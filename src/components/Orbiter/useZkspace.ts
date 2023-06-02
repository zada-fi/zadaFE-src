import { TransferDataStateType } from "./bridge" 
import OrbiterOtherConfig from '../../utils/orbiter-config/other'
// import { BigNumber, FixedNumber } from '@ethersproject/bignumber'
import BigNumber from 'bignumber.js'
import { useSelector } from "react-redux"
import { AppState } from "../../state"
type PropsType = {
  transferDataState: TransferDataStateType
}
export default function useZkspace(props: PropsType){
  let zksTokenList = useSelector((state: AppState) => state.orbiter.zksTokenList)
  const getZKSpaceTransferGasFee = async (localChainID: string, account: string) =>{
    if (!account) {
      return 0
    }
    const ethPrice = props.transferDataState.ethPrice
      ? props.transferDataState.ethPrice
      : 2000

    if (localChainID+'' !== '12' && localChainID+'' !== '512') {
      throw new Error('getZKSpaceTransferGasFee：wrongChainID')
    }
    const url = `${
      localChainID+'' === '512' ? OrbiterOtherConfig.ZKSpace.Rinkeby : OrbiterOtherConfig.ZKSpace.Mainnet
    }/account/${account}/fee`
    try {
      // const response = await axios.get(url)
      let fetchResponse = await  fetch(url)
      let response = await fetchResponse.json()
      if (response.status === 200) {
        const respData = response.data
        if (respData.success === true) {
          const gasFee =  new BigNumber(respData.data.transfer).dividedBy(
            new BigNumber(ethPrice)
          )
          const gasFee_fix = gasFee.decimalPlaces(6, BigNumber.ROUND_UP)
          return Number(gasFee_fix)
        } else {
          throw new Error('getZKSpaceGasFee->respData.success no true')
        }
      } else {
        throw new Error('getZKSpaceGasFee->response.status not 200')
      }
    } catch (error) {
      throw new Error('getZKSpaceGasFee->network error')
    }
  }
  return {
    zksTokenList,
    getZKSpaceTransferGasFee
  }
}