import React, { useEffect, useState, useMemo } from "react"
import * as ethers from 'ethers'
import Web3 from 'web3'
import { ComPropsType } from './bridge'
import { useDispatch, useSelector } from "react-redux"
import { AppState } from "../../state"
import useTransferCalcute from "./useTransferCalcute"
import CommBoxHeader from "../CommBoxHeader"
import SvgIcon from "../SvgIcon"
import QuestionHelper from "../QuestionHelper"
import { MouseoverTooltip } from "../Tooltip"
import { ButtonConfirmed } from "../Button"
import Loader from "../Loader"
import './confirm.css'
import { SUPPORTED_WALLETS } from '../../constants'
import { injected } from '../../connectors'
import { useWeb3React } from "@web3-react/core"
import { NetworkContextName } from "../../constants"
import {
  isLegalAddress, showMessage, getMetaMaskNetworkId,
  ensureWalletNetwork, isExecuteXVMContract, getRealTransferValue,
  getChainInfoByChainId, isEthTokenAddress, stableWeb3, testStore,
  getCompatibleGlobalWalletConf
} from "../../utils/orbiter-tool"
import zkspace from "../../utils/orbiter-core/zkspace"
import { useWalletModalToggle } from "../../state/application/hooks"
import { CrossAddress } from "../../utils/orbiter-tool/cross_address"
import { XVMSwap } from "../../utils/orbiter-constant/xvm"
import { RatesType, getRates } from '../../utils/orbiter-tool/coinbase'
import walletsDispatchers from "../../utils/orbiter-tool/walletsDispatchers"
import {
  updateProceedState,
  updateProceedTxID,
  updateProceedingMakerTransfer,
  updateProceedingUserTransfer
} from "../../state/orbiter/reducer"
import BigNumber from 'bignumber.js'
import { getTransferContract, getTransferGasLimit } from "../../utils/orbiter-constant/getContract"
import { Coin_ABI } from "../../utils/orbiter-constant/contract"
import orbiterCore from "../../utils/orbiter-core"
import { DydxHelper } from "../../utils/orbiter-tool/dydx/dydx_helper"
import * as zksync from 'zksync'
import * as zksync2 from 'zksync-web3'

import otherConfig from "../../utils/orbiter-config/other"
import { getZkSyncProvider } from "../../utils/orbiter-tool/zkysnc_helper"
import { providers } from 'ethers'
import { IMXHelper } from "../../utils/orbiter-tool/immutablex/imx_helper"
import { ERC20TokenType, ETHTokenType } from '@imtbl/imx-sdk'
import { utils } from 'zksync'
import { exchangeToCoin } from "../../utils/orbiter-tool/coinbase"
import { submitSignedTransactionsBatch } from 'zksync/build/wallet'
const {
  walletDispatchersOnSignature,
  walletDispatchersOnSwitchChain,
  // @ts-ignore 
  walletConnectSendTransaction,
} = walletsDispatchers

