import { useEffect } from "react";
import { useImmer } from 'use-immer'
type TotalDatsType = {
  fundsRaised: string,
  coinsMarketCap: string,
  assets: string,
  participants: string
}
export default function useTTotalData(){
  // @ts-ignore 
  let [totalDats, setTotalDats] = useImmer<TotalDatsType>({
    fundsRaised: '',
    coinsMarketCap: '',
    assets: '',
    participants: ''
  })
  const getData = async ()=>{
    await new Promise((res)=>{
      setTimeout(()=>{
        res(1)
      }, 1000)
    })
    setTotalDats(draf=>{
      draf.fundsRaised = '359015'
      draf.coinsMarketCap = '3622849956'
      draf.assets = '32'
      draf.participants = '802'
    })
  }
  useEffect(()=>{
    getData()
  },[])
  return {
    totalDats
  }
}