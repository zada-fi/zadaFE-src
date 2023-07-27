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
color:${({ theme }) => theme.text1};

`
const LastValueDiv = styled.div`
font-size:28px;
line-height:40px;
font-weight:bold;
color:${({ theme }) => theme.text1};
`


export default function SwapChart(props: {
  idName: string,
  title: string,
  netDataUrl: string,
  xKey: string,
  yKey: string,
}) {


  let [chartData, setChartData] = useState(
    {
      chartId: props.idName,
      xAxisData: [],
      yAxisData: []
    }
  )
  let [lastData, setLastData] = useState<string | null>(null)
  let [isNetDataDone, setIsNetDataDone] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)
  useSwEChart(chartData)
  const getNetData = async () => {
    if (isLoading) {
      return
    }
    setIsLoading(true)
    try {
      let url = (`${props.netDataUrl}`)
      let response = await fetch(url)
      let resData = await response.json()
      console.log('chartData resData=',props, resData)


      let tempList: Array<SwDataItem>
      if(props.idName === 'swap-chart-volume'){
        tempList = resData.data.stat_infos || []
      }else{
        tempList = resData.data || []
      }
      
      tempList = tempList.sort((item1: SwDataItem, item2: SwDataItem)=>{
        let x = props.xKey as keyof SwDataItem
        let val1 = item1[x] as string
        let val2 = item2[x] as string
        val1 = val1.replace(/-/ig, '/')
        val2 = val2.replace(/-/ig, '/')
        if(new Date(val1).getTime() > new Date(val2).getTime()){
          return 1
        }else if(new Date(val1).getTime() < new Date(val2).getTime()){
          return -1
        }else {
          return 0
        }
      })

      if(props.idName === 'swap-chart-volume'){
        setLastData(resData.data.total_volume)  
      }else{
        if (tempList.length) {
          let len = tempList.length
          let y = props.yKey as keyof SwDataItem
          console.log('lastData=', tempList[len - 1][y])
          setLastData(tempList[len - 1][y])
        }
      }
      

      let rsFormate = tempList.reduce((res, item: SwDataItem) => {
        let x = props.xKey as keyof SwDataItem
        let y = props.yKey as keyof SwDataItem
        res.xAxisData.push(item[x])
        res.yAxisData.push(item[y])
        return res
      }, {
        xAxisData: [],
        yAxisData: []
      })

      setChartData({
        chartId: props.idName,
        ...rsFormate,
      })
    } catch (error) {
      console.log('oh there is an error here', error)
    } finally {
      setIsLoading(false)
    }

  }
  useEffect(() => {
    if (!isNetDataDone) {
      setIsNetDataDone(true)
      getNetData()
    }
  }, [props.netDataUrl])



  return (<Chartbody>
    <LastNameDiv>{props.title}</LastNameDiv>
    <LastValueDiv>
      {lastData === null ? '--' : formateChartValue(lastData)}
    </LastValueDiv>
    <FixedLoader isLoading={isLoading}>
      <div style={{ width: '100%', height: '202px' }} id={props.idName}></div>
    </FixedLoader>
  </Chartbody>)
}