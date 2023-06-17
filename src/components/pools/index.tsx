import React, { useEffect, useMemo, useState } from "react";
import { ButtonPrimary } from '../Button'
import { Text } from 'rebass'
import { ColumnProps } from 'antd/es/table/interface'
import { Table, Pagination } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/spin/style/index.css'
// import 'antd/dist/antd.css'


import { Link } from 'react-router-dom'
import './style.css'
import { useCurrency } from "../../hooks/Tokens";
import DoubleCurrencyLogo from "../DoubleLogo";
import Row from "../Row";
type PoolPairItemType = {
  pair_name: string,
  pair_address: string,
  x_address: string,
  y_address: string,
  x_reserves: string,
  y_reserves: string,
  x_name: string,
  y_name: string,
}
type T = any
type ColumnType = ColumnProps<T>
const TableItemLogo = (props: {
  x_address: string,
  y_address: string,
  pair_name: string
}) => {
  let token0 = useCurrency(props.x_address)
  let token1 = useCurrency(props.y_address)
  // @ts-ignore 
  return (<Row><DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} margin={true} />{props.pair_name}</Row>)
}

export default function AllPools() {
  let [tableDatas, setTableDatas] = useState<Array<PoolPairItemType>>([])
  let [isLoading, setIsLoading] = useState(false)
  let [isFinish, setIsFinish] = useState(false)
  let [curPage, setCurPage] = useState<number>(1)
  let [total, setTotal] = useState<number>(0)

  let columnsConfig = useMemo<ColumnType[]>(() => ([
    {
      title: 'Name',
      dataIndex: 'pair_name',
      key: 'pair_name',
      render: (text, record, index) => {
        return (
          <TableItemLogo pair_name={record.pair_name} x_address={record.x_address} y_address={record.y_address} />
        )
      },
    },
    {
      title: 'x_reserves/y_reserves',
      dataIndex: 'custom-col',
      key: 'x_reserves/y_reserves',
      render: (text, record: any) => {
        return `${record.x_reserves} /  ${record.y_reserves}`
      }
    },
    {
      title: 'Add',
      dataIndex: 'operation',
      key: 'operation',
      render: (text, record: any) => (
        <ButtonPrimary id="join-pool-button"
          as={Link} style={{ padding: "6px 10px" }}
          to={`/add/${record.x_address}/${record.y_address}`}>
          <Text fontWeight={500} fontSize={14}>
            Add Liquidity
          </Text>
        </ButtonPrimary>
      )

    }
  ]), [])
  const getTableData = async (page = curPage) => {
    console.log('getTableData---')
    if (isLoading) {
      return
    }
    setIsLoading(true)
    try {
      let baseUrl = process.env.REACT_APP_ANALYTICS
      if(!baseUrl){
        baseUrl = location.protocol + '//' + location.hostname+':8088'
      }
      let url = (`${baseUrl}/get_all_pools?pg_no=${encodeURIComponent(page)}`)
      let response = await fetch(url)
      let resData = await response.json()
      console.log('get all pools =', response, 'resData=', resData)
      let originList = []
      if (resData.code === 'Ok') {
        originList = resData.data[1] || []
      }

      let tempList = originList.reduce((result: Array<PoolPairItemType>, item: any) => {
        let pairKeys = item.pair_name.split('-')
        let x_name = pairKeys.length ? pairKeys[0].replace(/\"/ig, '') : ''
        let y_name = pairKeys.length === 2 ? pairKeys[1].replace(/\"/ig, '') : x_name
        // console.log('pairKeys', pairKeys,x_name, y_name, item.pair_name)
        let x_address = item.x_address || '0x' + item.token_x_address
        let y_address = item.y_address || '0x' + item.token_y_address

        let obj = {
          ...item,
          pair_name: `${x_name}-${y_name}`,
          x_name,
          y_name,
          // @ts-ignore
          x_address,
          // @ts-ignore
          y_address
        }
        result.push(obj)
        return result
      }, [])
      setTableDatas(tempList)
      let temp_total = resData.data && resData.data.length ? resData.data[0]: tempList.length
      setTotal(temp_total)
      // setTableDatas([])
    } catch (error) {
      console.log('oh there is an error here', error)
    } finally {
      setIsLoading(false)
    }


  }


  useEffect(() => {
    if (!isFinish) {
      setIsFinish(true)
      getTableData()
    }
  }, [isFinish])

  let onChangePage = (page:number, pageSize?:number)=>{
    setCurPage(page)
    getTableData(page)
  }

  // let currencyx = useCurrency('0xa1ea0b2354f5a344110af2b6ad68e75545009a03')
  // console.log('currecyx=', currencyx)
  // let allToken = useAllTokens()
  // console.log('allToken=', allToken)

  return (<><Table
    scroll={{ x: 500, y: 800 }}
    loading={isLoading}
    columns={columnsConfig}
    pagination={false}
    dataSource={tableDatas}>
  </Table>
  <Pagination total={total} current={curPage} onChange={onChangePage}/>
  </>)


}