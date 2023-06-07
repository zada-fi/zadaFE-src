import React, { useState } from "react"
import styled from "styled-components"
import { BodyWrapper } from "../../AppBody"
import Transfer from "../../../components/Orbiter/transfer"
import Confirm from "../../../components/Orbiter/Confirm"
import Proceed from "../../../components/Orbiter/Proceed"
import { isMobile } from "react-device-detect"
import useWalletConf from "./useWalletConf"

const OrbiterBridageDiv = styled(BodyWrapper)`
  width: 480px;
  max-width:100%;
  padding: 24px 20px;
  &.orbiter-bridge-curPage-3{
    width: 640px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 24px 20px;
    width: calc(100% - 24px);
    position: relative;
    animation:none;
    box-shadow: 0 1px 10px #0093df, 0 1px 10px #0093df inset;
    `
  };
  
`
export default function OrbiterBridage() {
  
  let [curPageStatus, setCurPageStatus] = useState('1')//  1 transfer 2.confirm 3.proceed
  useWalletConf()

  const onChangeState = (value: string) => {
    setCurPageStatus(value)
  }
  return (
    <OrbiterBridageDiv className={`${isMobile ? 'app-mobile' : 'app'} orbiter-bridge-curPage-${curPageStatus}`}>
      <div >
        {curPageStatus === '1' && <Transfer onChangeState={onChangeState}></Transfer>}
        {curPageStatus === '2' && <Confirm onChangeState={onChangeState}></Confirm>}
        {curPageStatus === '3' && <Proceed onChangeState={onChangeState}></Proceed>}
      </div>
      
    </OrbiterBridageDiv>
  )
}