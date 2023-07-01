import React, { useMemo, useState } from 'react'
import { useWeb3React } from "@web3-react/core"
import CurrencyLogo from './../CurrencyLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { NetworkContextName } from "../../constants"
import { useWalletModalToggle } from "../../state/application/hooks"
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import './My.css'
const InfoRightDiv = styled.div`
  display:flex;
  flex-flow:column nowrap;
  box-sizing:border-box;
  background:#26326D;
  flex: none;
  width: 580px;
  border-radius: 14px;
  padding: 0 30px;
  padding-bottom: 35px;
  min-height: 420px;
  ${({theme}) => theme.mediaWidth.upToLarge`
    width: 48%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
    width: 100%;
    margin-top: 40px;
  `};
  .bot-button{
    border: none;
    outline: none;
    width: 100%;
    height: 44px;
    background-color: #4A68FF;
    border-radius: 14px;
    color: #ffffff;
    font-size: 20px;
    text-align: center;
  }


`


const ClaimCenterDiv = styled.div`
  flex:1;
  display:flex;
  justify-content:center;
  align-items: center;
  flex-flow:column nowrap;
  box-sizing:border-box;
  background:#0A0F34;
  width: 100%;
  border-radius: 14px;
  margin-bottom: 61px;
  ${({theme}) => theme.mediaWidth.upToSmall`
  `};
`
export default function LaunchMy(props){
  let [errorMsg, setErrorMsg] = useState('')
  let [investNum, setInvestNum ] = useState(null)
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const walletIsLogin = useMemo(() => {
    console.log('walletIsLogin---',active, account, contextNetwork.active)
    return (contextNetwork.active || active)&& account
  }, [active, contextNetwork, account])
 


  const btnStatus = useMemo(()=>{
    if(walletIsLogin){
      if(props.curStatus === 2){
        return 1 // buy
      }else{
        return 2 // claim
      }
    }else{
      return 0 // connect
    }
  },[props.curStatus, walletIsLogin])

  let fromCoinName = useMemo(()=>{
    return (props.fromCoin||{}).symbol || ''
  },[props.fromCoin])
  let toCoinName = useMemo(()=>{
    return (props.toCoin||{}).symbol || ''
  },[props.toCoin])

  let realBalance = useMemo(()=>{
    if(props.fromCoin){
      let a = new BigNumber(props.balance).shiftedBy(0-props.fromCoin.decimals)
      return a.toString()
    }else{
      return 0
    }
  },[props.fromCoin, props.balance])
  let realPrice = useMemo(()=>{
    if (props.fromCoin && props.toCoin){
      let a = new BigNumber(props.price).shiftedBy(props.fromCoin.decimals - props.toCoin.decimals)
      return a.toString()
    }
    else {
      return ''
    }
  },[props.toCoin, props.fromCoin])
  let profitNum = useMemo(()=>{
    if(!realPrice || !investNum){
      return 0
    }
    let tempNum = new BigNumber(investNum).multipliedBy(realPrice)
    return tempNum.toString()
  },[investNum, realPrice])

  let realMax = useMemo(()=>{
    if (props.max){
      let a = new BigNumber(props.max).shiftedBy(0-(props.fromCoin?.decimals ?? 0))
      return a.toString()
    }
    else {
      return ''
    }
  },[props.max, props.fromCoin])
  let realMin = useMemo(()=>{
    if (props.min){
      let a = new BigNumber(props.min).shiftedBy(0-(props.fromCoin?.decimals ?? 0))
      return a.toString()
    }
    else {
      return ''
    }
  },[props.min, props.fromCoin])

  const toggleWalletModal = useWalletModalToggle()

  const clickHandler = ()=>{
    // buy or claim
    setErrorMsg('')
    if(props.curStatus === 2){
      // claim
      if(props.availClaimNum && new BigNumber(props.availClaimNum).comparedTo(0) === 1){
        // To Claim


      }else{
        setErrorMsg('No Available claim')
      }

    }else if(props.curStatus === 1){
      // buy




    }else if(props.curStatus === 0){
      // unstart
      setErrorMsg('Unstart!')
      return 
    }

  }
  

  return ( <InfoRightDiv>
    <p className="ClaimTitle">{props.curStatus === 2 ?`Claim ${toCoinName} Token`:`Invest in ${toCoinName} Token`}</p>
    {
      props.curStatus === 2 && (<ClaimCenterDiv>
        <p className="ClaimSubTitle">Claim available</p>
        <div className="ClaimAmountTitle">{walletIsLogin?props.availClaimNum:0.0000}</div>
      </ClaimCenterDiv>)
    }
    {
      props.curStatus !== 2 && (<>
      <div className='item invest-item'>
        <div className='left'>
          <span className='key'>Investment</span>
          <div className='value-frame'>
              <NumericalInput
                className="value"
                value={investNum}
                onUserInput={val => {
                  setInvestNum(val)
                }}
              />
          </div>
        </div>
        <div className='right'>
          <div className='key-zhanwei'>
            <label className='key avail'>
              Minimum: <span className='impo'>{realMin}</span>
            </label>
          </div>
         <label className='key avail'>
          Max amount: <span className='impo'>{realMax}</span>
         </label> 
         <label className='key avail'>
          Balance: <span className='impo'>{realBalance}</span>
         </label> 
         <div className='current-logo-container'>
          <CurrencyLogo currency={props.fromCoin} size={'24px'} />
          <span className='txt'>{(props.fromCoin||{}).symbol}</span>
         </div>

        </div>
      </div>
      <div className='item amount-item'>
        <div className='left'>
          <span className='key'>Amount</span>
          <div className='value-frame'>
            <span className='value'>{profitNum}</span>
          </div>
        </div>
        <div className='right'>
         {/* <label className='key avail'>
          Max amount: <span className='impo'>{realMax}</span>
         </label> */}
        </div>
      </div>
      <div className='bottom-item'>
        <span className='bot-key'>Price</span>
        <span className='bot-value'>
        1.0{fromCoinName} = {realPrice}{toCoinName}
        </span>
      </div>
      </>)
    }
    
    {
      !walletIsLogin && <button className='bot-button' onClick={toggleWalletModal}>Not connected</button>
    }
    {
      walletIsLogin && <button className='bot-button' onClick={clickHandler}>{props.curStatus === 2?'Claim':'Buy'}</button>
    }
    <p className='my-error-msg'>{errorMsg}</p>
    
  </InfoRightDiv>)
}