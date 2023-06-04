import React,{useRef} from "react";
import { RaiseUpSelectPropType } from "./a";
import './raiseUpSelect.css'

import { useOnClickOutside } from "../../hooks/useOnClickOutside"
import { isMobile } from "react-device-detect";
export default function RaiseUpSelect(props: RaiseUpSelectPropType) {
  const node = useRef<HTMLDivElement>(null) 
  useOnClickOutside(node, isMobile&&props.isShow ? props.onCancel : undefined)
  const clickHander = () => {
    props.onCancel()
  }
  if (!props.isShow) {
    return null
  }
  let onSelectItem = (item: any) => {
    props.onChange(item)
    props.onCancel()
  }
  return (<>
    <div className="raiseup-select-box">
      <div  ref={node} className="raiseup-select-box-wrapper">
        <div className="items">
          {
            props.datas.map((item) => {
              return (<div 
                key={item.value}
                className={`item ${item.value === props.value ? 'selected' : ''}`}
              onClick={()=>onSelectItem(item)}>
                <img
                  src={item.icon}
                  className="item-icon"
                  alt=""
                />
                <span className="item-label">{item.label}</span>
              </div>)
            })
          }
        </div>
        <div className="cancel" onClick={clickHander}>cancel</div>
      </div>

    </div>
  </>)
}