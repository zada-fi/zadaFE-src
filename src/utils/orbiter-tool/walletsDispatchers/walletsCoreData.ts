import store from './../../../state'
import { updateStoreGlobalSelectWalletConf , updateStoreGlobalSelectWalletPayload} from '../../../state/orbiter/reducer'
export const globalSelectWalletConf = ()=>store.getState().orbiter.storeGlobalSelectWalletConf


export const updateGlobalSelectWalletConf = (
  type = '',
  conf = {},
  loginSuccess = false
) => {
  store.dispatch(updateStoreGlobalSelectWalletConf({
    walletPayload: conf,
    walletType: type,
    loginSuccess
  }))
  // globalSelectWalletConf.walletPayload = conf
  // globalSelectWalletConf.walletType = type
  // globalSelectWalletConf.loginSuccess = loginSuccess
}

export const updateSelectWalletConfPayload = (payload:any) => {
  store.dispatch(updateStoreGlobalSelectWalletPayload(payload))
  // globalSelectWalletConf.walletPayload = {
  //   ...globalSelectWalletConf.walletPayload,
  //   ...payload,
  // }
}

export const updateSelectWalletAddress = (newAddress: string) => {
  store.dispatch(updateStoreGlobalSelectWalletPayload({
    walletAddress: newAddress
  }))
  // globalSelectWalletConf.walletPayload.walletAddress = newAddress
}

// export default {}