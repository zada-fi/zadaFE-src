import { useState } from "react";
type LoadingDatsType = {
  timeSpenLoading: boolean,
  gasCostLoading: boolean,
  originGasLoading: boolean,
  fromBalanceLoading: boolean,
  toBalanceLoading: boolean,
  saveTimeLoading: boolean,
}
export default function useLoadingData(){
  let [loadingDats, setLoadingDats] = useState<LoadingDatsType>({
    timeSpenLoading: false,
    gasCostLoading: false,
    originGasLoading: false,
    fromBalanceLoading: false,
    toBalanceLoading: false,
    saveTimeLoading: false,
  })
  const updateLoadingData = (value: boolean, valueKey: string)=>{
    setLoadingDats({
      ...loadingDats,
      [valueKey as keyof LoadingDatsType]: value
    })
  }
  return {
    loadingDats,
    updateLoadingData
  }
}