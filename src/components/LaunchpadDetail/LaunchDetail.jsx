import React, {useEffect, useMemo, useState} from "react";
import { useWeb3React } from "@web3-react/core"
import styled from "styled-components";
import "./LaunchDetail.css";
import { useCurrency } from "../../hooks/Tokens";

import {getQuery} from '../../utils/orbiter-tool'
import { getProjectCommonData, getProjectUserData, getTokenAllowanceAndBalance} from './LaunchPadHooks'
import LaunchStatus from './LaunchStatus'
import LaunchTotal from './LaunchTotal'
import LaunchMy from './My'
import LaunchBottom from './bottom'
import {useLocation, useHistory} from "react-router-dom";
import SvgIcon from "../SvgIcon";
import BigNumber from 'bignumber.js'
import link1Img from './images/link1.png'
import link2Img from './images/link2.png'
import link3Img from './images/link3.png'
import link4Img from './images/link4.png'
const TitleDiv = styled.div`
  font-size: 10px;
  color:#566188;
  padding:10px 0;
  width:100%
  box-sizing:border-box;
  cursor:pointer;
  ${({theme}) => theme.mediaWidth.upToSmall`
    font-size:24px;
    padding: 20px 10px;
  `};
`
const MainDiv = styled.div`
  display:flex;
  flex-flow:row wrap
  font-size: 18px;
  line-height:1;
  color: #ffffff;
  box-sizing:border-box;
  justify-content: space-between;
  padding-top: 34px;
  ${({theme}) => theme.mediaWidth.upToSmall`
    font-size:14px;
  `};
`
const LeftDiv = styled.div`
  font-size: 18px;
  line-height:1;
  color: #ffffff;
  box-sizing:border-box;
  flex: none;
  width: 580px;
  .link-wrap{
    width: 280px;
  }
  ${({theme}) => theme.mediaWidth.upToLarge`
    font-size:14px;
    width: 48%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
    font-size:14px;
    width: 100%;
    .link-wrap{
      width: 100%;
    }
    .link-wrap{
      padding-bottom: 30px;
      box-sizing:border-box;
    }
  `};
`

const RightDiv = styled.div`
  line-height:1;
  color: #ffffff;
  box-sizing:border-box;
  aspect-ratio:58/28;
  background:#26326D;
  flex:none;
  width: 580px;
  border-radius: 14px;
  overflow:hidden;
  ${({theme}) => theme.mediaWidth.upToLarge`
    font-size:14px;
    width: 48%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
    font-size:14px;
    width: 100%;
  `};
`
const SubDiv = styled.div`
  flex:1 0;
  line-height:24px;
  font-size: 14px;
  font-family: PingFang SC;
  font-weight: 400;
  color: #878FAF;
  box-sizing:border-box;
  ${({theme}) => theme.mediaWidth.upToSmall`
    font-size:13px;
  `};
`
const InfoDiv = styled.div`
  display:flex;
  flex-flow:row wrap;
  justify-content: space-between;
  align-content: stretch;
  box-sizing:border-box;
  min-height:420px;
  ${({theme}) => theme.mediaWidth.upToSmall`
  `};
`
const InfoLeftDiv = styled.div`
  display:flex;
  flex-flow:column;
  box-sizing:border-box;
  flex: none;
  width: 580px;
  ${({theme}) => theme.mediaWidth.upToLarge`
    width: 48%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`


const ContentDiv = styled.div`
  width: 1260px;
  margin: 0 auto;
  padding: 0 30px;
  box-sizing: border-box;
  background:#0A0F34;
  ${({theme}) => theme.mediaWidth.upToLarge`
    width: 100%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
  `}
  ${({theme}) => theme.mediaWidth.upToSmall`
  `}
