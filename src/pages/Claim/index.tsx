import React from 'react'
import AppBody from '../AppBody'
import styled from 'styled-components'
const TitleDiv = styled.div`
  text-align:center;
  font-size: 28px;
  font-weight:bold;
  color:blue;
  padding:30px;
  box-sizing:border-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size:14px;
    padding: 20px 10px;
  `};

`
const ClaimCBody = styled.div`
  width: 1200px;
  margin: 0 auto;
  ${({theme})=> theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`
export default function Claim(){
  return (<AppBody>
    <TitleDiv>Claim your tokens</TitleDiv>
    <ClaimCBody></ClaimCBody>

  </AppBody>)
}