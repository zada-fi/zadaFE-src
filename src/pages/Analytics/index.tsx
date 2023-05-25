import React from "react"

import AppFlowBody from '../AppFlowBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import SwapChart from "../../components/analytics/SwapChart"
export default function Analytics(){
  let chartsConfig = [
    {
      idName:'swap-chart-tvl',
      title:'TVL',
      netDataUrl:'api/get_total_tvl_by_day',
      xKey:'tvl_date',
      yKey:'tvl_value',
    },
    {
      idName:'swap-chart-volume',
      title:'Volume',
      netDataUrl:'api/get_total_volumne_by_day',
      xKey:'volume_date',
      yKey:'volume_value',
    }
  ]
  return (
    <>
    <AppFlowBody>
      <SwapPoolTabs  active={'analytics'} />
      <div style={{width:"100%", display:"flex", flexWrap:'wrap'}}>
        {
          chartsConfig.map((item)=>{
            return (<SwapChart key={item.idName} {...item}></SwapChart>)
          })
        }

      </div>
    </AppFlowBody>
    </>
  )
}