export default function Confirm(props: ComPropsType) {
  let zksTokenList = useSelector((state: AppState) => state.orbiter.zksTokenList)
  let web3State = useSelector((state: AppState)=> state.orbiter.web3State)
  // @ts-ignore 
  let [transferLoading, setTransferLoading] = useState<boolean>(false)
  // @ts-ignore 
  let [expectValue, setExpectValue] = useState('')
  let [isInit, setIsInit] = useState(false)
  let storeConfirmData = useSelector((state: AppState) => state.orbiter.confirmData)
  let transferDataState = useSelector((state: AppState) => state.orbiter.storeTransferDataState)
  let { realTransferAmount, realTransferOPID } = useTransferCalcute({
    transferDataState
  })
  let { getTransferTValue } = useTransferCalcute({
    transferDataState
  })
  const toggleWalletModal = useWalletModalToggle()
  const { active, account, chainId, connector } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const walletIsLogin = useMemo(() => {
    return (contextNetwork.active || active) && account
  }, [active, contextNetwork, account])
  const userWalletType = useMemo(() => {
    const { ethereum } = window
    const isMetaMask = !!(ethereum && ethereum.isMetaMask)
    const name = Object.keys(SUPPORTED_WALLETS)
      .filter(
        k =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
      )
      .map(k => SUPPORTED_WALLETS[k].name)[0]
    return name
  }, [connector])


  let [rates, setRates] = useState<RatesType>(null)
  useEffect(() => {
    let active = true
    loadRate()
    return () => {
      active = false
    }
    async function loadRate() {
      const exchangeRates: RatesType = await getRates('ETH');
      if (!active) {
        return
      }
      setRates(exchangeRates)
    }
  }, [])

  var initData = async () => {
    // if (!isInit) {
      const { selectMakerConfig, transferValue } = transferDataState
      if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
        return
      }
      const { fromChain, toChain } = selectMakerConfig
      const amount = orbiterCore.getToAmountFromUserAmount(
        new BigNumber(transferValue).plus(
          new BigNumber(selectMakerConfig.tradingFee)
        ),
        selectMakerConfig,
        false
      )
      if (isExecuteXVMContract(transferDataState)) {
        const fromCurrency = fromChain.symbol
        const toCurrency = toChain.symbol
        const slippage = selectMakerConfig.slippage
        if (fromCurrency !== toCurrency) {
          const decimal = toChain.decimals === 18 ? 5 : 3
          const highValue = (
            await exchangeToCoin(amount, fromCurrency, toCurrency, rates)
          ).toFixed(decimal)
          const lowerValue = new BigNumber(highValue)
            .multipliedBy(1 - slippage / 10000)
            .toFixed(decimal)
          setExpectValue(`${lowerValue} ~ ${highValue} ${toCurrency}`)
        } else {
          setExpectValue(`${amount} ${toCurrency}`)
        }
      } else {
        setExpectValue(`${amount} ${selectMakerConfig.fromChain.symbol}`)
      }
      setIsInit(true)
    // }
  }
  useEffect(() => {
    if(!isInit){
      initData()
    }
    
  }, [isInit, transferDataState])

  useEffect(() => {
    console.log('confirm ---', transferDataState)
  }, [])
  let isStarkNetChain = useMemo(() => {
    let fromChainID = +transferDataState.fromChainID
    let toChainID = +transferDataState.toChainID
    return (
      fromChainID == 4 ||
      fromChainID == 44 ||
      toChainID == 4 ||
      toChainID == 44
    )
  }, [transferDataState.fromChainID, transferDataState.toChainID])
  let confirmData = useMemo(() => {
    const { selectMakerConfig } = transferDataState
    // 0.000120000000009022 to 0.000120...09022
    let temp_realTransferAmount = realTransferAmount().toString()
    console.log('orbiter confirm temp_realTransferAmount---', temp_realTransferAmount)
    temp_realTransferAmount = temp_realTransferAmount.replace(
      /(.*?0)0{4,}(0.*?)/,
      '$1...$2'
    )
    if (!selectMakerConfig || !Object.keys(selectMakerConfig).length) {
      return []
    }
    const comm = [
      {
        icon: 'withholding',
        title: 'Withholding Fee',
        notice: 'The ‘Maker’ charges the ‘Sender’ a fixed fee to cover the fluctuating gas fees that incur when sending funds to the destination network.',
        desc:
          selectMakerConfig.tradingFee +
          ' ' +
          selectMakerConfig.fromChain.symbol,
      },
      {
        icon: 'security',
        title: 'Identification Code',
        notice: 'In Orbiter, each transaction has a four digit identification code. The identification code can be seen at the end of the total amount being transferred as a way to identify the transaction. The identification code will be the evidence in the case that the ‘Maker’ does not send the assets to the target network. This will act as an evidence to claim your funds from the margin contract.',
        desc: realTransferOPID(),
        haveSep: true,
      },
      {
        icon: 'send',
        title: 'Total Send',
        notice: 'Total amount sent by the ‘Sender’ including the withholding fee.',
        desc:
          temp_realTransferAmount +
          ' ' +
          selectMakerConfig.fromChain.symbol,
        textBold: true,
      },
      {
        icon: 'received',
        title: 'Received',
        desc: expectValue,
        textBold: true,
      },
      {
        icon: 'exchange',
        title: 'Maker Routes',
        notice: 'After the ‘Sender’ submits the transaction, the assets are transferred to the ‘Maker’s’ address who will provide the liquidity. Orbiter’s contract will ensure the safety of the assets and will make sure that the ‘Sender’ receives the assets to the target network.',
        descInfo: storeConfirmData.routeDescInfo,
      },
    ]
    return [...comm]
  }, [transferDataState, expectValue, storeConfirmData])
  const onBackClick = () => {
    props.onChangeState('1')
  }

  const dispatch = useDispatch()



  function confirmUserTransaction(hash: any) {
    let currentStatus = 1
    const cron = setInterval(async () => {
      try {
        // TODO openApi  baseURL: process.env.VUE_APP_OPEN_URL,  cannot find 
        // const { status, txList } = await openApiAx.get(`/status?hash=${hash}`)
        const fetchResponse = await fetch(`${process.env.REACT_APP_OPEN_API_URL}/status?hash=${hash}`)

        const resdata = await fetchResponse.json()
        if (resdata.code !== 0) {
          return
        }
        const { status, txList } = resdata.result || {}
        // util.log('txStatus', status, 'txList', txList)
        switch (status) {
          case 0: {
            if (currentStatus === 2) {
              // storeUpdateProceedState(3)
            } else {
              // @ts-ignore 
              const tx = txList.find((item) => item.side === 0)
              if (tx) {
                currentStatus = 2
                // storeUpdateProceedState(2)
                dispatch(updateProceedState(2))
              }
            }
            break
          }
          case 1: {
            // storeUpdateProceedState(4)
            dispatch(updateProceedState(4))
            break
          }
          case 99: {
            // storeUpdateProceedState(5)
            dispatch(updateProceedState(5))
            clearInterval(cron)
            break
          }
        }
        for (const tx of txList) {
          if (tx.side === 0) {
            // store.commit(
            //   'updateProceedingUserTransferTimeStamp',
            //   new Date(tx.timestamp).valueOf() / 1000
            // )
            dispatch(updateProceedingUserTransfer({
              timeStamp: new Date(tx.timestamp).valueOf() / 1000
            }))
          }
          if (tx.side === 1) {
            // store.commit('updateProceedingMakerTransferTxid', tx.hash)
            dispatch(updateProceedingMakerTransfer({
              txid: tx.hash
            }))
          }
        }
      } catch (e) {
        console.error(e)
      }
    }, 20 * 1000)
    return cron
  }


  const proceedUserTransferReady = (user: any, maker: string, amount: any, localChainID: string, txHash: any) => {
    if (+localChainID === 4 || +localChainID === 44) {
      // txHash = util.starknetHashFormat(txHash);
    }
    dispatch(updateProceedTxID(txHash))
    dispatch(updateProceedingUserTransfer({
      from: user
    }))
    dispatch(updateProceedingUserTransfer({
      to: maker
    }))
    // store.commit('updateProceedTxID', txHash)
    // store.commit('updateProceedingUserTransferFrom', user)
    // store.commit('updateProceedingUserTransferTo', maker)
    let realAmount = orbiterCore.getRAmountFromTAmount(localChainID, amount)

    if (realAmount.state) {
      // realAmount = realAmount.rAmount
    } else {
      throw new Error(`UserTransferReady error: ${realAmount.error}`)
    }
    dispatch(updateProceedingUserTransfer({
      amount: realAmount.rAmount
    }))
    dispatch(updateProceedingUserTransfer({
      localChainID
    }))
    dispatch(updateProceedingUserTransfer({
      txid: txHash
    }))
    // store.commit('updateProceedingUserTransferAmount', realAmount)
    // store.commit('updateProceedingUserTransferLocalChainID', localChainID)
    // store.commit('updateProceedingUserTransferTxid', txHash)
    // console.log(txHash)
    return confirmUserTransaction(txHash)
  }
  const onTransferSucceed = (from: any, amount: any, fromChainID: string, transactionHash: any) => {
    const { selectMakerConfig } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }
    proceedUserTransferReady(
      from,
      selectMakerConfig.recipient,
      amount,
      fromChainID,
      transactionHash
    )

    // Immutablex's identifier is not a hash
    let title = transactionHash
    if (+fromChainID === 8 || +fromChainID === 88) {
      title = 'TransferId: ' + title
    }
    // $notify.success({
    //   title,
    //   duration: 3000,
    // })
    showMessage(title, 'success')
    // $emit('stateChanged', '3')
    props.onChangeState('3')
  }

  const handleXVMContract = async () => {
    const {
      fromChainID,
      crossAddressReceipt,
      isCrossAddress,
      selectMakerConfig,
    } = transferDataState

    if (!walletIsLogin) {
      return
    }

    const amount = getRealTransferValue(transferDataState)
    const matchSignatureDispatcher = walletDispatchersOnSignature[
      userWalletType as keyof typeof walletDispatchersOnSignature
    ]
    if (typeof matchSignatureDispatcher === 'function') {
      (matchSignatureDispatcher as Function)(
        account,
        selectMakerConfig,
        amount,
        fromChainID,
        onTransferSucceed
      )
      return
    }

    const chainInfo = getChainInfoByChainId(fromChainID)
    const contractAddress = chainInfo.xvmList[0]
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }
    const tokenAddress = selectMakerConfig.fromChain.tokenAddress
    // approve
    if (!isEthTokenAddress(+fromChainID, tokenAddress)) {
      if (
        userWalletType ===
        'WalletConnect'
      ) {
        const web3 = stableWeb3(+fromChainID)
        const provider = new ethers.providers.Web3Provider(
          web3.currentProvider as ethers.ethers.providers.ExternalProvider
        )
        const crossAddress = new CrossAddress(
          userWalletType,
          provider,
          +fromChainID,
          // @ts-ignore 
          provider.getSigner(account),
          userWalletType
        )
        await crossAddress.contractApprove(
          tokenAddress,
          contractAddress,
          ethers.BigNumber.from(amount)
        )
      } else {
        let temp_curwalletProvider = await connector?.getProvider()
        const provider = new ethers.providers.Web3Provider(
          temp_curwalletProvider
        )
        const crossAddress = new CrossAddress(userWalletType, provider, +fromChainID)
        await crossAddress.contractApprove(
          tokenAddress,
          contractAddress,
          ethers.BigNumber.from(amount)
        )
      }
    }

    try {
      const provider = await connector?.getProvider()
      const { transactionHash } = await XVMSwap(
        transferDataState,
        rates,
        provider,
        contractAddress,
        account,
        selectMakerConfig.recipient,
        amount,
        isCrossAddress ? crossAddressReceipt : account
      )
      if (transactionHash) {
        onTransferSucceed(
          account,
          amount,
          fromChainID,
          transactionHash
        )
      }
    } catch (e) {
      console.error(e)
      // @ts-ignore 
      showMessage(e.message, 'error')

    }
  }

  const onRealTransfer = async () => {
    let { testVal } = testStore()
    console.log('onRealTransfer---', testVal)
    // props.onChangeState('3')
    if (!walletIsLogin) {
      // Middle.$emit('connectWallet', true)
      toggleWalletModal()
      return
    }
    if (!await isLegalAddress(transferDataState, account)) {
      showMessage('Contract address is not supported, please use EVM address.', 'error')
      return;
    }
    // @ts-ignore 
    const { fromChainID, toChainID, selectMakerConfig } = transferDataState
    if (+fromChainID !== 4 && +fromChainID !== 44) {
      if (
        chainId?.toString() !==
        getMetaMaskNetworkId(+fromChainID).toString()
      ) {
        if (
          userWalletType === 'MetaMask'
        ) {
          try {
            if (
              !(await ensureWalletNetwork(+fromChainID, connector))
            ) {
              return
            }
          } catch (err) {
            // @ts-ignore 
            showMessage(err.message, 'error')
            return
          }
        } else {
          let compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
          // @ts-ignore 
          const matchAddChainDispatcher = walletDispatchersOnSwitchChain[compatibleGlobalWalletConf.walletType]
          if (matchAddChainDispatcher) {
            matchAddChainDispatcher(
              compatibleGlobalWalletConf.walletPayload.provider
            )
            return
          }
        }
      }
    }

    // Only one
    if (transferLoading) {
      return
    }

    // EVM contract
    if (isExecuteXVMContract(transferDataState)) {

      setTransferLoading(true)
      await handleXVMContract()

      setTransferLoading(false)
      return
    }



    setTransferLoading(true)

    if (+fromChainID === 3 || +fromChainID === 33) {
      zkTransfer()
    } else if (+fromChainID === 14 || +fromChainID === 514) {
      zk2Transfer()
    } else if (+fromChainID === 9 || +fromChainID === 99) {
      // loopringTransfer()
    } else if (+fromChainID === 12 || +fromChainID === 512) {
      zkspaceTransfer()
    } else {
      if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
        return
      }
      const tokenAddress = selectMakerConfig.fromChain.tokenAddress
      const to = selectMakerConfig.recipient
      const tValue = getTransferTValue()
      // @ts-ignore 
      if (!tValue || !tValue.state) {
        // @ts-ignore 
        showMessage(tValue.error, 'error')

        setTransferLoading(false)
        return
      }
      if (+toChainID === 4 || +toChainID === 44) {
        // transferToStarkNet(tValue.tAmount)
        return
      }
      const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
      const account =
        compatibleGlobalWalletConf.walletPayload.walletAddress
      if (+fromChainID === 4 || +fromChainID === 44) {
        // starknetTransfer(tValue.tAmount)
        return
      }

      if (+fromChainID === 8 || +fromChainID === 88) {
        imxTransfer(tValue.tAmount)
        return
      }

      if (+fromChainID === 11 || +fromChainID === 511) {
        dydxTransfer(tValue.tAmount)
        return
      }

      if (isEthTokenAddress(+fromChainID, tokenAddress)) {
        // When tokenAddress is eth
        ethTransfer(tValue.tAmount)
      } else {
        // When tokenAddress is erc20
        if (
          compatibleGlobalWalletConf.walletType ===
          'WalletConnect'
        ) {
          const web3 = new Web3()
          const tokenContract = new web3.eth.Contract(
            Coin_ABI,
            tokenAddress
          )
          const tokenTransferData = await tokenContract.methods
            .transfer(to, web3.utils.toHex(tValue.tAmount))
            .encodeABI()
          return walletConnectSendTransaction(
            fromChainID,
            account,
            tokenAddress,
            0,
            tokenTransferData
          ).//@ts-ignore 
            then((hash) => {
              onTransferSucceed(
                account,
                tValue.tAmount,
                fromChainID,
                hash
              )
            })
        }
        const transferContract = getTransferContract(
          fromChainID,
          tokenAddress
        )
        if (!transferContract) {
          showMessage('Failed to obtain contract information, please refresh and try again',
            'error')
          return
        }

        let gasLimit = await getTransferGasLimit(
          fromChainID,
          selectMakerConfig,
          account,
          to,
          tValue.tAmount
        )
        if (+fromChainID === 2 && gasLimit && gasLimit < 21000) {
          gasLimit = 21000
        }
        const objOption = { from: account, gas: gasLimit };
        // @ts-ignore 
        transferContract.methods.transfer(to, tValue.tAmount)
          // @ts-ignore 
          .send(objOption, (error, transactionHash) => {
            setTransferLoading(false)
            if (!error) {
              onTransferSucceed(
                account,
                tValue.tAmount,
                fromChainID,
                transactionHash
              )
            } else {
              showMessage(error.message,
                'error')
            }
          })
      }
    }
  }


  async function zk2Transfer() {
    // @ts-ignore 
    const { selectMakerConfig, fromChainID } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }
    if (selectMakerConfig.fromChain.symbol !== 'ETH') {
      throw new Error('Tokens are not supported at this time');
    }

    const tValue = getTransferTValue()
    if (!tValue || !tValue.state) {
      if (tValue?.error) {
        showMessage(tValue?.error, 'error')
      }


      setTransferLoading(false)
      return
    }
    const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
    const provider = new zksync2.Web3Provider(compatibleGlobalWalletConf.walletPayload.provider);
    const signer = provider.getSigner();
    const amount = (new BigNumber(tValue.tAmount).dividedBy(10 ** 18)).toString();
    const transferResult = await signer.transfer({
      to: selectMakerConfig.recipient,
      amount: ethers.utils.parseEther(amount),
    });
    if (transferResult.hash) {
      onTransferSucceed(
        account || web3State.coinbase,
        tValue.tAmount,
        fromChainID,
        transferResult.hash
      );
    }

    setTransferLoading(false)
  }
  async function zkTransfer() {
    const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
    const { selectMakerConfig, fromChainID } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }
    const web3Provider = new Web3(
      compatibleGlobalWalletConf.walletPayload.provider
    )
    const walletAccount =
      compatibleGlobalWalletConf.walletPayload.walletAddress
    const tokenAddress = selectMakerConfig.fromChain.tokenAddress
    const ethWallet = new ethers.providers.Web3Provider(
      // @ts-ignore 
      web3Provider?.currentProvider
    )
    const syncProvider = await getZkSyncProvider(fromChainID)
    try {
      const syncWallet = await zksync.Wallet.fromEthSigner(
        ethWallet.getSigner(walletAccount),
        syncProvider
      )
      if (!syncWallet) {
        return
      }
      const tValue = getTransferTValue()
      if (!tValue || !tValue.state) {
        // @ts-ignore 
        showMessage(tValue.error, 'error')

        setTransferLoading(false)
        return
      }
      const amount = zksync.utils.closestPackableTransactionAmount(
        tValue.tAmount
      )
      const transferFee = await syncProvider.getTransactionFee(
        'Transfer',
        syncWallet.address() || '',
        tokenAddress
      )
      if (!(await syncWallet.isSigningKeySet())) {
        const nonce = await syncWallet.getNonce('committed')
        const batchBuilder = syncWallet.batchBuilder(nonce)
        if (
          syncWallet.ethSignerType?.verificationMethod ===
          'ERC-1271'
        ) {
          const isOnchainAuthSigningKeySet =
            await syncWallet.isOnchainAuthSigningKeySet()
          if (!isOnchainAuthSigningKeySet) {
            const onchainAuthTransaction =
              await syncWallet.onchainAuthSigningKey()
            await onchainAuthTransaction?.wait()
          }
        }
        // @ts-ignore 
        const newPubKeyHash = await syncWallet.signer.pubKeyHash()
        const accountID = await syncWallet.getAccountId()
        if (typeof accountID !== 'number') {
          throw new TypeError(
            'It is required to have a history of balances on the account to activate it.'
          )
        }
        const changePubKeyMessage =
          utils.getChangePubkeyLegacyMessage(
            newPubKeyHash,
            nonce,
            accountID
          )
        const ethSignature = (
          await syncWallet.getEthMessageSignature(
            changePubKeyMessage
          )
        ).signature
        const keyFee = await syncProvider.getTransactionFee(
          {
            ChangePubKey: { onchainPubkeyAuth: false },
          },
          syncWallet.address() || '',
          tokenAddress
        )
        // @ts-ignore 
        const changePubKeyTx = await syncWallet.signer.signSyncChangePubKey({
          accountId: accountID,
          account: syncWallet.address(),
          newPkHash: newPubKeyHash,
          nonce,
          ethSignature,
          validFrom: 0,
          validUntil: utils.MAX_TIMESTAMP,
          fee: keyFee.totalFee,
          feeTokenId:
            syncWallet.provider.tokenSet.resolveTokenId(
              tokenAddress
            ),
        })
        batchBuilder.addChangePubKey({
          tx: changePubKeyTx,
          // @ts-ignore
          alreadySigned: true,
        })
        batchBuilder.addTransfer({
          to: selectMakerConfig.recipient,
          token: tokenAddress,
          amount,
          fee: transferFee.totalFee,
        })
        const batchTransactionData = await batchBuilder.build()
        const transactions = await submitSignedTransactionsBatch(
          syncWallet.provider,
          batchTransactionData.txs,
          [batchTransactionData.signature]
        )
        let transaction
        for (const tx of transactions) {
          if (tx.txData.tx.type !== 'ChangePubKey') {
            transaction = tx
            break
          }
        }
        // @ts-ignore 
        const transferReceipt = await transaction.awaitReceipt()
        if (
          transferReceipt.success &&
          !transferReceipt.failReason
        ) {
          onTransferSucceed(
            walletAccount,
            amount.toString(),
            fromChainID,
            // @ts-ignore 
            transaction.txHash
          )
        }

        setTransferLoading(false)
      } else {
        try {
          const transfer = await syncWallet.syncTransfer({
            to: selectMakerConfig.recipient,
            token: tokenAddress,
            amount,
          })
          const transferReceipt = await transfer.awaitReceipt()
          if (
            transferReceipt.success &&
            !transferReceipt.failReason
          ) {
            onTransferSucceed(
              walletAccount,
              amount.toString(),
              fromChainID,
              transfer.txHash
            )
          }

          setTransferLoading(false)
        } catch (error) {
          // console.warn('inError =', error.message)

          setTransferLoading(false)
          // @ts-ignore 
          showMessage(error.message, 'error')
        }
      }
    } catch (error) {
      // console.warn('outError =', error.message)

      setTransferLoading(false)
      // @ts-ignore 
      showMessage(error.message, 'error')
    }
  }

  // async function loopringTransfer() {
  //   const {
  //     selectMakerConfig,
  //     isCrossAddress,
  //     crossAddressReceipt,
  //     fromChainID,
  //     toChainID,
  //   } = transferDataState
  //   if(!selectMakerConfig || Object.keys(selectMakerConfig).length === 0){
  //     return 
  //   }
  //   const tokenAddress = selectMakerConfig.fromChain.tokenAddress
  //   const compatibleGlobalWalletConf = getCompatibleGlobalWalletConf()
  //   try {
  //     const tValue = getTransferTValue()
  //     if (!tValue || !tValue.state) {
  //       // @ts-ignore 
  //       showMessage(tValue.error,'error')

  //       setTransferLoading(false)
  //       return
  //     }
  //     const p_text = 9000 + Number(toChainID) + ''
  //     const amount = tValue.tAmount
  //     const memo = isCrossAddress
  //       ? `${p_text}_${crossAddressReceipt}`
  //       : p_text
  //     if (memo.length > 128) {
  //       showMessage('The sending address is too long',
  //         'error')

  //       setTransferLoading(false)
  //       return
  //     }
  //     try {
  //       const response = await loopring.sendTransfer(
  //         compatibleGlobalWalletConf.walletPayload
  //           .walletAddress,
  //         fromChainID,
  //         selectMakerConfig.recipient,
  //         0,
  //         tokenAddress,
  //         amount,
  //         memo
  //       )
  //       if (response.hash && response.status === 'processing') {
  //         onTransferSucceed(
  //           compatibleGlobalWalletConf.walletPayload
  //             .walletAddress,
  //           amount,
  //           fromChainID,
  //           response.hash
  //         )
  //       }

  //       setTransferLoading(false)
  //     } catch (error) {

  //       setTransferLoading(false)
  //       if (error.message === 'account is not activated') {
  //         // const notify =
  //         $notify({
  //           type: 'error',
  //           message:
  //             '<div style="text-align:left;font-size: 1.4rem; color: black">This Loopring account is not yet activated, please activate it before transferring.</div>',
  //           dangerouslyUseHTMLString: true,
  //           duration: 8000,
  //         })
  //       } else if (error.message === 'User account is frozen') {
  //         const notify = $notify({
  //           type: 'error',
  //           message:
  //             '<div style="text-align:left;font-size: 1.4rem; color: black">Your Loopring account is frozen, please check your Loopring account status on Loopring website. Get more details <span style="color:blue;text-decoration: underline"> here </span>.</div>',
  //           dangerouslyUseHTMLString: true,
  //           duration: 8000,
  //         })
  //         notify.$el.querySelector('span').onclick = () => {
  //           notify.close()
  //           window.open(
  //             'https://docs.loopring.io/en/basics/key_mgmt.html?h=frozen',
  //             '_blank'
  //           )
  //         }
  //       } else {
  //         showMessage(error.message,
  //           'error')
  //       }
  //     }
  //   } catch (error) {
  //     console.warn('outError =', error.message)

  //     setTransferLoading(false)
  //     showMessage(error.message,
  //       'error')
  //   }
  // }
  async function ethTransfer(value: any) {
    const { selectMakerConfig, fromChainID } = transferDataState
    const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
    const from =
      compatibleGlobalWalletConf.walletPayload.walletAddress
    // @ts-ignore 
    const matchSignatureDispatcher = walletDispatchersOnSignature[compatibleGlobalWalletConf.walletType]
    if (matchSignatureDispatcher) {
      matchSignatureDispatcher(
        from,
        selectMakerConfig,
        value,
        fromChainID,
        onTransferSucceed
      )
      return
    }

    if (!walletIsLogin) {

      setTransferLoading(false)
      return
    }
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }

    try {
      const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
      const provider =
        compatibleGlobalWalletConf.walletPayload.provider
      const web3 = new Web3(provider)

      let gasLimit = await getTransferGasLimit(
        fromChainID,
        selectMakerConfig,
        from,
        selectMakerConfig.recipient,
        value,
        provider
      )
      if (+fromChainID === 2 && gasLimit && gasLimit < 21000) {
        gasLimit = 21000
      }
      // @ts-ignore 
      const eprovider = new providers.Web3Provider(web3.currentProvider)
      const signer = eprovider.getSigner()
      signer
        .sendTransaction({
          from,
          to: selectMakerConfig.recipient,
          value,
          gasLimit,
        })
        .then((res) => {
          setTransferLoading(false)
          onTransferSucceed(
            from,
            value,
            fromChainID,
            res.hash
          )
        })
        .catch((err) => {
          setTransferLoading(false)
          showMessage(err.message,
            'error')
        })
    } catch (error) {
      console.error(error)
    }
  }

  async function imxTransfer(value: any) {
    const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
    const { selectMakerConfig, fromChainID } = transferDataState
    if (!walletIsLogin) {

      setTransferLoading(false)
      return
    }
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }
    const from =
      compatibleGlobalWalletConf.walletPayload.walletAddress
    try {
      const contractAddress = selectMakerConfig.fromChain.tokenAddress

      const imxHelper = new IMXHelper(+fromChainID)
      let provider = await connector?.getProvider()
      const imxClient = await imxHelper.getImmutableXClient(
        provider,
        from,
        true
      )

      let tokenInfo = {
        type: ETHTokenType.ETH,
        data: {
          decimals: selectMakerConfig.fromChain.decimals,
        },
      }
      if (!isEthTokenAddress(+fromChainID, contractAddress)) {
        tokenInfo = {
          // @ts-ignore 
          type: ERC20TokenType.ERC20,
          data: {
            // @ts-ignore 
            symbol: selectMakerConfig.fromChain.symbol,
            decimals: selectMakerConfig.fromChain.decimals,
            tokenAddress: contractAddress,
          },
        }
      }
      const resp = await imxClient.transfer({
        sender: from,
        token: tokenInfo,
        quantity: ethers.BigNumber.from(value),
        receiver: selectMakerConfig.recipient,
      })
      onTransferSucceed(
        from,
        value,
        fromChainID,
        resp.transfer_id
      )
    } catch (error) {
      // @ts-ignore 
      showMessage(error.message, 'error')
    } finally {

      setTransferLoading(false)
    }
  }
  async function dydxTransfer(value: any) {
    const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
    const { selectMakerConfig, fromChainID } = transferDataState
    if (!walletIsLogin || !selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      setTransferLoading(false)
      return
    }
    const from = account || ''
    // compatibleGlobalWalletConf.walletPayload.walletAddress
    try {
      const dydxHelper = new DydxHelper(
        +fromChainID,
        new Web3(
          compatibleGlobalWalletConf.walletPayload.provider
        ),
        'MetaMask',
        connector
      )
      const dydxMakerInfo = dydxHelper.getMakerInfo(
        selectMakerConfig.recipient
      )
      const dydxClient = await dydxHelper.getDydxClient(
        from,
        false,
        true
      )
      const dydxAccount = await dydxHelper.getAccount(from)

      const params = {
        clientId: dydxHelper.generateClientId(from),
        amount: new BigNumber(value).dividedBy(10 ** 6).toString(), // Only usdc now!
        expiration: new Date(
          new Date().getTime() + 86400000 * 30
        ).toISOString(),
        receiverAccountId: dydxHelper.getAccountId(
          selectMakerConfig.recipient
        ),
        receiverPublicKey: dydxMakerInfo.starkKey,
        receiverPositionId: String(dydxMakerInfo.positionId),
      }
      const resp = await dydxClient.private.createTransfer(
        params,
        dydxAccount.positionId
      )

      onTransferSucceed(
        from,
        value,
        fromChainID,
        resp.transfer.id
      )
    } catch (error) {
      console.error(error)
      // @ts-ignore 
      showMessage(error.message,
        'error')
    } finally {

      setTransferLoading(false)
    }
  }
  async function zkspaceTransfer() {
    const { selectMakerConfig, fromChainID } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return
    }
    const compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
    try {
      const provider = new ethers.providers.Web3Provider(
        compatibleGlobalWalletConf.walletPayload.provider
      )
      const walletAccount =
        compatibleGlobalWalletConf.walletPayload.walletAddress
      const signer = provider.getSigner()
      const privateKey = await zkspace.getL1SigAndPriVateKey(signer)

      const tValue = getTransferTValue()
      if (!tValue || !tValue.state) {
        // @ts-ignore 
        showMessage(tValue.error, 'error')
        // this.transferLoading = false
        setTransferLoading(false)
        return
      }
      const transferValue =
        zksync.utils.closestPackableTransactionAmount(
          tValue.tAmount
        )

      const accountInfo = await zkspace.getAccountInfo(
        +fromChainID,
        privateKey,
        signer,
        walletAccount
      )
      const feeTokenId = 0
      const zksNetWorkID =
        +fromChainID === 512
          ? otherConfig.ZKSpace.zksrinkebyChainID
          : otherConfig.ZKSpace.zksChainID

      const fee = await zkspace.getZKSpaceTransferGasFee(
        +fromChainID,
        walletAccount,
        transferDataState
      )

      const transferFee = zksync.utils.closestPackableTransactionFee(
        ethers.utils.parseUnits(fee.toString(), 18)
      )

      const zksTokenInfos =
        +fromChainID === 12
          ? zksTokenList.mainnet
          : zksTokenList.rinkeby
      const tokenAddress = selectMakerConfig.toChain.tokenAddress
      const tokenInfo = zksTokenInfos.find(
        (item: any) => item.address === tokenAddress
      )
      const { pubKey, l2SignatureOne } = zkspace.getL2SigOneAndPK(
        privateKey,
        accountInfo,
        walletAccount,
        // @ts-ignore 
        tokenInfo ? tokenInfo.id : 0,
        transferValue,
        feeTokenId,
        transferFee,
        zksNetWorkID,
        transferDataState
      )

      const l2SignatureTwo = await zkspace.getL2SigTwoAndPK(
        signer,
        accountInfo,
        transferValue,
        fee,
        zksNetWorkID,
        tokenInfo,
        transferDataState
      )
      const req = {
        signature: {
          type: 'EthereumSignature',
          signature: l2SignatureTwo,
        },
        fastProcessing: false,
        tx: {
          type: 'Transfer',
          // @ts-ignore 
          accountId: accountInfo.id,
          from: walletAccount,
          to: selectMakerConfig.recipient,
          // @ts-ignore 
          token: tokenInfo ? tokenInfo.id : 0,
          amount: transferValue.toString(),
          feeToken: feeTokenId,
          fee: transferFee.toString(),
          chainId: zksNetWorkID,
          // @ts-ignore 
          nonce: accountInfo.nonce,
          signature: {
            pubKey,
            signature: l2SignatureOne,
          },
        },
      }

      const transferResult = await zkspace.sendTransfer(
        +fromChainID,
        req
      )
      const txHash = transferResult.data?.data.replace(
        'sync-tx:',
        '0x'
      )

      const firstResult = await getFristResult(
        fromChainID,
        txHash
      )

      onTransferSucceed(
        walletAccount,
        tValue.tAmount.toString(),
        fromChainID,
        firstResult.data.tx_hash
      )
      // this.transferLoading = false
      setTransferLoading(false)
    } catch (error) {
      // this.transferLoading = false
      setTransferLoading(false)
      // @ts-ignore 
      showMessage(error.message,
        'error')
      // @ts-ignore 
      console.warn('zkspaceTransfer =', error.message)
    }


  }
  // @ts-ignore 
  async function getFristResult(fromChainID: string, txHash: any) {
    const firstResult = await zkspace.getZKSpaceTransactionData(
      +fromChainID,
      txHash
    )
    if (
      firstResult.success &&
      !firstResult.data.fail_reason &&
      !firstResult.data.success &&
      !firstResult.data.amount
    ) {
      await new Promise((res) => {
        setTimeout(() => {
          res(1)
        }, 300);
      }) //util.sleep(300)
      return await getFristResult(fromChainID, txHash)
    } else if (
      firstResult.success &&
      !firstResult.data.fail_reason &&
      firstResult.data.success &&
      firstResult.data.amount
    ) {
      return firstResult
    } else {
      throw new Error('zks sendResult is error')
    }
  }
  return (<div className="confirm-box">
    <CommBoxHeader className="head-com" back={true} onBack={onBackClick}>Confirm</CommBoxHeader>
    {
      confirmData.map(item => {
        return (<div className="confirm-item"
          key={item.title}
          style={{ marginBottom: '22px' }}>
          <div className="item-left">
            <SvgIcon iconName={'dark-' + item.icon} />
            <span className="left-txt">{item.title}</span>
            {item.notice && <QuestionHelper text={item.notice || ''} />}

          </div>
          <div className="item-right">
            {item.desc && <span>{item.desc}</span>}
          </div>
          {
            item.descInfo && item.descInfo.length && (
              <div className="descBottom">
                {
                  item.descInfo.map((desc: any, index) => {
                    return (<div key={desc.no + index} style={{ marginBottom: '10px' }}>

                      <span
                        style={{
                          width: '40px',
                          display: 'inline-block'
                        }}
                      >
                        {index === 0 ? 'Send' : ''}
                      </span>
                      {
                        desc.fromTip ? (<MouseoverTooltip text={desc.fromTip}>
                          {/* <span className="o-tip">{ desc.fromTip }</span> */}
                          <span
                            style={{
                              marginLeft: '7px',
                              marginRight: '7px',
                              color: '#df2e2d',
                              width: '90px',
                              display: 'inline-block',
                              textAlign: 'center'
                            }}>
                            {desc.from}
                          </span>
                        </MouseoverTooltip>) : (<span
                          style={{
                            marginLeft: '7px',
                            marginRight: '7px',
                            color: '#df2e2d',
                            width: '90px',
                            display: 'inline-block',
                            textAlign: 'center'
                          }}
                        >
                          {desc.from}
                        </span>)
                      }
                      To
                      <MouseoverTooltip text={desc.toTip}>
                        <span
                          style={{
                            marginLeft: '7px',
                            color: '#df2e2d',
                            width: '90px',
                            display: 'inline-block',
                            textAlign: 'center'
                          }}
                        >
                          {desc.to}
                        </span>
                      </MouseoverTooltip>
                      <span style={{ marginLeft: '3px', verticalAlign: '-25%' }}>
                        <SvgIcon iconName={'dark-' + desc.icon} />
                      </span>
                    </div>)
                  })
                }

              </div>
            )
          }
          {
            item.haveSep && (<div style={{
              borderBottom: '2px dashed rgba(255, 255, 255, 0.2)',
              height: '43px'
            }}>

            </div>)
          }
        </div>)
      })
    }
    {
      isStarkNetChain && (<div style={{
        padding: '0 30px',
        display: 'flex',
        textAlign: 'left',
        paddingTop: '8px'
      }}>
        <SvgIcon iconName="dark-info" />
        <span style={{ color: '#df2e2d', flex: 1, marginLeft: '10px' }}>Starknet is still in alpha version, the transaction on it maybe
          will be done in 1~2 hours. Orbiter keeps your funds safe.</span>

      </div>)
    }

    <div
      style={{
        padding: '0 30px',
        display: 'flex',
        textAlign: 'left',
        paddingTop: '8px'
      }}
    >
      <SvgIcon className="warn-tip" iconName="dark-info" />
      <span style={{ color: '#df2e2d', flex: 1, marginRight: '10px' }}>
        Please do not modify the transaction or remove the last four
        digits on the transfer amount in your wallet as this will cause
        the transaction to fail.</span>
    </div>

    <ButtonConfirmed className="select-wallet-dialog" onClick={onRealTransfer}>
      {
        transferLoading ? <Loader></Loader> : (<span className="wbold s16" style={{ letterSpacing: '1px' }}>CONFIRM AND SEND</span>)
      }
    </ButtonConfirmed>


  </div>)
}