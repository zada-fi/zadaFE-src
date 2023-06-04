import { useState } from 'react'
import {
  ChainAndTokenDataType,
  TokenItemType
} from './bridge'
type CtItemDataType  = Array<TokenItemType> | Array<number>
export default function useChainAndTokenData(){
  let [ctData, setCtData] = useState<ChainAndTokenDataType>({
    fromChainIdList: [],
      toChainIdList: [],
      fromTokenList: [] ,
      toTokenList:  [],
  })
  const updateChainAndTokenData = (value:CtItemDataType, valueKey: string)=>{
    setCtData(prevState=>({
      ...prevState,
      [valueKey as keyof CtItemDataType]: value
    }))
  } 
  return {
    ctData,
    updateChainAndTokenData
  }
}