import React, { useEffect, useMemo, useState } from "react"

import { Text } from 'rebass'
import Row from "../Row"
// import { BigNumber } from '@ethersproject/bignumber'
import BigNumber from 'bignumber.js'
import { notification } from 'antd'
import 'antd/es/notification/style/index.css'
import config from './../../utils/orbiter-config'
import orbiterEnv from "../../utils/orbiter-env"
import { TokenItemType } from "./bridge"
import { isExecuteXVMContract, equalsIgnoreCase, getQuery, objParseQuery, getTokenIcon, isSupportXVMContract } from '../../utils/orbiter-tool'
import useInputData from "./useInputData"
import useChainAndTokenData from "./useChainAndTokenData"
import useTransferDataState from "./useTransferDataState"
import useTransferCalcute from "./useTransferCalcute"
import { exchangeToUsd } from "../../utils/orbiter-tool/coinbase"
import useLoadingData from "./useLoadingData"
import useBalance from "./useBalance"
import { useHistory, useLocation } from "react-router-dom"
import { getRates, RatesType } from '../../utils/orbiter-tool/coinbase'
type TransferPropsType = {
  onChangeState: Function
}

type CronConfigType = {
  cron: any,
  banList: Array<any>,
}
type SendBtnInfoType = {
  text: string,
  disabled: boolean
}


