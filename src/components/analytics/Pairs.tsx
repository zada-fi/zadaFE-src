import React, { useEffect, useState } from "react";
import SwDatetimeRangePicker from "../SwDatetimeRangePicker";
import moment from 'moment'
import Loader from "../Loader";

import { ColumnProps } from 'antd/es/table/interface'
import { Table } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/dropdown/style/index.css'


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
type T = any
type ColumnType = ColumnProps<T>
type ConfigItemType = {
  netUrl: string,
  columns: ColumnType[]
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
      netUrl: 'api/get_pair_statistic_info',
      columns: [
        {
          title:'Name',
          dataIndex: 'pair_name',
        },{
          title:'Liquidity',
          dataIndex:'Liquitity'
        },{
          title:'Volume(24h)',
          dataIndex:'day_volume'
        },{
          title:'Volume(7d)',
          dataIndex:'week_volume'
        }
      ]
    },
    transactions: {
      netUrl: 'api/get_all_transactions',
      columns:[
        {
          title:'All',
          dataIndex:'opt_type',
          render: (text, row)=>{
            return `${text} ${row.amount0} to ${row.amount1}`
          },
          filters:[
            {
              text:'add',
              value:'add',
            },
            {
              text:'remove',
              value:'remove',
            },
            {
              text:'swap',
              value:'swap',
            }
          ]
        },
        {
          title:'Token0',
          dataIndex:'amount0'
        },
        {
          title:'Token1',
          dataIndex:'amount1'
        },
        {
          title:'Account',
          dataIndex:'user_address'
        },
        {
          title:'Time',
          dataIndex:'timestamp'
        }
      ]
    }
  }
  const now = moment();
  const start = moment('2022/09/18')
  let [dateValue, setDateValue] = useState<Array<moment.Moment>>([start, now]) // eslint-disable
  let [tableDatas, setTableDatas] = useState<Array<DataItem>>([])

  let [isFinishData, setIsFinishData] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    console.log('dateValue changed---', dateValue, dateValue[0].format())
  }, [dateValue])
  console.log(tableDatas)

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
      await getTableData()
    } finally {
      setIsLoading(false)
    }
  }
  
  const getTableData = async () => {
    await new Promise((res) => {
      setTimeout(() => { res(1) }, 2000)
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
      let nowColumns:ColumnType[] = baseConfig[props.skey as keyof BaseConfigType].columns
      return (
        <Table 
        pagination={{position:'bottom'}}
        columns={nowColumns}
        dataSource={tableDatas}
        />
      )
    }
  }

  return (<>
    <SwDatetimeRangePicker
      title={props.title}
      value={dateValue}
      onChange={setDateValue}
    />
    <TableComp />


  </>)

}