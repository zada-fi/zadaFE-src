// import { BigNumber } from "@ethersproject/bignumber"
import BigNumber from 'bignumber.js'
import { getContractFactory, predeploys } from '@eth-optimism/contracts'
import { useSelector } from "react-redux"
import { BigNumberish, ethers } from 'ethers'
import { getZkSyncProvider } from "../../utils/orbiter-tool/zkysnc_helper"
import { TransferDataStateType } from "./bridge"
import { AppState } from "../../state"
import useLoopring from "./useLoopring"
import useLpData from "./useLpData"
import useZkspace from "./useZkspace"
import orbiterCore from "../../utils/orbiter-core"
import { getRpcList, stableRpc, setStableRpc, isEthTokenAddress, requestWeb3, getWeb3TokenBalance } from '../../utils/orbiter-tool'
import thirdapi from "../../utils/orbiter-core/thirdapi"
import zkspace from "../../utils/orbiter-core/zkspace"
import { IMXHelper } from "../../utils/orbiter-tool/immutablex/imx_helper"
import { useWeb3React } from "@web3-react/core"
import Web3 from 'web3'
import { DydxHelper } from '../../utils/orbiter-tool/dydx/dydx_helper'
import { exchangeToUsd } from '../../utils/orbiter-tool/coinbase'
type PropsType = {
  transferDataState: TransferDataStateType
}
export type MainnetType = {
  address: string,
  id: string,
  decimals: number
}
export type RinkebyType = {
  address: string,
  id: string,
  decimals: number
}
export type ZkTokenItemType = MainnetType | RinkebyType
type ErrorType  = {
  message: string
}|any

