// import loopring from '../actions/loopring'
// import { getStarkNonce } from '../../util/constants/starknet/helper'
import thirdapi from './thirdapi'
import zkspace from './zkspace'
import { requestWeb3 } from '../orbiter-tool'

export default {
  getNonce: async function (
    localChainID:number,
    tokenAddress: string,
    tokenName: string,
    userAddress: string,
    getAccountStorageID: (address: string, localChainID:number, tokenID:number)=>Promise<0|any>
  ) {
    if (localChainID == 3 || localChainID == 33) {
      const req = {
        account: userAddress,
        localChainID,
        stateType: 'committed',
      }
      try {
        const accountInfo = await thirdapi.getZKAccountInfo(req)
        // @ts-ignore 
        if (!accountInfo || (accountInfo&&!accountInfo?.result)) {
          return 0
        }
        // @ts-ignore 
        const nonce = accountInfo.result.nonce
        return nonce
      } catch (error) {
        console.warn('error =', error)
        return 0
      }
    } else if (localChainID === 4 || localChainID === 44) {
      // try {
      //   const nonce = Number(await getStarkNonce())
      //   return nonce
      // } catch (error) {
      //   return 0
      // }
    } else if (localChainID === 8 || localChainID === 88) {
      return 0
    } else if (localChainID === 9 || localChainID === 99) {
      // https://api3.loopring.io/api/v3/user/balances?accountId=1&tokens=0,1
      // unsupport chain
      // const nonceObj = await getAccountStorageID(
      //   userAddress,
      //   localChainID,
      //   0
      // )
      // if (nonceObj && nonceObj.offchainId > 0) {
      //   return (nonceObj.offchainId - 1) / 2
      // }
      return 0
    } else if (localChainID === 11 || localChainID === 511) {
      return 0
    } else if (localChainID === 12 || localChainID === 512) {
      const accountInfo = await zkspace.getZKAccountInfo(
        localChainID,
        userAddress
      )
      if (accountInfo) {
        // @ts-ignore 
        return accountInfo?.nonce
      }
      return 0
    } else {
      try {
        const nonce = await requestWeb3(
          localChainID,
          'getTransactionCount',
          userAddress
        )
        return nonce
      } catch (err) {
        console.warn('getWeb3NonceError =', err)
        return 0
      }
    }
  },
}
