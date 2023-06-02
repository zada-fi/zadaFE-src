import { useEffect, useMemo, useState } from "react"
import { TransferDataStateType } from "./bridge"


import config from "../../utils/orbiter-config"
type PropsType = {
  isCrossAddress: boolean
}
export default function useTransferDataState(props: PropsType) {
  const [transferDataState, setTransferDataState] = useState<TransferDataStateType>({
    fromChainID: '',
    toChainID: '',
    transferValue: 0,
    gasFee: 0,
    ethPrice: 0,
    // @ts-ignore
    selectMakerConfig: null,
    fromCurrency: undefined,
    toCurrency: undefined,
    isCrossAddress: undefined,
    crossAddressReceipt: undefined,
    transferExt: undefined
  })
  const updateTransferDataState = (value: any, valueKey: string) => {
    let preValue = transferDataState[valueKey as keyof TransferDataStateType]
    if (preValue + '' === '' + value) {
      return
    }
    setTransferDataState({
      ...transferDataState,
      [valueKey]: value
    })
  }

  const makerConfigInfo = useMemo(() => {
    let makerConfigs = config.v1MakerConfigs // not new version
    const makerConfig = makerConfigs.find(item =>
      item.fromChain.id + '' === transferDataState.fromChainID &&
      item.toChain.id + '' === transferDataState.toChainID &&
      item.fromChain.symbol === transferDataState.fromCurrency &&
      item.toChain.symbol === transferDataState.toCurrency
    );
    console.log('makerConfig---', makerConfigs,makerConfig)
    const tempmakerConfigInfo = makerConfig ? JSON.parse(JSON.stringify(makerConfig)):{};
    if (transferDataState.fromCurrency === transferDataState.toCurrency
      && props.isCrossAddress && tempmakerConfigInfo.crossAddress?.recipient) {
      tempmakerConfigInfo.recipient = tempmakerConfigInfo.crossAddress?.recipient;
      tempmakerConfigInfo.sender = tempmakerConfigInfo.crossAddress?.sender;
      tempmakerConfigInfo.tradingFee = tempmakerConfigInfo.crossAddress?.tradingFee;
      tempmakerConfigInfo.gasFee = tempmakerConfigInfo.crossAddress?.gasFee;
    }
    return tempmakerConfigInfo
  }, [transferDataState.toChainID,
  transferDataState.toCurrency,
  transferDataState.fromChainID,
  transferDataState.fromCurrency,
  props.isCrossAddress])

  useEffect(()=>{
    updateTransferDataState(makerConfigInfo, 'selectMakerConfig')
  },[makerConfigInfo])


  return {
    transferDataState,
    updateTransferDataState
  }
}