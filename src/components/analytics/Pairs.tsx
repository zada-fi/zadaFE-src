import React, { useEffect, useState } from "react";
import SwDatetimeRangePicker from "../SwDatetimeRangePicker";
import moment from 'moment'
import { shortenAddress } from '../../utils'
import { ColumnProps } from 'antd/es/table/interface'
import { Table, Pagination } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/dropdown/style/index.css'
import 'antd/es/pagination/style/index.css'
import './Pair.css'
import FixedLoader from "../FixedLoader";


type TransactionItem = {
  pair_name: string,
  pair_address: string,
  token_x_amount: string,
  token_y_amount: string,
  event_time: string,
  op_type: string,
  user_address: string,
  x_name?: string,
  y_name?: string
}

type PairStatisticItem = {
  pair_name: string,
  pair_address: string,
  token_x_address: string,
  token_y_address: string,
  usd_volume: string,
  usd_volume_week: string,
  usd_tvl: string
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
  let baseUrl = process.env.REACT_APP_ANALYTICS
  if(!baseUrl){
    baseUrl = location.protocol + '//' + location.hostname+':8088'
  }
  const baseConfig: BaseConfigType = {
    pairs: {
      netUrl: `${baseUrl}/get_pair_statistic_info`,
      columns: [
        {
          title: 'Name',
          dataIndex: 'pair_name',
          key: 'pair_name-' + props.title,
        }, {
          title: 'Liquidity',
          dataIndex: 'usd_tvl',
          key: 'usd_tvl',
          render: (text) => {
            let reg = (text+'').indexOf(".") > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
            return `$${text.replace(reg, '$1,')}`
          }
        }, {
          title: 'Volume(24h)',
          dataIndex: 'usd_volume',
          key: 'usd_volume'
        }, {
          title: 'Volume(7d)',
          dataIndex: 'usd_volume_week',
          key: 'usd_volume_week'
        }
      ]
    },
    transactions: {
      netUrl: `${baseUrl}/get_all_transactions`,
      columns: [
        {
          title: 'All',
          dataIndex: 'op_type',
          key: 'op_type',
          render: (text, row) => {
            return `${text} ${row.token_x_amount} ${row.x_name} to ${row.token_y_amount} ${row.y_name}`
          },
          filters: [
            {
              text: 'add',
              value: 'add',
            },
            {
              text: 'remove',
              value: 'remove',
            },
            {
              text: 'swap',
              value: 'swap',
            }
          ],
          onFilter(value, record) {
            return value === record.op_type
          },
        },
        {
          title: 'Token0',
          dataIndex: 'token_x_amount',
          key: 'token_x_amount'
        },
        {
          title: 'Token1',
          dataIndex: 'token_y_amount',
          key: 'token_y_amount'
        },
        {
          title: 'Account',
          dataIndex: 'user_address',
          key: 'user_address',
          render: (text) => {
            return `${shortenAddress(text)}`
          }
        },
        {
          title: 'Time',
          dataIndex: 'event_time',
          key: 'event_time'
        }
      ]
    }
  }
  const now = moment();
  const start = moment('2022/09/18')
  let [dateValue, setDateValue] = useState<Array<moment.Moment>>([start, now]) // eslint-disable
  let [tableDatas, setTableDatas] = useState<Array<DataItem>>([])
  let [curPage, setCurPage] = useState<number>(1)
  let [total, setTotal] = useState<number>(0)

  let [isFinishData, setIsFinishData] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    console.log('dateValue changed---', dateValue, dateValue[0].format())
  }, [dateValue])

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

  const getTableData = async (page = curPage) => {
    try {

      let netUrl = baseConfig[props.skey as keyof BaseConfigType].netUrl
      // console.log('getTableData netUrl =', netUrl)
      let url = (`${netUrl}?pg_no=${encodeURIComponent(page)}`)
      let response = await fetch(url)
      let resData = await response.json()
      console.log('get tableData res=', props.skey, 'resData=', resData.data)
      let tempTableList: Array<DataItem> = []
      if (props.skey === 'pairs') {
        tempTableList = resData.data && resData.data.length ? resData.data[1] : []
        let temp_total = resData.data && resData.data.length ? resData.data[0]: tempTableList.length
        setTotal(temp_total*10)
      } else {
        tempTableList = resData.data.data && resData.data.data.length ? resData.data.data[1] : []
        tempTableList = tempTableList.reduce((res: DataItem[], item) => {
          let pairKeys = item.pair_name.split('-')
          let x_name = pairKeys.length ? pairKeys[0].replace(/\"/ig, '') : ''
          let y_name = pairKeys.length === 2 ? pairKeys[1].replace(/\"/ig, '') : x_name
          res.push({
            ...item,
            x_name,
            y_name
          })
          return res
        }, [])
        let temp_total = resData.data.page_count 
        setTotal(temp_total*10)
      }
      console.log('get tableData resultData---', props.skey, tempTableList)
      setTableDatas(tempTableList)

    } catch (error) {
      console.log('oh there is an error here', error)
    }
  }
  let onChangePage = (page:number, pageSize?:number)=>{
    setCurPage(page)
    getTableData(page)
  }
  const TableComp = () => {
    let nowColumns: ColumnType[] = baseConfig[props.skey as keyof BaseConfigType].columns
    
    return (
      <FixedLoader isLoading={isLoading}>
        <Table
          pagination={false}
          scroll={{y:500}}
          columns={nowColumns}
          dataSource={tableDatas}
        />
        <Pagination total={total} current={curPage} onChange={onChangePage}/>
      </FixedLoader>
    )
  }

  return (<div  className="grey-content">
    <SwDatetimeRangePicker
      title={props.title}
      value={dateValue}
      onChange={setDateValue}
    />
    <TableComp />


  </div>)

}