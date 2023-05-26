import React, { useEffect, useState } from "react";
import SwDatetimeRangePicker from "../SwDatetimeRangePicker";
import moment from 'moment'
import Loader from "../Loader";

type PoolPairItemType = {
  pair_name: string,
  pair_address: string,
  x_address: string,
  y_address: string,
  x_reserves: string,
  y_reserves: string,
  liquidity: string
}

type TransactionItem = {
  pair_name: string,
  pair_address: string,
  token_in_address: string,
  token_out_address: string,
  op_type: string,
  user_address: string,
  amount0: string,
  amount1: string,
  timestamp: number,
}

type PairStatisticItem = {
  pair_name: string,
  pair_address: string,
  x_address: string,
  y_address: string,
  day_volume: string,
  liquitity: string
}

type DataItem = PairStatisticItem | TransactionItem

type ConfigItemType = {
  isNeedPre: boolean,
  netUrl: string,
  preNetUrl: string,
}
type BaseConfigType = {
  pairs: ConfigItemType,
  transactions: ConfigItemType
}

export default function Pairs(props: {
  title: string,
  skey: string
}) {
  const baseConfig: BaseConfigType = {
    pairs: {
      isNeedPre: true,
      netUrl: 'api/get_pair_statistic_info',
      preNetUrl: 'api/get_all_pools',
    },
    transactions: {
      preNetUrl: '',
      netUrl: 'api/get_all_transactions',
      isNeedPre: false,
    }
  }
  const now = moment();
  const start = moment('2022/09/18')
  let [dateValue, setDateValue] = useState<Array<moment.Moment>>([start, now]) // eslint-disable
  let [preDatas, setPreDatas] = useState<Array<PoolPairItemType>>([])
  let [tableDatas, setTableDatas] = useState<Array<DataItem>>([])

  let [isFinishData, setIsFinishData] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    console.log('dateValue changed---', dateValue, dateValue[0].format())
  }, [dateValue])
  console.log(preDatas, tableDatas)

  useEffect(() => {
    if (!isFinishData) {
      setIsFinishData(true)
      getData()
    }
  }, [isFinishData])

  const getData = async () => {
    if (isLoading) {
      return
    }
    setIsLoading(true)
    try {
      if (props.skey === 'pairs') {
        await getPreData()
      }
      await getTableData()
    } finally {
      setIsLoading(false)
    }
  }
  const getPreData = async() => {
    console.log('getPreData enter--')
    await new Promise((res) => {
      setTimeout(() => { res(1) }, 2000)
    })
    console.log('preNetUrl', baseConfig.pairs.preNetUrl)
    let tempList = [
      {
        pair_name: 'WBTC-ETH',
        pair_address: 'string',
        x_address: '0x2321321',
        y_address: '0x2321321',
        x_reserves: '10000',
        y_reserves: '2000',
        liquidity: '1000'
      }
    ]
    setPreDatas(tempList)

  }
  const getTableData = async () => {
    await new Promise((res) => {
      setTimeout(() => { res(1); console.log('getTableData reso==') }, 2000)
    })
    let netUrl = baseConfig[props.skey as keyof BaseConfigType].netUrl
    console.log('getTableData netUrl =', netUrl)
    let tempTableList: Array<DataItem> = []
    setTableDatas(tempTableList)
  }

  const TableComp = ()=>{
    if(isLoading){
      return (
        <Loader/>
      )
    }else{
      return (
        <>Biaoge</>
      )
    }
  }

  return (<>
    <SwDatetimeRangePicker
      title={props.title}
      value={dateValue}
      onChange={setDateValue}
    />
    <TableComp/>


  </>)

}