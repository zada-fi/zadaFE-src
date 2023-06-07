import * as util from '../index'

export const getNetworkIdByChainId = (chainId?: string) => {
  let transferDataState = util.getStoreTransferDataState()
  const selectIdByUser = +transferDataState.fromChainID // chainId selected by user
  return util.getMetaMaskNetworkId(+(chainId||'') || selectIdByUser)
}
