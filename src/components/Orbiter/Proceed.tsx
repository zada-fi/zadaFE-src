import React, { useMemo } from "react"
import { ComPropsType } from './bridge'
import { useDispatch, useSelector } from "react-redux"
import { AppState } from "../../state"
import { chainName, shortAddress, transferTimeStampToTime, ensureWalletNetwork } from './../../utils/orbiter-tool'
import orbiterEnv from "../../utils/orbiter-env"
import CommBoxHeader from "../CommBoxHeader"
import { updateProceedTxID } from '../../state/orbiter/reducer'
import Loader from "../Loader"
import { isMobile } from "react-device-detect"
import SvgIcon from "../SvgIcon"
import './proceed.css'

import { useWeb3React } from "@web3-react/core"
import { ButtonOutlined } from "../Button"
export default function Proceed(props: ComPropsType) {
  let { connector, account } = useWeb3React()
  let dispatch = useDispatch()
  let proceeding = useSelector((state: AppState) => state.orbiter.proceeding)
  let proceedState = useSelector((state: AppState) => state.orbiter.proceedState)
  let transferDataState = useSelector((state: AppState) => state.orbiter.storeTransferDataState)
  let isCompleted = useMemo(() => {
    return !(
      proceedState === 1 ||
      proceedState === 2
    ) && proceedState === 5
  }, [proceedState])
  let isProcee = useMemo(() => {
    return proceedState !== 5
  }, [proceedState])
  const fromChainObj = useMemo(() => {
    const localChainID = transferDataState.fromChainID
    console.log('from chainobj localchainid', localChainID)
    if (!localChainID) {
      return {
        chainID: '',
        icon: '',
        name: ''
      }
    }
    return {
      chainID: localChainID || '',
      // @ts-ignore 
      icon: orbiterEnv.chainIcon[localChainID],
      name: chainName(localChainID)
    }
  }, [transferDataState.fromChainID])
  const toChainObj = useMemo(() => {
    const localChainID = transferDataState.toChainID
    if (!localChainID) {
      return {
        chainID: localChainID || '',
        icon: '',
        name: ''
      }
    }
    return {
      chainID: localChainID || '',
      // @ts-ignore 
      icon: orbiterEnv.chainIcon[localChainID],
      name: chainName(localChainID)
    }
  }, [transferDataState.toChainID])

  const FromTx = useMemo(() => {
    // const { proceedState, proceeding } = this.$store.state
    if (proceedState === 1) {
      return 'View on Explore'
    } else {
      // immutablex
      if (
        +transferDataState.fromChainID == 8 ||
        +transferDataState.fromChainID == 88
      ) {
        return `TransferId: ${proceeding.userTransfer.txid}`
      }
      return `Tx:${shortAddress(proceeding.userTransfer.txid || '')}`
    }
  }, [transferDataState.fromChainID, proceedState, proceeding])
  let ToTx = useMemo(() => {
    const { toChainID } = transferDataState
    // const { proceedState, proceeding } = this.$store.state
    if (proceedState < 4) {
      return 'View on Explore'
    } else {
      // immutablex
      if (+toChainID === 8 || +toChainID === 88) {
        return `TransferId: ${proceeding.makerTransfer.txid}`
      }
      return `Tx:${shortAddress(proceeding.makerTransfer.txid || '')}`
    }
  }, [transferDataState.toChainID, proceedState, proceeding])

  let proceedData = useMemo(() => {
    const { selectMakerConfig, fromCurrency } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return [
        {
          title: 'Timestamp',
          desc: transferTimeStampToTime(
            proceeding.userTransfer.timeStamp
          ),
        }
      ]
    }
    return [
      {
        title: 'Timestamp',
        desc: transferTimeStampToTime(
          proceeding.userTransfer.timeStamp
        ),
      },
      {
        title: 'Value',
        desc:
          (
            (proceeding.userTransfer.amount || 0) /
            10 ** selectMakerConfig.fromChain.decimals
          ).toFixed(6) +
          ' ' +
          fromCurrency,
      },
    ]

  }, [proceeding, transferDataState.fromCurrency, transferDataState.selectMakerConfig])
  const onBackClick = () => {
    dispatch(updateProceedTxID(null))
    props.onChangeState('1')
  }
  const goToExplorFrom = async () => {
    let url = ''
    const { fromChainID } = transferDataState
    const { accountExploreUrl, txExploreUrl } = orbiterEnv
    if (proceedState === 1) {
      let userAddress = account //web3State.coinbase
      if (+fromChainID == 4 || +fromChainID == 44) {
        // userAddress = web3State.starkNet.starkNetAddress
      }
      //@ts-ignore
      url = accountExploreUrl[+fromChainID] + userAddress

      // ImmutableX
      if (+fromChainID == 8 || +fromChainID == 88) {
        //@ts-ignore
        url = accountExploreUrl[+fromChainID]
      }
    } else {
      const txid = proceeding.userTransfer.txid
      //@ts-ignore
      url = txExploreUrl[+fromChainID] +
        txid +
        (+fromChainID == 9 || +fromChainID == 99 ? '-transfer' : '')

      // ImmutableX don't have testnet browser
      if (+fromChainID == 88) {
        //@ts-ignore
        url = accountExploreUrl[+fromChainID]
      }
    }
    window.open(url, '_blank')
  }
  const switchNetWork = (isFrom = true) => {
    if (isFrom) {
      ensureWalletNetwork(+fromChainObj.chainID, connector)
    } else {
      ensureWalletNetwork(+toChainObj.chainID, connector)
    }
  }
  const goToExplorTo = async () => {
    let data = transferDataState
    
    const { toChainID } = data
    const { accountExploreUrl, txExploreUrl } = orbiterEnv
    let url = null

    const commHandler = () => {
        let userAddress = account //web3State.coinbase
        if (+toChainID == 4 || +toChainID == 44) {
            // userAddress = web3State.starkNet.starkNetAddress
        }
        // @ts-ignore 
        url = accountExploreUrl[+toChainID] + userAddress

        // ImmutableX
        if (+toChainID == 8 || +toChainID == 88) {
          // @ts-ignore 
            url = accountExploreUrl[toChainID]
        }
    }
    if (proceedState < 4) {
      commHandler()
    } else {
        const txid = proceeding.makerTransfer.txid
        // @ts-ignore 
        url = txExploreUrl[+toChainID] +
            txid +
            (+toChainID == 9 || +toChainID == 99 ? '-transfer' : '')

        // ImmutableX don't have testnet browser
        if (+toChainID == 88) {
          // @ts-ignore 
            url = accountExploreUrl[+toChainID]
        }
    }
    window.open(url, '_blank')
  }

  return (<div className="proceed-box">
    <CommBoxHeader back={true} onBack={onBackClick}>{
      isCompleted
        ? 'Completed'
        : 'Processing'
    }</CommBoxHeader>
    <div className="ProceedContent">
      {
        proceedData.map((item: any) => {
          return (<div className="contentItem" key={item.title}>
            <span
              className="item-title"
              style={{ width: '100px', textAlign: 'left' }}
            >{item.title}</span>
            {
              item.desc || item.descInfo ? (<span
                className="item-value right">{item.desc}</span>) :
                (<span className="right"><Loader></Loader></span>)
            }

          </div>)
        })
      }


      <div className="chainDataContent">
        {isMobile &&
          (<div className="middle-icon-abs" style={{ zIndex: 2 }}>
            {
              isProcee ? (
                <div className={`${isProcee ? 'rocket-box-bg' : ''}`}></div>) :
                (<div className="rocket-box">
                  <SvgIcon iconName="satellite"></SvgIcon>
                </div>)
            }
          </div>)
        }

        <div className="item left" style={{ zIndex: 3 }}>
          <div className="chain-name from">
            <span>{fromChainObj.name || ''}</span>
          </div>
          <div className="chain">
            <SvgIcon className="chain-logo" iconName={fromChainObj.icon}></SvgIcon>
          </div>
          <div className="tx from-tx" onClick={goToExplorFrom}>
            {
              proceedState === 1 && (<SvgIcon className="status-icon" iconName="history_2"></SvgIcon>)
            }
            {
              proceedState === 2 && <SvgIcon className="status-icon" iconName="history_3"></SvgIcon>

            }
            {
              proceedState !== 1 && proceedState !== 2 && (<SvgIcon className="status-icon" iconName="status-success"></SvgIcon>)
            }

            <span>{FromTx}</span>
          </div>
          <ButtonOutlined className="switch-btn" onClick={() => switchNetWork()}>
            Switch Network
          </ButtonOutlined>
        </div>
        <div className="middle-icon">
          {!isMobile &&
            (<><div className={`rocket-box ${isProcee ? 'rocket-box-bg' : ''}`} >
              {!isProcee && <SvgIcon iconName="satellite" />}
            </div>
              <div className="rocket-line-box">
                  <SvgIcon iconName="dark-rocket-line" className="rock-line-style" />
              </div></>)
          }
        </div>
        <div className="item right" style={{ zIndex: 3 }}>
          <div className="chain-name to">
            <span>{toChainObj.name}</span>
          </div>
          <div className="chain">
            <SvgIcon className="chain-logo" iconName={toChainObj.icon} />
          </div>
          <div className="tx to-tx" onClick={goToExplorTo}>
            {
              proceedState === 4 && <SvgIcon className="status-icon"
                iconName="history_3"></SvgIcon>
            }
            {
              proceedState === 5 && <SvgIcon className="status-icon"
                iconName="status-success"></SvgIcon>
            }
            {
              proceedState !== 4 && proceedState !== 5 && <SvgIcon className="status-icon"
                iconName="history_1"></SvgIcon>
            }
            <span>{ToTx}</span>
          </div>
          <ButtonOutlined className="switch-btn" onClick={() => switchNetWork(false)}>
            Switch Network
          </ButtonOutlined>
        </div>
      </div>
    </div>



  </div>)
}