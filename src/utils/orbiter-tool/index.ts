import Web3 from 'web3'
import { Eth } from 'web3-eth';
import config from '../orbiter-config'
import { TransferDataStateType } from '../../components/Orbiter/bridge'
import { Coin_ABI } from '../orbiter-constant/contract';
import orbiterEnv from '../orbiter-env';
import { notification } from 'antd'
import 'antd/es/notification/style/index.css'
type WalletPayLoadType = {
  walletAddress: string,
  networkId: string,
  provider: any
}

export type GlobalSelectWalletConfType = {
  walletType: string,
  walletPayload: WalletPayLoadType,
  loginSuccess: false
}

export const getChainInfoByChainId = (chainId: string|number) => {
  const info = config.chainConfig.find(
    (item) => +item.internalId === +chainId
  )
  if (!info) return null
  const chainInfo = JSON.parse(JSON.stringify(info))
  const localWsRpc = process.env[`VUE_APP_WP_${chainId}`]
  if (localWsRpc) {
    chainInfo.rpc = chainInfo.rpc || []
    chainInfo.rpc.push(localWsRpc)
  }
  const localHttpRpc = process.env[`VUE_APP_HP_${chainId}`]
  if (localHttpRpc) {
    chainInfo.rpc = chainInfo.rpc || []
    chainInfo.rpc.push(localHttpRpc)
  }
  return chainInfo
}
type TokenIconsType = {
  ETH: any,
  USDC: any,
  USDT: any,
  TUSD: any,
  MCO: any,
  METIS: any,
  ZKS: any, 
  LRC:  any,
  BNB:  any,
  DAI:  any,
  MATIC:  any,
}
export const getTokenIcon = (token: string) => {
  if (!token) {
    return ''
  }

  token = token.toUpperCase()
  const tokenIcons:TokenIconsType = {
    ETH: require('../../assets/images/logo/ethlogo.svg'),
    USDC: require('../../assets/images/logo/usdclogo.png'),
    USDT: require('../../assets/images/logo/usdtlogo.png'),
    TUSD: require('../../assets/images/logo/tusdlogo.png'),
    MCO: require('../../assets/images/logo/mcologo.png'),
    METIS: require('../../assets/images/logo/metislogo.png'),
    ZKS: require('../../assets/images/logo/zkslogo.png'),
    LRC: require('../../assets/images/logo/lrclogo.png'),
    BNB: require('../../assets/images/logo/bnblogo.png'),
    DAI: require('../../assets/images/logo/dailogo.png'),
    MATIC: require('../../assets/images/logo/maticlogo.png'),
  }
  return tokenIcons[token as keyof TokenIconsType] || null
}

/**
* @param {string} tokenAddress when tokenAddress=/^0x0+$/i,
* @returns {boolean}
*/
export function isEthTokenAddress(chainId: number, tokenAddress: string) {
 const chainInfo = getChainInfoByChainId(chainId)
 if (chainInfo) {
   // main coin
   if (
     equalsIgnoreCase(chainInfo.nativeCurrency?.address, tokenAddress)
   ) {
     return true
   }
   // ERC20
   // @ts-ignore
   if (chainInfo.tokens.find((item) =>
       equalsIgnoreCase(item.address, tokenAddress)
     )
   ) {
     return false
   }
 }
 return /^0x0+$/i.test(tokenAddress)
}
export function equalsIgnoreCase(value1: any, value2: any) {
  if (typeof value1 !== 'string' || typeof value2 !== 'string') {
    return false
  }
  return value1.toUpperCase() === value2.toUpperCase()
}

