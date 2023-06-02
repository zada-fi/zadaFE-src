import { getChainInfoByChainId } from '../orbiter-tool'
import BigNumber from 'bignumber.js'
import { MakerConfigType } from '../orbiter-config'
const MAX_BITS = {
  eth: 256,
  arbitrum: 256,
  zksync: 35,
  zksync2: 256,
  starknet: 256,
  polygon: 256,
  optimistic: 256,
  immutablex: 28,
  loopring: 256,
  metis: 256,
  dydx: 28,
  zkspace: 35,
  boba: 256,
  bsc: 256,
  arbitrum_nova: 256,
  polygon_zkevm: 256,
  scroll_l1_test: 256,
  scroll_l2_test: 256,
  taiko_a1_test: 256,
}

const CHAIN_INDEX = {
  1: 'eth',
  2: 'arbitrum',
  22: 'arbitrum',
  3: 'zksync',
  33: 'zksync',
  4: 'starknet',
  44: 'starknet',
  5: 'eth',
  6: 'polygon',
  66: 'polygon',
  7: 'optimistic',
  77: 'optimistic',
  8: 'immutablex',
  88: 'immutablex',
  9: 'loopring',
  99: 'loopring',
  10: 'metis',
  510: 'metis',
  11: 'dydx',
  511: 'dydx',
  12: 'zkspace',
  512: 'zkspace',
  13: 'boba',
  513: 'boba',
  14: 'zksync2',
  514: 'zksync2',
  515: 'bsc',
  15: 'bsc',
  16: 'arbitrum_nova',
  516: 'arbitrum_nova',
  517: 'polygon_zkevm',
  518: 'scroll_l1_test',
  519: 'scroll_l2_test',
  520: 'taiko_a1_test',
}

const SIZE_OP = {
  P_NUMBER: 4,
}

/**
 * @deprecated Replaced by [isLimitNumber]
 * @param {*} chain
 */
function isZKChain(chain:any) {
  if (
    chain+'' === '3' ||
    chain+'' === '33' ||
    chain === 'zksync' ||
    chain+'' == '12' ||
    chain+'' == '512' ||
    chain == 'zkspace'
  ) {
    return true
  }
  return false
}

function isLPChain(chain:any) {
  if (chain+'' === '9' || chain+'' === '99' || chain === 'loopring') {
    return true
  }
}

function isLimitNumber(chain:any) {
  if (chain+'' === '3' || chain+'' === '33' || chain === 'zksync') {
    return true
  }
  if (chain+'' === '8' || chain+'' === '88' || chain === 'immutablex') {
    return true
  }
  if (chain+'' === '11' || chain+'' === '511' || chain === 'dydx') {
    return true
  }
  if (chain+'' === '12' || chain+'' === '512' || chain === 'zkspace') {
    return true
  }
  return false
}

function getToAmountFromUserAmount(userAmount:any, selectMakerConfig:MakerConfigType, isWei:any) {
  // @ts-ignore
  const decimals = selectMakerConfig.fromChain?.decimals || selectMakerConfig.precision
  let toAmount_tradingFee =  new BigNumber(userAmount+'').minus(
   (selectMakerConfig.tradingFee)
  )
  let gasFee = toAmount_tradingFee
    .multipliedBy((selectMakerConfig.gasFee))
    .dividedBy((1000))
  let digit = decimals === 18 ? 5 : 2
  let gasFee_fix = gasFee.decimalPlaces(digit, BigNumber.ROUND_UP)
  let toAmount_fee =  toAmount_tradingFee.minus((gasFee_fix)).toNumber() //toAmount_tradingFee.minus(gasFee_fix)

  if (!toAmount_fee || isNaN(toAmount_fee)) {
    return 0
  }
  if (!!isWei) {
    return new BigNumber(toAmount_fee).multipliedBy((10 ** decimals)).toNumber()
  } else {
    return toAmount_fee
  }
}

function getTAmountFromRAmount(chain:any, amount:any, pText:any) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: 'The chain did not support',
    }
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    }
  }
  if (pText.length > SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: 'the pText size invalid',
    }
  }

  let validDigit = AmountValidDigits(chain, amount) // 10 11
  var amountLength = amount.toString().length
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: 'Amount size must be greater than pNumberSize',
    }
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    let tAmount =
      amount.toString().slice(0, validDigit - pText.length) +
      pText +
      amount.toString().slice(validDigit)
    return {
      state: true,
      tAmount,
    }
  } else if (isLPChain(chain)) {
    return {
      state: true,
      tAmount: amount,
    }
  } else {
    let tAmount =
      amount.toString().slice(0, amountLength - pText.length) + pText
    return {
      state: true,
      tAmount,
    }
  }
}

function getToChainIDFromAmount(chain:any, amount:any) {
  let pText = getPTextFromTAmount(chain, amount)
  let toChainID
  if (pText.state) {
    toChainID = pText.pText
  } else {
    return null
  }
  if (toChainID > 9000) {
    return toChainID - 9000
  } else {
    return null
  }
}

function getPTextFromTAmount(chain: string, amount:any) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: 'The chain did not support',
    }
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    }
  }

  let validDigit = AmountValidDigits(chain, amount) // 10 11
  var amountLength = amount.toString().length
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: 'Amount size must be greater than pNumberSize',
    }
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    let zkAmount = amount.toString().slice(0, validDigit)
    let op_text = zkAmount.slice(-SIZE_OP.P_NUMBER)
    return {
      state: true,
      pText: op_text,
    }
  } else {
    let op_text = amount.toString().slice(-SIZE_OP.P_NUMBER)
    return {
      state: true,
      pText: op_text,
    }
  }
}

