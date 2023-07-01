import React from 'react'
import styled from 'styled-components'
import BotImg1 from './images/b-1@2x.png'
import BotImg2 from './images/b-2@2x.png'
import BotImg3 from './images/b-3@2x.png'
const BottomDiv = styled.div`
  display:flex;
  justify-content:space-between;
  align-items: center;
  flex-flow:row wrap;
  box-sizing:border-box;
  width:100%;
  padding: 40px 0;
  ${({theme}) => theme.mediaWidth.upToSmall`
  `};
`
const BottomInfoDiv = styled.div`
  border: 1px solid #26326D;
  border-radius: 14px;
  min-height: 280px;
  padding: 30px;
  flex: none;
  width: 32%;
  
  ${({theme}) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
  .title-wrap{
    position: relative;
    padding-left: 42px;
  }
  .title-wrap img{
    display: inline-block;
    width: 32px;
    height: 32px;
    vertical-align: middle;
    position: absolute;
    left: 0;
  }
  .title-wrap .txt{
    display:inline-block;
    letter-space: 1px;
    font-size: 20px;
    line-height: 32px;
    color: #D9E1F7;
    font-weight: bold;
    margin-left: 4px;
    margin-right: -10px;
    vertical-align: middle;

  }
  .desc{
    margin-top: 17px;
    color: #878C99;
    font-size: 14px;
    line-height: 19px;
  }
`
export default function LaunchBottom(props) {
  let configListData = [
    {
      img: BotImg1,
      title:'how the price is determined',
      content:`The auction will take place in two distinct phases.
      Phase 1: During the first 12 hours, only whitelisted addresses can participate and guarantee the allocation cap.
      Phase 2: In the next 12 hours, only whitelisted addresses can participate, and the distribution cap is increased by 5 times.
      Phase 3: Starting June 13 at 12pm, other participants can purchase the remaining tokens on a first-come, first-served basis. This phase will last 48 hours.`
    },
    {
      img: BotImg2,
      title:'how the price is determined',
      content:`The auction will take place in two distinct phases.
      Phase 1: During the first 12 hours, only whitelisted addresses can participate and guarantee the allocation cap.
      Phase 2: In the next 12 hours, only whitelisted addresses can participate, and the distribution cap is increased by 5 times.
      Phase 3: Starting June 13 at 12pm, other participants can purchase the remaining tokens on a first-come, first-served basis. This phase will last 48 hours.`
    },
    {
      img: BotImg3,
      title:'how the price is determined',
      content:`The auction will take place in two distinct phases.
      Phase 1: During the first 12 hours, only whitelisted addresses can participate and guarantee the allocation cap.
      Phase 2: In the next 12 hours, only whitelisted addresses can participate, and the distribution cap is increased by 5 times.
      Phase 3: Starting June 13 at 12pm, other participants can purchase the remaining tokens on a first-come, first-served basis. This phase will last 48 hours.`
    }
  ]
  return (<BottomDiv>
    {
      configListData.map((item, index)=>{
        return ( <BottomInfoDiv className='launch-bottom-item' key={`launch-bottom-${index}`}>
        <div className='title-wrap'>
          <img src={item.img} />
          <span className='txt'>{item.title}</span>
        </div>
        <div className='desc' dangerouslySetInnerHTML={{__html: item.content}}>
        </div>
      </BottomInfoDiv>)
      })
    }
   
   
  </BottomDiv>)
}