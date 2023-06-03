import React, { useEffect, useState } from "react"
import useSwEChart, { formateChartValue } from "../../hooks/useSwEChart"
import styled from "styled-components"
import FixedLoader from "../FixedLoader"


type TvlDataItem = {
  tvl_date: string,
  tvl_value: string,
}
type VolumeDataItem = {
  volume_date: string,
  volume_value: string,
}
type SwDataItem = TvlDataItem | VolumeDataItem

const Chartbody = styled.div`
position:relative;
flex:none;
width: 50%;
display:block;
padding:16px;
${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    width: 100%;
    position: relative;`
  };
`
const LastNameDiv = styled.div`
font-size:16px;
line-height:40px;
color:${({theme})=>theme.text1};

`
const LastValueDiv = styled.div`
font-size:28px;
line-height:40px;
font-weight:bold;
color:${({theme})=>theme.text1};
`


export default function SwapChart(props: {
  idName: string,
  title: string,
  netDataUrl: string,
  xKey: string,
  yKey: string,
}){

  
  let [chartData, setChartData] = useState(
    {
      chartId: props.idName, 
      xAxisData:[], 
      yAxisData:[] 
    }
  )
  let [lastData, setLastData ] = useState<string|null>(null)
  let [isNetDataDone, setIsNetDataDone ] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)
  useSwEChart(chartData)
  const getNetData = async()=>{
    if(isLoading){
      return 
    }
    setIsLoading(true)
    let url = (`${props.netDataUrl}`)
    let response = await fetch(url)
    let resData = await response.json()
    console.log('chartData resData=', resData)
    // await new Promise((res)=>{
    //   setTimeout(()=>{res(1)}, 3000)
    // })
    

    let tempList: Array<SwDataItem>
    tempList = resData.data || []
    // if(props.idName === 'swap-chart-tvl'){
    //   tempList  = [{
    //     tvl_date:'2023-02-23',
    //     tvl_value: '50000000',
    //   },{
    //     tvl_date:'2023-02-24',
    //     tvl_value: '1000000',
    //   },{
    //     tvl_date:'2023-02-25',
    //     tvl_value: '300000',
    //   },{
    //     tvl_date:'2023-02-26',
    //     tvl_value: '90000000',
    //   }]
    // }else{
    //   tempList  = [{
    //     volume_date:'2023-02-23',
    //     volume_value: '50000000',
    //   },{
    //     volume_date:'2023-02-24',
    //     volume_value: '1000000',
    //   },{
    //     volume_date:'2023-02-25',
    //     volume_value: '302000',
    //   },{
    //     volume_date:'2023-02-26',
    //     volume_value: '200000',
    //   }]
    // }
    
    if(tempList.length){
      let len = tempList.length
      let y = props.yKey  as  keyof SwDataItem  
      console.log('lastData=',tempList[len-1][y])
      setLastData(tempList[len-1][y])
    }
  
    let rsFormate = tempList.reduce((res, item: SwDataItem)=>{
      let x = props.xKey as  keyof SwDataItem 
      let y = props.yKey  as  keyof SwDataItem 
      res.xAxisData.push(item[x])
      res.yAxisData.push(item[y])
      return res
    },{
      xAxisData:[],
      yAxisData:[]
    })

    setChartData({
      chartId: props.idName,
      ...rsFormate,
    })
    setIsLoading(false)
  }
  useEffect(()=>{
    if(!isNetDataDone){
      setIsNetDataDone(true)
      getNetData()
    }
  },[props.netDataUrl])

  
 
  return (<Chartbody>
    <LastNameDiv>{props.title}</LastNameDiv>
    <LastValueDiv>
      {lastData === null ?'--':formateChartValue(lastData)}
    </LastValueDiv>
    <FixedLoader isLoading={isLoading}>
      <div style={{width:'100%', height:'202px'}} id={props.idName}></div>
    </FixedLoader>
  </Chartbody>)
}