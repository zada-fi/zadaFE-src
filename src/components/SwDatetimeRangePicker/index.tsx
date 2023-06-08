import React from "react";
import { DatePicker } from 'antd'
import "antd/es/date-picker/style/index.css";
import "antd/es/input/style/index.css";
import './style.css'
import moment from 'moment'

import styled from "styled-components"

const SubTitleDiv = styled.div`
font-size:16px;
line-height:40px;
width:120px;
flex:none;
color:${({ theme }) => theme.text1};
`



const { RangePicker } = DatePicker
export default function SwDatetimeRangePicker(props: {
  title: string,
  value: moment.Moment[],
  onChange: Function
}) {

 let dateFormatStr = 'YYYY-MM-DD HH:mm:ss'
 let timeFormatStr = 'HH:mm:ss'


  const onOk = (value:any) => {
    console.log('onOk: ', value[0].format(dateFormatStr));
    props.onChange(value)
  };
  return (<div style={{display:"flex",flexDirection:"row", alignItems:"center"}}>
    <SubTitleDiv>{props.title}</SubTitleDiv>
    {
      false && <RangePicker
      showTime={{ format: timeFormatStr }}
      format={dateFormatStr}
      onOk={onOk}
    />
    }
    
  </div>)
}