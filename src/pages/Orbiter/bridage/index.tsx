import React, { useState } from "react"
import styled from "styled-components"
import { BodyWrapper } from "../../AppBody"
import Transfer from "../../../components/Orbiter/transfer"

const OrbiterBridageDiv = styled(BodyWrapper)`
  width: 480px;
  max-width:100%;
  padding: 24px 20px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 24px 20px;
    width: calc(100% - 24px);
    position: relative;
    animation:none;
    box-shadow: 0 1px 10px #0093df, 0 1px 10px #0093df inset;
    `
  };



`
export default function OrbiterBridage(){
  let [curPageStatus, setCurPageStatus] = useState('1')//  1 transfer 2.confirm 3.proceed
  const onChangeState = (value: string)=>{
    setCurPageStatus(value)
  }
  return (
    <OrbiterBridageDiv>
      {curPageStatus === '1'&& <Transfer onChangeState={onChangeState}></Transfer>}
    </OrbiterBridageDiv>
  )
}