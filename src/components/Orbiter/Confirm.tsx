import React, { useEffect, useState, useMemo } from "react"
import * as ethers from 'ethers'
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
import { SUPPORTED_WALLETS } from '../../constants'
import { injected } from '../../connectors'
import { useWeb3React } from "@web3-react/core"
import { NetworkContextName } from "../../constants"
import {
  isLegalAddress, showMessage, getMetaMaskNetworkId,
  ensureWalletNetwork, isExecuteXVMContract, getRealTransferValue,
  getChainInfoByChainId, isEthTokenAddress, stableWeb3
} from "../../utils/orbiter-tool"
import { useWalletModalToggle } from "../../state/application/hooks"
import { CrossAddress } from "../../utils/orbiter-tool/cross_address"
import { XVMSwap } from "../../utils/orbiter-constant/xvm"
import { RatesType, getRates } from '../../utils/orbiter-tool/coinbase'
import { updateProceedState,
updateProceedTxID,
updateProceedingMakerTransfer,
updateProceedingUserTransfer } from "../../state/orbiter/reducer"
import orbiterCore from "../../utils/orbiter-core"


export default function Confirm(props: ComPropsType) {
  // @ts-ignore 
  let [transferLoading, setTransferLoading] = useState<boolean>(false)
  // @ts-ignore 
  let [expectValue, setExpectValue] = useState('')
  let storeConfirmData = useSelector((state: AppState) => state.orbiter.confirmData)
  let transferDataState = useSelector((state: AppState) => state.orbiter.storeTransferDataState)
  let { realTransferAmount, realTransferOPID } = useTransferCalcute({
    transferDataState
  })
  const toggleWalletModal = useWalletModalToggle()
  const { active, account, chainId, connector } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const walletIsLogin = useMemo(() => {
    return contextNetwork.active || active
  }, [active, contextNetwork])
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
          realTransferAmount +
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
        if(resdata.code !== 0 ){
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


  const proceedUserTransferReady = (user:any, maker:string, amount:any, localChainID:string, txHash:any)=>{
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
    if(!selectMakerConfig || Object.keys(selectMakerConfig).length === 0){
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
    // this.$notify.success({
    //   title,
    //   duration: 3000,
    // })
    showMessage(title, 'success')
    // this.$emit('stateChanged', '3')
    props.onChangeState('3')
  }

  const handleXVMContract = async () => {
    const {
      fromChainID,
      crossAddressReceipt,
      isCrossAddress,
      selectMakerConfig,
    } = transferDataState
    // const account =
    //     compatibleGlobalWalletConf.value.walletPayload.walletAddress

    if (!walletIsLogin) {
      return
    }

    const amount = getRealTransferValue(transferDataState)
    const matchSignatureDispatcher = null // TODO
    // walletDispatchersOnSignature[
    //     compatibleGlobalWalletConf.value.walletType
    // ]
    if (matchSignatureDispatcher) {
      // TODO
      // matchSignatureDispatcher(
      //     account,
      //     selectMakerConfig,
      //     amount,
      //     fromChainID,
      //     this.onTransferSucceed
      // )
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
      // this.$notify.error({
      //     title: e.message,
      //     duration: 3000,
      // })
    }
  }

  const onRealTransfer = async () => {
    if (!walletIsLogin) {
      // Middle.$emit('connectWallet', true)
      toggleWalletModal()
      return
    }
    if (!await isLegalAddress(transferDataState, account)) {
      // this.$notify.error({
      //     title: `Contract address is not supported, please use EVM address.`,
      //     duration: 3000,
      // });
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
          // TODO
          // const matchAddChainDispatcher =
          //     walletDispatchersOnSwitchChain[
          //         compatibleGlobalWalletConf.value.walletType
          //     ]
          // if (matchAddChainDispatcher) {
          //     matchAddChainDispatcher(
          //         compatibleGlobalWalletConf.value.walletPayload
          //             .provider
          //     )
          //     return
          // }
        }
      }
    }

    // Only one
    if (transferLoading) {
      return
    }

    // EVM contract
    if (isExecuteXVMContract(transferDataState)) {
      // this.transferLoading = true
      setTransferLoading(true)
      await handleXVMContract()
      // this.transferLoading = false
      setTransferLoading(false)
      return
    }

    // this.transferLoading = true

    // TODO ...
    // setTransferLoading(true)

    // if (+fromChainID === 3 || +fromChainID === 33) {
    //   this.zkTransfer()
    // } else if (+fromChainID === 14 || +fromChainID === 514) {
    //   this.zk2Transfer()
    // } else if (+fromChainID === 9 || +fromChainID === 99) {
    //   this.loopringTransfer()
    // } else if (+fromChainID === 12 || +fromChainID === 512) {
    //   this.zkspaceTransfer()
    // } else {
    //   const tokenAddress = selectMakerConfig.fromChain.tokenAddress
    //   const to = selectMakerConfig.recipient
    //   const tValue = transferCalculate.getTransferTValue()
    //   if (!tValue.state) {
    //     this.$notify.error({
    //       title: tValue.error,
    //       duration: 3000,
    //     })
    //     this.transferLoading = false
    //     return
    //   }
    //   if (toChainID === 4 || toChainID === 44) {
    //     this.transferToStarkNet(tValue.tAmount)
    //     return
    //   }
    //   const account =
    //     compatibleGlobalWalletConf.value.walletPayload.walletAddress
    //   if (fromChainID === 4 || fromChainID === 44) {
    //     this.starknetTransfer(tValue.tAmount)
    //     return
    //   }

    //   if (fromChainID === 8 || fromChainID === 88) {
    //     this.imxTransfer(tValue.tAmount)
    //     return
    //   }

    //   if (fromChainID === 11 || fromChainID === 511) {
    //     this.dydxTransfer(tValue.tAmount)
    //     return
    //   }

    //   if (util.isEthTokenAddress(fromChainID, tokenAddress)) {
    //     // When tokenAddress is eth
    //     this.ethTransfer(tValue.tAmount)
    //   } else {
    //     // When tokenAddress is erc20
    //     if (
    //       compatibleGlobalWalletConf.value.walletType ===
    //       WALLETCONNECT
    //     ) {
    //       const web3 = new Web3()
    //       const tokenContract = new web3.eth.Contract(
    //         Coin_ABI,
    //         tokenAddress
    //       )
    //       const tokenTransferData = await tokenContract.methods
    //         .transfer(to, web3.utils.toHex(tValue.tAmount))
    //         .encodeABI()
    //       return walletConnectSendTransaction(
    //         fromChainID,
    //         account,
    //         tokenAddress,
    //         0,
    //         tokenTransferData
    //       ).then((hash) => {
    //         this.onTransferSucceed(
    //           account,
    //           tValue.tAmount,
    //           fromChainID,
    //           hash
    //         )
    //       })
    //     }
    //     const transferContract = getTransferContract(
    //       fromChainID,
    //       tokenAddress
    //     )
    //     if (!transferContract) {
    //       this.$notify.error({
    //         title: 'Failed to obtain contract information, please refresh and try again',
    //         duration: 3000,
    //       })
    //       return
    //     }

    //     let gasLimit = await getTransferGasLimit(
    //       fromChainID,
    //       selectMakerConfig,
    //       account,
    //       to,
    //       tValue.tAmount
    //     )
    //     if (fromChainID === 2 && gasLimit < 21000) {
    //       gasLimit = 21000
    //     }
    //     const objOption = { from: account, gas: gasLimit }
    //     transferContract.methods
    //       .transfer(to, tValue.tAmount)
    //       .send(objOption, (error, transactionHash) => {
    //         this.transferLoading = false
    //         if (!error) {
    //           this.onTransferSucceed(
    //             account,
    //             tValue.tAmount,
    //             fromChainID,
    //             transactionHash
    //           )
    //         } else {
    //           this.$notify.error({
    //             title: error.message,
    //             duration: 3000,
    //           })
    //         }
    //       })
    //   }
    // }
  }
  return (<div className="confirm-box">
    <CommBoxHeader className="head-com" back={true} onBack={onBackClick}>Confirm</CommBoxHeader>
    {
      confirmData.map(item => {
        return (<div className="confirm-item"
          key={item.title}
          style={{ marginBottom: '22px' }}>
          <div className="item-left">
            <SvgIcon iconName={'light-' + item.icon} />
            <span className="left-txt">{item.title}</span>
            <QuestionHelper text={item.notice || ''} />

          </div>
          <div className="item-right">
            {item.desc && <span>{item.desc}</span>}
          </div>
          {
            item.descInfo && item.descInfo.length && (
              <div className="descBottom">
                {
                  item.descInfo.map((desc: any, index) => {
                    return (<div key={desc.no} style={{ marginBottom: '10px' }}>

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
                        <SvgIcon iconName={'light-' + desc.icon} />
                      </span>
                    </div>)
                  })
                }

              </div>
            )
          }
          {
            item.haveSep && (<div style={{
              borderBottom: '2px dashed rgba(0, 0, 0, 0.2)',
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
        <SvgIcon iconName="light-info" />
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
      <SvgIcon iconName="light-info" />
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