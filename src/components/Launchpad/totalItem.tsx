import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { useCountUp } from 'react-countup'
import BigNumber from 'bignumber.js'
const TotalItemDIv =  styled.div`
  width:280px;
  height: 120px;
  border-radius: 14px;
  background-color: #26326D;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 30px;
  box-sizing:border-box;
  .total-item-title{
    font-size: 14px;
    font-family: Arial;
    font-weight: 400;
    color: #D9E1F7;
    line-height: 1;
    text-align:center;
    padding-bottom: 17px;
    box-sizing: border-box;
  }
  .count-up-value{
    font-size: 32px;
    line-height: 1;
    font-weight: bold;
    color: #D9E1F7;
  }
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 24%;
    .count-up-value{
      font-size: 28px;
    }
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 48%;
    height: 130px;
    padding-top: 40px;
    margin-right: 10px;
    margin-bottom: 10px;
    &:nth-child(2n){
      margin-right: 0;
    }
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width:98%;
    height: 130px;
    padding-top: 35px;
    margin-bottom: 15px;
    margin-right: 0;
  `};
  
`

type PropsType = {
  title: string,
  amount: string,
  idKey: string,
  unit?: string
}
export default function TotalItem(props: PropsType){
  const fn = useCallback((num:number)=>{
    //k,m,b,t,q 
    if (num > 1e18){
      return `${props.unit}${(num / 1e15).toFixed(4)}Q`;
    }else if (num > 1e15){
      return `${props.unit}${(num / 1e12).toFixed(4)}T`;
    }else if (num > 1e12){
      return `${props.unit}${(num / 1e9).toFixed(4)}B`;
    }else if (num > 1e9){
      return `${props.unit}${(num / 1e6).toFixed(4)}M`;
    }else if (num > 1e6){
      return `${props.unit}${(num / 1e3).toFixed(3)}K`;
    }
    return `${props.unit}${num }`
  },[props.amount, props.unit]);
  const {  update } = useCountUp({
    ref:props.idKey,
    start:0,
    end: props.amount? new BigNumber(props.amount).toNumber() : 0,
    delay: 2,
    duration: 5,
    prefix: props.unit,
    formattingFn:fn,
  })  
  useEffect(()=>{
    if(props.amount){
      update(new BigNumber(props.amount).toNumber())
    }
  },[props.amount])
  return (<TotalItemDIv>
    <span className="total-item-title">{props.title}</span>
    <div className="count-up-value" id={props.idKey}></div>
  </TotalItemDIv>)
}