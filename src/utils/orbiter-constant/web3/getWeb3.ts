import Web3 from 'web3'
import store from '../../../state'

import pollWeb3 from './pollWeb3'
import { findMatchWeb3ProviderByWalletType } from '../../orbiter-tool/walletsDispatchers/utils'
import { METAMASK } from '../../orbiter-tool/walletsDispatchers'
import { getCompatibleGlobalWalletConf } from '../../orbiter-tool'
import { updateCoinbase, updateNetWorkId, updateIsInstallMeta } from '../../../state/orbiter/reducer'
 


import { showMessage, showNotifiy } from '../../orbiter-tool'

async function installWeb3() {
  const web3Provider = findMatchWeb3ProviderByWalletType(METAMASK)
  if (web3Provider) {
    try {
      await web3Provider.enable()
    } catch (error) {
      store.dispatch(updateIsInstallMeta(true))
      store.dispatch(updateCoinbase(''))
      showMessage('User denied account access', 'error')
      return
    }
  } else {
    store.dispatch(updateIsInstallMeta(false))
    store.dispatch(updateCoinbase(''))
    // @ts-ignore 
    if ( window.ethereum && window.ethereum.isBlockWallet == true && window.ethereum.isMetaMask === false) {
      return showNotifiy({
        message: 'Error: MetaMask has not been installed.',
        className: 'installWalletTips',
        duration: 3000,
        description:
          'If you already have MetaMask installed, check your browser extension settings to make sure you have it enabled and that you have disabled any other browser extension wallets.',
      },'warning')
    }
    return showMessage('not install metamask', 'error')
  }
  return new Web3(web3Provider)
}

async function getWeb3() {
  const web3 = await installWeb3()
  if (!web3) {
    return
  }
  // updateIsInstallMeta(true)
  store.dispatch(updateIsInstallMeta(true))
  await web3.eth.net.getId((error, netWorkId) => {
    if (error || !netWorkId) {
      showMessage('get netWorkID failed, refresh and try again', 'error')
      store.dispatch(updateCoinbase(''))
    } else {
      // store.commit('updateNetWorkId', netWorkId.toString())
      store.dispatch(updateNetWorkId(netWorkId.toString()))
    }
  })
  await web3.eth.getCoinbase(async(error, coinbase) => {
    if (error || !coinbase) {
      showMessage( 'get coinbase failed，please unlock metamask or generate a new address', 'error');
      (await getCompatibleGlobalWalletConf()).walletPayload.provider
        .send('eth_requestAccounts')
        // @ts-ignore 
        .then((coin) => {
          store.dispatch(updateCoinbase(coin.result[0]))
        })
        // @ts-ignore 
        .catch((err) => {
          showMessage(err.message, 'error')
          store.dispatch(updateCoinbase(''))

        })
    } else {
      store.dispatch(updateCoinbase(coinbase))
    }
  })
  await pollWeb3()
}

const userDeniedMessage = () =>
  showMessage('User denied account access', 'error')

export { installWeb3, getWeb3, showMessage, userDeniedMessage }

// export default {}