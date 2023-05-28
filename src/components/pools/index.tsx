import React, { useEffect, useState } from "react";
import { ButtonPrimary } from '../Button'
import { Text } from 'rebass'

import { ColumnProps } from 'antd/es/table/interface'
import { Table } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/spin/style/index.css'
// import 'antd/dist/antd.css'

import { Link } from 'react-router-dom'
import './style.css'

const { Column } = Table
type PoolPairItemType = {
  pair_name: string,
  pair_address: string,
  x_address: string,
  y_address: string,
  x_reserves: string,
  y_reserves: string,
  liquidity: string,
  x_name: string,
  y_name: string,
}
type T = any
type ColumnType = ColumnProps<T>
export default function PoolsList() {
  let [tableDatas, setTableDatas] = useState<Array<PoolPairItemType>>([])
  let [isLoading, setIsLoading] = useState(false)
  let [isFinish, setIsFinish] = useState(false)
  let columnsConfig: ColumnType[] = [
    {
      title: 'Name',
      dataIndex: 'pair_name',
    },
    {
      title: 'Liquidity',
      dataIndex: 'liquidity',
    }
  ]
  const getTableData = async () => {
    if (isLoading) {
      return
    }
    setIsLoading(true)
    await new Promise((res) => {
      setTimeout(() => { res(1) }, 2000)
    })
    // api/get_all_pools
    let tempList = [
      {
        pair_name: 'ETH-USDC',
        liquidity: '358770.76',
        pair_address: '0xsf234234',
        x_address: '0x23k234234',
        y_address: '0x4223432423',
        x_reserves: '1000',
        y_reserves: '2000',
        x_name:'ETH',
        y_name:'USDC'
      },
      {
        pair_name: 'ETH-USDT',
        liquidity: '35770.76',
        pair_address: '0xsf234234',
        x_address: '0x23k234234',
        y_address: '0x4223432423',
        x_reserves: '1000',
        y_reserves: '2000',
        x_name:'ETH',
        y_name:'USDT'
      },
      {
        pair_name: 'DAI-ETH',
        liquidity: '3570.76',
        pair_address: '0xsf234234',
        x_address: '0x23k234234',
        y_address: '0x4223432423',
        x_reserves: '1000',
        y_reserves: '2000',
        x_name:'DAI',
        y_name:'ETH'
      }
    ]
    setTableDatas(tempList)
    // setTableDatas([])
    setIsLoading(false)
  }
  

  useEffect(() => {
    if (!isFinish) {
      setIsFinish(true)
      getTableData()
    }
  }, [isFinish])

  return (<Table
    scroll={{x: 500, y:800}}
    loading={isLoading}
    pagination={false}
    dataSource={tableDatas}>
    {
      columnsConfig.map((item) => {
        return (
          <Column title={item.title} dataIndex={item.dataIndex} />
        )
      })
    }
    <Column
      title="Add"
      key="action-add"
      render={(text, record :any) => {
        console.log('render-add--', text, record)
        return (
            <ButtonPrimary id="join-pool-button" 
            as={Link} style={{ padding: "6px 10px" }}
             to={`/add/${record.x_name}/${record.y_name}`}>
              <Text fontWeight={500} fontSize={14}>
                Add Liquidity
              </Text>
            </ButtonPrimary> 
         
        )
      }}
    />

  </Table>)


}