import { TransferDataStateType } from "../../components/Orbiter/bridge"
import otherConfig from "../orbiter-config/other"
import BigNumber from 'bignumber.js'

type ZKspaceBalanceReq = {
  account: string,
  localChainID: number
}
export default {
  getZKspaceBalance: async function (req:ZKspaceBalanceReq) {
    if (req.localChainID !== 12 && req.localChainID !== 512) {
      throw new Error('getZKSpaceBalance Error: wrongChainID')
    }
    const url = `${
      req.localChainID === 512 ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet
    }/account/${req.account}/balances`
    try {
      let fetchReponse = await fetch(url)
      let response = await fetchReponse.json()
      // const response = await axios.get(url)
      if (response.status === 200 && response.data.success) {
        return response.data.data.balances.tokens
      } else {
        throw new Error('getZKSpaceBalance error: response.status not 200')
      }
    } catch (error) {
      // @ts-ignore 
      throw new Error(`getZKSpaceBalance error: ${(error||{}).message||''}`)
    }
  },
 
  /**
   *
   * @param {localChianID,account} req
   * @returns
   */
  getZKAccountInfo: function (localChainID:number, account:string) {
    return new Promise((resolve, reject) => {
      if (localChainID !== 12 && localChainID !== 512) {
        reject({
          errorCode: 1,
          errMsg: 'getZKSpaceAccountInfoError_wrongChainID',
        })
      }
      const url =
        (localChainID === 512
          ? otherConfig.ZKSpace.Rinkeby
          : otherConfig.ZKSpace.Mainnet) +
        '/account/' +
        account +
        '/' +
        'info'
      // axios
      //   .get(url)
       fetch(url).then(res=>res.json())
        .then(function (response) {
          if (response.status === 200) {
            const respData = response.data
            if (respData.success == true) {
              resolve(respData.data)
            } else {
              reject(respData.data)
            }
          } else {
            reject({
              errorCode: 1,
              errMsg: 'NetWorkError',
            })
          }
        })
        .catch(function (error) {
          reject({
            errorCode: 2,
            errMsg: error,
          })
        })
    })
  },
  
  getZKSpaceWithDrawGasFee: async function (localChainID:string, account:any, transferDataState: TransferDataStateType) {
    if (!account) {
      return
    }
    const ethPrice = transferDataState.ethPrice
      ? transferDataState.ethPrice
      : 2000

    if (localChainID !== '12' && localChainID !== '512') {
      throw new Error('getZKSpaceGasFeeError：wrongChainID')
    }
    const url = `${
      localChainID === '512' ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet
    }/account/${account}/fee`
    try {
      // const response = await axios.get(url)
      let fetchResp = await fetch(url)
      let response = await fetchResp.json()
      if (response.status === 200 && response.data.success) {
        const respData = response.data
        const gasFee = new BigNumber(respData.data.withdraw).dividedBy(
          new BigNumber(ethPrice)
        )
        const gasFee_fix = gasFee.decimalPlaces(6, BigNumber.ROUND_UP)
        return Number(gasFee_fix)
      }
      throw new Error('getZKSpaceWithDrawGasFee response.status not 200')
    } catch (error) {
      throw new Error(`getZKSpaceWithDrawGasFee error：${error}`)
    }
  },
}
