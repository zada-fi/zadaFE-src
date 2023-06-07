import { MakerConfigType } from "../../utils/orbiter-config"
export type ComPropsType = {
  onChangeState: Function
}

export type TokenItemType = {
  icon: any,
  token: string,
  amount: number
}
export type ChainAndTokenDataType = {
  fromChainIdList: number[],
  toChainIdList: number[],
  fromTokenList: Array<TokenItemType>,
  toTokenList: Array<TokenItemType>
}

export type TransferDataStateType = {
  fromChainID: string,
  toChainID: string,
  transferValue: number,
  gasFee: number,
  ethPrice: number,

  selectMakerConfig: MakerConfigType | null,
  fromCurrency: string | undefined,
  toCurrency: string | undefined,
  isCrossAddress: boolean | undefined,
  crossAddressReceipt: string | undefined,
  transferExt: string | undefined
}

export type HistoryPanelStateType = {
  isLoading: boolean,
  transactionListInfo: {
    current: number,
    size: number,
    total: number,
    pages: number,
  },
  transactionList: any,
  historyInfo: any,
  isShowHistory: boolean,
}

type GlobalSelectWalletConfType = {
  walletType: string,
  walletPayload: {
    walletAddress: string,
    networkId: string,
    connector: any
    // provider: any, // ethereum node match this wallet type
  },
  loginSuccess: boolean,
}

type OrWeb3StateType = {
  isInstallMeta: boolean,
  isInjected: boolean,
  web3Instance: any,
  networkId: any,
  coinbase: any,
  error: any,
  localLogin: boolean,
  starkNet: {
    starkNetAddress: string,
    starkNetWalletName:string,
    starkWalletIcon: string,
    starkIsConnected: boolean,
    starkChain: string,
  },
}