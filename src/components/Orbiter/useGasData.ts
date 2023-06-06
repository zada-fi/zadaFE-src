import { useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
type PropsType = {
  exchangeToUsdPrice: number
}
export default function useGasData(props: PropsType){
  let [originGasCost, setOriginGasCost] = useState<number>(0)
  let [gasTradingTotal, setGasTradingTotal] = useState<string>('0')
  let [gasSavingMin, setGasSavingMin] = useState<string>('')
  let [gasSavingMax, setGasSavingMax] = useState<string>('')
  let [gasFeeToolTip, setGasFeeToolTip ] = useState<string>('')
  let showSaveGas = useMemo(()=>{
    return new BigNumber(originGasCost).minus(new BigNumber(gasTradingTotal).multipliedBy(props.exchangeToUsdPrice)).toNumber()
  },[originGasCost, props.exchangeToUsdPrice, gasTradingTotal])
  const updateGasData = (value: string|number, valueKey: string)=>{
    if(valueKey === 'originGasCost'){
      setOriginGasCost(value as number)
    }else if(valueKey === 'gasTradingTotal'){
      setGasTradingTotal(value as string)
    }else if(valueKey === 'gasSavingMin'){
      setGasSavingMin(value as string)
    }else if(valueKey === 'gasSavingMax'){
      setGasSavingMax(value as string)
    }else if(valueKey === 'gasFeeToolTip'){
      setGasFeeToolTip(value as string)
    }

  }
  return {
    originGasCost,
    showSaveGas,
    gasTradingTotal,
    gasSavingMin,
    gasSavingMax,
    gasFeeToolTip,
    updateGasData
  }
}