
import { useEffect, useState } from 'react'
import * as echarts from 'echarts/core';
import {  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption
  } from 'echarts/components'
import { LineChart, LineSeriesOption} from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// import { BigNumber } from '@ethersproject/bignumber'
import BigNumber from 'bignumber.js'

echarts.use([
  GridComponent, 
  TooltipComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
])

type EchartsOptions = echarts.ComposeOption<
| TooltipComponentOption 
| GridComponentOption
| LineSeriesOption
>


type SwapChartProps = {
  chartId: string,
  xAxisData: Array<string>,
  yAxisData: Array<string> 
}

export function formateChartValue(value:number|string){
  if(!value){
    return value+''
  }
  if(typeof value === 'string'){
    value = (value+'').split('.')[0]
  }
  let tempNum = new BigNumber(value)
  let mNum = new BigNumber('1000000')
  let kNum = new BigNumber('1000')
  let tempNum1 = tempNum.dividedBy(mNum)
  let res = value+''
  if(tempNum1.comparedTo(new BigNumber('1'))> -1){
    res = tempNum1.toNumber().toFixed(1)+'M'
  }else {
    tempNum1 = tempNum.dividedBy(kNum)
    if(tempNum1.comparedTo(new BigNumber('1'))> -1){
      res = tempNum1.toNumber().toFixed(1)+'K'
    } 
  }
  console.log(res)
  return `$${res}`
}

export default function useSwEChart(props:SwapChartProps){
  let { chartId, xAxisData, yAxisData } = props
  let [ preAxisData, setPreAxisData ] = useState<string>('')
  let [isCreated, setIsCreated] = useState<boolean>(false)
  let [echartInstance, setEchartInstance] = useState<echarts.ECharts|null>(null)
  useEffect(()=>{
    if(!isCreated){
      let chartDom = document.getElementById(chartId)!;
      let mychart = echarts.init(chartDom)
      let option: EchartsOptions = {
        grid:{
          show: false,
          left:40,
          top:20,
          right: 60,
          bottom: 30
        },
        xAxis:{
          type:'category',
          data: xAxisData,
          boundaryGap:false
        },
        tooltip:{
          show:true,
          trigger:'axis',
        },
        yAxis:{
          position: 'right',
          type: 'value',
          // boundaryGap: false,
          // boundaryGap: [0, '100%'],
          splitLine: {
            show: false
          }
        },
        series:[
          {
            data: yAxisData,
            type:'line',
            smooth: true
          }
        ]
      }
      setPreAxisData((xAxisData.concat(yAxisData)).join(''))
      mychart.setOption(option)
      setEchartInstance(mychart)
      window.addEventListener('resize',()=>{
        mychart.resize()
      })
      setIsCreated(true)
    }
    return ()=>{
      echartInstance?.dispose()
    }
  },[chartId])

  useEffect(()=>{
    let nowAxisData = (xAxisData.concat(yAxisData)).join('')
    if(preAxisData !== nowAxisData && echartInstance){
      echartInstance.setOption<EchartsOptions>({
        xAxis:{
          type:'category',
          data: xAxisData,
          axisLabel:{
            align: 'center'
          },
          splitLine: {
            show: false
          },
          axisTick: {
            show: false
          }
        },
        yAxis:{
          position: 'right',
          // type: 'log',
          splitLine: {
            show: false
          },
          // min: yAxisData[0],
          // max: yAxisData[yAxisData.length - 1],
          axisLabel:{
            formatter: function(value: number|string){
              return formateChartValue(value)
            }
          }
        },
        series:[
          {
            data: yAxisData,
            showSymbol: false,
            type:'line',
            smooth: true
          }
        ] 
      })
    }
    
  },[echartInstance, xAxisData, yAxisData])


}