function getRAmountFromTAmount(chain:any, amount:any) {
  let pText = ''
  for (let index = 0; index < SIZE_OP.P_NUMBER; index++) {
    pText = pText + '0'
  }
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: 'The chain did not support',
    }
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    }
  }

  let validDigit = AmountValidDigits(chain, amount) // 10 11
  var amountLength = amount.toString().length
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: 'Amount size must be greater than pNumberSize',
    }
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    let rAmount =
      amount.toString().slice(0, validDigit - SIZE_OP.P_NUMBER) +
      pText +
      amount.toString().slice(validDigit)
    return {
      state: true,
      rAmount,
    }
  } else {
    let rAmount =
      amount.toString().slice(0, amountLength - SIZE_OP.P_NUMBER) + pText
    return {
      state: true,
      rAmount,
    }
  }
}

function isChainSupport(chain: string|number) {
  return !!getChainInfoByChainId(chain)
}

// 0 ~ (2 ** N - 1)
function AmountRegion(chain: number| string) {
  if (!isChainSupport(chain)) {
    return {
      error: 'The chain did nxot support',
    }
  }
  
  if (typeof chain === 'number' || typeof chain==='string'&&!Number.isNaN(chain)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
    let max = new BigNumber(2 ** (MAX_BITS[CHAIN_INDEX[Number(chain)]] || 256) - 1)
    return {
      error:'',
      min: new BigNumber(0),
      max,
    }
  } else if (typeof chain === 'string') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
    let max = new BigNumber(2 ** (MAX_BITS[chain.toLowerCase()] || 256) - 1)
    return {
      error:'',
      min: new BigNumber(0),
      max,
    }
  }
}
// ????????
function AmountMaxDigits(chain: any) {
  let amountRegion = AmountRegion(chain)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  if (amountRegion.error) {
    return amountRegion
  }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  return amountRegion.max.toNumber().toFixed().length
}

function AmountValidDigits(chain:any, amount:any) {
  let amountMaxDigits = AmountMaxDigits(chain)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  if (amountMaxDigits.error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
    return amountMaxDigits.error
  }
  let amountRegion = AmountRegion(chain)

  let ramount = removeSidesZero(amount.toString())
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  if (ramount.length > amountMaxDigits) {
    return 'amount is inValid'
  }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  if (ramount > amountRegion.max?.toNumber().toFixed()) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
    return amountMaxDigits - 1
  } else {
    return amountMaxDigits
  }
}

function removeSidesZero(param:any) {
  if (typeof param !== 'string') {
    return 'param must be string'
  }
  return param.replace(/^0+(\d)|(\d)0+$/gm, '$1$2')
}

function isAmountInRegion(amount: string|number, chain: string) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: 'The chain did not support',
    }
  }
  let amountRegion = AmountRegion(chain)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  if (amountRegion.error) {
    return false
  }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  if (new BigNumber(amount).comparedTo(amountRegion.min) !== -1 &&new BigNumber(amount).comparedTo(amountRegion.max) !== 1) {
    return true
  }
  return false
}

function pTextFormatZero(num: any) {
  if (String(num).length > SIZE_OP.P_NUMBER) return num
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
  return (Array(SIZE_OP.P_NUMBER).join(0) + num).slice(-SIZE_OP.P_NUMBER)
}

function isAmountValid(chain: string, amount:number) {
  if (!isChainSupport(chain)) {
    return {
      state: false,
      error: 'The chain did not support',
    }
  }
  if (amount < 1) {
    return {
      state: false,
      error: "the token doesn't support that many decimal digits",
    }
  }

  let validDigit = AmountValidDigits(chain, amount) // 10 11
  var amountLength = amount.toString().length
  if (amountLength < SIZE_OP.P_NUMBER) {
    return {
      state: false,
      error: 'Amount size must be greater than pNumberSize',
    }
  }

  let rAmount = amount
  if (isLimitNumber(chain)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
    rAmount = removeSidesZero(amount.toString())
  }
  if (!isAmountInRegion(rAmount, chain)) {
    return {
      state: false,
      error: 'Amount exceeds the spending range',
    }
  }
  if (isLimitNumber(chain) && amountLength > validDigit) {
    let zkAmount = amount.toString().slice(0, validDigit)
    let op_text = zkAmount.slice(-SIZE_OP.P_NUMBER)
    if (Number(op_text) === 0) {
      return {
        state: true,
      }
    }
    return {
      state: false,
      error: 'Insufficient number of flag bits',
    }
  } else {
    let op_text = amount.toString().slice(-SIZE_OP.P_NUMBER)
    if (Number(op_text) === 0) {
      return {
        state: true,
      }
    }
    return {
      state: false,
      error: 'Insufficient number of flag bits',
    }
  }
}

/**
 * @param {number} precision
 */
function getDigitByPrecision(precision:number) {
  return precision === 18 ? 6 : 2
}

export default {
  getPTextFromTAmount,
  getToChainIDFromAmount,
  isAmountValid,
  getTAmountFromRAmount,
  getRAmountFromTAmount,
  pTextFormatZero,
  isZKChain,
  isLPChain,
  isLimitNumber,
  getToAmountFromUserAmount,
  getDigitByPrecision,
}
