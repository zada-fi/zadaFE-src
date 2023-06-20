import React, { useState, useEffect } from "react"
import { ColumnProps } from 'antd/es/table/interface'
import { Table, Pagination } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/pagination/style/index.css'
import styled from "styled-components"
import SvgIcon from "../SvgIcon"
import FixedLoader from "../FixedLoader";
import './list.css'
import CheckedImg from './images/icon-checked.png'
import UncheckedImg from './images/icon-unchecked.png'

const ListBody = styled.div`
  width: 100%;
  padding: 30px;
  box-sizing: border-box;
  border-radius: 30px;
  background: #171f45;
  margin-top: 40px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 30px 0;
    border-radius: 10px;
  `}
`
const ListContainer = styled.div`
  width: 1200px;
  padding: 30px;
  box-sizing: border-box;
  background: #26326D;
  margin: 0 auto;
  border-radius: 14px;
  .search-container{
    width: 100%;
    display: flex;
    height: 40px;
    border-radius: 20px;
  }
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    padding: 15px;
    
  `};
`
type T = any
type ColumnType = ColumnProps<T>
type DataItemType = {
  project_name?: string,
  project_description?: string,
  project_links?: any,
  project_owner?: string,
  token_address?: string,
  start_time?: string,
  end_time?: string,
  raise_limit?: string,
  raised?: string,
  removed?: boolean,
  phase?: number,
  purchased_min_limit?: number,
  purchased_max_limit?: number,
  white_list_max_limit?: number,


  name: string,
  hardcap: number, // 1 correct  2 incorrect
  wl_stage: number, // 1 correct 2incorrect
  status: string,
  total_raised: string,
  your_allocation: string,
}

export default function List(){
  // @ts-ignore 
  let [searchKey, setSearchKey] = useState<string|''>('')
  // @ts-ignore 
  let [tableData, setTableData] = useState<Array<DataItemType>>([])
  let [curPage, setCurPage] = useState<number>(1)
  let [total, setTotal] = useState<number>(0)

  let [isFinishData, setIsFinishData] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)

  let columnsDatas:ColumnType[] = [
    {
      title:'Name',
      dataIndex:'name',
      key:'launchpad-name',
      render: (text, record:any)=>{
        return (<div className="name-container">
          <div className="icon-wrapper">

          </div>
          <div className="name-wrapper">
            <label className="name-txt1">Name</label>
            <p className="name-txt2">{text}</p>
          </div>
        </div>)
      }

    },
    {
      title:'Hardcap',
      dataIndex:'hardcap',
      key:'launchpad-hardcap',
      render(text, record, index) {
        if(text === 1){
          return (<img className="column-icon" src={CheckedImg}></img>)
        }else{
          return (<img className="column-icon" src={UncheckedImg}></img>)
        }
      },
    },
    {
      title:'WL stage',
      dataIndex:'wl_stage',
      key:'launchpad-wl-stage',
      render(text, record, index) {
        if(text === 1){
          return (<img className="column-icon" src={CheckedImg}></img>)
        }else{
          return (<img className="column-icon" src={UncheckedImg}></img>)
        }
      },
    },
    {
      title:'Status',
      dataIndex:'status',
      key:'launchpad-status'
    },
    {
      title:'Total raised',
      dataIndex:'total_raised',
      key:'launchpad-total-raised'
    },
    {
      title:'Your allocation',
      dataIndex:'your_allocation',
      key:'launchpad-allocation'
    }
  ]

 
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
  let onChangePage = (page:number, pageSize?:number)=>{
    setCurPage(page)
    getTableData(page)
  }
  const getTableData = async (page = curPage) => {
    await new Promise((res)=>{
      setTimeout(()=>{res(1)},1000)
    })
    // setTableData([])
    // setTotal(0)


    // 测试
    setTableData([{
      name: 'project1',
      hardcap: 1,
      wl_stage: 0,
      status: 'sold out',
      total_raised: '10000',
      your_allocation: '0',
    }])
    setTotal(0)


  }

  useEffect(() => {
    if (!isFinishData) {
      setIsFinishData(true)
      getData()
    }
  }, [isFinishData])

  return (<ListBody>
    <ListContainer className="launchpad-home-container">
      <div className="search-container">
        <SvgIcon className="search-icon" iconName="dark-search"/>
        <input type="text" className="search-input" placeholder="search" value={searchKey} onChange={e=> setSearchKey(e.target.value)}/>
      </div>
      <FixedLoader className="table-list" isLoading={isLoading}>
        <Table
          pagination={false}
          scroll={{x: 800,y:500}}
          columns={columnsDatas}
          dataSource={tableData}
          rowKey={'launchpad-table-key'}
        />
        <Pagination total={total} current={curPage} onChange={onChangePage}/>
      </FixedLoader>
    </ListContainer>
  </ListBody>)
}