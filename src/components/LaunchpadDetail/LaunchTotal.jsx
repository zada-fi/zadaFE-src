import React, { useMemo } from 'react'
import DetailInfo from "./DetailInfo"
import styled from "styled-components";
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js'
import Img1 from './images/1@2x.png'
import Img2 from './images/2@2x.png'
import Img3 from './images/3@2x.png'
import Img4 from './images/4@2x.png'
const InfoLeftBottomDiv = styled.div`
  width:100%;
  flex: auto;
  margin-top:40px;
  box-sizing:border-box;
  background:#26326D;
  border-radius: 14px;
  ${({theme}) => theme.mediaWidth.upToSmall`
  `};
`
const DetailInfoContainerDiv = styled.div`
  display:flex;
  flex-flow:row wrap;
  flex:1 ;
  width:100%;
  height: 100%;
  align-items: center;
  box-sizing:border-box;
  ${({theme}) => theme.mediaWidth.upToSmall`

  `};
`

export default function LaunchTotal(props){
  let value1 = useMemo(()=>{
    if (props.fromCoin){
    return `${ethers.utils.formatUnits(props.totalRaise, props.fromCoin.decimals) }/${ethers.utils.formatUnits(props.hardcap, props.fromCoin.decimals)} ${(props.fromCoin||{}).symbol}`
    }else {
      return ''
    }
  },[props.totalRaise, props.hardcap, props.fromCoin])
  let fromCoinName = useMemo(()=>{
    return (props.fromCoin||{}).symbol || ''
  },[props.fromCoin])
  let toCoinName = useMemo(()=>{
    return (props.toCoin||{}).symbol || ''
  },[props.toCoin])
  let realPrice = useMemo(()=>{
    if (props.fromCoin && props.toCoin){
      let a = new BigNumber(props.price)
      .shiftedBy(0-props.toCoin.decimals)
      return `1.0${fromCoinName} = ${a.toString()}${toCoinName}` 
    }
    else {
      return ''
    }
  },[props.toCoin, props.fromCoin])

  return ( <InfoLeftBottomDiv>
    <DetailInfoContainerDiv>
      <DetailInfo avatarImg={Img1} label={`Total raised/ Hardcap`} value={value1}></DetailInfo>
      <DetailInfo avatarImg={Img2} label={`$${toCoinName} price `} value={realPrice}></DetailInfo>
    </DetailInfoContainerDiv>
    {/* <DetailInfoContainerDiv> */}
      {/* <DetailInfo avatarImg={Img3} label={`Circ. marketcap (min/max)`} value={`-/-`}></DetailInfo> */}
      {/* <DetailInfo avatarImg={Img4} label={`FDV (min/max)`} value={`-/-`}></DetailInfo> */}
    {/* </DetailInfoContainerDiv> */}

  </InfoLeftBottomDiv>)
}