export function isWhite(transferDataState?: TransferDataStateType) {

  // return !(
  //   config.whiteList.length &&
  //   !config.whiteList.find((item) =>
  //     equalsIgnoreCase(
  //       item,
  //       compatibleGlobalWalletConf.value.walletPayload.walletAddress
  //     )
  //   )
  // )
  return false
}
type Web3ParamsType = string | {
  from: string,
  to: string
} | {
  from: string,
  to: string,
  value: any
} | undefined
export function requestWeb3(chainId:number, method:string, args?: Web3ParamsType): Promise<number|string|any> {
  const rpcList = getRpcList(chainId)
  return new Promise(async (resolve, reject) => {
    let result
    if (rpcList && rpcList.length > 0) {
      for (const url of rpcList) {
        if (!url || url === '') {
          continue
        }
        try {
          const web3 = new Web3(url)
          result = await web3.eth[method as keyof Eth ](args)
          setStableRpc(chainId, url, 'success')
          resolve(result)
          break
        } catch (error) {
          setStableRpc(chainId, '', 'error')
          // this.log(
          //   'request rpc error:',
          //   url,
          //   error.message,
          //   chainId,
          //   method,
          //   args
          // )
        }
      }
    }
    if (!result) {
      reject(`Reuqest Web3 RPC ERROR：${chainId}-${method}-${args}`)
    }
  })
}
export function getWeb3TokenBalance(chainId:number, userAddress:string, tokenAddress:string) {
  const rpcList = getRpcList(chainId)
  return new Promise(async (resolve, reject) => {
    let result
    if (rpcList && rpcList.length > 0) {
      for (const url of rpcList) {
        try {
          const web3 = new Web3(url)
          // result = await web3.eth[method](...args)
          const tokenContract = new web3.eth.Contract(Coin_ABI, tokenAddress)
          if (!tokenContract) {
            console.warn('getLocalCoinContract_ecourseContractInstance')
            continue
          }
          const result = await tokenContract.methods
            .balanceOf(userAddress)
            .call()
          setStableRpc(chainId, url, 'success')
          resolve(result)
          break
        } catch (error) {
          // this.log(
          //   'Request Web3 token Balance rpc error:',
          //   url,
          //   error.message,
          //   chainId
          // )
        }
      }
    }

    if (!result) {
      reject(`Request Web3 TokenBalance RPC error${chainId}`)
    }
  })
}



export function isStarkNet(transferDataState: TransferDataStateType) {
  const { fromChainID, toChainID } = transferDataState
  return (
    fromChainID + '' === '4' ||
    fromChainID + '' === '44' ||
    toChainID + '' === '4' ||
    toChainID + '' === '44'
  )
}

export const isSupportXVMContract = (transferDataState: TransferDataStateType) => {
  const { fromChainID } = transferDataState
  if (!isWhite(transferDataState)) {
    return false
  }
  if (isStarkNet(transferDataState)) {
    return false
  }
  const chainInfo = getChainInfoByChainId(fromChainID)
  return chainInfo?.xvmList && chainInfo.xvmList.length
}

export const isExecuteXVMContract = (transferDataState: TransferDataStateType) => {
  const { fromCurrency, toCurrency, isCrossAddress } = transferDataState
  return !!(
    isSupportXVMContract(transferDataState) &&
    (fromCurrency !== toCurrency || isCrossAddress)
  )
}
export function getMetaMaskNetworkId(chainId:number) {
  // @ts-ignore 
  return orbiterEnv.metaMaskNetworkId[chainId]
}
export function toHex(num:number) {
  return '0x' + Number(num).toString(16)
}
 /**
* @param {number} chainId
*/
export async function ensureWalletNetwork(chainId: number, connector:any) {
 const maskNetworkId = getMetaMaskNetworkId(chainId)
 if (!maskNetworkId) {
   return
 }
 const switchParams = {
   chainId: toHex(maskNetworkId),
 }
 try {
   let provider = await connector.getProvider()//compatibleGlobalWalletConf.value.walletPayload.provider
   await provider.request({
     method: 'wallet_switchEthereumChain',
     params: [switchParams],
   })
   return true
 } catch (error) {
  // @ts-ignore 
   if (error?.code === 4902) {
     await addEthereumChain(chainId, connector)
   } else {
     console.error(error)
    //  @ts-ignore 
     showMessage(error.message, 'error')
   }
   return false
 }
}

