import React, { useMemo, useRef } from "react"
// import { isMobile } from 'react-device-detect'
import useToggle from "../../hooks/useToggle"
import { useOnClickOutside } from "../../hooks/useOnClickOutside"
// import CurrencyLogo from "../CurrencyLogo"
// import { useCurrency } from "../../hooks/Tokens"
import { ObSelectPropsType, DataItem } from "./a"
export default function ObSelect(props: ObSelectPropsType) {

  const node = useRef<HTMLDivElement>()

  const [dialogVisible, toggle] = useToggle(false)
  // let [dialogVisible, setDialogVisible] = useState<Boolean>(false)

  useOnClickOutside(node, dialogVisible ? toggle : undefined)
  let dataList = useMemo((): Array<DataItem> => {
    return props.datas.reduce((res:Array<DataItem>, v) => {
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
  }, [dataList])
  // @ts-ignore 
  let onSelectItem = (item:any)=>{
    props.onChange(item)
    toggle()
  }
  let onShowSelect = ()=>{
     toggle()
  }
  // let currency = useCurrency(selectedItem.token)

  

  return (<>
<div className="ob-select-box" >
    <div className="prefix" onClick={onShowSelect}>
      {
        selectedItem && (
          <img
              src={selectedItem.icon}
              className="select-item-icon"
              alt=""
          />
        )
      }
     {/* {currency && <CurrencyLogo currency={currency} size={'24px'} />} */}
     <span className="selected-label">{selectedItem?selectedItem.label:''}</span>
    </div>
</div>
  </>)
}