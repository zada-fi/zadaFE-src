import React from "react";
import styled from "styled-components";
import "./DetailInfo.css";

const MainDiv = styled.div`
  display:flex;
  flex-flow:column nowrap
  box-sizing:border-box;
  justify-content:center;
  align-items: center;
  min-height:190px;
  height: 100%;
  width: 50%;
  ${({theme}) => theme.mediaWidth.upToSmall`
  width: 100%;
  `};
`
const AvatarDiv = styled.img`
  width:40px;
  height:auto;
  aspect-ratio:1;
  box-sizing:border-box;
  margin:10px;
  ${({theme}) => theme.mediaWidth.upToSmall`

  `};
`
const RightInfoDiv = styled.div`
  box-sizing:border-box;
  width: calc(100% - 80px);
  ${({theme}) => theme.mediaWidth.upToSmall`

  `};
`
export default function DetailInfo(props) {
  return (<MainDiv>
    <AvatarDiv src={props.avatarImg}></AvatarDiv>
    <RightInfoDiv>
      <p className="RightInfoTop">{props.label}</p>
      <p className="RightInfoBottom">{props.value}</p>
    </RightInfoDiv>
  </MainDiv>

  )
}