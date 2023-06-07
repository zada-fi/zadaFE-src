import { METAMASK } from '../constants'
import { modifyLocalLoginInfo, withPerformInterruptWallet } from '../utils'
import { updateGlobalSelectWalletConf } from '../walletsCoreData'
import { getWeb3 } from '../../../orbiter-constant/web3/getWeb3'
import { getStoreWeb3State } from './../../index'
import store from '../../../../state'
import { updateLocalLogin } from '../../../../state/orbiter/reducer'

/**
 *
 * metamask pc browser dispatcher.js is not incorporated into standard processing reducers
 * because the risk is large, if it's plugged in later, this file can be deprecated
 * u can find more information in ./deprecated-coinbaseDispatcher.js
 */

export const loginStatusCheckerOfMetaMask = () => {
  let web3State = getStoreWeb3State()
  return web3State.isInstallMeta && web3State.isInjected && web3State.localLogin
}

export const metaMaskDispatcherOnDisconnect = withPerformInterruptWallet(() => {
  store.dispatch(updateLocalLogin(false))
})

export const metaMaskDispatcherOnInit = () => {
  getWeb3()
  updateGlobalSelectWalletConf(METAMASK)
  modifyLocalLoginInfo({
    walletType: METAMASK,
    loginSuccess: true,
    walletPayload: {},
  })
}
