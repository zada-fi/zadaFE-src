import React, {useEffect, useMemo} from "react";
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
import {useLocation} from "react-router-dom";
import SvgIcon from "../SvgIcon";
import BigNumber from 'bignumber.js'
const TitleDiv = styled.div`
  font-size: 10px;
  color:#566188;
  padding:10px 0;
  width:100%
  box-sizing:border-box;
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
  ${({theme}) => theme.mediaWidth.upToLarge`
    font-size:14px;
    width: 48%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
    font-size:14px;
    width: 100%;
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
  let projectAddress = useMemo(() => {
    return getQuery().projectAddress || '0x9100bdc539F69969a731d2dbDDA5e15E3e9dda60'
  }, [location.search])
  let [minUserCap, maxUserCap, tokenPrice, fromAddress, toAddress, totalRaise, hardcap, startTime, endTime] =  getProjectCommonData(projectAddress)
  let fromCoinCurrency = useCurrency(fromAddress)
  let toCoinCurrency = useCurrency(toAddress)
  let { account } = useWeb3React()
  let [allowance, balance] = getTokenAllowanceAndBalance(fromAddress, projectAddress, account)
  // let [allowance, balance] = ['0', '0'];
    // let [allowance, balance] = getTokenAllowanceAndBalance('0x58e460dEE0bFAd1E40F959dEbef4B096177feedb', '0xEE5970AE95C802F8BbabeB7b93F0A3482837F244', '0xCe7BAa4cd38574ECc8C2D05f55f0e6E69087B76f');

  let [investNum, iswhite, isClaimed] = getProjectUserData(projectAddress, account)
  
  // let [startTime, endTime] = getProjectTime(projectAddress)
  let curStatus = useMemo(()=>{
    console.log('curStatus--useMemo-', startTime, endTime)
    let now = Date.now()
    if(!startTime || now < startTime){
      return 0 // 
    }else if(now >= startTime && now < endTime){
      return 1 
    }else {
      return 2
    }

  },[startTime, endTime])
  let availClaimNum = useMemo(()=>{
    let val1 = new BigNumber(investNum||'0')
    let val2 = new BigNumber(tokenPrice || '0')
    return val1.multipliedBy(val2).toNumber()
  },[investNum, tokenPrice])

  

  
  console.log('launchpadDetail default function LaunchDetail()');
  // getPadContractData();
  // getProjectData('0x9100bdc539F69969a731d2dbDDA5e15E3e9dda60');
  

  return (<ContentDiv>
    <TitleDiv>
      &lt;Back to list
    </TitleDiv>
    <MainDiv>
      <LeftDiv>
        <p className="MainTitle">XXX auction</p>
        <p className="DesTitle">Penpie is a next-generation DeFi product created by Magpie to provide Pendle Finance users with yield and veTokenomics boosting services. Integrated with Pendle Finance, Penpie focuses on locking PENDLE tokens to obtain governance rights and enhanced yield benefits within Pendle Finance. Penpie revolutionizes the way users can maximize returns on their investments and monetize their governance power.</p>
      </LeftDiv>
      <RightDiv></RightDiv>

    </MainDiv>
    <SubDiv className="desc1">
      $xxx 在 xxx 上的初始 DEX 发行 (IDO) 是一项高风险的投资活动。该项目仍处于早期阶段，存在资金损失的可能性。强烈建议投资者进行尽职调查，只投资他们愿意损失的东西。$XXX 无意构成任何司法管辖区的证券。本公告不构成任何类型的招股说明书或要约文件，也无意构成任何司法管辖区的证券要约或证券投资招揽。请注意，交易加密货币涉及重大风险，并可能导致您的投资资本损失。
    </SubDiv>
    <SubDiv  className="desc2">
      请确保您在继续之前了解公开销售的机制和条款，存入的金额不能提取。
      最初，拍卖将以 100 万美元的完全稀释估值 (FDV) 开始，为 $PNP 确定 0.1 美元的底价，并在筹集到前 20 万美元后增加。一旦达到 200k，我们将进入价格发现阶段，代币价格将在每次购买时持续上涨。
      <br /><SvgIcon className="tips" iconName="tips-default"></SvgIcon> 无论您何时参与，每个人都将以相同的最终价格获得 $XXX 代币。
      <br /><SvgIcon className="tips" iconName="tips-default"></SvgIcon>您的分配将由 30% $XXX 和 70% $XXX（超过 1 年的 $PNP 线性归属的收据代币）组成。请查看
    </SubDiv>
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
    <LaunchBottom/>
    <p className="FooterText">Zada  是一套去中心化合约，旨在支持 Arbitrum 本地构建器。作为一种无需许可的协议，Zada 对使用其合约购买的任何代币不承担任何责任。所有用户都对他们了解所涉及的相关风险承担全部责任，并且他们参与的代币是完全独立的，与 Zada 没有任何关联。Zada 应用程序上的社交媒体帖子和可见信息绝不算作 Zada 团队对协议的认可，在任何 Zada 媒体上发布或分享的任何内容都不是推荐或财务建议。</p>
  </ContentDiv>

  )
}