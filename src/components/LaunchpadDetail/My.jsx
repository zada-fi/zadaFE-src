import React, {useMemo, useState} from 'react'
import {useWeb3React} from "@web3-react/core"
import CurrencyLogo from './../CurrencyLogo'
import {Input as NumericalInput} from '../NumericalInput'
import {NetworkContextName} from "../../constants"
import {useWalletModalToggle} from "../../state/application/hooks"
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import './My.css'
import {sendApprove, sendBuy, sendClaim} from './LaunchPadHooks'
const InfoRightDiv = styled.div`
  display:flex;
  flex-flow:column nowrap;
  box-sizing:border-box;
  background:#26326D;
  flex: none;
  width: 580px;
  border-radius: 14px;
  padding: 0 30px;
  padding-bottom: 35px;
  min-height: 420px;
  ${({theme}) => theme.mediaWidth.upToLarge`
    width: 48%;
  `};
  ${({theme}) => theme.mediaWidth.upToMedium`
    width: 100%;
    margin-top: 40px;
  `};
  .bot-button{
    border: none;
    outline: none;
    width: 100%;
    height: 44px;
    background-color: #4A68FF;
    border-radius: 14px;
    color: #ffffff;
    font-size: 20px;
    text-align: center;
  }


`


const ClaimCenterDiv = styled.div`
  flex:1;
  display:flex;
  justify-content:center;
  align-items: center;
  flex-flow:column nowrap;
  box-sizing:border-box;
  background:#0A0F34;
  width: 100%;
  border-radius: 14px;
  margin-bottom: 61px;
  ${({theme}) => theme.mediaWidth.upToSmall`
  `};
`

const MyBotButton = (props) => {
  console.log('mybotton props=',props)
  const toggleWalletModal = useWalletModalToggle()
  if (!props.walletIsLogin) {
    return (<button className={`bot-button ${props.btnCls}`} onClick={toggleWalletModal}>
      {props.btnText}
    </button>)
  } else {
    return (<button className={`bot-button ${props.btnCls}`} onClick={props.clickHandler}>
      {props.btnText}
    </button>)
  }

}

