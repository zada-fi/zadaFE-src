import React, { useState, useEffect } from 'react'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import { Pagination } from "antd";
import 'antd/es/pagination/style/index.css'
import FixedLoader from "../../components/FixedLoader";
import styled from 'styled-components'
import SvgIcon from '../../components/SvgIcon'
import 'antd/es/radio/style/index.css'
import './style.css'
import { sendClaim } from '../../components/LaunchpadDetail/LaunchPadHooks';
import { useWeb3React } from "@web3-react/core"
import { message } from 'antd';

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const TitleDiv = styled.div`
  text-align:center;
  font-size: 50px;
  font-weight:bold;
  color:#4A68FF;
  padding:30px;
  padding-bottom: 24px;
  box-sizing:border-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size:24px;
    padding: 20px 10px;
  `};

`

const ClaimCBody = styled.div`
  width: 1200px;
  padding: 30px;
  box-sizing: border-box;
  background: #26326D;
  margin: 0 auto;
  border-radius: 14px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `};
`

type DataItemType = {
  project_name: string,
  token_symbol: string,
  claimable_amount: string,
  claim_start_time: string,
  project_address:string
}

export default function Claim() {
  let [searchKey, setSearchKey] = useState<string | ''>('')
  let [isMy, setIsMy] = useState<boolean>(true)
  let [tableData, setTableData] = useState<Array<DataItemType>>([])
  let [curPage, setCurPage] = useState<number>(1)
  let [total, setTotal] = useState<number>(0)

  let [isFinishData, setIsFinishData] = useState<boolean>(false)
  let [isLoading, setIsLoading] = useState<boolean>(false)
  let {account, library} = useWeb3React();

  
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
    let response = await fetch(`${process.env.REACT_APP_ANALYTICS}/get_user_claimable_tokens?pg_no=${page}&&address=${account}`)
    let resData = await response.json()
    console.log('getTableData--', resData)
    //get_user_claimable_tokens
    // await new Promise((res)=>{
    //   setTimeout(()=>{res(1)},1000)
    // })

    // let resData = {
    //   code:'Ok',
    //   data:[1, [{
    //     "project_name":"AiDoge",
    //     "token_symbol": "DOGE",
    //     "token_amount": 98,
    //     "claim_start_time": "2023-07-08 00:00:00"
    //   },{
    //     "project_name":"AiDoge",
    //     "token_symbol": "DOGE",
    //     "token_amount": 0,
    //     "claim_start_time": "2023-07-08 00:00:00"
    //   }]]
    // }
    let originResList: any[] = []
    if (resData.code === 'Ok') {
      // @ts-ignore 
      originResList = resData.data[1] || []
    }
    let tempResList = originResList.reduce((res, item)=>{
      let obj = {
        ...item
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

  // @ts-ignore
  const clickHander = (item: DataItemType)=>{
    sendClaim(item.project_address, library.getSigner()).then((res:any) => {
      console.log(res)
      message.success(res.hash);
    }).catch((error:any) => {
      console.log(error)
      message.error(error.reason);
    })
  }

  return (<>
    <TitleDiv>Claim your tokens</TitleDiv>
    <ClaimCBody className="claim-container-body">
      <div className="filter-container">
        <div className="search-container">
          <SvgIcon className="search-icon" iconName="dark-search" />
          <input type="text" className="search-input" placeholder="search" value={searchKey} onChange={e => setSearchKey(e.target.value)} />
        </div>
        <div className='right'>
          <label className='ant-radio-wrapper' onClick={e=>setIsMy(true)}>
            <span className={`ant-radio ${!isMy?'':'ant-radio-checked'}`}>
              <span className='ant-radio-inner'></span>
            </span>
            <span className='radio-value'>My Claims</span>
          </label>
          <div className='network-select-wrapper'>
            <span className='cur-network-key'>Select Network:</span>
            <label className='network-select'>
              <StyledEthereumLogo  src={EthereumLogo} size={'24px'}></StyledEthereumLogo>
              <span className='cur-network-val'>Ethererum</span>
              <SvgIcon className='sel-icon' iconName='arrow_down'></SvgIcon>
            </label>
          </div>
        </div>
      </div>
      
      <FixedLoader className="table-list" isLoading={isLoading}>
        <div className='filter-result'>
          {
            tableData.map((item, index)=>{
              return (<div className='list-item'>
                <div className="name-container">
                  <div className="icon-wrapper">

                  </div>
                  <div className="name-wrapper">
                    <label className="name-txt1">{item.project_name}</label>
                    <p className="name-txt2">Claim {item.token_symbol}</p>
                  </div>
                </div>

                <div className='claim-amount'>
                  <div className='txt1'>Claimed</div>
                  <div className='txt2'>{item.claimable_amount}</div>
                </div>
                <div className='claim-date'>
                  <div className='txt1'>Claim Start Date</div>
                  <div className='txt2'>{item.claim_start_time}</div>
                </div>
                <div className='operator-area'>
                  {
                    Number(item.claimable_amount) - 0 > 0? (
                     <button className='btn' onClick={()=>clickHander(item)}>Claim</button>
                    ): (
                      <button className='btn disable' >Unavailable</button>
                     )
                  }
                </div>
              </div>)
            })
          }
         
        </div>
        <Pagination total={total} current={curPage} onChange={onChangePage}/>
      </FixedLoader>
    </ClaimCBody>

  </>)
}