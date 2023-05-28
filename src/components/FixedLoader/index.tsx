import React from 'react'
import styled from "styled-components"
import Loader from "../Loader"
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
export default function FixedLoader({ children, isLoading }: { children: React.ReactNode, isLoading: boolean }){
  return (
    <div  style={{position:'relative'}}>
      {children}
      {
        isLoading && (<LoadingFrameDiv>
          <span style={{display:"block"}}><Loader></Loader></span>
        </LoadingFrameDiv> )
      }
    </div>
  )

}