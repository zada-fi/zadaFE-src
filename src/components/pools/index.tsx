import React, { useEffect, useMemo, useState } from "react";
import { ButtonPrimary } from '../Button'
import { Text } from 'rebass'
import { ColumnProps } from 'antd/es/table/interface'
import { Table } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/spin/style/index.css'
// import 'antd/dist/antd.css'


import { Link } from 'react-router-dom'
import './style.css'
import {  useCurrency } from "../../hooks/Tokens";
import DoubleCurrencyLogo from "../DoubleLogo";
import Row from "../Row";
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
const TableItemLogo = (props:{
  x_address: string,
  y_address: string,
  pair_name: string
})=>{
  let token0 = useCurrency(props.x_address)
  let token1 = useCurrency(props.y_address)
  // @ts-ignore 
  return (<Row><DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} margin={true} />{props.pair_name}</Row>)
}

export default function AllPools() {
  let [tableDatas, setTableDatas] = useState<Array<PoolPairItemType>>([])
  let [isLoading, setIsLoading] = useState(false)
  let [isFinish, setIsFinish] = useState(false)
  
  let columnsConfig = useMemo<ColumnType[]>(()=>( [
    {
      title: 'Name',
      dataIndex: 'pair_name',
      key:'pair_name',
      render:(text, record, index)=> {
        return (
          <TableItemLogo pair_name={record.pair_name} x_address={record.x_address} y_address={record.y_address}/> 
        )
      },
    },
    {
      title: 'Liquidity',
      dataIndex: 'liquidity',
      key:'liquidity'
    },
    {
      title:'Add',
      dataIndex:'operation',
      key:'operation',
      render: (text, record:any)=>(
        <ButtonPrimary id="join-pool-button" 
            as={Link} style={{ padding: "6px 10px" }}
             to={`/add/${record.x_address}/${record.y_address}`}>
              <Text fontWeight={500} fontSize={14}>
                Add Liquidity
              </Text>
            </ButtonPrimary> 
      )

    }
  ]),[])
  const getTableData = async () => {
    console.log('getTableData---')
    if (isLoading) {
      return
    }
    setIsLoading(true)
    let url = (`http://8.218.16.29:8088/get_all_pools?pg_no=${encodeURIComponent(1)}`)
    let response = await fetch(url)
    let resData = await response.json()
    console.log('get all pools =', response, 'resData=',resData)
    let originList = []
    if(resData.code === 'Ok'){
      originList = resData.data[1]
    }
    // api/get_all_pools
    // let tempList = [
    //   {
    //     pair_name: 'ETH-USDC',
    //     liquidity: '358770.76',
    //     pair_address: '0xsf234234',
    //     x_address: '0x23k234234',
    //     y_address: '0x4223432423',
    //     x_reserves: '1000',
    //     y_reserves: '2000',
    //     x_name:'ETH',
    //     y_name:'USDC'
    //   },
    //   {
    //     pair_name: 'ETH-USDT',
    //     liquidity: '35770.76',
    //     pair_address: '0xsf234234',
    //     x_address: '0x23k234234',
    //     y_address: '0x4223432423',
    //     x_reserves: '1000',
    //     y_reserves: '2000',
    //     x_name:'ETH',
    //     y_name:'USDT'
    //   },
    //   {
    //     pair_name: 'DAI-ETH',
    //     liquidity: '3570.76',
    //     pair_address: '0xsf234234',
    //     x_address: '0x23k234234',
    //     y_address: '0x4223432423',
    //     x_reserves: '1000',
    //     y_reserves: '2000',
    //     x_name:'DAI',
    //     y_name:'ETH'
    //   }
    // ]
    let tempList = originList.reduce((result: Array<PoolPairItemType>, item:any)=>{
      let pairKeys = item.pair_name.split('-')
      let x_name = pairKeys.length ? pairKeys[0].replace(/\"/ig, ''):''
      let y_name = pairKeys.length === 2? pairKeys[1].replace(/\"/ig,''): x_name
      // console.log('pairKeys', pairKeys,x_name, y_name, item.pair_name)
      let x_address = item.x_address || '0x'+item.token_x_address
      let y_address = item.y_address || '0x'+item.token_y_address
      
      let obj = {
        ...item,
        pair_name:`${x_name}-${y_name}`, 
        x_name,
        y_name,
        // @ts-ignore
        x_address,
        // @ts-ignore
        y_address
      }
      result.push(obj)
      return result
    },[])
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

  // let currencyx = useCurrency('0xa1ea0b2354f5a344110af2b6ad68e75545009a03')
  // console.log('currecyx=', currencyx)
  // let allToken = useAllTokens()
  // console.log('allToken=', allToken)

  return (<Table
    scroll={{x: 500, y:800}}
    loading={isLoading}
    columns={columnsConfig}
    pagination={false}
    dataSource={tableDatas}>
  </Table>)


}