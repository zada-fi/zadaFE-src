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
  const isEmpty = (value: any) => (value === null || value === '')
  const formateVal = (val: any)=> isEmpty(val)?'0':val+''
  const getData = async ()=>{
    //get_launchpad_stat_info
    await new Promise((res)=>{
      setTimeout(()=>{
        res(1)
      }, 1000)
    })
    // "total_projects": 30, 
    // "total_raised": 1000000,--所有项目融资到的USDC总额
    // "total_assert_cap": 10000000, --所有融资项目的总市值
    // "total_addresses": 800, --所有参与用户地址数
    let tempRes = {
      "total_projects": 30, 
      "total_raised": 1000000,//--所有项目融资到的USDC总额
      "total_assert_cap": 10000000, //--所有融资项目的总市值
      "total_addresses": 800,// --所有参与用户地址数
    }
    setTotalDats(draf=>{
      draf.fundsRaised = formateVal(tempRes.total_raised) 
      draf.coinsMarketCap = formateVal(tempRes.total_assert_cap)
      draf.assets = formateVal(tempRes.total_projects)
      draf.participants = formateVal(tempRes.total_addresses)
    })
  }
  useEffect(()=>{
    getData()
  },[])
  return {
    totalDats
  }
}