import React, { useState, useEffect } from "react"
import { ColumnProps } from 'antd/es/table/interface'
import { Table, Pagination } from "antd";
import 'antd/es/table/style/index.css'
import 'antd/es/pagination/style/index.css'
import styled from "styled-components"
import SvgIcon from "../SvgIcon"
import FixedLoader from "../FixedLoader";
import './list.css'
import { useHistory } from "react-router-dom";
// import CheckedImg from './images/icon-checked.png'
// import UncheckedImg from './images/icon-unchecked.png'

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
type ProjectLinkType = {
  web: string,
  twitter: string,
  dc: string,
  tg: string,
}
type DataItemType = {
  project_name?: string,
  project_description?: string,
  project_links?: ProjectLinkType,
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
  project_title?: string,
  project_pic_url?:string,

  name: string,
  // hardcap: number, // 1 correct  2 incorrect
  // wl_stage: number, // 1 correct 2incorrect
  status: string,
  total_raised: string,
  // your_allocation: string,
}

export default function List(){
  let history = useHistory()
  // @ts-ignore 
  let [searchKey, setSearchKey] = useState<string|''>('')
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
            <label className="name-txt1">{text}</label>
            <p className="name-txt2">Raising {record.token_symbol}</p>
          </div>
        </div>)
      }
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
    }
    // ,
    // {
    //   title:'Your allocation',
    //   dataIndex:'your_allocation',
    //   key:'launchpad-allocation'
    // }
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
    let response = await fetch(`${process.env.REACT_APP_ANALYTICS}/get_all_projects?pg_no=${page}`)
    let resData = await response.json()
    console.log('getTableData--', resData)
    //get_all_projects
    // await new Promise((res)=>{
    //   setTimeout(()=>{res(1)},1000)
    // })
    // setTableData([])
    // setTotal(0)

    // simulate result
    // let resData = {
    //   code:'Ok',
    //   data:[1, [{
    //     "project_name": "AiDoge",
    //     "project_descrbtion": "Orbofi AI is the most sophisticated AI-generated content infrastructure and platform currently in the web3 market, that serves as the main factory and engine for all AI-generated gaming/media assets on web3.",
    //     "project_links": {
    //         "web": "offical web url",
    //         "twitter": "twitter url",
    //         "dc": "dc url",
    //         "tg": "tg url",
    //     },
    //     "project_address": "0x112",// --project合约地址
    //     "project_owner": "0x111",// --接收USDC的项目方地址
    //     "receive_token": "0x123",// --购买使用的token地址，默认是USDC
    //     "token_symbol":"DOGE", //--token符号
    //     "token_address": "0x222",
    //     "token_price_usd": 1,
    //     "start_time": "2023-1-1 12:00:00",
    //     "end_time": "2023-2-1 12:00:00",
    //     "raise_limit": 100000000, //--IDO硬顶，USDC为单位
    //     "paused": false, //--如果项目被暂停为true，可以重新启动，也可以永远为暂停状态（表示项目被废弃）
    //     "purchased_min_limit": 100, //--每个地址可以购买的最小数量，USDC为单位
    //     "purchased_max_limit": 1000, //--每个地址可以购买的最大数量，USDC为单位
    //     total_raised: 1000
    //   }]]
    // }
    let originResList: any[] = []
    if (resData.code === 'Ok') {
      // @ts-ignore 
      originResList = resData.data[1] || []
    }

    let tempResList:Array<DataItemType>  = originResList.reduce((res:Array<DataItemType>, item)=>{
      let obj = {
        ...(JSON.parse(JSON.stringify(item))),
        name: item.project_name,
        status: '',
        total_raised: item.total_raised,
        // your_allocation: '0',
      }
      if(item.paused){
        obj.status = 'paused'
      }else{
        let startTime = new Date((obj.start_time||'').replace(/-/ig, '/')).getTime()
        let endTime = new Date((obj.start_time||'').replace(/-/ig, '/')).getTime()
        let nowTime = Date.now()
        if(nowTime < startTime){
          obj.status = 'presale'
        }else if(startTime<= nowTime && nowTime <= endTime){
          obj.status= 'sale'
        }else {
          obj.status = 'claim'
        }
      }

      res.push(obj)
      return res
    },[])

    setTableData(tempResList)
    let temp_total: number = 
    resData.data && resData.data.length ? 
    (resData.data[0] as number): 
    tempResList.length
    setTotal(temp_total*10)


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
          // expandRowByClick={true}
          pagination={false}
          scroll={{x: 800,y:500}}
          columns={columnsDatas}
          dataSource={tableData}
          rowKey={'launchpad-table-key'}
          onRow={(record:DataItemType|any, rowIndex) => {
            return {
              onClick: event => {
                console.log('click row item', record, rowIndex)
                localStorage.setItem(process.env.NODE_ENV+'_'+record.project_address, JSON.stringify(record))
                history.push({
                  pathname: 'launchDetail',
                  search: '?projectAddress='+ record.project_address,
                });
              }, // click row
              // onDoubleClick: event => {}, // double click row
              // onContextMenu: event => {}, // right button click row
              // onMouseEnter: event => {}, // mouse enter row
              // onMouseLeave: event => {}, // mouse leave row
            };
          }}
        />
        <div style={{height: '20px'}}></div>
        <Pagination total={total} current={curPage} onChange={onChangePage}/>
      </FixedLoader>
    </ListContainer>
  </ListBody>)
}