`


export default function LaunchDetail() {
  let location = useLocation()
  let history = useHistory()
  let projectAddress = useMemo(() => {
    return getQuery().projectAddress || '0x9100bdc539F69969a731d2dbDDA5e15E3e9dda60'
  }, [location.search])
  let [minUserCap, maxUserCap, tokenPrice, fromAddress, toAddress, totalRaise, hardcap, preStartTime, preEndTime,pubEndTime] =  getProjectCommonData(projectAddress)
  let fromCoinCurrency = useCurrency(fromAddress)
  let toCoinCurrency = useCurrency(toAddress)
  let { account } = useWeb3React()
  let [allowance, balance] = getTokenAllowanceAndBalance(fromAddress, projectAddress, account)
  // let [allowance, balance] = ['0', '0'];
    // let [allowance, balance] = getTokenAllowanceAndBalance('0x58e460dEE0bFAd1E40F959dEbef4B096177feedb', '0xEE5970AE95C802F8BbabeB7b93F0A3482837F244', '0xCe7BAa4cd38574ECc8C2D05f55f0e6E69087B76f');

  let [investNum, iswhite, isClaimed] = getProjectUserData(projectAddress, account)
  
  // let [startTime, endTime] = getProjectTime(projectAddress)
  let curStatus = useMemo(()=>{
    console.log('curStatus--useMemo-', preStartTime, preEndTime,pubEndTime)
    let now = Date.now()
    if(!preStartTime || now < preStartTime){
      return 0 // 
    }else if(now >= preStartTime && now < preEndTime){
      return 1 
    }else if(now >= preEndTime && now < pubEndTime) {
      return 2
    }else {
      return 3
    }

  },[preStartTime, preEndTime, pubEndTime])
  let availClaimNum = useMemo(()=>{
    let val1 = new BigNumber(investNum||'0')
    let val2 = new BigNumber(tokenPrice || '0')
    return val1.multipliedBy(val2).toNumber()
  },[investNum, tokenPrice])
  let temObjStr = localStorage.getItem(process.env.NODE_ENV+'_'+projectAddress)||'{}'

  let [detailsInfo, setDetailsInfo] = useState(JSON.parse(temObjStr));
  // setDetailsInfo()
  // const detailsInfo = localStorage.getItem(process.env.NODE_ENV+'_'+projectAddress)
console.log(detailsInfo)

  
  console.log('launchpadDetail default function LaunchDetail()');
  // getPadContractData();
  // getProjectData('0x9100bdc539F69969a731d2dbDDA5e15E3e9dda60');
  const backHandler = ()=>{
    history.goBack()
    localStorage.removeItem(process.env.NODE_ENV+'_'+projectAddress)
  }

  return (<ContentDiv>
    <TitleDiv onClick={backHandler}>
      &lt;Back to list
    </TitleDiv>
    <MainDiv>
      <LeftDiv>
        <p className="MainTitle">{`${detailsInfo.project_name} auction`}</p>
        <p className="DesTitle">{detailsInfo.project_description}</p>
        <div className="link-wrap">
          <a className="link-img-wrap" target="_blank" href={detailsInfo.project_links.twitter_url}><img className="link-img-item" src={link1Img}/></a>
          <a className="link-img-wrap" target="_blank" href={detailsInfo.project_links.tg_url}><img className="link-img-item" src={link2Img}/></a>
          <a className="link-img-wrap" target="_blank" href={detailsInfo.project_links.dc_url}><img className="link-img-item" src={link3Img}/></a>
          <a className="link-img-wrap" target="_blank" href={detailsInfo.project_links.web_url}><img className="link-img-item" src={link4Img}/></a>
        </div>
      </LeftDiv>
      <RightDiv>
        <img className="pic" src={detailsInfo.project_pic_url} referrerpolicy={"no-referrer"}></img>
      </RightDiv>

    </MainDiv>
    <SubDiv className="desc1">
      {detailsInfo.project_title}
      
    </SubDiv>
    <br/>
    <br/>
    {/* <SubDiv  className="desc2">
      请确保您在继续之前了解公开销售的机制和条款，存入的金额不能提取。
      最初，拍卖将以 100 万美元的完全稀释估值 (FDV) 开始，为 $PNP 确定 0.1 美元的底价，并在筹集到前 20 万美元后增加。一旦达到 200k，我们将进入价格发现阶段，代币价格将在每次购买时持续上涨。
      <br /><SvgIcon className="tips" iconName="tips-default"></SvgIcon> 无论您何时参与，每个人都将以相同的最终价格获得 $XXX 代币。
      <br /><SvgIcon className="tips" iconName="tips-default"></SvgIcon>您的分配将由 30% $XXX 和 70% $XXX（超过 1 年的 $PNP 线性归属的收据代币）组成。请查看
    </SubDiv> */}
    <InfoDiv>
      <InfoLeftDiv>
        <LaunchStatus curStatus={curStatus}></LaunchStatus>
        <LaunchTotal
        price={tokenPrice}
        totalRaise={totalRaise}
        hardcap={hardcap} 
        fromCoin={fromCoinCurrency}
        toCoin={toCoinCurrency}></LaunchTotal>
      </InfoLeftDiv>
      <LaunchMy 
       projectAddress={projectAddress}
        allowance={allowance}
        balance={balance}
        isClaimed={isClaimed}
        iswhite={iswhite}
        availClaimNum={availClaimNum}
        min={minUserCap} 
        max={maxUserCap} 
        price={tokenPrice}  
        fromCoin={fromCoinCurrency}
        toCoin={toCoinCurrency}
        curStatus={curStatus}/>
    </InfoDiv>
    {/* <LaunchBottom/> */}
    <p className="FooterText">ZadaFinance is the first decentralized order book exchange on Scroll that supports cross-Rollup transactions. Its Lanchpad aims to foster the development of projects within the Scroll ecosystem and discover high-quality assets. As a permissionless protocol, ZadaFinance assumes no responsibility for any tokens purchased using its contracts. All users are fully liable for understanding the associated risks, and their participation in any tokens is completely independent and unrelated to ZadaFinance.</p>
  </ContentDiv>

  )
}