export function showMessage(message: string, type: string) {
  const _type = type || 'success'
  // @ts-ignore 
  notification[_type]({
    message: ``,
    description: message,
  });
  // Notification[_type]({
  //   message,
  //   dangerouslyUseHTMLString: true,
  //   duration: 3000,
  // })
}
export function getChainInfoByNetworkId(networkId: string|number) {
  const info = config.chainConfig.find(
    (item) => +item.networkId === +networkId
  )
  if (!info) return null
  return JSON.parse(JSON.stringify(info))
}
export function netWorkName(networkId: string|number) {
  return getChainInfoByNetworkId(networkId)?.name || 'unknown'
}
export function chainName(chainId:string|number) {
  return getChainInfoByChainId(chainId)?.name || 'unknown'
}
export function chainNetWorkId(chainId: string|number) {
  return getChainInfoByChainId(chainId)?.chainId
}
export async function  addEthereumChain(chainId:number, connector: any) {
  const chainInfo = getChainInfoByChainId(chainId)
  const maskNetworkId = getMetaMaskNetworkId(chainId)
  const params = {
    chainId: toHex(maskNetworkId), // A 0x-prefixed hexadecimal string
    chainName: chainInfo.name,
    nativeCurrency: {
      name: chainInfo.nativeCurrency.name,
      symbol: chainInfo.nativeCurrency.symbol, // 2-6 characters long
      decimals: chainInfo.nativeCurrency.decimals,
    },
    rpcUrls: chainInfo.rpc,
    // @ts-ignore 
    blockExplorerUrls: [orbiterEnv.networkUrl[chainId]],
  }
  try {
    let provider = await connector.getProvider()
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    })
  } catch (error) {
    console.error(error)
    // @ts-ignore 
    showMessage(error.message, 'error')
  }
}

export function getRpcList(chainId: string|number) {
  const chainInfo = getChainInfoByChainId(chainId)
  const rpcList = (chainInfo?.rpc || []).sort(function () {
    return 0.5 - Math.random()
  })
  const storageRpc = localStorage.getItem(`${ chainId }_stable_rpc`)||'{}';
  try {
    const stableRpc = JSON.parse(storageRpc);
    if (stableRpc.rpc && stableRpc.expireTime > new Date().valueOf()) {
      return [stableRpc.rpc, ...rpcList];
    }
  } catch (e) {
  }
  return rpcList
}
export function setStableRpc(chainId: any, rpc:any, msg: any) {
  console.log(chainId, rpc, msg || '', 'success')
  localStorage.setItem(`${ chainId }_stable_rpc`, JSON.stringify({ rpc, expireTime: new Date().valueOf() + 60 * 1000 }));
}
export function stableRpc(chainId: string|number) {
  const rpcList = getRpcList(chainId)
  if (rpcList.length) {
    return rpcList[0]
  }
  console.error(`${chainId} Unable to find stable rpc node`)
  return null
}
type QueryParser = UrlParams | string | number | boolean | null;
interface UrlParams {
  [key: string]: QueryParser;
}
export const objParseQuery = (
  param: any,
  key?: string,
  encode?: null | boolean
):string => {
  if (param === null) return "";
  let paramStr = "";
  let t = typeof param;
  if (t === "string" || t === "number" || t === "boolean") {
    paramStr +=
      "&" +
      key +
      "=" +
      (encode == null || encode ? encodeURIComponent(param as string) : param);
  } else {
    for (let i in param as UrlParams) {
      let k =
        key === null || typeof key === 'undefined'? i : key + (param instanceof Array ? `[${i}]` : `.${i}`);
      let temp = param[i] as QueryParser;
      paramStr += objParseQuery(temp, k, encode);
    }
  }
  return paramStr;
}
export const getQuery = (url = window.location.href) => {
  const arrList = url.split("#");

  let paramData:any = {};

  arrList.forEach((strItem) => {
    let str = strItem; // 取得整个地址栏
    const num = str.indexOf("?");
    str = str.substr(num + 1); // 取得所有参数   stringvar.substr(start [, length ]
    if (num > -1) {
      const arr = str.split("&"); // 各个参数放到数组里
      for (let i = 0; i < arr.length; i += 1) {
        const n = arr[i].indexOf("=");
        if (n > 0) {
          // "&key=value" 键值对
          const key = arr[i].substring(0, n);
          const value = arr[i].substr(n + 1);
          paramData[key] = decodeURIComponent(value);
        } else {
          // "&key" 仅标识
          const key = arr[i];
          if (key !== "") paramData[key] = "";
        }
      }
    }
  });

  return paramData;
}

