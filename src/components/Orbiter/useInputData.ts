import {  useEffect,  useState } from "react";
import { TransferDataStateType } from "./bridge"
import orbiterCore from "../../utils/orbiter-core";
import BigNumber from 'bignumber.js'
import {  RatesType } from "../../utils/orbiter-tool/coinbase";
import { DataItem } from "../ObSelect/a";
type PropsType = {
  transferDataState: TransferDataStateType,
  rates: RatesType
}
export default function useInputData(props: PropsType){
  let [selectFromToken, setSelectFromToken]=useState<string>('ETH')
  let [selectToToken, setSelectToToken] = useState<string>('ETH')
  let [transferValue, setTransferValue] = useState<string>('') // 
  let [crossAddressReceipt, setCrossAddressReceipt] = useState<string>('')
  // let [toValue, setToValue] = useState<string>('')
  let onInputTransferValue = (e: any)=>{
    let value = e.target.value 
    const { selectMakerConfig } = props.transferDataState;
      if (!selectMakerConfig) return;
      const { fromChain, toChain } = selectMakerConfig;
      
      if (fromChain.id === 9 || fromChain.id === 99 || toChain.id === 9 || toChain.id === 99) {
        let temp_transferValue = fromChain.decimals === 18
                ? value.replace(/^\D*(\d*(?:\.\d{0,5})?).*$/g, '$1')
                : value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1');
        setTransferValue(temp_transferValue)
      } else {
        let temp_transferValue = fromChain.decimals === 18
                ? value.replace(/^\D*(\d*(?:\.\d{0,6})?).*$/g, '$1')
                : value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1');
                setTransferValue(temp_transferValue)
      }
  }
  let getToValue = async()=> {
    const { fromCurrency, toCurrency, selectMakerConfig } = props.transferDataState;
    if (!transferValue || !selectMakerConfig) {
      return 0
    }
    let amount = orbiterCore.getToAmountFromUserAmount(
            new BigNumber(transferValue).plus(
                    new BigNumber(selectMakerConfig.tradingFee)
            ),
            selectMakerConfig,
            false
    );
    if (fromCurrency !== toCurrency) {
      const exchangeRates: RatesType = props.rates //await getRates('ETH');
      // @ts-ignore 
      const fromRate = exchangeRates?exchangeRates[fromCurrency]:null
      // @ts-ignore 
      const toRate = exchangeRates?exchangeRates[toCurrency]:null
      const slippage = selectMakerConfig.slippage;
      if (!fromRate || !toRate || !slippage) {
        // util.log('get rate fail', fromCurrency, fromRate, toCurrency, toRate);
        return 0;
      }
      const value = (new BigNumber(amount).dividedBy(fromRate).multipliedBy(toRate)).toFixed(6);
      return new BigNumber(value).multipliedBy(1 - slippage / 10000).toNumber();
    } else {
      return amount;
    }
  }
  let [toValue, setToValue] = useState<number>(0)
  useEffect(()=>{
    let flag = true 
    loadData()
    return ()=>{
      flag = false 
    }
    async function loadData(){
      let res = await getToValue()
      if(!flag){
        return 
      }
      setToValue(res)
    }
  },[props.transferDataState, props.rates])
  const updateInputData = (value: string, key: string)=>{
    switch(key){
      case 'from':
        setSelectFromToken(value);
        break
      case 'to':
        setSelectToToken(value);
        break;
      case 'transferValue':
        setTransferValue(value);
        break
      case 'crossAddressReceipt':
        setCrossAddressReceipt(value)
        break
      default:
        break
    }
  }
  const onChangeSelectFromToken = (item:DataItem)=>{
    if(item){
    updateInputData(item.value||'', 'from')
    }
  }
  return {
    selectFromToken,
    selectToToken,
    transferValue,
    toValue,
    crossAddressReceipt,
    updateInputData,
    onInputTransferValue,
    onChangeSelectFromToken

  }
}