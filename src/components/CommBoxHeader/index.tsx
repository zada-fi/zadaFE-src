import React from "react";
import SvgIcon from "../SvgIcon";
import './style.css'
type PropsType ={
  back: boolean,
  close?: boolean,
  className?: string,
  onBack?: ()=>void,
  onClose?: ()=>void,
  children: React.ReactNode
}
export default function CommBoxHeader(props: PropsType){
  return ( <div className={`comm-box-header ${props.className}`}>
    {
      props.back && <span  className="header-left" onClick={props.onBack} ><SvgIcon iconName="light-back"/></span>
    }
  
  <div className="header-content">
    {props.children}
  </div>
  {
    props.close && <span className="header-right" onClick={props.onClose}>
      <SvgIcon iconName="light-close"/>
    </span>
  }
  
</div>
)
}