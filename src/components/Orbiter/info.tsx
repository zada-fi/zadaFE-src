import React from 'react'
import SvgIcon from '../SvgIcon'
import Loader from '../Loader'
import QuestionHelper from '../QuestionHelper'
type PropsType = {
  isCurrentAddress: boolean,
  isErrorAddres: boolean,
  isShowUnreachMinInfo: boolean,
  isShowMax: boolean,
  showSaveGas: number,
  maxPrice: number|undefined,

  selectFromToken: string,
  originGasLoading: boolean,
  gasSavingMin: string,
  gasSavingMax: string,
  gasFeeToolTip: string
  timeSpenLoading: boolean,
  timeSpent: string,
  timeSpenToolTip: string,
  saveTimeLoading: boolean,
  transferSavingTime: string
}
export default function TransferInfoBox(props: PropsType) {
  return (<>
    <div className="info-box">
      {
        props.isCurrentAddress && <div className="info-item">
          <SvgIcon className="info-icon" iconName="info-warn"></SvgIcon>
          <span className="warn">
            This is your address.
          </span>
        </div>
      }
      {
        props.isErrorAddres && <div className="info-item">
          <SvgIcon className="info-icon" iconName="info"></SvgIcon>
          <span className="red">
            Address format error.
          </span>
        </div>
      }
      {
        props.isShowUnreachMinInfo && <div className="info-item">
          <SvgIcon className="info-icon" iconName="info"></SvgIcon>
          <span className="red">
            Less than the minimum transfer amount.
          </span>
        </div>
      }

      {
        props.isShowMax && <div v-if="isShowMax" className="info-item">
          <SvgIcon className="info-icon" iconName="info"></SvgIcon>
          <span className="red">
            Makers provide {props.maxPrice}
            {props.selectFromToken} for liquidity.
          </span>
        </div>
      }
      {
        !!props.showSaveGas && <div className="gas-save info-item">
          <SvgIcon className="gas-save-icon sm-icon" iconName="light-orbiter" />
          <span className="border">Gas Fee Saved </span>
          <span className="red">
            Save
            {
              props.originGasLoading && <Loader size="1rem"></Loader>
            }
            {
              !props.originGasLoading && <span style={{ marginLeft: '0.4rem' }}>{ props.gasSavingMin } ~ { props.gasSavingMax }</span>
            }
          </span>
          <QuestionHelper text={props.gasFeeToolTip} />

        </div>
      }





      <div className="time-save info-item">
        <SvgIcon className="gas-save-icon sm-icon"  iconName="light-clock" />
        {/* <SvgIconThemed style="margin-right: 6px" icon="clock" size="sm" /> */}
        <span className="border">
          Time Spend
          {
            props.timeSpenLoading ? (<Loader></Loader>) : (<span style={{ marginLeft: '4px' }}>{props.timeSpent}</span>)
          }

        </span>
        <span className="red">
          Save
          {
            props.saveTimeLoading ? (<Loader></Loader>) : (<span style={{ marginLeft: '4px' }}>{props.transferSavingTime}</span>)
          }

        </span>
        <QuestionHelper text={props.timeSpenToolTip} />

      </div>
    </div>
  </>
  )
}