export default function useTransferCalcute(props: PropsType) {
  let { connector } = useWeb3React()
  let { zksTokenList, getZKSpaceTransferGasFee } = useZkspace(props)
  let { web3State } = useLpData()
  let zktokenList = useSelector((state: AppState) => state.orbiter.zktokenList)
  let { getLpTokenInfo, getTransferFee, getLoopringBalance } = useLoopring(props)

  const getOPFee = async (fromChainID: string) => {
    // Create an ethers provider connected to the public mainnet endpoint.
    const provider = new ethers.providers.JsonRpcProvider(
      stableRpc(fromChainID)
    )
    // Create contract instances connected to the GPO and WETH contracts.
    const GasPriceOracle = getContractFactory('OVM_GasPriceOracle')
      .attach(predeploys.OVM_GasPriceOracle)
      .connect(provider)
    const ETH = getContractFactory('WETH9')
      .attach(predeploys.WETH9)
      .connect(provider)
    // Arbitrary recipient address.
    const to = props.transferDataState.selectMakerConfig.recipient

    // Small amount of WETH to send (in wei).
    const amount = ethers.utils.parseUnits('5', 18)
    // Compute the estimated fee in wei
    let tempGasFee: BigNumberish = await provider.getGasPrice()
    const l1FeeInWei = await GasPriceOracle.getL1Fee(
      ethers.utils.serializeTransaction({
        ...(await ETH.populateTransaction.transfer(to, amount)),
        // @ts-ignore 
        gasPrice: tempGasFee,// await provider.getGasPrice(),
        gasLimit: 21000,
      })
    )
    return Number(l1FeeInWei)
  }
  const getGasPrice = async (fromChainID: string) => {
    if (fromChainID + '' === '33' || fromChainID + '' === '3') {
      return null
    }
    const rpcList = getRpcList(fromChainID)
    for (const rpc of rpcList) {
      try {
        let fetchReponse = await fetch(rpc, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 0,
          }),
          headers: { 'content-type': 'application/json', accept: 'application/json' },
        })
        const response = await fetchReponse.json()
        // const response = await axios.post(rpc, {
        //   jsonrpc: '2.0',
        //   method: 'eth_gasPrice',
        //   params: [],
        //   id: 0,
        // })
        if (response.status === 200) {
          setStableRpc(fromChainID, rpc, 'eth_gasPrice')
          return parseInt(response.data.result)
        }
      } catch (e) {
        setStableRpc(fromChainID, '', 'eth_gasPrice')
      }
    }
    setStableRpc(fromChainID, '', 'eth_gasPrice')
    return null
  }
  // @ts-ignore
  const realTransferAmount = () => {
    const { selectMakerConfig, transferValue, fromChainID, toChainID } =
      props.transferDataState
    const userValue = new BigNumber(transferValue).multipliedBy(
      new BigNumber(selectMakerConfig.tradingFee)
    ).toNumber()
    if (!fromChainID || !userValue) {
      return 0
    }
    const rAmount = new BigNumber(userValue).multipliedBy(
      new BigNumber(10 ** selectMakerConfig.fromChain.decimals)
    ).toNumber()
    const rAmountValue = rAmount.toFixed()
    const p_text = 9000 + Number(toChainID) + ''
    const tValue = orbiterCore.getTAmountFromRAmount(
      fromChainID,
      rAmountValue,
      p_text
    )
    if (!tValue.state) {
      return userValue
    } else {
      return new BigNumber(tValue.tAmount).dividedBy(
        new BigNumber(10 ** selectMakerConfig.fromChain.decimals)
      ).toNumber()
    }
  }
  // gasCost-> savingValue
  const transferSpentGas = async (fromChainID: string, gasPriceMap: any, gasLimitMap: any) => {
    const { selectMakerConfig } = props.transferDataState
    if (fromChainID + '' === '3' || fromChainID + '' === '33') {
      const syncHttpProvider = await getZkSyncProvider(fromChainID)
      const zkTokenList: Array<ZkTokenItemType> =
        fromChainID + '' === '3'
          ? zktokenList.mainnet
          : zktokenList.rinkeby
      const tokenAddress = typeof selectMakerConfig === 'undefined' || !selectMakerConfig ? '' : selectMakerConfig.fromChain.tokenAddress
      const tokenList = zkTokenList.filter(
        (item: any) => item.address === tokenAddress
      )
      const resultToken = tokenList.length > 0 ? tokenList[0] : null
      if (!resultToken) {
        return null
      }

      const fee: any = await syncHttpProvider.getTransactionFee(
        'Transfer',
        selectMakerConfig.recipient,
        resultToken?.id
      )
      return (fee.totalFee / 10 ** resultToken.decimals).toFixed(6)
    }
    if (fromChainID + '' === '9' || fromChainID + '' === '99') {
      const tokenAddress = selectMakerConfig.fromChain.tokenAddress
      const lpTokenInfo = await getLpTokenInfo(
        fromChainID,
        tokenAddress
      )
      const loopringFee = await getTransferFee(
        web3State.coinbase,
        fromChainID,
        lpTokenInfo
      )
      // lpGasFee must use eth
      return (Number(loopringFee) / 10 ** 18).toFixed(6)
    }
    if (fromChainID + '' === '12' || fromChainID + '' === '512') {
      let transferFee = 0
      try {
        transferFee = await getZKSpaceTransferGasFee(
          fromChainID,
          web3State.coinbase ? web3State.coinbase : selectMakerConfig.recipient
        )
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
      } catch (error) {
        console.warn('getZKSpaceTransferGasFeeError =', error)
        return 0
      }
      return transferFee.toFixed(6)
    }
    // if (fromChainID + '' === '4' || fromChainID + '' === '44') {
    //   const data_realTransferAmount = realTransferAmount().toString()
    //   const fromTokenAddress = selectMakerConfig.fromChain.tokenAddress
    //   const starkFee = await getStarkTransferFee(
    //     web3State.coinbase,
    //     fromTokenAddress,
    //     selectMakerConfig.recipient,
    //     data_realTransferAmount,
    //     fromChainID
    //   )
    //   return (starkFee / 10 ** 18).toFixed(6)
    // }

    const gasPrice = await getGasPrice(fromChainID.toString())
    if (!gasPrice) {
      const gas =
        ((gasPriceMap[fromChainID.toString()] || 1) *
          (gasLimitMap[fromChainID.toString()] || 21000)) /
        10 ** 9
      return gas.toFixed(6).toString()
    } else {
      let gas = gasPrice * (gasLimitMap[fromChainID.toString()] || 21000)
      if (fromChainID + '' === '7' || fromChainID + '' === '77') {
        const l1GasFee = await getOPFee(fromChainID)
        gas += l1GasFee
      }
      gas = gas / 10 ** 18
      return gas.toFixed(6).toString()
    }
  }

  const getBalanceByRPC = async (chainId: number, userAddress: string, tokenAddress: string) => {
    if (isEthTokenAddress(chainId, tokenAddress)) {
      // When is ETH
      const balance = await requestWeb3(chainId, 'getBalance', userAddress)
      return Number(balance) || 0
    } else {
      // When is ERC20
      const tokenBalance = await getWeb3TokenBalance(
        chainId,
        userAddress,
        tokenAddress
      )
      return Number(tokenBalance)
    }
  }

  // min ~ max
  async function getTransferGasLimit(fromChainID:number, 
    makerAddress:string, 
    fromTokenAddress:string) {
    const { selectMakerConfig } = props.transferDataState
    if (fromChainID === 3 || fromChainID === 33) {
      const syncHttpProvider = await getZkSyncProvider(fromChainID+'')
      if (!makerAddress) {
        return null
      }
      const zkTokenList =
        fromChainID === 3
          ? zktokenList.mainnet
          : zktokenList.rinkeby
      const tokenAddress = selectMakerConfig.fromChain.tokenAddress
      // @ts-ignore 
      const tokenList = zkTokenList.filter((item) => item.address === tokenAddress)
      const resultToken = tokenList.length > 0 ? tokenList[0] : null
      if (!resultToken) {
        return null
      }
      const fee = await syncHttpProvider.getTransactionFee(
        'Transfer',
        makerAddress,
        // @ts-ignore 
        resultToken?.id
      )
      let totalFee = fee.totalFee
      // When account's nonce is zero(0), add ChangePubKey fee
      try {
        const addressState = await syncHttpProvider.getState(web3State.coinbase)
        if (!addressState.committed || addressState.committed?.nonce == 0) {
          const changePubKeyFee = await syncHttpProvider.getTransactionFee(
            { ChangePubKey: { onchainPubkeyAuth: false } },
            web3State.coinbase,
             // @ts-ignore 
            resultToken?.id
          )
          totalFee = totalFee.add(changePubKeyFee.totalFee)
        }
      } catch (err) {
        console.error('Get ChangePubKey fee failed: ', err)
      }
      // @ts-ignore 
      // return totalfee /10 ** resultToken.decimals
      return new BigNumber(totalFee.toString()).dividerBy(10 ** resultToken.decimals).toNumber()
    } else if (fromChainID === 12 || fromChainID === 512) {
      let transferFee = 0
      try {
        transferFee = await getZKSpaceTransferGasFee(
          fromChainID+'',
          web3State.coinbase
        )
      } catch (error) {
        console.warn('getZKSpaceTransferGasFeeError =', error)
      }
      return transferFee
    } else if (fromChainID === 4 || fromChainID === 44) {
      // const temp_realTransferAmount = realTransferAmount().toString()
      // const starkFee = await getStarkTransferFee(
      //   web3State.coinbase,
      //   fromTokenAddress,
      //   makerAddress,
      //   realTransferAmount,
      //   fromChainID
      // )
      // return starkFee / 10 ** 18
      return 0
    } else if (fromChainID === 9 || fromChainID === 99) {
      // loopring fee can only use eth。other erc20 fee will be error
      try {
        const lpTokenInfo = await getLpTokenInfo(
          fromChainID+'',
          fromTokenAddress
        )
        const loopringFee = await getTransferFee(
          web3State.coinbase,
          fromChainID+'',
          lpTokenInfo
        )
        const decimals = 18 // loopringFee must be use eth
        return Number(loopringFee) / 10 ** decimals
      } catch (error) {
        console.warn('lp getTransferFeeerror:')
      }
    } else if (fromChainID === 8 || fromChainID === 88) {
      return 0
    } else if (
      isEthTokenAddress(fromChainID, fromTokenAddress) ||
      ((fromChainID === 14 || fromChainID === 514) &&
        fromTokenAddress.toUpperCase() === `0X${'E'.repeat(40)}`)
    ) {
      if (fromChainID === 12 || fromChainID === 512) {
        // zkspace can only use eth as fee
        let transferFee = 0
        try {
          transferFee = await getZKSpaceTransferGasFee(
            fromChainID+'',
            web3State.coinbase
          )
        } catch (error) {
          console.warn('getZKSpaceTransferGasFeeError =', error)
        }
        return transferFee
      } else if (fromChainID === 9 || fromChainID === 99) {
        // loopring fee can only use eth。other erc20 fee will be error
        try {
          const lpTokenInfo = await getLpTokenInfo(
            fromChainID+'',
            fromTokenAddress
          )
          const loopringFee = await getTransferFee(
            web3State.coinbase,
            fromChainID+'',
            lpTokenInfo
          )
          const decimals = lpTokenInfo ? lpTokenInfo.decimals : 18
          return Number(loopringFee) / 10 ** decimals
        } catch (error) {
          console.warn('lp getTransferFeeerror:')
        }
      }
      const rpcList = getRpcList(fromChainID)
      if (!rpcList.length) {
        return 0
      }
      let estimateGas: number = await requestWeb3(fromChainID, 'estimateGas', {
        from: web3State.coinbase,
        to: makerAddress,
      })
      if (fromChainID === 14 || fromChainID === 514) {
        estimateGas = estimateGas * 1.5;
      }
      const gasPrice:string = await requestWeb3(fromChainID, 'getGasPrice')
      let gas = new BigNumber(gasPrice).multipliedBy(estimateGas)
      if (fromChainID === 7 || fromChainID === 77) {
        const l1GasFee = await getOPFee(fromChainID+'')
        gas = gas.plus(l1GasFee)
      }
      return gas.dividedBy(10 ** 18).toNumber()//.toString()
    }
    return 0
  }

  const getTransferBalance = async (
    localChainID: number,
    tokenAddress: string,
    tokenName: string,
    userAddress: string,
    isMaker = false
  ): Promise<number|undefined> =>  {
    const { selectMakerConfig } = props.transferDataState
    if (localChainID === 3 || localChainID === 33) {
      const req = {
        account: userAddress,
        localChainID,
        stateType: 'committed',
      }
      try {
        const balanceInfo = await thirdapi.getZKAccountInfo(req)
        // @ts-ignore 
        if (!balanceInfo || !balanceInfo.result || !balanceInfo.result.balances) {
          return 0
        }
        // @ts-ignore 
        const balances = balanceInfo.result.balances
        return balances[tokenName] ? balances[tokenName] : 0
      } catch (error) {
        console.warn('error =', error)
        throw 'getZKBalanceError'
      }
    } else if (localChainID === 4 || localChainID === 44) {
      throw 'unsupport chain'
      // const networkId = getNetworkIdByChainId(localChainID)
      // let starknetAddress = web3State.starkNet.starkNetAddress
      // if (!isMaker) {
      //   if (!starknetAddress) {
      //     return 0
      //   }
      // } else {
      //   starknetAddress = userAddress
      // }
      // return await getErc20Balance(starknetAddress, tokenAddress, networkId)
    } else if (localChainID === 8 || localChainID === 88) {
      const imxHelper = new IMXHelper(localChainID)
      let provider = await connector?.getProvider()
      const balance = await imxHelper.getBalanceBySymbol(userAddress, tokenName, provider)
      return balance.toNumber()//Number(balance + '')
    } else if (localChainID === 9 || localChainID === 99) {
      const lpTokenInfo = await getLpTokenInfo(
        localChainID + '',
        tokenAddress
      )
      if (typeof lpTokenInfo === 'undefined') {
        throw 'get lpTokeninfo undefined'
        // return 0
      }
      return await getLoopringBalance(
        userAddress,
        localChainID,
        isMaker,
        lpTokenInfo
      )
    } else if (localChainID === 11 || localChainID === 511) {
      let provider = await connector?.getProvider()
      const dydxHelper = new DydxHelper(
        localChainID,
        new Web3(provider),//compatibleGlobalWalletConf.value.walletPayload.provider
        'MetaMask',
        connector
      )
      let res =  await dydxHelper.getBalanceUsdc(userAddress, false) // Dydx only usdc
      return res.toNumber() // for test
    } else if (localChainID === 12 || localChainID === 512) {
      const zkReq = {
        account: userAddress,
        localChainID,
      }
      try {
        const balanceInfo = await zkspace.getZKspaceBalance(zkReq)
        if (!balanceInfo) {
          return 0
        }
        const zksTokenInfos =
          localChainID === 12
            ? zksTokenList.mainnet
            : zksTokenList.rinkeby
        // @ts-ignore 
        const tokenInfo = zksTokenInfos.find((item) => item.address === tokenAddress)
        // @ts-ignore 
        const theBalanceInfo = balanceInfo.find((item) => item.id === tokenInfo.id)
        return theBalanceInfo
          ? theBalanceInfo.amount * 10 ** selectMakerConfig.fromChain.decimals
          : 0
      } catch (error ) {
        throw new Error(`getZKSBalanceError,${(error as ErrorType).message}`)
      }
    } else {
      return await getBalanceByRPC(localChainID, userAddress, tokenAddress)
    }
  }

  const getTokenConvertUsd =  async (tokenName:string)=> {
    try {
      return (await exchangeToUsd(1, tokenName)).toNumber()
    } catch (error) {
      // @ts-ignore 
      throw error.message
    }
  }

  return {
    transferSpentGas,
    getTransferBalance,
    getTransferGasLimit,
    getTokenConvertUsd
  }
}