
import { useState, useMemo, useEffect } from 'react'
import { injected } from '../../../connectors'
import { useWeb3React } from "@web3-react/core"
import { NetworkContextName, SUPPORTED_WALLETS } from "../../../constants"
import { useDispatch } from "react-redux"
import { updateStoreGlobalSelectWalletConf } from "../../../state/orbiter/reducer"

export default function useWalletConf() {
  let dispatch = useDispatch()
  const { active, account, chainId, connector } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const walletIsLogin = useMemo(() => {
    return contextNetwork.active || active
  }, [active, contextNetwork])
  const userWalletType = useMemo(() => {
    const { ethereum } = window
    const isMetaMask = !!(ethereum && ethereum.isMetaMask)
    const name = Object.keys(SUPPORTED_WALLETS)
      .filter(
        k =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
      )
      .map(k => SUPPORTED_WALLETS[k].name)[0]
    return name
  }, [connector])
  const [curWalletProvider, setCurWalletProvider] = useState<any>(null)
  useEffect(() => {
    let flag = true
    if (connector) {
      getPData()
    }
    return () => {
      flag = false
    }
    async function getPData() {
      let res = await connector?.getProvider()
      if (!flag) {
        return
      }
      setCurWalletProvider(res)
    }
  }, [connector])

  useEffect(() => {
    dispatch(updateStoreGlobalSelectWalletConf({
      loginSuccess: walletIsLogin,
      walletType: userWalletType,
      walletPayload: {
        walletAddress: account,
        networkId: chainId,
        // provider: curWalletProvider
        connector
      }
    }))

  }, [walletIsLogin,
    userWalletType,
    curWalletProvider,
    account,
    chainId])

}