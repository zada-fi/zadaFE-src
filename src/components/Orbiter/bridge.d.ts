import { MakerConfigType } from "../../utils/orbiter-config"
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

  selectMakerConfig: MakerConfigType,
  fromCurrency: string | undefined,
  toCurrency: string | undefined,
  isCrossAddress: boolean | undefined,
  crossAddressReceipt: string | undefined,
  transferExt: string | undefined
}