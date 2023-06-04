import React, { useRef } from "react"
import { useOnClickOutside } from "../../hooks/useOnClickOutside"
import { RaiseUpSelectPropType } from "./a"
import { isMobile } from "react-device-detect"
export default function PcDialog(props: RaiseUpSelectPropType) {
  // @ts-ignore 
  const node1 = useRef<HTMLDivElement>(null)
  // @ts-ignore 
  useOnClickOutside(props.node, !isMobile&&props.isShow ? props.onCancel : undefined)
  if (!props.isShow) {
    return null
  }
  let onSelectItem = (item: any) => {
    console.log('onSelectItem---', item)
    props.onChange(item)
    props.onCancel()
  }
  return (
    <div ref={node1} className="ob-select-box-dialog">
      <div className="dialog">
        {
          props.datas.map(item => {
            return (<div
              key={item.value}
              className={`select-item ${item.value === props.value ? 'selected' : ''}`}
              onClick={() => onSelectItem(item)}>
              <img
                src={item.icon}
                className="select-item-icon"
                alt=""
              />
              <span>{item.label}</span>
            </div>)
          })
        }
      </div>
    </div>
  )
}