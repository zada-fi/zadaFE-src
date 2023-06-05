import React, { useMemo, useState, useRef } from "react";
import styled from "styled-components";
import SvgIcon from "../SvgIcon";
import orbiterEnv from "../../utils/orbiter-env";
import { chainName , showMessage} from "../../utils/orbiter-tool";
import Loader from "../Loader";
import { useWeb3React } from "@web3-react/core";
import { useOnClickOutside } from "../../hooks/useOnClickOutside"

import { IMXHelper } from "../../utils/orbiter-tool/immutablex/imx_helper";
import { DydxHelper } from "../../utils/orbiter-tool/dydx/dydx_helper";
import Web3 from 'web3'
import './style.css'
const StyledSvgIcon2 = styled(SvgIcon)`
width: 20px; 
height: 20px;
 cursor: pointer
`
type ObSelChainPropsType = {
  chainData: any[],
  onCancel: () => void,
  onChange: (item:any) => void
}

export default function ObSelectChain(props: ObSelChainPropsType) {
  let {account, connector} = useWeb3React()
  let [keyword, setKeyword] = useState<string>('')
  let [loadingIndex, setLoadingIndex] = useState<number>(-1)
  let node = useRef(null)
  useOnClickOutside(node, props.onCancel)
  const closerButton = () => {
    props.onCancel()
  }

  const transferChainData = useMemo(() => {
    let newArray = props.chainData.reduce((res, item) => {
      // @ts-ignore 
      const iconName = orbiterEnv.chainIcon[item]
      const chainData = {
        icon: iconName,
        chain: chainName(item),
        localID: item,
      }
      res.push(chainData)
      return res
    }, [])
    const chainOrderIds = [
      14, 514, 3, 33, 17, 517, 6, 66, 1, 5, 2, 22, 16, 516, 9, 99, 7, 77, 12, 512, 8,
      88, 10, 510, 11, 511, 13, 513, 4, 44, 15, 515, 518, 519, 520,
    ]
    newArray.sort((chainInfo: any, nextChainInfo: any) => {
      return (
        chainOrderIds.indexOf(+chainInfo.localID) -
        chainOrderIds.indexOf(+nextChainInfo.localID)
      )
    })
    return newArray
  }, [props.chainData])

  const newChainData = useMemo(() => {
    if (!keyword || keyword === '') {
      return transferChainData
    }
    return transferChainData.filter((item: any) => item.chain.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
  }, [transferChainData])
  function isStarkSystem(chainId: number) {
    return [4, 44, 8, 88, 11, 511].indexOf(chainId) > -1
  }
  const clickItem = async(item: any, index: number) => {
    console.log('clickItem enter', item)
    if (isStarkSystem(item.localID)) {
      try {
        // starknet
        if (item.localID == 4 || item.localID == 44) {
          // const { starkIsConnected, starkNetAddress } =
          //   web3State.starkNet
          // if (!starkIsConnected && !starkNetAddress) {
          //   await connectStarkNetWallet()
          //   if (
          //     !web3State.starkNet.starkIsConnected &&
          //     !web3State.starkNet.starkNetAddress
          //   ) {
          //     return
          //   }
          // }
        }
        // immutableX
        if (item.localID == 8 || item.localID == 88) {
          // this.loadingIndex = index
          setLoadingIndex(index)
          // const coinbase =
          //   compatibleGlobalWalletConf.value.walletPayload
          //     .walletAddress
          const coinbase = account
          const imxHelper = new IMXHelper(item.localID)
          const provider = await connector?.getProvider()
          coinbase && (await imxHelper.ensureUser(coinbase, provider))
        }

        // dydx
        if (item.localID == 11 || item.localID == 511) {
          try {
            // this.loadingIndex = index
            setLoadingIndex(index)
            // const coinbase =
            //   compatibleGlobalWalletConf.value.walletPayload
            //     .walletAddress
            const coinbase = account
            let provider = await connector?.getProvider()
            const dydxHelper = new DydxHelper(
              item.localID,
              new Web3(
                provider
              ),
              'MetaMask',
              connector
            )
            coinbase && await dydxHelper.getDydxClient(coinbase)
          } catch (error) {
            console.error(error)
          }
        }

        // this.loadingIndex = -1
        setLoadingIndex(-1)
      } catch (err) {
        console.log('error', err)
        // @ts-ignore 
        let msg = err&&err.message?err.message:''
        showMessage(msg, 'error')
        
        setLoadingIndex(-1)
        return
      }
    }
    console.log('clickItem---after', item)
    props.onChange(item)
    props.onCancel()
  }


  return (<div ref={node} className="obSelectChainBody">
    <div className="selectChainContent" >
      <div className="topItem">
        <span>Select a Chain</span>
        <div
          onClick={closerButton}
          style={{ position: 'absolute', top: 0, right: 0 }}
        >
          <StyledSvgIcon2
            iconName="close"
          />
        </div>
      </div>
      <div style={{ width: '100%', position: 'relative' }}>
        <input
          type="text"
          value={keyword}
          className="input"
          onChange={e => setKeyword(e.target.value)}
          placeholder="input search text"
        />
        <span >
          <SvgIcon className="searchIcon" iconName="light-search" />
        </span>

      </div>
    </div>
    <div className="list-content-box ob-scrollbar">
      <div className="list-content">
        {
          newChainData.map((item: any, index: number) => {
            return (<div className="contentItem"
              key={item.chain}
              onClick={() => clickItem(item, index)}>
              <SvgIcon iconName={item.icon} className={`logo`} />
              <span>{item.chain}</span>
              {loadingIndex === index && <Loader></Loader>}
            </div>)
          })
        }

      </div>
    </div>
  </div>)
}