import WalletConnect from '@walletconnect/client'
import QRCodeModule from '@walletconnect/qrcode-modal'
import { userDeniedMessage, showMessage } from '../../../orbiter-constant/web3/getWeb3'
import {
  globalSelectWalletConf,
  updateSelectWalletConfPayload,
  updateGlobalSelectWalletConf,
} from '../walletsCoreData'
import { WALLETCONNECT } from '../constants'
import { modifyLocalLoginInfo, withPerformInterruptWallet } from '../utils'
import * as util from './../../index'
let connector:any = null // when walletconnect connect success, connector will be assigned connector instance
// this hof helps the following functions to throw errors
// avoid duplicate code
// @ts-ignore 
export const withErrorCatcher = (fn) => {
  // @ts-ignore 
  return (error, ...args) => {
    if (error) throw error
    return fn(...args)
  }
}

const provider = {
  // @ts-ignore 
  request: async (request:any) => {
    let result = null
    switch (request.method) {
      case 'wallet_switchEthereumChain':
        result = await walletConnectSwitchChain(request.params).then()
        break
      default:
        result = await connector.sendCustomRequest(request)
        break
    }
    return result
  },// @ts-ignore 
  sendAsync: async (params, callback) => {
    connector
      .sendCustomRequest(params)
      // @ts-ignore 
      .then((result) => {
        callback(null, { result })
      })// @ts-ignore 
      .catch((error) => {
        callback(error)
      })
  },
}
// transfer data after connect success into a valid data structure
// there r different processing between the initial connect and the repeated connect
const performWalletConnectAccountInfo = (payload = {}, connected = false) => {
  if (connected) {
    // @ts-ignore 
    const { _accounts = [],_chainId = '', _peerId = '', _peerMeta = {},} = payload
    return {
      provider,
      // connector,
      walletAddress: _accounts[0] || '',
      networkId: _chainId,
      peerId: _peerId,
      peerMeta: _peerMeta,
    }
  }
  // @ts-ignore 
  const { params = [] } = payload
  const [payloadObj = {}] = params
  const { accounts = [], chainId = '', peerId = '', peerMeta = {} } = payloadObj
  const [walletAddress = ''] = accounts
  return {
    provider,
    // connector,
    walletAddress,
    networkId: chainId,
    peerId,
    peerMeta,
  }
}
// @ts-ignore 
const onConnectSuccessCallback = withErrorCatcher((payload, connected = false) => {
    // this console is necessary
    // console.successLog('WalletConnect connect success', payload, connected)
    const walletInfo = performWalletConnectAccountInfo(payload, connected)
    updateGlobalSelectWalletConf(WALLETCONNECT, walletInfo, true)
    // if connect successful, set the local login info
    modifyLocalLoginInfo({
      walletType: WALLETCONNECT,
      loginSuccess: true,
      walletPayload: walletInfo,
    })
  }
)
// @ts-ignore 
const onDisconnectCallback = withErrorCatcher((payload) => {
  // console.errorLog('WalletConnect disconnected', payload)
  if (!connector) {
    userDeniedMessage() // first in
  } else {
    // this only happens when the user disconnects on the phone manually
    walletConnectDispatcherOnDisconnect(false)
  }
})

const onSessionUpdateCallback = withErrorCatcher((payload:any) => {
  // console.warnLog('WalletConnect session updated', payload)
  const { params = [] } = payload
  const [chainIdAndAccountInfo = {}] = params
  const { chainId, accounts } = chainIdAndAccountInfo
  if (chainId !== globalSelectWalletConf().walletPayload.networkId) {
    updateSelectWalletConfPayload({ networkId: chainId }) // UPDATE chainId
  }
  const [walletAddress] = accounts
  if (walletAddress !== globalSelectWalletConf().walletPayload.walletAddress) {
    updateSelectWalletConfPayload({ walletAddress }) // UPDATE address
  }
})

const subscribeWalletEvents = () => {
  // @ts-ignore 
  if (!connector) return
  connector.on('connect', onConnectSuccessCallback)
  connector.on('disconnect', onDisconnectCallback)
  // if wallet data changed, such as chainId? account info? session_update event will be invoked
  connector.on('session_update', onSessionUpdateCallback)
}

// wake up the wallet connect modal by invoke this method
export const walletConnectDispatcherOnInit = async () => {
  connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org',
    qrcodeModal: QRCodeModule,
  })

  if (connector.connected) {
    // if it's already connected, invoke onConnectSuccessCallback for the data init
    onConnectSuccessCallback(null, connector, true)
  } else {
    // if there is no connection, createSession will be invoked for pop up a qrcode scan box
    await connector.createSession()
  }

  subscribeWalletEvents()
}

// disconnect the walletconnect manually
export const walletConnectDispatcherOnDisconnect = withPerformInterruptWallet(
  (shouldKill = true) => {
    // @ts-ignore 
    shouldKill && connector.killSession()
  }
)
// @ts-ignore 
export const walletConnectDispatcherOnSignature = async (from, selectMakerConfig, value, fromChainID, onTransferSucceed) => {
  const gaslimit = await util.requestWeb3(fromChainID, 'estimateGas', {
    from,
    to: selectMakerConfig.recipient,
    value,
  })
  const nonce = await util.requestWeb3(fromChainID, 'getTransactionCount', from)
  connector
    .sendTransaction({
      from,
      to: selectMakerConfig.recipient,
      gasLimit: gaslimit,
      value,
      nonce,
    })
    // @ts-ignore 
    .then((result) => {
      onTransferSucceed(from, value, fromChainID, result)
    })// @ts-ignore 
    .catch((err) => {
      console.log('err', err)
      showMessage(err, 'error')
    })
}
// @ts-ignore 
export async function walletConnectSendTransaction(chainId, from, to,  value, data) {
  const nonce = await util.requestWeb3(chainId, 'getTransactionCount', from)
  return new Promise((resolve, reject) => {
    connector
      .sendTransaction({
        from,
        to,
        value,
        data,
        nonce,
      })// @ts-ignore 
      .then((result) => {
        resolve(result)
      })// @ts-ignore 
      .catch((err) => {
        // showMessage(err, 'error')
        reject(err)
      })
  })
}
// @ts-ignore 
export async function walletConnectSwitchChain(params) {
  return new Promise((resolve, reject) => {
    connector
      .sendCustomRequest({
        method: 'wallet_switchEthereumChain',
        params,
      })
      .then(() => {
        resolve(null)
      })// @ts-ignore 
      .catch((e) => {
        reject(e)
      })
    // bc Metamask Mobile and Walletconnect appear to have issues with wallet_switchEthereumChain (the above will never finish)
    // the following will time out rejecting the promise
    let timeout = 0
    const timer = setInterval(() => {
      if (
        Number(params[0].chainId) ===
        Number(globalSelectWalletConf().walletPayload.networkId)
      ) {
        clearInterval(timer)
        return resolve(true)
      }
      timeout++
      if (timeout >= 10) {
        clearInterval(timer)
        return reject(false)
      }
    }, 1000)
  })
}

// @ts-ignore 
export const walletConnectDispatcherOnAddChain = (...result) => {
  // console.log('walletConnectDispatcherOnAddChain:', result);
  showMessage('You must Change Networks on your wallet app', 'error')
}
