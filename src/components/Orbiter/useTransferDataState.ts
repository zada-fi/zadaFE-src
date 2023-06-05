import { useEffect, useMemo, useState } from "react"
import { TransferDataStateType } from "./bridge"

import { updateStoreTransferDataState } from '../../state/orbiter/reducer'

import config from "../../utils/orbiter-config"
import { useDispatch } from "react-redux"
type PropsType = {
  isCrossAddress: boolean
}
export default function useTransferDataState(props: PropsType) {
  let dispatch = useDispatch()
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
    if (preValue + '' === '' + value && valueKey !== 'selectMakerConfig') {
      return
    }
    setTransferDataState(prevState => ({
      ...prevState,
      [valueKey as keyof TransferDataStateType]: value
    }))
  }

  const makerConfigInfo = useMemo(() => {
    let makerConfigs = config.v1MakerConfigs // not new version
    const makerConfig = makerConfigs.find(item =>
      item.fromChain.id + '' === transferDataState.fromChainID &&
      item.toChain.id + '' === transferDataState.toChainID &&
      item.fromChain.symbol === transferDataState.fromCurrency &&
      item.toChain.symbol === transferDataState.toCurrency
    );
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
    dispatch(updateStoreTransferDataState(transferDataState))
  },[transferDataState])

  useEffect(()=>{
    updateTransferDataState(makerConfigInfo, 'selectMakerConfig')
  },[makerConfigInfo])


  return {
    transferDataState,
    updateTransferDataState
  }
}