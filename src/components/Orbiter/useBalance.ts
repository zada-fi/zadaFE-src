import { useEffect, useMemo, useState } from "react"
import { TransferDataStateType } from "./bridge"
import { useWeb3React } from "@web3-react/core"
import { NetworkContextName } from "../../constants"
import orbiterCore from './../../utils/orbiter-core'
import BigNumber from "bignumber.js"
import { exchangeToCoin, RatesType } from '../../utils/orbiter-tool/coinbase'


type PropsType = {
  transferDataState: TransferDataStateType,
  rates: RatesType,
  updateLoadingData: (value: boolean, valueKey: string) => void,
  getTransferGasLimit: (fromChainID: number,
    makerAddress: string,
    fromTokenAddress: string) => Promise<number | null>,
  getTransferBalance: (arg1: number, arg2: string, arg3: string, arg4: string, arg5?: boolean) => Promise<number | undefined>
}
export default function useBalance(props: PropsType) {
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  let [fromBalance, setFromBalance] = useState(Number(0).toFixed(6))
  let [toBalance, setToBalance] = useState(Number(0).toFixed(6))
  let [userMaxPrice, setUserMaxPrice] = useState('0')
  let userMinPrice = useMemo(() => {
    return props.transferDataState.selectMakerConfig?.fromChain?.minPrice || 0
  }, [props.transferDataState.fromChainID, props.transferDataState.fromCurrency])
  let [makerMaxBalance, setMakerMaxBalance] = useState<number | undefined>()
  useEffect(() => {
    let active = true
    loadData()
    return () => {
      active = false
    }
    async function loadData() {
      let res = await getMakerMaxBalance()
      if (!active) return
      setMakerMaxBalance(res)
    }

  }, [props.transferDataState.selectMakerConfig, props.rates])

  async function getMakerMaxBalance() {
    const { selectMakerConfig } = props.transferDataState;
    if (!selectMakerConfig || !Object.keys(selectMakerConfig).length) return;
    const { toChain } = selectMakerConfig;
    // dYdX can't get maker's balance, don't check it
    if (toChain.id === 11 || toChain.id === 511) {
      return Number.MAX_SAFE_INTEGER;
    }
    // const makerAddress = selectMakerConfig.sender;
    const _balance = await getBalance(
      toChain.id,
      toChain.tokenAddress,
      toChain.symbol,
      toChain.decimals
    );
    if (new BigNumber(_balance).isGreaterThan(0)) {
      // Max use maker balance's 95%, because it transfer need gasfee(also zksync need changePubKey fee)
      return (new BigNumber(_balance).multipliedBy(0.95)).toNumber();
    }
    return 0
  }
  const getBalance = async (chainId: number,
    tokenAddress: string,
    tokenName: string,
    precision: number) => {
    const { fromCurrency, selectMakerConfig } = props.transferDataState;
    const sender = selectMakerConfig.sender;
    try {
      if (!sender) {
        return '0';
      }
      const response = await props.getTransferBalance(
        chainId,
        tokenAddress,
        tokenName,
        sender,
        true
      );
      if (fromCurrency !== tokenName && fromCurrency) {
        const exchangeRes = (await exchangeToCoin(response, tokenName, fromCurrency, props.rates)).toString();
        return (new BigNumber(exchangeRes).dividedBy(10 ** precision)).toFixed(6);
      }
      return response ? (response / 10 ** precision).toFixed(6) : '0';
    } catch (error) {
      console.warn(error);
      return '0';
    }

  }

  const updateBalance = (value: string, valueKey: string) => {
    if (valueKey === 'fromBalance') {
      setFromBalance(value)
    } else if (valueKey === 'toBalance') {
      setToBalance(value)
    }
  }
  const walletIsLogin = useMemo(() => {
    return contextNetwork.active || active
  }, [active, contextNetwork])

  const updateUserMaxPrice = async () => {
    const { selectMakerConfig } = props.transferDataState;
    if (!selectMakerConfig||!Object.keys(selectMakerConfig).length) return '0';
    const { fromChain, toChain } = selectMakerConfig;
    if (!walletIsLogin) {
      return fromChain.maxPrice;
    }
    // check fromBalance
    if (!fromBalance) {
      return '0';
    }
    let transferGasFee = (await props.getTransferGasLimit(
      fromChain.id,
      selectMakerConfig.recipient,
      fromChain.tokenAddress
    )) || 0;
    let avalibleDigit = orbiterCore.getDigitByPrecision(fromChain.decimals);
    let opBalance = 10 ** -avalibleDigit;
    let preGasDigit = 3;
    let preGas = 0;
    if ([3, 33, 1, 5, 2, 22, 7, 77, 16, 516].includes(fromChain.id)) {
      preGas = 10 ** -preGasDigit;
    }
    let userBalance = new BigNumber(fromBalance)
      .minus(new BigNumber(selectMakerConfig.tradingFee))
      .minus(new BigNumber(opBalance))
      .minus(new BigNumber(transferGasFee))
      .minus(new BigNumber(preGas));
    let userMax = userBalance.decimalPlaces(avalibleDigit, BigNumber.ROUND_DOWN).comparedTo(0) === 1
      ? userBalance.decimalPlaces(avalibleDigit, BigNumber.ROUND_DOWN)
      : new BigNumber(0);
    let max = userMax.comparedTo(new BigNumber(fromChain.maxPrice)) > 0
      ? new BigNumber(fromChain.maxPrice)
      : userMax;

    if ((
      fromChain.id === 9 ||
      fromChain.id === 99 ||
      toChain.id === 9 ||
      toChain.id === 99) &&
      fromChain.decimals === 18
    ) {
      max = max.decimalPlaces(5, BigNumber.ROUND_DOWN);
    }
    // this.userMaxPrice = max.toString();
    setUserMaxPrice(max.toString())
  }

  const refreshUserBalance = async () => {
    props.updateLoadingData(true, 'fromBalanceLoading')
    props.updateLoadingData(true, 'toBalanceLoading')
    // @ts-ignore 
    const { fromChainID, toChainID, selectMakerConfig } = props.transferDataState;
    if (!selectMakerConfig || !Object.keys(selectMakerConfig).length) return;
    const { fromChain, toChain } = selectMakerConfig;

    let address = account //compatibleGlobalWalletConf.value.walletPayload.walletAddress;
    // if (fromChainID === 4 || fromChainID === 44) {
    //   address = web3State.starkNet.starkNetAddress;
    // }
    if (address && address !== '0x') {
      await props.getTransferBalance(fromChain.id, fromChain.tokenAddress, fromChain.symbol, address, false)
        .then(async (response) => {
          const balance = response ? (response / 10 ** fromChain.decimals).toFixed(6) : '0';
          // self.addBalance(fromChain.id, fromChain.symbol, balance, address);
          // self.fromBalance = balance;
          setFromBalance(balance)
          await updateUserMaxPrice();
        })
        .catch((error) => {
          console.warn(error);
        }).finally(() => {
          // self.fromBalanceLoading = false;
          props.updateLoadingData(false, 'fromBalanceLoading')
        });
      await updateUserMaxPrice();


    } else {
      // self.fromBalanceLoading = false;
      props.updateLoadingData(false, 'fromBalanceLoading')
    }

    address = account //compatibleGlobalWalletConf.value.walletPayload.walletAddress;
    // if (toChainID === 4 || toChainID === 44) {
    //   address = web3State.starkNet.starkNetAddress;
    // }
    if (address && address !== '0x') {
      await props.getTransferBalance(toChain.id, toChain.tokenAddress, toChain.symbol, address, false)
        .then((response) => {
          const balance = response ? (response / 10 ** toChain.decimals).toFixed(6) : '0';
          // self.addBalance(toChain.id, toChain.symbol, balance, address);
          // self.toBalance = balance;
          setToBalance(balance)
        })
        .catch((error) => {
          console.warn(error);
        }).finally(() => {
          // self.toBalanceLoading = false;
          props.updateLoadingData(false, 'toBalanceLoading')
        });

    } else {
      // self.toBalanceLoading = false;
      props.updateLoadingData(false, 'toBalanceLoading')
    }
  }
  return {
    fromBalance,
    toBalance,
    userMaxPrice,
    userMinPrice,
    makerMaxBalance,
    walletIsLogin,
    updateBalance,
    refreshUserBalance
  }
}