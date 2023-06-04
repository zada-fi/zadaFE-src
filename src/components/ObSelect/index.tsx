import React, { useMemo, useState, useRef } from "react"

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { ObSelectPropsType, DataItem  } from "./a"
import styled from "styled-components"
import './style.css'
import RaiseUpSelect from "./raiseUpSelect"
import { isMobile } from "react-device-detect"
import RaiseUpSelectPc from './raiseUpSelectPc'
const StyledDropDown = styled(DropDown) <{ selected: boolean }>`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`




export default function ObSelect(props: ObSelectPropsType) {
  const [dialogVisible, setDialogVisible] = useState(false)

  let dataList = useMemo((): Array<DataItem> => {
    return props.datas.reduce((res: Array<DataItem>, v) => {
      res.push({
        ...v,
        icon: v.icon || 'tokenLogo',
        label: v.token,
        value: v.token,
        iconType: 'img',
      })
      return res
    }, [])
  }, [props.datas])
  let selectedItem = useMemo(() => {
    // @ts-ignore 
    return dataList.find((v) => v.value == props.value)
  }, [dataList, props.value])
  let onShowSelect = (value  = false) => {
    let newVal = !value
    console.log('onShowSelect--', dialogVisible, newVal)
    if(newVal !== dialogVisible){
      setDialogVisible(newVal)
    }
  }
  let onCancel = ()=>{
    setDialogVisible(false)
  }
  let node = useRef(null)

  return (<>
    <div ref={node} className="ob-select-box" onClick={()=>onShowSelect(dialogVisible)} >
      <div className="prefix" >
        {
          selectedItem && (
            <img
              src={selectedItem.icon}
              className="select-item-icon"
              alt=""
            />
          )
        }
      </div>
      <span className="selected-label">{selectedItem ? selectedItem.label : ''}</span>
      <StyledDropDown selected={true}></StyledDropDown>
      {isMobile?null: <RaiseUpSelectPc
      isShow={dialogVisible}
      datas={dataList}
      node={node}
      value={props.value}
      onChange={props.onChange}
      onCancel={onCancel} />}
    </div>
    {isMobile ? (<RaiseUpSelect
      isShow={dialogVisible}
      datas={dataList}
      value={props.value}
      onChange={props.onChange}
      onCancel={onCancel}
    />) :null}

  </>)
}