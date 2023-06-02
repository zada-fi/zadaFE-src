import otherConfig from "../orbiter-config/other"


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
 
}