export default function LaunchMy(props) {
  console.log('function LaunchMy(props) {', props)
  let [submitErrorMsg, setSubmitErrorMsg] = useState('')
  let [inputInvestNum, setInvestNum] = useState('')
  const {active, account, library} = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const walletIsLogin = useMemo(() => {
    console.log('walletIsLogin---', active, account, contextNetwork.active)
    return (contextNetwork.active || active) && account
  }, [active, contextNetwork, account])
  let realBalance = useMemo(() => {
    if (props.fromCoin) {
      let a = new BigNumber(props.balance).shiftedBy(0 - props.fromCoin.decimals)
      return a.toString()
    } else {
      return '0'
    }
  }, [props.fromCoin, props.balance])


  const netInputInvestNum = useMemo(() => {
    if (props.fromCoin) {
      let a = new BigNumber(inputInvestNum).shiftedBy(props.fromCoin.decimals)
      return a
    } else {
      return new BigNumber(0)
    }
  }, [props.fromCoin, inputInvestNum])


  const btnText = useMemo(() => {
    if (!walletIsLogin) {
      return 'Connect Wallet'
    } else {
      if (props.curStatus === 0) {
        return 'Approve'
      } else if (props.curStatus === 1 || props.curStatus === 2) {
        if (props.allowance == '0') {
          return 'Approve'
        }
        if (netInputInvestNum.comparedTo(props.allowance) <= 0) {
          return 'Buy'
        }
        return 'Approve'
      } else if (props.curStatus === 3) {
        if (props.isClaimed) {
          return 'Claimed'
        } else {
          return 'Claim'
        }
      } else {
        return ''
      }
    }
  }, [walletIsLogin, props.curStatus, props.iswhite, props.isClaimed, props.allowance, netInputInvestNum])






  let fromCoinName = useMemo(() => {
    return (props.fromCoin || {}).symbol || ''
  }, [props.fromCoin])
  let toCoinName = useMemo(() => {
    return (props.toCoin || {}).symbol || ''
  }, [props.toCoin])

  let realAvailClaimNum = useMemo(()=>{
    if(props.toCoin && props.fromCoin){
      let a = new BigNumber(props.availClaimNum).shiftedBy(0-props.toCoin.decimals-props.fromCoin.decimals)
      return a.toString()
    }else{
      return ''
    }
  },[props.toCoin, props.availClaimNum, props.fromCoin])
  let realPrice = useMemo(() => {
    if (props.fromCoin && props.toCoin) {
      let a = new BigNumber(props.price)
      .shiftedBy(0 - props.toCoin.decimals)
      return a.toString()
    }
    else {
      return ''
    }
  }, [props.toCoin, props.fromCoin])
  let profitNum = useMemo(() => {
    if (!realPrice || !inputInvestNum) {
      return 0
    }
    let tempNum = new BigNumber(inputInvestNum).multipliedBy(realPrice)
    return tempNum.toString()
  }, [inputInvestNum, realPrice])

  let realMax = useMemo(() => {
    if (props.max) {
      let a = new BigNumber(props.max).shiftedBy(0 - (props.fromCoin?.decimals ?? 0))
      return a.toString()
    }
    else {
      return ''
    }
  }, [props.max, props.fromCoin])
  let realMin = useMemo(() => {
    if (props.min) {
      let a = new BigNumber(props.min).shiftedBy(0 - (props.fromCoin?.decimals ?? 0))
      return a.toString()
    }
    else {
      return ''
    }
  }, [props.min, props.fromCoin])
  const btnCls = useMemo(() => {
    if (!walletIsLogin) {
      return 'disable'
    } else {
      if(btnText === 'Approve'){
        return ''
      }
      if (props.curStatus === 0) {
        return 'disable'
      } else if (props.curStatus === 1 || props.curStatus === 2) {
        if (!props.iswhite && props.curStatus === 1) {
          return 'disable'
        } else {
          if (inputInvestNum === '') {
            return 'disable'
          } else {
            // if(realMin&& inputInvestNum && new BigNumber(realMin).comparedTo(inputInvestNum)> 0){
            //   return 'disable'
            // }else if(realMax && inputInvestNum && new BigNumber(inputInvestNum).comparedTo(realMax)> 0){
            //   return 'disable'
            // }else
            if (inputInvestNum && new BigNumber(inputInvestNum).comparedTo(realBalance) === 1) {
              return 'disable'
            } else {
              return ''
            }
          }
        }
      } else if (props.curStatus === 3) {
        if (props.isClaimed) {
          return 'disable'
        } else {
          if (props.availClaimNum && new BigNumber(props.availClaimNum).comparedTo(0) === 1) {
            return ''
          } else {
            return 'disable'
          }

        }
      } else {
        return ''
      }
    }
  }, [walletIsLogin, props.curStatus, props.iswhite, props.isClaimed, inputInvestNum, realBalance, realMax, realMin])


  const errorMsg = useMemo(() => {
    if (!walletIsLogin) {
      return ''
    } else {
      if (props.curStatus === 0) {
        return 'Unstart!'
      } else if (props.curStatus === 1) {
        if (!props.iswhite) {
          return 'You have no permission'
        } else {
          if (inputInvestNum === '') {
            return 'Please input invest amount'
          } else {
            if (realMin && inputInvestNum && new BigNumber(realMin).comparedTo(inputInvestNum) > -1) {
              return 'Invest amount need be greater than minimum'
            } else if (realMax && inputInvestNum && new BigNumber(inputInvestNum).comparedTo(realMax) > -1) {
              return 'Invest amount need be lesser than maxmum'
            } else
              if (inputInvestNum && new BigNumber(inputInvestNum).comparedTo(realBalance) === 1) {
                return 'Insufficient'
              } else {
                return ''
              }
          }


        }
      } else if (props.curStatus === 3) {
        if (props.availClaimNum && new BigNumber(props.availClaimNum).comparedTo(0) === 1) {
          return ''
        } else {
          return 'No Claim available'
        }
      } else {
        return ''
      }
    }
  }, [walletIsLogin, props.curStatus, props.iswhite, props.isClaimed,
    inputInvestNum, realBalance, realMax, realMin])

  const clickHandler = () => {
    console.log('clickHandler')

    if (btnText == 'Approve') {
      console.log('else if (btnText == ')
      sendApprove(props.fromCoin.address, props.projectAddress, library.getSigner()).then((res) => {
        console.log(res);
        setSubmitErrorMsg('')
      }).catch((err) => {
        setSubmitErrorMsg(err.reason)
        console.log(err);
      });
      return

    }
    if (btnCls === 'disable') {
      console.log('btnCls===disable');
      return
    }
    // buy or claim
    if (props.curStatus === 3) {
      // claim
      sendClaim(props.projectAddress, library.getSigner()).then((res) => {
        console.log(res);
        setSubmitErrorMsg('')
      }).catch((err) => {
        setSubmitErrorMsg(err.reason)
        console.log(err.reason);
      });
    } else if (props.curStatus === 1 || props.curStatus === 2) {
      if (btnText == 'Buy') {
        sendBuy(props.projectAddress, netInputInvestNum.toString(), library.getSigner()).then((res) => {
          console.log(res);
          setSubmitErrorMsg('')
        }).catch((err) => {
          setSubmitErrorMsg(err.reason)
          console.log(err);
        });
      } 

    }
  }


  return (<InfoRightDiv>
    <p className="ClaimTitle">{props.curStatus === 3 ? `Claim ${toCoinName} Token` : `Invest in ${toCoinName} Token`}</p>
    {
      props.curStatus === 3 && (<ClaimCenterDiv>
        <p className="ClaimSubTitle">Claim available</p>
        <div className="ClaimAmountTitle">{walletIsLogin ? realAvailClaimNum : 0.0000}</div>
      </ClaimCenterDiv>)
    }
    {
      props.curStatus !== 3 && (<>
        <div className='item invest-item'>
          <div className='left'>
            <span className='key'>Investment</span>
            <div className='value-frame'>
              <NumericalInput
                className="value"
                title=""
                value={inputInvestNum}
                onUserInput={val => {
                  setInvestNum(val)
                }}
              />
            </div>
          </div>
          <div className='right'>
            <div className='key-zhanwei'>
              <label className='key avail'>
                Minimum: <span className='impo'>{realMin}</span>
              </label>
            </div>
            <label className='key avail'>
              Max amount: <span className='impo'>{realMax}</span>
            </label>
            <label className='key avail'>
              Balance: <span className='impo'>{realBalance}</span>
            </label>
            <div className='current-logo-container'>
              <CurrencyLogo currency={props.fromCoin} size={'24px'} />
              <span className='txt'>{(props.fromCoin || {}).symbol}</span>
            </div>

          </div>
        </div>
        <div className='item amount-item'>
          <div className='left'>
            <span className='key'>Amount</span>
            <div className='value-frame'>
              <span className='value'>{profitNum}</span>
            </div>
          </div>
          <div className='right'>
            {/* <label className='key avail'>
          Max amount: <span className='impo'>{realMax}</span>
         </label> */}
          </div>
        </div>
        <div className='bottom-item'>
          <span className='bot-key'>Price</span>
          <span className='bot-value'>
            1.0{fromCoinName} = {realPrice}{toCoinName}
          </span>
        </div>
      </>)
    }

    <MyBotButton
      walletIsLogin={walletIsLogin}
      btnCls={btnCls}
      btnText={btnText}
      clickHandler={clickHandler} />
    <p className='my-error-msg'>{errorMsg}</p>
    <p className='submit-result-error'>{submitErrorMsg}</p>

  </InfoRightDiv>)
}