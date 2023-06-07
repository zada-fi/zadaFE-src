import store from './../../../state'
import { getCompatibleGlobalWalletConf } from '../../orbiter-tool'
import { updateCoinbase, updateNetWorkId } from '../../../state/orbiter/reducer'
const pollWeb3 = async function () {
  let compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
  compatibleGlobalWalletConf.walletPayload.provider.autoRefreshOnNetworkChange = false
  compatibleGlobalWalletConf.walletPayload.provider.on(
    'chainChanged',
    // @ts-ignore 
    (chainId) => {
      store.dispatch(updateNetWorkId(parseInt(chainId, 16).toString()))
      // store.commit('updateNetWorkId', parseInt(chainId, 16).toString())
    }
  )
  compatibleGlobalWalletConf.walletPayload.provider.on(
    'accountsChanged',
    // @ts-ignore 
    (accounts) => {
      if (accounts.length === 0) {
        // updateCoinbase('')
        store.dispatch(updateCoinbase(''))
      } else {
        // updateCoinbase(accounts[0])
        store.dispatch(updateCoinbase(accounts[0]))
      }
    }
  )
}
export default pollWeb3
