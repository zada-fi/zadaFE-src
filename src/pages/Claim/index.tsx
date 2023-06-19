import React, { useState } from 'react'
import EthereumLogo from '../../assets/images/ethereum-logo.png'

import styled from 'styled-components'
import SvgIcon from '../../components/SvgIcon'
import 'antd/es/radio/style/index.css'
import './style.css'

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
export default function Claim() {
  let [searchKey, setSearchKey] = useState<string | ''>('')
  let [isMy, setIsMy] = useState<boolean>(false)
  return (<>
    <TitleDiv>Claim your tokens</TitleDiv>
    <ClaimCBody className="claim-container-body">
      <div className="filter-container">
        <div className="search-container">
          <SvgIcon className="search-icon" iconName="dark-search" />
          <input type="text" className="search-input" placeholder="search" value={searchKey} onChange={e => setSearchKey(e.target.value)} />
        </div>
        <div className='right'>
          <label className='ant-radio-wrapper' onClick={e=>setIsMy(!isMy)}>
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
      <div className='filter-result'>
        <div className='list-item'>
          
        </div>
      </div>
    </ClaimCBody>

  </>)
}