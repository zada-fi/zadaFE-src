import React, { useEffect, useMemo } from 'react'
import styled from 'styled-components'
const InfoLeftTopDiv = styled.div`
  flex:1;
  width:100%;
  // min-height:190px;
  background:#26326D;
  border-radius: 14px;
  padding-bottom: 30px;
  box-sizing: border-box;
  ${({theme}) => theme.mediaWidth.upToSmall`
  `};
  .prog-line{
    display: flex;
    align-items: center;
    padding: 85px 30px 84px 30px;
    box-sizing: border-box;
  }
  .line{
    flex: none;
    display: block;
    height: 2px;
    background: #566188;
  }
  .line.active{
    background:#4A68FF;
  }
  .line.line-1{
    width: 13%;
  }
  .line.line-2{
    width: 35%;
  }
  .line.line-3{
    width: 35%;
  }
  
  .line.line-5{
    flex: auto;
  }
  .pointer{
    background: #566188;
    display:block;
    width:10px;
    height:10px;
    border-radius: 50%;
    margin-left: -2px;
    margin-right: -2px;
    position: relative;
  }
  .pointer::before{
    position:absolute;
    content: attr(data-txt);
    word-break:keep-all;
    white-space: nowrap;
    font-size: 16px;
    line-height: 1;
    color: #878C99;
    display:inline-block
    text-align:center;
    left: 50%;
    top: -38px;
    transform: translate(-50%, 0%)
  }
  .pointer::after{
    position:absolute;
    content: attr(data-btxt);
    min-width: 100px;
    // word-break:keep-all;
    // white-space: nowrap;
    font-size: 16px;
    line-height: 1;
    color: #878C99;
    display:inline-block
    text-align:center;
    left: 50%;
    bottom: -18px;
    transform: translate(-50%, 100%)
  }
  .pointer.active{
    background:#4A68FF;
  }
  .pointer.pointer-active{
    background:#4A68FF;
  }
  .pointer.active::before{
    color: #4A68FF;
  }
  .pointer.active::after{
    color: #4A68FF;
  }
  .prog-intro{
    display: flex;
    justify-content: space-between;
    padding: 0 30px 49px;
    box-sizing:border-box;
  }
  .prog-intro .left{
    display: inline-block;
    font-size: 22px;
    line-height:1;
    color:#FEFEFF;
    font-weight: bold;
  }
  .prog-intro .right{
    display: inline-block;
    text-align: right;
    color: #4A68FF;
    font-size: 22px;
    line-height:1;
    font-weight: bold;
  }

  .claim-intro{
    text-align:center;
    font-size: 22px;
    color: #FEFEFF;
    font-weight: bold;
    margin: 0;
    padding-bottom: 26px;
  }

`
export default function LaunchStatus(props) {
  let configArr = ['Whitelist stage','Public stage','Claims']
  let dateArr = useMemo(()=>{
    let arr = ['','','']
    if(props.preStartTime){
      arr[0] = new Date(props.preStartTime).toUTCString()
    }
    if(props.pubEndTime){
      arr[1] = new Date(props.pubEndTime).toUTCString()
    }
    if(props.preEndTime){
      arr[2] = new Date(props.preEndTime).toUTCString()
    }
    return arr//[props.preStartTime, props.preEndTime, props.pubEndTime]
  },[props.preStartTime, props.preEndTime, props.pubEndTime])
  let progLineData = useMemo(()=>{
    return configArr.reduce((result,item, index)=>{
      let obj = {
        txt: item,
      }
      if(props.curStatus === 0){
        obj.lineCls = ''
        obj.labelCls = ''
      }else if(props.curStatus === 1){
        if(index < 1){
          obj.lineCls = 'active'
          obj.labelCls = 'active'//index === 2?'active':'pointer-active'
        }else {
          obj.lineCls = ''
          obj.labelCls = ''
        }
      }else if(props.curStatus === 2){
        if(index < 2){
          obj.lineCls = 'active'
          obj.labelCls = 'active'//index === 2?'active':'pointer-active'
        }else {
          obj.lineCls = ''
          obj.labelCls = ''
        }
      }else if(props.curStatus === 3){
        obj.lineCls = 'active'
        obj.labelCls = 'active'//index === 3?'active':'pointer-active'
      }
      result.push(obj)
      return result
    },[])
  },[props.curStatus])


  return (<InfoLeftTopDiv>
    <div className='prog-line' >
      {
        progLineData.map((item, index)=>{
          return (<>
            <span key={`${item}-${index}-line`} className={`line line-${index+1} ${item.lineCls}`}></span>
            <span key={`${item}-${index}-pointer`} 
            className={`pointer pointer-${index+1} ${item.labelCls}`} 
            data-txt={item.txt}
            data-btxt={dateArr[index]}></span>
            {
              index === 2 && (<span key={`${item}-${index}-line-5`}  className={`line line-5 ${props.curStatus === 3?'active':''} `} ></span>)
            }
          </>)
        })
      }
      
    </div>
    {/* {
      props.curStatus !== 2 && (<div className='prog-intro'>
      <span className='left'>Claims open in</span>
      <span className='right'>TBA soon</span>
    </div>)
    } */}
    {
      props.curStatus === 0 && (<p className='claim-intro'>
        Unstart stage
      </p>)
    }
    {
      props.curStatus === 1 && (<p className='claim-intro'>
        Whitelist investment stage
      </p>)
    }
    {
      props.curStatus === 2 && (<p className='claim-intro'>
        Public sale stage
      </p>)
    }
    {
      props.curStatus === 3 && (<p className='claim-intro'>
        Claim your tokens
      </p>)
    }
    {/* {
      props.curStatus === 2 && (<p className='claim-intro'>
        Public sale has ended<br/>
        Contributions are now claimable
      </p>)
    } */}
  </InfoLeftTopDiv>)
}