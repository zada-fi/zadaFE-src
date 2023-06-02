
import { ExchangeAPI,UserAPI,OffchainFeeReqType, sleep } from '@loopring-web/loopring-sdk'
import { useSelector } from "react-redux"
import { AppState } from "../../state"
import useLpData from './useLpData'
import { TransferDataStateType } from "./bridge" 
import otherConfig from '../../utils/orbiter-config/other'
type PropsType = {
  transferDataState: TransferDataStateType
}
export type LpMainnetType = {
  address: string,
  id: string,
  decimals: number,
  tokenId: string
}
export type LpRinkebyType = {
  address: string,
  id: string,
  decimals: number,
  tokenId: string
}
export type LpTokenItemType = LpMainnetType | LpRinkebyType


export default function useLoopring(props: PropsType) {
  let lpTokenList = useSelector((state: AppState) => state.orbiter.lpTokenList)
  let configNet = otherConfig.loopring.Mainnet
  const getLpTokenInfoOnce = (fromChainID: string, tokenAddress: string):(LpTokenItemType|undefined) => {
    const lpTokenInfos: Array<LpTokenItemType> =
      fromChainID + '' === '9'
        ? lpTokenList.mainnet
        : lpTokenList.rinkeby
    return lpTokenInfos.find((item) => item.address == tokenAddress)
  }
  const getLpTokenInfo = async (fromChainID: string, tokenAddress: string, count = 10): Promise<LpTokenItemType|undefined>=> {
    const theLpTokenInfo = getLpTokenInfoOnce(fromChainID, tokenAddress)
    if (theLpTokenInfo) {
      return theLpTokenInfo
    } else {
      await sleep(100)
      count--
      if (count > 0) {
        await getLpTokenInfo(fromChainID, tokenAddress, count)
      } else {
        return undefined//0
      }
    }
  }
  const getExchangeAPI = (localChainID: string) => {
    const netWorkID = localChainID + '' == '9' ? 1 : 5
    return new ExchangeAPI({ chainId: netWorkID })
  }
  const  getUserAPI = (localChainID: string)=> {
    const netWorkID = localChainID+'' == '9' ? 1 : 5
    return new UserAPI({ chainId: netWorkID })
  }
  const { lpAccountInfo, updateLpData } = useLpData()
  const accountInfo = async (address: string, localChainID: string) => {
    const accountInfo = lpAccountInfo
    if (accountInfo) {
      return {
        accountInfo,
        code: 0,
      }
    }
    if (!address || !localChainID) {
      return null
    }
    try {
      const exchangeApi = getExchangeAPI(localChainID)
      const response = await exchangeApi.getAccount({ owner: address })
      if (response.accInfo && response.raw_data) {
        const info = {
          accountInfo: response.accInfo,
          code: 0,
        }
        // updatelpAccountInfo(response.accInfo)
        updateLpData(response.accInfo, 'lpAccountInfo')
        return info
      } else {
        const info = {
          // @ts-ignore
          code: response.code, 
          accountInfo: null,
          // @ts-ignore
          errorMessage:response.code == 101002 ? 'noAccount' : response.message,
        }
        return info
      }
    } catch (error) {
      console.warn(`get lp accountInfo error:${error}`)
      return null
    }
  }

  const getTransferFee = async (address: string, localChainID: string, lpTokenInfo: any) => {
    const accountResult = await accountInfo(address, localChainID)
    if (!accountResult) {
      return 0
    }
    let acc
    if (accountResult.code) {
      return 0
    } else {
      acc = !accountResult?'': accountResult.accountInfo
    }
    const sendAmount = props.transferDataState.transferValue
    const GetOffchainFeeAmtRequest = {
      // @ts-ignore
      accountId: acc?acc.accountId:null,
      requestType: OffchainFeeReqType.TRANSFER,
      tokenSymbol: lpTokenInfo ? lpTokenInfo.symbol : 'ETH',
      amount: sendAmount,
    }
    const userApi = getUserAPI(localChainID)
    // @ts-ignore
    const response = await userApi.getOffchainFeeAmt(GetOffchainFeeAmtRequest, '' )
    return response && lpTokenInfo && response.fees[lpTokenInfo.symbol]
      ? response.fees[lpTokenInfo.symbol].fee
      : 0
  }
  const getLoopringBalance = async(
    address : string,
    localChainID : number,
    isMaker: boolean,
    lpTokenInfo: LpTokenItemType
  ) => {
    try {
      let temp_accountInfo
      if (isMaker) {
        const exchangeApi = getExchangeAPI(localChainID+'')
        const GetAccountRequest = {
          owner: address,
        }
        const response = await exchangeApi.getAccount(GetAccountRequest)
        if (response.accInfo && response.raw_data) {
          temp_accountInfo = response.accInfo
        } else {
          return 0
          // if (response.code === 101002) {
          //   return 0
          // } else {
          //   return 0
          // }
        }
      } else {
        const accountResult = await accountInfo(address, localChainID+'')
        if (!accountResult || accountResult.code) {
          return 0
        }
        temp_accountInfo = accountResult.accountInfo
      }
      if (localChainID === 99) {
        configNet = otherConfig.loopring.Rinkeby
      }
      let fetchReponse = await fetch(`${configNet}/api/v3/user/balances?accountId=${
            temp_accountInfo?.accountId
          }&tokens=${lpTokenInfo ? lpTokenInfo.tokenId : 0}`)
      let resp = await fetchReponse.json()
      // const resp = await axios.get(
      //   `${configNet}/api/v3/user/balances?accountId=${
      //     accountInfo.accountId
      //   }&tokens=${lpTokenInfo ? lpTokenInfo.tokenId : 0}`
      // )
      if (resp.status === 200) {
        if (!Array.isArray(resp.data)) {
          return 0
        }
        if (resp.data.length === 0) {
          return 0
        }
        const balanceMap = resp.data[0]
        const totalBalance = balanceMap.total ? Number(balanceMap.total) : 0
        const locked = balanceMap.locked ? Number(balanceMap.locked) : 0
        const withdraw = balanceMap.pending.withdraw
          ? Number(balanceMap.pending.withdraw)
          : 0
        return totalBalance - locked - withdraw
      }
    } catch (err) {
      console.error(`Get loopring balance failed: ${err}`)
      return 0
    }
  }
  return {
    getLpTokenInfo,
    getTransferFee,
    getLoopringBalance
  }
}