import { useState } from "react";
type Web3StateType = {
  isInstallMeta: boolean,
  isInjected: boolean,
  web3Instance: any,
  networkId: any,
  coinbase: any,
  error: any,
  localLogin: boolean,
  starkNet: {
    starkNetAddress: string,
    starkNetWalletName: string,
    starkWalletIcon: string,
    starkIsConnected: boolean,
    starkChain: string,
  },
}
export default function useLpData() {
  let [lpAccountInfo, setLpAccountInfo] = useState(null)
  let [lpApiKey, setLpApiKey] = useState(null)
  let [web3State, setWeb3State] = useState<Web3StateType>({
    isInstallMeta: false,
    isInjected: false,
    web3Instance: null,
    networkId: null,
    coinbase: null,
    error: null,
    localLogin: true,
    starkNet: {
      starkNetAddress: '',
      starkNetWalletName: '',
      starkWalletIcon: '',
      starkIsConnected: false,
      starkChain: '',
    },
  })
  const updateLpData = (value: any, valueKey: string) => {
    if (valueKey === 'lpAccountInfo') {
      setLpAccountInfo(value)
    } else if (valueKey === 'lpApiKey') {
      setLpApiKey(value)
    } else if (valueKey === 'web3State') {
      setWeb3State(prevState=>({
        ...prevState,
        [valueKey as keyof Web3StateType]: value
      }))
    }
  }
  return {
    lpAccountInfo,
    lpApiKey,
    web3State,
    updateLpData
  }
}