import React from "react";
import styled from "styled-components";
import TotalItem from "./totalItem";
import useTTotalData from "./useTTotalData";
import List from "./list";
const TitleDiv = styled.div`
  text-align:center;
  font-size: 50px;
  font-weight:bold;
  color:#4A68FF;
  padding:30px;
  padding-bottom: 24px;
  box-sizing:border-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size:24px;
    padding: 20px 10px;
  `};
`
const SubTitleDiv = styled.div`
  text-align:center;
  font-size: 18px;
  line-height:1;
  color: #ffffff;
  padding:0 15px;
  box-sizing:border-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size:14px;
    padding: 10px;
  `};
`

const TotalContentDiv = styled.div`
  display: flex;
  flex-direction: row;
  width: 1200px;
  flex-wrap: nowrap;
  margin: 0 auto;
  justify-content: space-between;
  padding-top: 46px;
  box-sizing: border-box;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-wrap: wrap;
    width: 100%;
    padding-top:30px;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
   justify-content: center; 
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
   justify-content: center; 
  `}
`


export default function LaunchHome(){
  let { totalDats } = useTTotalData()
  return (<>
  <TitleDiv>Launchpad</TitleDiv>
  <SubTitleDiv>Custom-built infrastructure for Scroll native public sales</SubTitleDiv>
  <TotalContentDiv>
    <TotalItem title="Total Funds Raised" idKey="total-funds-raised"  amount={totalDats.fundsRaised}  unit="$"/>
    <TotalItem title="Total Coins Market Cap" idKey="total-coins-market-cap" amount={totalDats.coinsMarketCap} unit="$"></TotalItem>
    <TotalItem title="Total Assets"  idKey="total-assets" amount={totalDats.assets} unit=""></TotalItem>
    <TotalItem title="All time Unique Participants" idKey="all-time-unique-participants" amount={totalDats.participants}></TotalItem>
  </TotalContentDiv>
  <List></List>



  </>)
}