export default function Transfer(props: TransferPropsType) {
  let history = useHistory()
  let location = useLocation()
  let [rates, setRates] = useState<RatesType>(null)
  useEffect(()=>{
    let active = true
    loadRate()
    return ()=>{
      active = false
    }
    async function loadRate(){
      const exchangeRates: RatesType = await getRates('ETH');
      if(!active){
        return 
      }
      setRates(exchangeRates)
    }
  },[])
  
  const [isCrossAddress, setIsCrossAddress] = useState<boolean>(false)
  let { transferDataState, updateTransferDataState } = useTransferDataState({
    isCrossAddress
  })
  const { selectFromToken, selectToToken, transferValue,
    toValue,
    updateInputData,
    crossAddressReceipt,
    // @ts-ignore 
    onInputTransferValue } = useInputData({
      transferDataState,
      rates
    })

  useEffect(()=>{
    updateTransferDataState(crossAddressReceipt, 'crossAddressReceipt')
  },[crossAddressReceipt])

  let { ctData, updateChainAndTokenData } = useChainAndTokenData()

  let { transferSpentGas, getTransferBalance, getTransferGasLimit } = useTransferCalcute({
    transferDataState
  })
  // @ts-ignore 
  let { loadingDats, updateLoadingData } = useLoadingData()

  // @ts-ignore 
  let { fromBalance, toBalance,
    userMaxPrice,
    userMinPrice,
    makerMaxBalance,
    walletIsLogin,
    refreshUserBalance } = useBalance({
      transferDataState,
      updateLoadingData,
      getTransferGasLimit,
      getTransferBalance,
      rates
    })

  const [isInit, setIsInit] = useState(false)
  // const fromTokenList = []
  // const toTokenList = [];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [gasCostLoading, setGasCostLoading] = useState<boolean>(false)
  const [isLoopring, setIsLoopring] = useState<boolean>(false)
  const [configData, setConfigData] = useState<CronConfigType>({
    cron: null,
    banList: []
  })
  const isErrorAddress = useMemo(()=> {
    //!this.isNewVersion ||
    if ( selectFromToken === selectToToken) {
      return false;
    }
    if (!isCrossAddress || !crossAddressReceipt || !isSupportXVMContract(transferDataState)) {
      return false;
    }
    if (transferDataState.toChainID === '4' || transferDataState.toChainID === '44') {
      return false;
    }
    const reg = new RegExp(/^0x[a-fA-F0-9]{40}$/);
    const isCheck = !reg.test(crossAddressReceipt);
    // if (isCheck) {
    //   sendBtnInfo.disabled = 'disabled';
    // } else if(sendBtnInfo.disabled === 'disabled'){
    //   updateTransferInfo()
    // }
    return isCheck;
  },[transferDataState, 
    isCrossAddress, 
    crossAddressReceipt, 
    selectFromToken,
    selectToToken])
  useEffect(()=>{
    if(true){

    }
  },[isErrorAddress])
  const isShowMax = useMemo(()=> {
    return (
            new BigNumber(transferValue).comparedTo(
                    new BigNumber(transferDataState.selectMakerConfig?.fromChain?.maxPrice)
            ) > 0
    );
  },[transferDataState, transferValue])
  const isShowUnreachMinInfo = useMemo(()=>{
    if (walletIsLogin && transferValue) {
      let makerMin = new BigNumber(userMinPrice);
      let temp_transferValue = new BigNumber(transferValue);
      const temp_fromBalance = new BigNumber(fromBalance);
      return (
              temp_transferValue.comparedTo(makerMin) < 0 &&
              temp_transferValue.comparedTo(temp_fromBalance) < 0
      );
    }
    return false;
  },[walletIsLogin, transferValue, userMinPrice, fromBalance])  
  // @ts-ignore 
  const sendBtnInfo:SendBtnInfoType = useMemo(() => {
    const { selectMakerConfig, fromCurrency, toCurrency } = transferDataState;
    if (!selectMakerConfig) return {
      text: 'SEND',
      disable: true
    };
    const { fromChain } = selectMakerConfig;
    const availableDigit = fromChain.decimals === 18 ? 6 : 2;
    let opBalance = 10 ** -availableDigit;
    let useBalance = new BigNumber(fromBalance)
      .minus(new BigNumber(selectMakerConfig.tradingFee))
      .minus(new BigNumber(opBalance));
    let userMax = useBalance.decimalPlaces(availableDigit, BigNumber.ROUND_DOWN).comparedTo(0) === 1
      ? useBalance.decimalPlaces(availableDigit, BigNumber.ROUND_DOWN)
      : new BigNumber(0);
    let makerMax = new BigNumber(fromChain.maxPrice);
    let makerMin = new BigNumber(userMinPrice);
    let temp_transferValue = new BigNumber(transferValue || 0);

    if (walletIsLogin) {
      const info = {
        text: 'SEND',
        disabled: false,
      };
      info.text = 'SEND';
      if ((temp_transferValue).comparedTo(0) < 0) {
        info.disabled = true;
        // util.log('transferValue < 0', transferValue.toString());
      } else if ((temp_transferValue).comparedTo(userMaxPrice) > 0) {
        info.disabled = true;
        // util.log('transferValue > userMaxPrice', transferValue.toString(), this.userMaxPrice.toString());
      }
      if (temp_transferValue.comparedTo(userMax) > 0) {
        info.text = 'INSUFFICIENT FUNDS';
        info.disabled = true//'disabled';
        // util.log('transferValue > userMax', transferValue.toString(), userMax.toString());
      } else if (temp_transferValue.comparedTo(makerMax) > 0) {
        info.text = 'INSUFFICIENT LIQUIDITY';
        info.disabled = true//'disabled';
        // util.log('transferValue > makerMax', transferValue.toString(), makerMax.toString());
      } else if (temp_transferValue.comparedTo(makerMin) < 0) {
        info.text = 'INSUFFICIENT FUNDS';
        info.disabled = true//'disabled';
        // util.log('transferValue < makerMin', transferValue.toString(), makerMin.toString());
      } else if (temp_transferValue.comparedTo(0) > 0 && toValue <= 0) {
        info.text = 'INSUFFICIENT FUNDS';
        info.disabled = true//'disabled';
        // util.log('transferValue > 0 && toValue <= 0', transferValue.toString(), this.toValue.toString());
      } else if (toValue > 0 && makerMaxBalance && new BigNumber(toValue).comparedTo(new BigNumber(makerMaxBalance)) > 0) {
        info.text = 'INSUFFICIENT LIQUIDITY';
        info.disabled = true // 'disabled';
        // util.log('toValue > 0 && toValue > makerMaxBalance', this.toValue.toString(), new BigNumber(this.makerMaxBalance).toString());
      }

      if (isShowUnreachMinInfo || isShowMax) {
        info.text = 'SEND';
        info.disabled = true//'disabled';
        // util.log('isShowUnreachMinInfo || isShowMax', isShowUnreachMinInfo, this.isShowMax);
      }

      if ((fromCurrency !== toCurrency || isCrossAddress) &&
        !isSupportXVMContract(transferDataState) && !isLoopring ) {
        info.text = 'SEND';
        info.disabled = true// 'disabled';
        // util.log('(fromCurrency !== toCurrency || this.isCrossAddress) && !isSupportXVMContract && !this.isLoopring && !util.isStarkNet',
        //   fromCurrency !== toCurrency, this.isCrossAddress, !util.isSupportXVMContract(), !this.isLoopring, !util.isStarkNet());
      }

      if (isSupportXVMContract(transferDataState) && isCrossAddress && (!crossAddressReceipt || isErrorAddress)) {
        info.text = 'SEND';
        info.disabled = true//'disabled';
        // util.log('isSupportXVM && isCrossAddress && (!crossAddressReceipt || isErrorAddress)',
        //   this.crossAddressReceipt, this.isErrorAddress);
      }
      const reg = new RegExp(/^0x[a-fA-F0-9]{40}$/);
      const isCheck = !reg.test(crossAddressReceipt);
      if (isLoopring && isCrossAddress && (!crossAddressReceipt || isCheck)) {
        info.text = 'SEND';
        info.disabled = true//'disabled';
        // util.log('this.isLoopring && !this.crossAddressReceipt',
        //   this.isLoopring, !this.crossAddressReceipt);
      }
      return info

    } else {
      return {
        text: 'SEND',
        disable: false
      }
    }

  }, [fromBalance,
    transferDataState.selectMakerConfig,
    transferDataState.fromCurrency,
    transferDataState.toCurrency
  ])
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const toValueToolTip = useMemo(() => {
    let temp = 'Sender pays a 0.00% trading fee for each transfer.'
    if (typeof transferDataState.selectMakerConfig !== 'undefined' && transferDataState.selectMakerConfig) {
      temp = `Sender pays a ${parseFloat(((transferDataState.selectMakerConfig.gasFee || 0) / 10).toFixed(2))}% trading fee for each transfer.`;
    }
    return temp
  }, [transferDataState.selectMakerConfig])
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const isShowExchangeIcon = useMemo(() => {
    let makerConfigs = config.v1MakerConfigs // not new version
    return !!makerConfigs.find(item =>
      item.fromChain.id + '' === transferDataState.toChainID &&
      item.fromChain.symbol === transferDataState.toCurrency &&
      item.toChain.id + '' === transferDataState.fromChainID &&
      item.toChain.symbol === transferDataState.fromCurrency);
  }, [transferDataState.toChainID, transferDataState.toCurrency,
  transferDataState.fromChainID, transferDataState.fromCurrency])


  const queryParams = useMemo(() => {
    let query = getQuery()
    const { referer } = query;
    let { token, tokens, amount = '', fixed } = query;
    // amount = amount ? new BigNumber(amount) : '';
    tokens = !tokens ? [] : tokens.split(',');
    const makerConfigs: any = config.v1MakerConfigs
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let source = makerConfigs.find(item => item.fromChain.name.toLowerCase() === query?.source?.toLowerCase())?.fromChain?.id || 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let dest = makerConfigs.find(item => item.toChain.name.toLowerCase() === query?.dest?.toLowerCase())?.toChain?.id || 0;
    const getMapChainIds = (chainNames: string, isDest = 0) => {
      const chainIds: number[] = [];
      if (!chainNames) {
        return chainIds;
      }
      for (const chainName of chainNames.split(',')) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const chainId = isDest ? makerConfigs.find(item => item.toChain.name === chainName)?.toChain?.id || 0 : makerConfigs.find(item => item.fromChain.name === chainName)?.fromChain?.id || 0;
        if (chainId) {
          chainIds.push(chainId);
        }
      }
      return Array.from(new Set(chainIds)).sort(function (a, b) {
        return a - b;
      });
    };

    let sources = getMapChainIds(query.sources);
    let dests = getMapChainIds(query.dests, 1);

    if (sources.length === 1 && dests.length === 1 && sources[0] === dests[0]) {
      // Example: sources=[1], dests=[1], invalid, reset them!
      sources = [];
      dests = [];
    }

    if (source > 0 && sources.length > 0 && sources.indexOf(source) === -1) {
      source = 0;
    }
    if (dest > 0 && dests.length > 0 && dests.indexOf(dest) === -1) {
      dest = 0;
    }
    if (source <= 0 && sources.length > 0) {
      source = sources[0];
    }
    if (dest <= 0 && dests.length > 0) {
      dest = dests[0];
    }
    if (dests.length === 1 && sources.length > 1) {
      // When dests only 1 item: A, remove sources A item
      const _index = sources.indexOf(dests[0]);
      if (_index > -1) {
        sources.splice(_index, 1);

        // When source same as dests[0], set source=sources[0]
        if (source == dests[0]) {
          source = sources[0];
        }
      }
    }
    if (dests.length > 0 && dests[0] === source) {
      source = 0;
    }
    if (source === dest) {
      dest = 0;
    }

    // Tidy tokens
    const tidyTokens = [];
    for (const tk of tokens) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const makerConfig = makerConfigs.find(item => equalsIgnoreCase(item.fromChain.symbol, tk));
      if (makerConfig) {
        tidyTokens.push(makerConfig.fromChain.symbol);
      }
    }
    // Tidy
    if (!token) {
      token = tokens?.[0] || '';
    }
    if (amount && new BigNumber(amount).comparedTo(('0'))> -1) {
      amount = amount.toNumber().toFixed();
    } else {
      amount = '';
    }
    fixed = fixed === 1; // To boolean
    return {
      referer,
      source,
      dest,
      token,
      tokens: tidyTokens,
      amount,
      fixed,
      sources,
      dests,
    };
  }, [])

  // const refreshConfig = ()=>{
  //   // 更新配置
  // }
  
  // @ts-ignore
  let [exchangeToUsdPrice, setExchangeToUsdPrice] = useState<number>(0)
  const getExchangeToUsdPrice = async () => {
    const { selectMakerConfig } = transferDataState;
    if (!selectMakerConfig) return 0;
    const price = (await exchangeToUsd(1, selectMakerConfig.fromChain.symbol)).toNumber();
    if (price > 0) {
      return price;
    } else {
      return 0
    }
  }
  useEffect(()=>{
    let flag = true 
    const loadData = async()=>{
      let res = await getExchangeToUsdPrice()
      if(!flag)return 
      setExchangeToUsdPrice(res)
    }
    loadData()
    return ()=>{
      flag = false 
    }
    

  }, [transferDataState.selectMakerConfig])




  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const updateTransferInfo = async ({ fromChainID, toChainID, fromCurrency, toCurrency } = transferDataState) => {
    toCurrency = fromCurrency
   

    const isCrossAddress = transferDataState.isCrossAddress;
    const oldFromChainID = transferDataState.fromChainID;
    const oldToChainID = transferDataState.toChainID;

    // const oldFromCurrency = transferDataState.fromCurrency;
    fromChainID = fromChainID || transferDataState.fromChainID;
    toChainID = toChainID || transferDataState.toChainID;
    fromCurrency = fromCurrency || transferDataState.fromCurrency;
    toCurrency = toCurrency || transferDataState.toCurrency;

    // change toChainId,and toChainId equal fromChainId
    if (oldToChainID !== toChainID && oldFromChainID === fromChainID && toChainID === fromChainID) {
      fromChainID = oldToChainID;
    }
    setIsLoopring(fromChainID + '' === '9' || fromChainID + '' === '99')

    if (fromCurrency === toCurrency && !isLoopring) {
      if (isCrossAddress && isExecuteXVMContract(transferDataState)) {
        notification.warning({
          message: ``,
          description: 'Not supported yet Change Account.',
        });
      }
      setIsCrossAddress(false)
    }
    const { tokens, source, dest } = queryParams;
    const fromTokens = tokens;
    const makerConfigs = config.v1MakerConfigs
    const fromChainIdList: number[] = Array.from(new Set(
      makerConfigs.map(item => item.fromChain.id)
    )).sort(function (a, b) {
      return a - b;
    });

    fromChainID = fromChainID || (source && fromChainIdList.find(item => item === +source) ?
      (+source) + '' :
      fromChainIdList[0] + '');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let toChainIdList: number[] = Array.from(new Set(
      makerConfigs.map(item => {
        if (item.fromChain.id + '' === fromChainID + '') {
          return item.toChain.id;
        }
      })
        .filter(item => item)
    )).sort(function (a, b) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return a - b;
    });

    toChainID = toChainID || (dest && toChainIdList.find(item => item + '' === '' + dest) ?
      (dest + '') :
      (toChainIdList[0] + ''));
    if (toChainIdList.indexOf(+toChainID) === -1) {
      toChainID = toChainIdList.indexOf(dest) > -1 ?
        dest :
        toChainIdList[0];
    }

    // Reverse path
    if (makerConfigs.find(item => item.toChain.id + '' === '' + fromChainID) && makerConfigs.find(item => item.fromChain.id + '' === '' + toChainID)) {
      toChainIdList.push(+fromChainID);
      toChainIdList = toChainIdList.sort(function (a, b) {
        return a - b;
      });
    }

    const selectedFromChainIdIndex: number = fromChainIdList.findIndex(item => item + '' === fromChainID + '');
    if (selectedFromChainIdIndex !== -1) {
      fromChainIdList.splice(selectedFromChainIdIndex, 1);
    }

    const selectedToChainIdIndex: number = toChainIdList.findIndex(item => item + '' === toChainID + '');
    if (selectedToChainIdIndex !== -1) {
      toChainIdList.splice(selectedToChainIdIndex, 1);
    }

    let makerConfigList: any[] = makerConfigs.filter(item => item.fromChain.id + '' === fromChainID + '' && item.toChain.id + '' === toChainID + '');
    if (fromTokens.length) {
      makerConfigList = makerConfigList.filter(item =>
        fromTokens.find((it) => equalsIgnoreCase(it, item.fromChain.symbol))
      );
    }

    const fromTokenList: TokenItemType[] = [];
    const toTokenList: Array<TokenItemType> = [];
    makerConfigList.forEach(item => {
      if (!fromTokenList.find(it => it.token === item.fromChain.symbol)) {
        fromTokenList.push({
          icon: getTokenIcon(item.fromChain.symbol),
          token: item.fromChain.symbol,
          amount: 0,
        });
      }
      if (fromCurrency === item.fromChain.symbol && !toTokenList.find(it => it.token === item.toChain.symbol)) {
        toTokenList.push({
          icon: getTokenIcon(item.toChain.symbol),
          token: item.toChain.symbol,
          amount: 0,
        });
      }
    });
    if (fromTokenList.length && !fromTokenList.find((item) => item.token === fromCurrency)) {
      fromCurrency = fromTokenList[0].token;
      if (oldFromChainID !== fromChainID) {
        updateInputData(fromTokenList[0].token, 'from')
      }
      // this.selectFromToken = fromTokenList[0].token;
    }

    makerConfigList.forEach(item => {
      if (fromCurrency === item.fromChain.symbol && !toTokenList.find(it => it.token === item.toChain.symbol)) {
        toTokenList.push({
          icon: getTokenIcon(item.toChain.symbol),
          token: item.toChain.symbol,
          amount: 0,
        });
      }
    });

    if (toTokenList.length && !toTokenList.find((item) => item.token === toCurrency)) {
      toCurrency = toTokenList[0].token;
      if (oldToChainID !== toChainID) {
        updateInputData(toTokenList[0].token, 'to')
      }
      //this.selectToToken = toTokenList[0].token;
    }

    if (fromCurrency !== selectFromToken) {
      updateInputData(fromCurrency || '', 'from')
    }
    if (toCurrency !== selectToToken) {
      updateInputData(toCurrency || '', 'from')
    }

    if (ctData.fromChainIdList !== fromChainIdList) {
      updateChainAndTokenData(fromChainIdList, 'fromChainIdList')
    }
    if (ctData.toChainIdList !== toChainIdList) {
      updateChainAndTokenData(toChainIdList, 'toChainIdList');
    }
    if (ctData.toTokenList !== toTokenList) {
      updateChainAndTokenData(toTokenList, 'toTokenList')
    }
    if (ctData.fromTokenList !== fromTokenList) {
      updateChainAndTokenData(fromTokenList, 'fromTokenList')
    }
    updateTransferDataState(fromChainID, 'fromChainID');
    updateTransferDataState(toChainID, 'toChainID');
    updateTransferDataState(fromCurrency, 'fromCurrency');
    updateTransferDataState(toCurrency, 'toCurrency');

    specialProcessing(oldFromChainID, oldToChainID)
    if (fromChainID !== oldFromChainID || toChainID !== oldToChainID) {
      updateOriginGasCost();
    }
    if (fromChainID !== oldFromChainID) {
      // gasCostLoading = true;
      setGasCostLoading(true)
      // transferCalculate.
      transferSpentGas(fromChainID, orbiterEnv.gasPriceMap, orbiterEnv.gasLimitMap)
        .then((response) => {
          updateTransferGasFee(response);
          setGasCostLoading(false)
        })
        .catch((error) => {
          setGasCostLoading(false)
          console.warn('GetGasFeeError =', error);
        });
    }

    await refreshUserBalance()

    updateRoutes(oldFromChainID, oldToChainID);
  }


  const updateRoutes = (oldFromChainID: string, oldToChainID: string) => {
    const { fromChainID, toChainID, selectMakerConfig } = transferDataState;
    // const { path, query } = this.$route;
    let path = location.pathname
    let query = getQuery()
    const changeQuery = {};
    if (fromChainID !== oldFromChainID && query?.source !== selectMakerConfig.fromChain.name) {
      // @ts-ignore 
      changeQuery.source = selectMakerConfig.fromChain.name;
    }
    if (toChainID !== oldToChainID && query?.dest !== selectMakerConfig.toChain.name) {
      // @ts-ignore 
      changeQuery.dest = selectMakerConfig.toChain.name;
    }
    if (Object.keys(changeQuery).length) {
      const newQuery = JSON.parse(JSON.stringify(query));
      Object.assign(newQuery, changeQuery);
      let searchStr = '?' + objParseQuery(newQuery)
      console.log('searchStr=', searchStr)
      history.push({
        pathname: path,
        search: searchStr,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const specialProcessing = (oldFromChainID, oldToChainID) => { }
  const updateOriginGasCost = () => {

  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const updateTransferGasFee = (response) => {

  }

  const openApiFilter = async () => {
    try {
      let response = await fetch(`${process.env.REACT_APP_OPEN_API_URL}/frontend/net`);
      let res = await response.json()
      let cron = configData.cron
      if (!cron) {
        cron = setInterval(async () => {
          await openApiFilter()
        }, 30000)
      }
      if (res.code + '' === '0') {
        setConfigData({
          cron,
          banList: res.result
        })
      } else {
        setConfigData({
          cron,
          banList: []
        })
      }

    } catch (error) {
      setConfigData({
        cron: null,
        banList: []
      })
    }

  }
  const initData = () => {
    openApiFilter()
  }

  useEffect(() => {
    if (!isInit) {
      initData()
      setIsInit(true)
    }
    return () => {
      !!configData.cron && clearInterval(configData.cron)
    }
  }, [isInit])





  return (<>
    <Row>
      <Text fontSize={20} fontWeight={500}>Token</Text>

    </Row>

  </>)
}