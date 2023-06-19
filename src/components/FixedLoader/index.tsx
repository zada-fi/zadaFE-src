import React from 'react'
import styled from "styled-components"
import Loader from "../Loader"
import {  BoxProps } from 'rebass/styled-components'

const LoadingFrameDiv = styled.div`
position:absolute;
left:0;
top:0;
right:0;
bottom:0;
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
background: rgba(255,255,255,0.4);
z-index:999;
`
const FixedDiv = styled.div`
position: relative;
`
// @ts-ignore 
export default function FixedLoader({ children, isLoading, ...res }: { children: React.ReactNode, isLoading: boolean }&BoxProps){
  return (
    <FixedDiv {...res} >
      {children}
      {
        isLoading && (<LoadingFrameDiv>
          <span style={{display:"block"}}><Loader></Loader></span>
        </LoadingFrameDiv> )
      }
    </FixedDiv>
  )

}