import chainMain from './chain.json'
import chainTest from './chainTest.json'


export type MakerConfigType = {
  id: string,
  makerId: string,
  ebcId: string,
  slippage: number,
  recipient: string,
  sender: string,
  tradingFee: number,
  gasFee: number,
  fromChain: {
    id: number,
    name: string,
    tokenAddress: string,
    symbol: string,
    decimals: number,
    minPrice: number,
    maxPrice: number,
  },
  toChain: {
    id: number,
    name: string,
    tokenAddress: string,
    symbol: string,
    decimals: number,
  },
  times: [number, number],
  crossAddress: {
    recipient: string,
    sender: string,
    tradingFee: number,
    gasFee: number,
  },
}
const isProd = () => process.env.REACT_APP_ORBITER_ENV === 'production'

const getChainConfig = () => {
  const chain = isProd() ? chainMain : chainTest;
  return [...chain].map((item) => {
    if (process.env[`REACT_APP_CHAIN_API_KEY_${item.internalId}`]) {
      item.api = item.api || {}
      item.api.key = process.env[`REACT_APP_CHAIN_API_KEY_${item.internalId}`] || ''
    }
    return item
  })
}
const makerNum: number = parseInt(Math.random() * 2 + '') + 1;
const maker = require(`./${isProd() ? `maker-${makerNum}.json` : `makerTest-${makerNum}.json`}`);

const chainConfig = getChainConfig()
const whiteList: any[] = []
const convertMakerConfig = () => {
  const makerMap = maker
  const chainList = chainConfig
  const configs = []
  const tempv1makerconfigs = []
  const getChainTokenList = (chain: any) => {
    return chain.nativeCurrency
      ? [chain.nativeCurrency, ...chain.tokens]
      : [...chain.tokens]
  }
  for (const chainIdPair in makerMap) {
    if (!makerMap.hasOwnProperty(chainIdPair)) continue
    const symbolPairMap = makerMap[chainIdPair]
    const [fromChainId, toChainId] = chainIdPair.split('-')
    // Temporary offline configuration
    const offlineList = [12, 13];
    if (
      offlineList.find(item => +item === +fromChainId) ||
      offlineList.find(item => +item === +toChainId)) {
      continue;
    }
    const c1Chain = chainList.find((item) => +item.internalId === +fromChainId)
    const c2Chain = chainList.find((item) => +item.internalId === +toChainId)
    if (!c1Chain || !c2Chain) continue
    for (const symbolPair in symbolPairMap) {
      if (!symbolPairMap.hasOwnProperty(symbolPair)) continue
      const makerData = symbolPairMap[symbolPair]
      const [fromChainSymbol, toChainSymbol] = symbolPair.split('-')
      const fromTokenList = getChainTokenList(c1Chain)
      const toTokenList = getChainTokenList(c2Chain)
      const fromToken = fromTokenList.find(
        (item) => item.symbol === fromChainSymbol
      )
      const toToken = toTokenList.find((item) => item.symbol === toChainSymbol)
      if (!fromToken || !toToken) continue
      const config:MakerConfigType = {
        id: '',
        makerId: '',
        ebcId: '',
        slippage: makerData.slippage || 0,
        recipient: makerData.makerAddress,
        sender: makerData.sender,
        tradingFee: makerData.tradingFee,
        gasFee: makerData.gasFee,
        fromChain: {
          id: +fromChainId,
          name: c1Chain.name,
          tokenAddress: fromToken.address,
          symbol: fromChainSymbol,
          decimals: fromToken.decimals,
          minPrice: makerData.minPrice,
          maxPrice: makerData.maxPrice,
        },
        toChain: {
          id: +toChainId,
          name: c2Chain.name,
          tokenAddress: toToken.address,
          symbol: toChainSymbol,
          decimals: toToken.decimals,
        },
        times: [makerData.startTime, makerData.endTime],
        crossAddress: {
          recipient: makerData.crossAddress?.makerAddress,
          sender: makerData.crossAddress?.sender,
          tradingFee: makerData.crossAddress?.tradingFee,
          gasFee: makerData.crossAddress?.gasFee,
        },
      }
      // handle makerConfigs
      configs.push(config)
      // v1 maker configs
      if (fromChainSymbol === toChainSymbol) {
        tempv1makerconfigs.push(config)
      }
    }
  }
  return {
    makerConfigs: configs,
    v1MakerConfigs: tempv1makerconfigs
  }

}


const { makerConfigs = [], v1MakerConfigs = [] } = convertMakerConfig()


export default {
  chainConfig,
  whiteList,
  makerConfigs,
  v1MakerConfigs
}