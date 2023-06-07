import React, { useContext, useEffect, useMemo, useState } from "react"
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { AutoRow } from '../../components/Row'
import styled, { ThemeContext } from 'styled-components'
import { ArrowWrapper } from '../../components/swap/styleds'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Text } from 'rebass'
import Row from "../Row"
import { SUPPORTED_WALLETS } from '../../constants'
import { injected } from '../../connectors'
import nonceUtil from "../../utils/orbiter-core/nonce"
import BigNumber from 'bignumber.js'
import { notification } from 'antd'
import 'antd/es/notification/style/index.css'
import config from './../../utils/orbiter-config'
import orbiterEnv from "../../utils/orbiter-env"
import { TokenItemType, ComPropsType } from "./bridge"
import { isExecuteXVMContract, equalsIgnoreCase, getQuery, objParseQuery, getTokenIcon, isSupportXVMContract, showMessage, isLegalAddress, getMetaMaskNetworkId, ensureWalletNetwork, getChainInfoByChainId, shortAddress } from '../../utils/orbiter-tool'
import useInputData from "./useInputData"
import useChainAndTokenData from "./useChainAndTokenData"
import useTransferDataState from "./useTransferDataState"
import useTransferCalcute from "./useTransferCalcute"
import useLoadingData from "./useLoadingData"
import useBalance from "./useBalance"
import { useHistory, useLocation } from "react-router-dom"
import { getRates, RatesType, exchangeToUsd, asyncGetExchangeToUsdRate } from '../../utils/orbiter-tool/coinbase'
import { isWhite, chainName, getCompatibleGlobalWalletConf } from './../../utils/orbiter-tool'
import ObSelect from "../ObSelect"
import useGasData from "./useGasData"
import Loader from "../Loader"
import SvgIcon from "../SvgIcon"
import CommonDialog from "../CommDialog"
import './style.css'
import QuestionHelper from "../QuestionHelper"
import { ButtonConfirmed, ButtonLight } from "../Button"
import { useWalletModalToggle } from "../../state/application/hooks"
import { useWeb3React } from "@web3-react/core"
import { IMXHelper } from "../../utils/orbiter-tool/immutablex/imx_helper"
import useLoopring from "./useLoopring"
import { useDispatch } from "react-redux"
import { updateConfirmRouteDescInfo } from "../../state/orbiter/reducer"
import orbiterCore from "../../utils/orbiter-core"
import TransferInfoBox from "./info"
import walletsDispatchers from "../../utils/orbiter-tool/walletsDispatchers"

const { walletDispatchersOnSwitchChain } = walletsDispatchers

type CronConfigType = {
  cron: any,
  banList: Array<any>,
}
type SendBtnInfoType = {
  text: string,
  disabled: boolean
}

const TipSvgIcon = styled(SvgIcon)`
  width: 1rem; 
  height: 1rem;
  margin-right: 0.2rem
`

const StyledSvgIcon = styled(SvgIcon)`
  width: 24px;
  height: 24px;
  margin-right: 4px;

`
const StyledDropDown = styled(DropDown) <{ selected: boolean }>`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`
type SubmitBtnPropType = {
  btnInfo: SendBtnInfoType,
  other: {
    className: string,
    style: object
  },
  onClick: () => void
}
const SubmitBtn = (props: SubmitBtnPropType) => {

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useWeb3React()
  if (!account) {
    return (<><ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
    </>)

  } else if (props.btnInfo.disabled) {
    return (<ButtonLight className={props.other.className} style={props.other.style}>
      {props.btnInfo.text}
    </ButtonLight>)
  } else {
    return (<ButtonConfirmed
      onClick={props.onClick}
      className={props.other.className}
      style={props.other.style}>
      {props.btnInfo.text}
    </ButtonConfirmed>)
  }
}

