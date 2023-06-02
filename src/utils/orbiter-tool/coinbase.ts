// import { BigNumber } from "ethers"
import BigNumber from 'bignumber.js'
import { equalsIgnoreCase } from "."
export type RatesType = {
  [key: string]: string
} | undefined | null

let exchangeRates:RatesType = null

export async function exchangeToCoin(
  ovalue = 1,
  sourceCurrency = 'ETH',
  toCurrency: string,
  rates: RatesType
): Promise<number> {
  let value = new BigNumber(ovalue)
  const exchangeRates = rates || (await getRates(sourceCurrency))
  const fromRate = exchangeRates? exchangeRates[sourceCurrency]:null
  const toRate = exchangeRates?exchangeRates[toCurrency]:null
  if (!fromRate || !toRate) {
    return new BigNumber(0).toNumber()
  }
  // util.log(`${sourceCurrency} rate`, fromRate, `${toCurrency} rate`, toRate)
  return value.dividedBy(fromRate).multipliedBy(toRate).toNumber()
}
export async function getRates(currency: string): Promise<RatesType> {
  try {
    let fetchResponse = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${currency}`)
    let resp = await fetchResponse.json()
    // const resp = await axios.get(
    //   `https://api.coinbase.com/v2/exchange-rates?currency=${currency}`
    // )
    console.log('resp', resp)
    const data = resp?.data
    // check
    if (
      !data ||
      !equalsIgnoreCase(data.currency, currency) ||
      !data.rates
    ) {
      return undefined
    }
    return data.rates
  } catch (error) {
    return undefined
  }
}
/**
 * @param currency
 * @returns
 */
async function cacheExchangeRates(currency = 'USD'): Promise<RatesType>  {
  // cache
  exchangeRates = await getRates(currency)
  if (exchangeRates) {
    const metisExchangeRates = await getRates('metis')
    if (metisExchangeRates && metisExchangeRates.USD) {
      const usdToMetis = 1 / Number(metisExchangeRates.USD)
      exchangeRates.METIS = String(usdToMetis)
    }
    const bnbExchangeRates = await getRates('bnb')
    if (bnbExchangeRates && bnbExchangeRates.USD) {
      const usdTobnb = 1 / Number(bnbExchangeRates.USD)
      exchangeRates.BNB = String(usdTobnb)
    }
    return exchangeRates
  } else {
    return undefined
  }
}

/**
 * @param value
 * @param sourceCurrency
 * @returns {Promise<BigNumber>}
 */
export async function exchangeToUsd(value:any, sourceCurrency = 'ETH') {
  if (!(value instanceof BigNumber)) {
    value = new BigNumber(value)
  }
  try{
    const rate = await getExchangeToUsdRate(sourceCurrency)
    if (!rate.isGreaterThanOrEqualTo(new BigNumber('0'))) {
      return new BigNumber(0)
    }else{
      return value.dividedBy(rate)
    }
  }catch(error){
    return new BigNumber(0) 
  }

}


/**
 * @param sourceCurrency
 * @returns {Promise<BigNumber>}
 */
export async function getExchangeToUsdRate(sourceCurrency = 'ETH'): Promise<BigNumber> {
  // toUpperCase
  sourceCurrency = sourceCurrency.toUpperCase()

  const currency = 'USD'

  let rate: string = '-1'
  try {
    if (!exchangeRates) {
      exchangeRates = await cacheExchangeRates(currency)
    }
    if (exchangeRates?.[sourceCurrency]) {
      rate = exchangeRates[sourceCurrency]
    }
  } catch (error) {
    console.error(error)
  }

  return new BigNumber(rate)
}