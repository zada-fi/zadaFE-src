import {
  COINBASE,
  METAMASK,
  BRAVE,
  BLOCKWALLET,
  TALLYHO,
  LOCALLOGINDATA,
  IM_TOKEN_APP,
  METAMASK_APP,
  TOKEN_POCKET_APP,
  BIT_KEEP_APP,
  COINBASE_APP, OKXWALLET, BRAVE_APP,
} from './constants';
import {
  updateGlobalSelectWalletConf,
  globalSelectWalletConf,
} from './walletsCoreData'
export let isBraveWallet = false;
export const MOBILE_APP = 'mobileApp' // mobile env
export const PC_BROWSER = 'pcBrowser' // pc browser env
// TODO: should check by code
// export const isWebSimulation = false
// if u r in a mobile webview environment, return true, otherwise return false
export const isMobileEnv = () => {
  // @ts-ignore 
  if (typeof window.okxwallet !== 'undefined') {
    return false;
  }

  // if (isWebSimulation) return false
  return isMobileDevice()
}

export const isMobileDevice = () => {
  const regex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return regex.test(navigator.userAgent)
}

export function setIsBraveWallet(status: boolean) {
  isBraveWallet = status;
}

// update global wallet login status
export const modifyLocalLoginInfo = (loginInfo = {}) => {
  localStorage.setItem(LOCALLOGINDATA, JSON.stringify(loginInfo))
}

export const getCurrentLoginInfoFromLocalStorage = () => {
  const loginInfoStr = localStorage.getItem(LOCALLOGINDATA)
  if (loginInfoStr) return JSON.parse(loginInfoStr)
  return loginInfoStr
}

export const removeCurrentLoginInfoFromLocalStorage = () => {
  modifyLocalLoginInfo()
}

// hof for interrupt wallet
// @ts-ignore 
export const withPerformInterruptWallet = (fn) => {
  // @ts-ignore 
  return (...args) => {
    // 1. clear wallet login information saved in localStorage
    removeCurrentLoginInfoFromLocalStorage()
    // 2. for old code, do extra processing for metamask, will be removed later
    // @ts-ignore 
    localStorage.setItem('localLogin', false)
    // 3. clear wallet login information saved in global responsive variable
    updateGlobalSelectWalletConf()
    // 4. if u have any else to process
    return fn(...args)
  }
}

// wallet type & ethereum fit checker
export const ethereumWalletTypeFitChecker = (walletType: string, ethereum:any) => {
  if (!walletType || !ethereum) return false
  if (walletType === METAMASK)
    return ethereum.isMetaMask && !isBraveWallet
  if (walletType === TALLYHO) return ethereum.isTally
  if (walletType === COINBASE) return ethereum.isCoinbaseWallet
  if (walletType === BRAVE) return isBraveWallet
  if (walletType === BRAVE_APP) return isBraveWallet
  if (walletType === IM_TOKEN_APP) return ethereum.isImToken
  if (walletType === METAMASK_APP) return ethereum.isMetaMask
  if (walletType === TOKEN_POCKET_APP) return ethereum.isTokenPocket
  if (walletType === BIT_KEEP_APP) return 'isBitKeepChrome' in ethereum
  if (walletType === COINBASE_APP)
    return ethereum.isCoinbaseBrowser && ethereum.isCoinbaseWallet
  if (walletType === BLOCKWALLET) return ethereum.isBlockWallet
  if (walletType === OKXWALLET) return ethereum.isOkxWallet
  // we never care wallet connect, because it's a protocol, not a wallet
  // so it doesn't follow the Ethereum standard api
}

// check if coinbase extension is installed, coinbase extension will affect something!!
export const checkEthereumConflicts = () => {
  if (!window.ethereum) return false
  // @ts-ignore 
  if (!window.ethereum.providers) return false
  // @ts-ignore 
  const coinbaseProvider = window.ethereum.providers.find((provider) => provider.isCoinbaseWallet === true)
  return !!coinbaseProvider
}

// because coinbase also injects a global variable with the same name "ethereum" into browser
// according to the coinbase official, we can get all the provider by accessing ethereum.providers
export const findMatchWeb3ProviderByWalletType = (
  walletType: string,
  walletIsInstalledInvestigator?:any
) => {
  if (!checkEthereumConflicts()) {
    // if there is no conflict, there's only one "ethereum" instance in window
    // so we should confirm one thing: this "ethereum" object fits our wallet type
    // @ts-ignore 
    if (walletType === OKXWALLET && typeof window.okxwallet !== 'undefined') {
      // @ts-ignore 
      return window.okxwallet;
    }

    if (ethereumWalletTypeFitChecker(walletType, window.ethereum))
      return window.ethereum
    return null
  }

  // because metamask is still based on old code, i haven't had time to plug into the standard API
  // so we can do a special treatment for metamask, for temporary use and will be removed in the feature!
  if (!walletIsInstalledInvestigator && walletType === METAMASK) {
    walletIsInstalledInvestigator = (provider:any) =>
      provider.isMetaMask && !isBraveWallet
  }

  if (!walletIsInstalledInvestigator) return null
  // @ts-ignore 
  return window.ethereum.providers.find(walletIsInstalledInvestigator)
}

// login status checker
export const fetchTargetWalletLoginStatus = (params: { walletType: string }) => {
  let gwcf = globalSelectWalletConf()
  return gwcf.walletType === params.walletType && gwcf.loginSuccess
}



/**
 * mobile app webview only!!!!!!! don't use in other place!!!!
 */
export const getMobileAppTypeByProvider = () => {
  const provider = window.ethereum
  // @ts-ignore 
  if (provider.isImToken) return IM_TOKEN_APP
  // @ts-ignore 
  if (provider.isTokenPocket) return TOKEN_POCKET_APP
  // @ts-ignore 
  if (provider.isMetaMask && !provider.isTokenPocket) return METAMASK_APP
  // @ts-ignore 
  if ('isBitKeepChrome' in provider) return BIT_KEEP_APP
  // @ts-ignore 
  if (provider.isCoinbaseWallet && provider.isCoinbaseBrowser)
    return COINBASE_APP
  if (isBraveWallet) return BRAVE_APP;
}

/**
 * if current page is in a webview environment, users will not be allowed to choose
 * their wallets freely, instead, system will initialize the wallet automatically based
 * on the wallet type
 */
export const performInitMobileAppWallet = () => {
  if (!isMobileEnv()) return
  // in the webview, there's only one web3 provider already init completed, because u can't
  // install others wallet on current wallet
  // it was injected by the current wallet, we can get something useful from it
  // @ts-ignore 
  const matchAppType = getMobileAppTypeByProvider(window.ethereum)
  modifyLocalLoginInfo({
    walletType: matchAppType,
    loginSuccess: true,
    walletPayload: {},
  })
}