export default function Transfer(props: ComPropsType) {

  const { connector, account, chainId } = useWeb3React()

  const dispatch = useDispatch()

  const theme = useContext(ThemeContext)
  let history = useHistory()
  let location = useLocation()

  let [rates, setRates] = useState<RatesType>(null)
  useEffect(() => {
    let active = true
    loadRate()
    return () => {
      active = false
    }
    async function loadRate() {
      const exchangeRates: RatesType = await getRates('ETH');
      if (!active) {
        return
      }
      setRates(exchangeRates)
    }
  }, [])

  const [isCrossAddress, setIsCrossAddress] = useState<boolean>(false)
  let { transferDataState, updateTransferDataState } = useTransferDataState({
    isCrossAddress
  })
  const { getAccountStorageID } = useLoopring({
    transferDataState
  })
  const { selectFromToken, selectToToken, transferValue,
    isShowFromSel,
    isShowToSel,
    toValue,
    updateInputData,
    crossAddressReceipt,
    // @ts-ignore 
    onInputTransferValue, onChangeSelectFromToken, onChangeSelectToToken } = useInputData({
      transferDataState,
      rates
    })

  useEffect(() => {
    updateTransferDataState(crossAddressReceipt, 'crossAddressReceipt')
  }, [crossAddressReceipt])

  let { ctData, updateChainAndTokenData } = useChainAndTokenData()

  let { transferSpentGas, getTransferBalance, getTransferGasLimit, getTokenConvertUsd, transferOrginGasUsd } = useTransferCalcute({
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
  // console.log('transfer transferDataState=', transferDataState)
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
  const [orbiterTradingFee, setOrbiterTradingFee] = useState<string>('0')

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


  const originTimeSpent = useMemo(() => {
    let fromChainID = +transferDataState.fromChainID
    let toChainID = +transferDataState.toChainID
    if (fromChainID === 2 || fromChainID === 22) {
      return '~7 days'
    }
    if (fromChainID === 4 || fromChainID === 44) {
      return '~24 hours'
    }
    if (fromChainID === 16 || fromChainID === 516) {
      return '~7 days'
    }
    if (
      fromChainID === 3 ||
      fromChainID === 33 ||
      fromChainID === 12 ||
      fromChainID === 512 ||
      fromChainID === 14 ||
      fromChainID === 514
    ) {
      return '~4 hours'
    }
    // https://docs.polygon.technology/docs/develop/ethereum-polygon/getting-started/
    if (fromChainID === 6 || fromChainID === 66) {
      return '~3 hours'
    }
    if (fromChainID === 7 || fromChainID === 77) {
      return '~7 days'
    }
    if (fromChainID === 8 || fromChainID === 88) {
      return '~5 hours'
    }
    if (fromChainID === 9 || fromChainID === 99) {
      return '~4 hours'
    }
    if (fromChainID === 10 || fromChainID === 510) {
      return '~7 days'
    }
    if (fromChainID === 13 || fromChainID === 513) {
      return '~7 days'
    }
    if (fromChainID === 15 || fromChainID === 515) {
      return '~15min'
    }
    if (fromChainID === 518 && toChainID === 519) {
      return '~2min'
    }
    if (fromChainID === 519 && toChainID === 518) {
      return '~10min'
    }

    if (fromChainID === 1 || fromChainID === 5) {
      if (toChainID === 2 || toChainID === 22) {
        //  eth ->  ar
        return '~10min'
      }
      if (toChainID === 4 || toChainID === 44) {
        //  eth ->  ar
        return '~10min'
      }
      if (
        toChainID === 3 ||
        toChainID === 33 ||
        toChainID === 12 ||
        toChainID === 512 ||
        toChainID === 14 ||
        toChainID === 514
      ) {
        // eth -> zk
        return '~10min'
      }
      if (toChainID === 6 || toChainID === 66) {
        // eth -> polygon
        return '~5min'
      }
      if (toChainID === 7 || toChainID === 77) {
        // eth -> optimistic
        return '~5min'
      }
      if (toChainID === 8 || toChainID === 88) {
        // eth -> immutablex
        return '~20min'
      }
      if (toChainID === 9 || toChainID === 99) {
        return '~10min'
      }
      if (toChainID === 10 || toChainID === 510) {
        // eth -> metis
        return '~5min'
      }
      if (toChainID === 11 || toChainID === 511) {
        return '~20min'
      }
      if (toChainID === 13 || toChainID === 513) {
        return '~10min'
      }
      if (toChainID === 15 || toChainID === 515) {
        return '~15min'
      }
      if (toChainID === 16 || toChainID === 516) {
        return '~10min'
      }
    }
  }, [transferDataState.fromChainID, transferDataState.toChainID])
  const timeSpent = useMemo(() => {
    let fromChainID = +transferDataState.fromChainID
    let toChainID = +transferDataState.toChainID
    let timeSpent = 0
    if (fromChainID === 1 || fromChainID === 4 || fromChainID === 5) {
      timeSpent = 30
    }
    if (fromChainID === 2 || fromChainID === 22) {
      timeSpent = 15
    }
    if (fromChainID === 10 || fromChainID === 510) {
      timeSpent = 15
    }
    if (
      fromChainID === 3 ||
      fromChainID === 33 ||
      fromChainID === 12 ||
      fromChainID === 512
    ) {
      timeSpent = 5
    }
    if (fromChainID === 6 || fromChainID === 66) {
      timeSpent = 15
    }
    if (fromChainID === 7 || fromChainID === 77) {
      timeSpent = 15
    }
    if (fromChainID === 8 || fromChainID === 88) {
      timeSpent = 5
    }
    if (fromChainID === 9 || fromChainID === 99) {
      timeSpent = 15
    }
    if (fromChainID === 13 || fromChainID === 513) {
      timeSpent = 20
    }
    if (fromChainID === 16 || fromChainID === 516) {
      timeSpent = 30
    }
    if (fromChainID === 4 || fromChainID === 44) {
      timeSpent = 180
    }
    if (fromChainID === 518) {
      timeSpent = 15
    }
    if (fromChainID === 519) {
      timeSpent = 6.828
    }
    if (toChainID === 4 || toChainID === 44) {
      timeSpent = 180
    }
    if (toChainID === 1 || toChainID === 5) {
      timeSpent += 30
    }
    if (toChainID === 16 || toChainID === 516) {
      timeSpent += 30
    }
    if (toChainID === 2 || toChainID === 22) {
      timeSpent += 15
    }
    if (
      toChainID === 3 ||
      toChainID === 33 ||
      toChainID === 12 ||
      toChainID === 512
    ) {
      timeSpent += 5
    }
    if (toChainID === 6 || toChainID === 66) {
      timeSpent += 15
    }
    if (toChainID === 7 || toChainID === 77) {
      timeSpent += 15
    }
    if (toChainID === 8 || toChainID === 88) {
      timeSpent += 5
    }
    if (toChainID === 9 || toChainID === 99) {
      timeSpent += 15
    }
    if (toChainID === 10 || toChainID === 510) {
      timeSpent += 15
    }
    if (toChainID === 11 || toChainID === 511) {
      timeSpent += 5
    }
    if (toChainID === 13 || toChainID === 513) {
      timeSpent += 20
    }
    if (toChainID === 14 || toChainID === 514) {
      timeSpent += 15
    }
    if (toChainID === 518) {
      timeSpent += 15
    }
    if (toChainID === 519) {
      timeSpent += 6.828
    }
    const timeSpentStr = timeSpent + 's'
    return timeSpentStr
  }, [transferDataState.fromChainID, transferDataState.toChainID])
  const timeSpenToolTip = useMemo(() => {
    return `It takes about ${originTimeSpent
        ? originTimeSpent.replace('~', '')
        : originTimeSpent
      } moving funds using the native bridge, and it only takes about ${timeSpent ? timeSpent.replace('~', '') : timeSpent
      } using Orbiter.`;
  }, [timeSpent, originTimeSpent])
  const transferSavingTime = useMemo(()=>{
    return originTimeSpent?.replace('~', '')||'';
  },[originTimeSpent])
  const isErrorAddress = useMemo(() => {
    //!this.isNewVersion ||
    if (selectFromToken === selectToToken) {
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
  }, [transferDataState,
    isCrossAddress,
    crossAddressReceipt,
    selectFromToken,
    selectToToken])

  const fromChainObj = useMemo(() => {
    const localChainID = transferDataState.fromChainID
    console.log('from chainobj localchainid', localChainID)
    if (!localChainID) {
      return {
        icon: '',
        name: ''
      }
    }
    return {
      // @ts-ignore 
      icon: orbiterEnv.chainIcon[localChainID],
      name: chainName(localChainID)
    }
  }, [transferDataState.fromChainID])
  const toChainObj = useMemo(() => {
    const localChainID = transferDataState.toChainID
    if (!localChainID) {
      return {
        icon: '',
        name: ''
      }
    }
    return {
      // @ts-ignore 
      icon: orbiterEnv.chainIcon[localChainID],
      name: chainName(localChainID)
    }
  }, [transferDataState.toChainID])


  const isShowMax = useMemo(() => {
    return (
      new BigNumber(transferValue).comparedTo(
        new BigNumber(transferDataState.selectMakerConfig?.fromChain?.maxPrice||'0')
      ) > 0
    );
  }, [transferDataState, transferValue])
  const isShowUnreachMinInfo = useMemo(() => {
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
  }, [walletIsLogin, transferValue, userMinPrice, fromBalance])
  let isWhiteWallet = useMemo(() => {
    if (walletIsLogin) {
      return isWhite()
    } else {
      return false
    }
  }, [walletIsLogin])
  let isNewVersion = useMemo(() => {
    return false
  }, [walletIsLogin])
  // @ts-ignore 
  const sendBtnInfo: SendBtnInfoType = useMemo(() => {
    const { selectMakerConfig, fromCurrency, toCurrency } = transferDataState;
    if (!selectMakerConfig || !Object.keys(selectMakerConfig).length) return {
      text: 'SEND',
      disable: true
    };
    console.log('sendBtnInfo useMemo=', selectMakerConfig)
    const { fromChain } = selectMakerConfig;

    const availableDigit = fromChain && fromChain.decimals === 18 ? 6 : 2;
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
        !isSupportXVMContract(transferDataState) && !isLoopring) {
        info.text = 'SEND';
        info.disabled = true// 'disabled';
        // util.log('(fromCurrency !== toCurrency || isCrossAddress) && !isSupportXVMContract && !this.isLoopring && !util.isStarkNet',
        //   fromCurrency !== toCurrency, isCrossAddress, !util.isSupportXVMContract(), !this.isLoopring, !util.isStarkNet());
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

  const maxPrice = useMemo(() => {
    return transferDataState.selectMakerConfig?.fromChain?.maxPrice;
  }, [transferDataState.selectMakerConfig])

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
    let makerConfigs = isNewVersion ? config.makerConfigs : config.v1MakerConfigs // not new version
    return !!makerConfigs.find(item =>
      item.fromChain.id + '' === transferDataState.toChainID &&
      item.fromChain.symbol === transferDataState.toCurrency &&
      item.toChain.id + '' === transferDataState.fromChainID &&
      item.toChain.symbol === transferDataState.fromCurrency);
  }, [transferDataState.toChainID, transferDataState.toCurrency,
  transferDataState.fromChainID, transferDataState.fromCurrency])


  useEffect(() => {
    updateTransferInfo()
  }, [isWhiteWallet, isNewVersion])

  const queryParams = useMemo(() => {
    let query = getQuery()
    const { referer } = query;
    let { token, tokens, amount = '', fixed } = query;
    // amount = amount ? new BigNumber(amount) : '';
    tokens = !tokens ? [] : tokens.split(',');
    const makerConfigs: any = isNewVersion ? config.makerConfigs : config.v1MakerConfigs
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
    if (amount && new BigNumber(amount).comparedTo(('0')) > -1) {
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
  const refererUpper = useMemo(() => {
    const href = window.location.href
    const match = href.match(/referer=(\w*)/i)
    if (match?.[1]) {
      return match[1].toUpperCase()
    }
    return ''
  }, [])
  const isStarknet = useMemo(() => {
    return refererUpper === 'STARKNET'
  }, [refererUpper])
  const isSupportXVM = useMemo(() => {
    return isSupportXVMContract(transferDataState)
  }, [transferDataState])
  const isHiddenChangeAccount = useMemo(() => {
    return (!isNewVersion ||
      selectFromToken === selectToToken ||
      !isSupportXVM) &&
      !isLoopring
  }, [isNewVersion, selectFromToken, selectToToken, isSupportXVM, isLoopring])
  const crossAddressInputDisable = useMemo(() => {
    const toChainID = transferDataState.toChainID
    return (
      toChainID === '4' ||
      toChainID === '44' ||
      toChainID === '11' ||
      toChainID === '511'
    )
  }, [transferDataState.toChainID])

  const cu_chainName = useMemo(() => {
    return chainName(transferDataState.toChainID)
  }, [transferDataState.toChainID])



  let [exchangeToUsdPrice, setExchangeToUsdPrice] = useState<number>(0)
  const getExchangeToUsdPrice = async () => {
    const { selectMakerConfig } = transferDataState;
    if (!selectMakerConfig || !Object.keys(selectMakerConfig).length) return 0;
    const price = (await exchangeToUsd(1, selectMakerConfig.fromChain.symbol)).toNumber();
    if (price > 0) {
      return price;
    } else {
      return 0
    }
  }
  useEffect(() => {
    let flag = true
    const loadData = async () => {
      let res = await getExchangeToUsdPrice()
      if (!flag) return
      setExchangeToUsdPrice(res)
    }
    loadData()
    return () => {
      flag = false
    }


  }, [transferDataState.selectMakerConfig])

  // @ts-ignore 
  let { originGasCost, showSaveGas, gasTradingTotal, gasSavingMin, gasSavingMax, gasFeeToolTip, updateGasData } = useGasData({
    exchangeToUsdPrice
  })



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
    const makerConfigs = isNewVersion ? config.makerConfigs : config.v1MakerConfigs
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

    console.log('updateInfo', fromChainID, '---', oldFromChainID)

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
          // updateTransferGasFee(response);
          updateTransferDataState(response, 'gasFee')
          setGasCostLoading(false)
        })
        .catch((error) => {
          setGasCostLoading(false)
          console.warn('GetGasFeeError =', error);
        });
    }

    await refreshUserBalance()
    console.log('updateRoutes Before', transferDataState)
    // updateRoutes(oldFromChainID, oldToChainID);
  }

  useEffect(() => {
    console.log('useEffect---', transferDataState)
    updateRoutes()
  }, [transferDataState.selectMakerConfig])


  const updateRoutes = () => {
    const { selectMakerConfig } = transferDataState;
    // const { path, query } = this.$route;
    let path = location.pathname
    let query = getQuery()
    console.log('updateRoutes--start', transferDataState, query)
    const changeQuery = {};
    if (((selectMakerConfig || {}).fromChain || {}).name && query?.source !== ((selectMakerConfig || {}).fromChain || {}).name) {
      // @ts-ignore 
      changeQuery.source = selectMakerConfig.fromChain.name;
    }
    if (((selectMakerConfig || {}).toChain || {}).name && query?.dest !== ((selectMakerConfig || {}).toChain || {}).name) {
      // @ts-ignore 
      changeQuery.dest = selectMakerConfig.toChain.name;
    }
    console.log('updateRoutes-after--', changeQuery)
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

  const gasCost = () => {
    const { fromChainID, selectMakerConfig } = transferDataState;
    if(!selectMakerConfig || Object.keys(selectMakerConfig).length === 0){
      return 0
    }
    if (
      +fromChainID === 3 ||
      +fromChainID === 33 ||
      +fromChainID === 9 ||
      +fromChainID === 99
    ) {
      let transferGasFee = transferDataState.gasFee;
      const selectTokenRate = asyncGetExchangeToUsdRate(selectMakerConfig.fromChain.symbol);
      if (selectTokenRate > 0) {
        // switch to usd
        transferGasFee = transferGasFee / selectTokenRate;
      }
      return Math.ceil(Number(transferGasFee * 10)) / 10;
    }
    return (
      Math.ceil(transferDataState.gasFee * transferDataState.ethPrice * 10) /
      10
    );
  }



  const refreshGasSavingMin = () => {
    const temp_gasCost = gasCost();
    let savingValue = (new BigNumber(originGasCost).minus(
      new BigNumber(gasTradingTotal).multipliedBy(exchangeToUsdPrice)
    ).minus(temp_gasCost)).toNumber() || 0;


    if (savingValue < 0) {
      savingValue = 0;
    }
    let savingTokenName = '$';
    updateGasData(savingTokenName + savingValue.toFixed(2).toString(), 'gasSavingMin')
  }
  const refreshGasTradingTotal = () => {
    const { selectMakerConfig } = transferDataState;
    if (!selectMakerConfig) return "0.000000";
    let gasFee = new BigNumber(selectMakerConfig.tradingFee);
    updateGasData(gasFee.plus(orbiterTradingFee).toFixed(6), 'gasTradingTotal')
  }

  const refreshOrbiterTradingFee = () => {
    const { selectMakerConfig } = transferDataState;
    if (!selectMakerConfig) return;
    const { fromChain } = selectMakerConfig;
    let tradingFee = new BigNumber(
      transferValue ? transferValue : 0
    )
      .multipliedBy(new BigNumber(selectMakerConfig.gasFee))
      .dividedBy(new BigNumber(1000));
    let digit = orbiterCore.getDigitByPrecision(fromChain.decimals);
    setOrbiterTradingFee(tradingFee.decimalPlaces(digit, BigNumber.ROUND_UP).toNumber().toString())
  }
  const refreshGasSavingMax = () => {
    let savingValue = (new BigNumber(originGasCost).minus(new BigNumber(gasTradingTotal).multipliedBy(exchangeToUsdPrice))).toNumber() || 0;
    if (savingValue < 0) {
      savingValue = 0;
    }
    let savingTokenName = '$';
    updateGasData(savingTokenName + savingValue.toFixed(2).toString(), 'gasSavingMax');
  }

  const refreshGasFeeToolTip = () => {
    const { selectMakerConfig } = transferDataState;
    const gasFee = `<b>Fees using the native bridge costs around:</b><br />Gas Fee: $${originGasCost.toFixed(
      2
    )}<br />`;
    const tradingFee = ` <br /><b>Fees using Orbiter costs:</b><br />Trading Fee: $${(
      new BigNumber(orbiterTradingFee).multipliedBy(new BigNumber(exchangeToUsdPrice))
    ).toFixed(2)}`;
    const withholdingGasFee = `<br />Withholding Fee: $${selectMakerConfig
      ? (
        new BigNumber(selectMakerConfig.tradingFee).multipliedBy(new BigNumber(exchangeToUsdPrice)).toNumber()
      ).toFixed(2)
      : 0
      }`;
    const total = `<br /><br /><b>Total: $${(
      new BigNumber(gasTradingTotal).multipliedBy(new BigNumber(exchangeToUsdPrice))
    ).toFixed(2)}</b>`;

    let tempToolTip = gasFee + tradingFee + withholdingGasFee + total;
    updateGasData(tempToolTip, 'gasFeeToolTip')
  }


  const refreshGas = () => {
    refreshOrbiterTradingFee()
    refreshGasTradingTotal()
    refreshGasSavingMin()
    refreshGasSavingMax()
    refreshGasFeeToolTip()
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const specialProcessing = async (oldFromChainID, oldToChainID) => {
    const { fromChainID, toChainID } = transferDataState;
    if (toChainID !== oldToChainID && oldToChainID === 4 || oldToChainID === 44 || oldToChainID === 11 || oldToChainID === 511) {
      if (isCrossAddress) {
        setIsCrossAddress(false)
      }

      if (crossAddressReceipt) {
        updateInputData('', crossAddressReceipt)
      }
    }
    if (+fromChainID === 4 || +fromChainID === 44 || +toChainID === 4 || +toChainID === 44) {
      // const { starkNetIsConnect, starkNetAddress } = web3State.starkNet;
      // if (!starkNetIsConnect || !starkNetAddress) {
      //   await connectStarkNetWallet();
      //   if (!web3State.starkNet.starkIsConnected && !web3State.starkNet.starkNetAddress) {
      //     const makerConfig = makerConfigs[0];
      //     this.updateTransferInfo({ fromChainID: makerConfig.fromChain.id });
      //     return;
      //   }
      // }
      // if (toChainID === 4 || toChainID === 44) {
      //   isCrossAddress = true;
      //   this.crossAddressReceipt = web3State.starkNet.starkNetAddress;
      //   updateTransferExt({
      //     fromAddress: this.currentWalletAddress,
      //     ext: {
      //       type: '0x03',
      //       value: web3State.starkNet.starkNetAddress,
      //     }
      //   });
      // }
    }
    if (+fromChainID === 9 || +fromChainID === 99 || +toChainID === 9 || +toChainID === 99) {
      if (walletIsLogin) {
        // this.inputTransferValue();
        onInputTransferValue({
          target: {
            value: transferValue
          }
        })

      }
    }
    if (oldFromChainID !== fromChainID && (+fromChainID === 9 || +fromChainID === 99)) {
      // isCrossAddress = true;
      setIsCrossAddress(true)
    }
    if (toChainID !== oldToChainID && (+toChainID === 11 || +toChainID === 511)) {
      if (!isCrossAddress) {
        setIsCrossAddress(true)
      }
      // isCrossAddress = true;
      if (crossAddressReceipt !== account) {
        // setTimeout(() => {
        //   self.crossAddressReceipt = account;
        // }, 500);
        updateInputData(account || '', 'crossAddressReceipt')
      }
    }


  }

  const updateOriginGasCost = async () => {

    // this.originGasLoading = true
    updateLoadingData(true, 'originGasLoading')
    const { fromChainID, toChainID, fromCurrency } = transferDataState

    if (!fromChainID || !toChainID) {
      return
    }
    try {
      let temp_originGasCost = await transferOrginGasUsd(
        fromChainID,
        toChainID,
        fromCurrency !== 'ETH'
      )
      updateGasData(temp_originGasCost, 'originGasCost')
      refreshGas()
    } catch (error) {
      console.warn('updateOriginGasCost error =', error)
      // this.$notify.error({
      //   title: `GetOrginGasFeeError`,
      //   desc: error,
      //   duration: 3000,
      // })
    } finally {
      updateLoadingData(false, 'originGasLoading')
    }
  }

  const settingfromMax = () => {
    if(loadingDats.fromBalanceLoading){
      return 
    }
    if (!walletIsLogin) {
      // this.transferValue = '0'
      updateInputData('0', 'transferValue')
      return
    }
    const { selectMakerConfig } = transferDataState
    if (!selectMakerConfig) return
    // util.log('userMaxPrice', this.userMaxPrice)
    // this.transferValue = this.userMaxPrice
    updateInputData(userMaxPrice, 'transferValue')
    updateTransferInfo()
  }

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

  const sendTransfer = async () => {
    console.log('sendTransfer---', transferDataState, sendBtnInfo)
    if (curWalletProvider.isBitKeep) {
      showMessage('Bitkeep is not supported and please try another wallet.', 'error')
      return
    }
    if (sendBtnInfo && sendBtnInfo.disabled === true) {
      return
    }
    if (!(await isLegalAddress(transferDataState, account))) {
      showMessage(`Contract address is not supported, please use EVM address.`, 'error')
      return
    }
    const { fromChainID, toChainID, fromCurrency, selectMakerConfig } =
      transferDataState
      if(!selectMakerConfig || Object.keys(selectMakerConfig).length === 0){
        return 
      }
    if (configData.banList&& configData.banList.length) {
      for (const ban of configData.banList) {
        if (ban.source && ban.dest) {
          if (fromChainID === ban.source && toChainID === ban.dest) {
            showMessage(`The ${selectMakerConfig.fromChain.name}-${selectMakerConfig.toChain.name} network transaction maintenance, please try again later`, 'error')
            return
          }
          continue
        }
        if (ban.source) {
          if (fromChainID === ban.source) {
            showMessage(`The ${selectMakerConfig.fromChain.name} network transaction maintenance, please try again later`, 'error')
            return
          }
          continue
        }
        if (ban.dest) {
          if (toChainID === ban.dest) {
            showMessage(`The ${selectMakerConfig.toChain.name} network transaction maintenance, please try again later`, 'error')
            return
          }
        }
      }
    }
    // if unlogin  login first


    {
      let checkPriceRs = /^(?!0$|0\.$|0\.0$|0\.00$)(?![1-9]\d*\.$)(0?|[1-9]\d*)(\.\d{0,6})?$/.test(transferValue)
      if (!checkPriceRs) {
        showMessage(`The format of input amount is incorrect`, 'error')
        return
      }
      if (fromBalance === null) {
        showMessage(`Waiting for account balance to be obtained`, 'error')
        return
      }
      if (!selectMakerConfig) return
      if (!account) {
        return
      }
      const { fromChain } = selectMakerConfig
      let nonce = await nonceUtil.getNonce(
        fromChain.id,
        fromChain.tokenAddress,
        fromChain.symbol,
        // @ts-ignore 
        account, //compatibleGlobalWalletConf.walletPayload.walletAddress
        getAccountStorageID
      )
      // if (toChainID === 4 || toChainID === 44) {
      //   this.$notify.error({
      //     title: `The StarkNet network transaction maintenance, please try again later`,
      //     duration: 6000,
      //   });
      //   return;
      // }
      if (toChainID === '4' && fromChain.symbol == 'DAI') {
        showMessage(`The StarkNet network transaction maintenance, please try again later`, 'error')
        return
      }

      if (nonce > 8999) {
        showMessage(`Address with the nonce over 9000 are not supported by Orbiter`, 'error')
        return
      }

      if (
        !transferValue ||
        new BigNumber(transferValue).comparedTo(
          new BigNumber(userMaxPrice)
        ) > 0 ||
        new BigNumber(transferValue).comparedTo(
          new BigNumber(userMinPrice)
        ) < 0
      ) {
        // TAG: prod test
        // this.$notify.error({
        //   title: `Orbiter can only support minimum of ${ this.userMinPrice } and maximum of ${ this.maxPrice } ${ fromCurrency } on transfers.`,
        //   duration: 3000,
        // });
        // return;
      }

      // Ensure immutablex's registered
      if (toChainID === '8' || toChainID === '88') {
        const imxHelper = new IMXHelper(+toChainID)
        const walletAddress = account || ''
        //compatibleGlobalWalletConf.walletPayload.walletAddress
        walletAddress && (await imxHelper.ensureUser(walletAddress, curWalletProvider))
      }

      if (
        fromChainID === '4' ||
        fromChainID === '44' ||
        toChainID === '4' ||
        toChainID === '44'
      ) {
        // let { starkChain } = web3State.starkNet
        // starkChain = +starkChain ? +starkChain : starkChain
        // if (!starkChain || starkChain === 'unlogin') {
        //   util.showMessage('please connect Starknet Wallet', 'error')
        //   return
        // }

        // if (
        //   (fromChainID === 4 || toChainID === 4) &&
        //   (starkChain === 44 || starkChain === 'localhost')
        // ) {
        //   util.showMessage(
        //     'please switch Starknet Wallet to mainnet',
        //     'error'
        //   )
        //   return
        // }
        // if (
        //   (fromChainID === 44 || toChainID === 44) &&
        //   (starkChain === 4 || starkChain === 'localhost')
        // ) {
        //   util.showMessage(
        //     'please switch Starknet Wallet to testNet',
        //     'error'
        //   )
        //   return
        // }
      } else {
        let temp_networkID = (chainId)//+compatibleGlobalWalletConf.walletPayload.networkId 
        if (typeof chainId === 'undefined') {
          return
        }
        if (
          temp_networkID !==
          getMetaMaskNetworkId(+fromChainID)
        ) {
          if (userWalletType === 'MetaMask') {
            try {
              if (!(await ensureWalletNetwork(+fromChainID, connector))) {
                return
              }
            } catch (err) {
              // @ts-ignore 
              showMessage(err.message, 'error')
              return
            }
          } else {
            let compatibleGlobalWalletConf = await getCompatibleGlobalWalletConf()
            // @ts-ignore 
            const matchSwitchChainDispatcher = walletDispatchersOnSwitchChain[compatibleGlobalWalletConf.walletType]
            if (matchSwitchChainDispatcher) {
              // const successCallback = () =>  props.onChangeState('2')
              matchSwitchChainDispatcher(
                compatibleGlobalWalletConf.walletPayload.provider,
                () => {
                  props.onChangeState('2')
                }
              )
              return
            }
          }
        }
      }
      const chainInfo = getChainInfoByChainId(fromChainID)
      const toAddressAll = (
        isExecuteXVMContract(transferDataState)
          ? chainInfo.xvmList[0]
          : selectMakerConfig.recipient
      ).toLowerCase()
      const senderAddress = (
        isExecuteXVMContract(transferDataState)
          ? chainInfo.xvmList[0]
          : selectMakerConfig.sender
      ).toLowerCase()
      const toAddress = shortAddress(toAddressAll)
      const senderShortAddress = shortAddress(senderAddress)
      const { isCrossAddress, crossAddressReceipt } = transferDataState
      const walletAddress = (
        isCrossAddress || toChainID === '44' || toChainID === '4'
          ? (crossAddressReceipt || '')
          : (account || '')
      ).toLowerCase()
      // sendTransfer
      console.log('orbiter transfer sendTransfer', transferValue, selectMakerConfig)
      dispatch(updateConfirmRouteDescInfo([
        {
          no: 1,
          from:
            new BigNumber(transferValue||'0').plus(
              new BigNumber(selectMakerConfig.tradingFee)
            ) + (fromCurrency || ''),
          to: toAddress,
          fromTip: '',
          toTip: toAddressAll,
          icon: isExecuteXVMContract(transferDataState) ? 'contract' : 'wallet',
        },
        {
          no: 2,
          from: senderShortAddress,
          to: shortAddress(walletAddress),
          fromTip: senderAddress,
          toTip: walletAddress,
          icon: 'wallet',
        },
      ]))

      // this.$emit('stateChanged', '2')
      props.onChangeState('2')
    }
  }

  const openApiFilter = async () => {
    try {
      let response = await fetch(`${process.env.REACT_APP_OPEN_API_URL}/frontend/net`);
      let res = await response.json()
      console.log('openApiFilter--- res=', res, configData.cron)
      let cron = configData.cron
      if (!cron) {
        cron = setInterval(async () => {
          await openApiFilter()
        }, 3000000)
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
  const updateETHPriceI = async () => {
    getTokenConvertUsd('ETH')
      .then((response) => updateTransferDataState(response, 'ethPrice'))
      .catch((error) => console.warn('GetETHPriceError =', error));
  }


  const initData = () => {
    console.log('initData---')
    openApiFilter()
    updateTransferInfo()
    updateETHPriceI()
    updateInputData(queryParams.amount, 'transferValue')
    updateTransferDataState(isCrossAddress, 'isCrossAddress')
    updateTransferDataState(crossAddressReceipt, 'crossAddressReceipt')
  }

  useEffect(() => {
    if (!isInit) {
      initData()
      setIsInit(true)
    }
    return () => {
      !!configData.cron && clearInterval(configData.cron)
      setConfigData({
        cron: null,
        banList: []
      })
    }
  }, [isInit])

  const fromTransferPlaceholder = useMemo(() => {
    return userMinPrice
      ? new BigNumber(userMinPrice).comparedTo(new BigNumber(fromBalance)) === 1 || new BigNumber(userMinPrice).comparedTo(new BigNumber(userMaxPrice)) > -1
        ? `at least ${userMinPrice}`
        : `${userMinPrice}~${userMaxPrice}`
      : '0'
  }, [userMinPrice, fromBalance, userMaxPrice])


  const onChangeTransfer = () => {
    const { fromChainID, toChainID, fromCurrency, toCurrency } = transferDataState
    updateTransferDataState(toChainID, 'fromChainID')
    updateTransferDataState(fromChainID, 'toChainID')
    updateInputData(toCurrency || '', 'from')
    updateInputData(fromCurrency || '', 'to')
  }

  const onChangeFromChain = (item: any) => {
    console.log('onChangeFromChain--', item)
    if (item.localID + '' !== transferDataState.fromChainID) {
      updateTransferDataState(item.localID + '', 'fromChainID')
    }
  }
  const onChangeToChain = (item: any) => {
    console.log('onChangeToChain--', item)
    if (item.localID + '' !== transferDataState.toChainID) {
      updateTransferDataState(item.localID + '', 'toChainID')
    }
  }
  return (<div className="transfer-box">
    <Row>
      <Text fontSize={20} fontWeight={500}>Token</Text>
      {
        !isNewVersion && (<div>
          <ObSelect
            datas={ctData.fromTokenList}
            value={selectFromToken}
            onChange={onChangeSelectFromToken} />
        </div>)
      }

    </Row>
    <div className="from-area">
      <div className="topItem">
        <div className="left">From</div>
        {
          walletIsLogin && (
            <div className="right">
              Balance: {loadingDats.fromBalanceLoading ? <Loader></Loader> : (<span>{fromBalance}</span>)}
            </div>
          )
        }
      </div>
      <div className="bottomItem">
        <div className="left" onClick={() => updateInputData(true, 'isShowFromSel')}>
          <StyledSvgIcon
            iconName={fromChainObj.icon}
          />
          <span>{fromChainObj.name}</span>
          <StyledDropDown selected={true}></StyledDropDown>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '30px'
        }}>
          <input
            style={{ minWidth: '50px' }}
            type="text"
            value={transferValue}
            onChange={onInputTransferValue}
            className="right"
            placeholder={fromTransferPlaceholder}
          />
          
          <button className={`maxBtn ${loadingDats.fromBalanceLoading?'disable':''}`} onClick={settingfromMax}>Max</button>
          {
            isNewVersion && (<div>
              <ObSelect
                datas={ctData.fromTokenList}
                value={selectFromToken}
                onChange={onChangeSelectFromToken} />
            </div>)
          }
        </div>
      </div>

    </div>
    {/* {isShowExchangeIcon && <AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
      <span onClick={onChangeTransfer}>
        <StyledSvgIcon
          iconName={'exchange'}
          className="exchange-icon"
        />
      </span>
    </AutoRow>} */}

    {
      isShowExchangeIcon && (<AutoRow justify={'center'} style={{ padding: '0 1rem' }}>
        <ArrowWrapper clickable onClick={onChangeTransfer}>
          <ArrowDown
            size="16"
            color={transferValue ? theme.primary1 : theme.text2}
          />
          <ArrowUp
            size="16"
            color={transferValue ? theme.primary1 : theme.text2}
          />
        </ArrowWrapper>
      </AutoRow>)
    }

    <CommonDialog
      isShow={isShowFromSel}
      datas={ctData.fromChainIdList}
      onChange={onChangeFromChain}
      onCancel={() => updateInputData(false, 'isShowFromSel')}
    />
    <CommonDialog
      isShow={isShowToSel}
      datas={ctData.toChainIdList}
      onChange={onChangeToChain}
      onCancel={() => updateInputData(false, 'isShowToSel')}
    />


    <div className="to-area">
      <div className="topItem">
        <div className="left">To</div>
        {
          walletIsLogin && (
            <div className="right">
              Balance: {loadingDats.toBalanceLoading ? <Loader></Loader> : (<span>{toBalance}</span>)}
            </div>
          )
        }
      </div>
      <div className="bottomItem">
        <div className="left" onClick={() => updateInputData(true, 'isShowToSel')}>
          <StyledSvgIcon
            iconName={toChainObj.icon}
          />
          <span>{toChainObj.name}</span>
          <StyledDropDown selected={true}></StyledDropDown>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '30px'
          }}
          className="right">
          {
            isNewVersion && ctData.toTokenList && (<div style={{ marginLeft: '4px' }}>
              <ObSelect
                datas={ctData.toTokenList}
                value={selectToToken}
                onChange={onChangeSelectToToken} />
            </div>)
          }
          <QuestionHelper text={toValueToolTip} />
          <div className="right-value">{toValue}</div>
        </div>
      </div>
    </div>

    {
      isStarknet && (<div
        style={{
          fontSize: '12px',
          color: '#78797d',
          marginTop: '10px',
          textAlign: 'left'
        }}>
        <TipSvgIcon
          iconName="tips"
        ></TipSvgIcon>
        Centralized transfer is provided currently and trustless transfer will be
        launched soon.
        <a
          style={{ textDecoration: 'underline' }}
          href="https://docs.orbiter.finance/"
          target="__blank"
        >More</a>

      </div>)
    }

    {
      !isHiddenChangeAccount &&
      (<div>
        <label
          style={{
            textAlign: 'left',
            marginTop: '10px',
            paddingLeft: '20px',
            fontSize: '16px'
          }
          }
        >
          <input
            type="checkbox"
            style={{ marginRight: '5px' }}
            id="checkbox"
            disabled={crossAddressInputDisable}
            checked={isCrossAddress}
            onChange={e => setIsCrossAddress(!isCrossAddress)}
          />
          <span> Change Account </span>
        </label>
        {
          isCrossAddress && (
            <div
              className="cross-addr-box to-area"
              style={{ marginTop: '10px' }}
              v-if="isCrossAddress"
            >
              <div data-v-59545920="" className="topItem">
                <div className="left">Recipient's Address</div>
              </div>
              <input
                type="text"
                value={crossAddressReceipt}
                onChange={(e) => updateInputData(e.target.value, 'crossAddressReceipt')}
                v-model="crossAddressReceipt"
                placeholder={`Recipient's ${cu_chainName} Address`}
              />
            </div>
          )
        }

      </div>)
    }

    <div style={{height:'30px'}}></div>

    <SubmitBtn
      onClick={sendTransfer}
      btnInfo={sendBtnInfo}
      other={
        {
          className: 'tbtn',
          style: {
            borderRadius: '40px',
          }
        }
      } />

    <TransferInfoBox
      isCurrentAddress={isCrossAddress}
      isErrorAddres={isErrorAddress}
      isShowUnreachMinInfo={isShowExchangeIcon}
      isShowMax={isShowMax}
      showSaveGas={showSaveGas}
      maxPrice={maxPrice}
      selectFromToken={selectFromToken}
      originGasLoading={loadingDats.originGasLoading}
      gasSavingMax={gasSavingMax}
      gasSavingMin={gasSavingMin}
      gasFeeToolTip={gasFeeToolTip}
      timeSpenLoading={loadingDats.timeSpenLoading}
      timeSpent={timeSpent}
      timeSpenToolTip={timeSpenToolTip}
      saveTimeLoading={loadingDats.saveTimeLoading}
      transferSavingTime={transferSavingTime}

    />




  </div>)
}