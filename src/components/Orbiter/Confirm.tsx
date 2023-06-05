import React, { useEffect, useState } from "react"
import { ComPropsType } from './bridge'
import { useSelector } from "react-redux"
import { AppState } from "../../state"
export default function Confirm(props:ComPropsType){
  // @ts-ignore 
  let [transferLoading, setTransferLoading] = useState<boolean>(false)
  // @ts-ignore 
  let [expectValue, setExpectValue] = useState('')

  let transferDataState = useSelector((state: AppState)=>state.orbiter.storeTransferDataState)
  useEffect(()=>{
    console.log('confirm ---', transferDataState)
  },[])

  return (<div>Confirm
    {transferDataState.fromChainID?transferDataState.fromChainID:'false'}
  </div>)
}