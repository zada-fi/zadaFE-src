import React from "react"
import ObSelectChain from "../ObSelectChain"

import './style.css'
import { isMobile } from "react-device-detect"
type CommonDialogPropsType = {
  isShow: boolean,
  datas: any[],
  // value: string,
  onCancel: () => void,
  onChange: (item:any)=> void
}

export default function CommonDialog(props: CommonDialogPropsType) {
  if (props.isShow === false) {
    return null
  }
  
  return (
    
    <div  className={`comm-dialog-box ${isMobile?'app-mobile':'app'}`}>

      <div className={`${props.isShow ? 'CommDialog' : ''}`} onClick={props.onCancel}>
      </div>
      <div 
      className={`CommDialogContent center ${props.isShow ? 'CommDialogContentShow' : ''}`}
        >
          <ObSelectChain
          chainData={props.datas}
          onCancel={props.onCancel}
          onChange={props.onChange}
          />
      </div>
    </div>
  )
}