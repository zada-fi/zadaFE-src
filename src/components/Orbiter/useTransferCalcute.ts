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



// zk deposit
const ZK_ERC20_DEPOSIT_APPROVEL_ONL1 = 45135
const ZK_ERC20_DEPOSIT_DEPOSIT_ONL1 = 103937
const ZK_ETH_DEPOSIT_DEPOSIT_ONL1 = 62599

// zkspace deposit
const ZKSPACE_ETH_DEPOSIT_DEPOSIT_ONL1 = 160000
// https://rinkeby.etherscan.io/tx/0x6b6c2eacf0cdc5ff70b7923d6225456b8f6d26008de12beec611f7ab81eb2775
const ZKSPACE_ERC20_DEPOSIT_DEPOSIT_ONL1 = 100325
// ar deposit
const AR_ERC20_DEPOSIT_DEPOSIT_ONL1 = 218291
const AR_ETH_DEPOSIT_DEPOSIT_ONL1 = 92000

// ar withdraw
const AR_ERC20_WITHDRAW_ONAR = 801420
const AR_ERC20_WITHDRAW_ONL1 = 234552
const AR_ETH_WITHDRAW_ONAR = 666721
const AR_ETH_WITHDRAW_ONL1 = 161063

// polygon deposit
const PG_ERC20_DEPOSIT_DEPOSIT_ONL1 = 77257

// polygon withdraw
const PG_ERC20_WITHDRAW_ONPG = 32000
const PG_ERC20_WITHDRAW_ONL1 = 480000

// metis deposit
const MT_ERC20_DEPOSIT_DEPOSIT_ONL1 = 170617

// metis withdraw
const MT_ERC20_WITHDRAW_ONMT = 685768
const MT_ERC20_WITHDRAW_ONL1 = 21000

// optimistic deposit
const OP_ETH_DEPOSIT_DEPOSIT_ONL1 = 151000
const OP_ETH_WITHDRAW_ONOP_L2 = 137000
const OP_ETH_WITHDRAW_ONL1 = 820000

// https://ropsten.etherscan.io/tx/0x6182c35a69951a8443d6b7670ecccd7c8327d95faea95d7e949fc96ab6e7e0d7
const OP_ERC20_DEPOSIT_DEPOSIT_ONL1 = 77921
// optimistic withdraw
// https://kovan-optimistic.etherscan.io/tx/0x1df81e482369067c63c20f40d9ce1b8b75813f11957ff90c2fa967feef66e7a7
const OP_ERC20_WITHDRAW_ONOP_L2 = 115340
const OP_ERC20_WITHDRAW_ONL1 = 820000 // not get wanted

// loopring depost
const LP_ETH_DEPOSIT_DEPOSIT_ONL1 = 75000
// https://goerli.etherscan.io/tx/0x2571fa4a6ef7b69e143a9055877319014a770e30f22caec13bb540e0c9daee1e
const LP_ERC20_DEPOSIT_DEPOSIT_ONL1 = 91795
// immutablex deposit
// Testnet deposit contract: 0x6C21EC8DE44AE44D0992ec3e2d9f1aBb6207D864
const IMX_ETH_DEPOSIT_DEPOSIT_ONL1 = 126000
// https://ropsten.etherscan.io/tx/0x3e197cf0122e70aeccc7f7acbdc5418024f2e1e6161ed4f635a2c17e427f52c5
const IMX_ERC20_DEPOSIT_DEPOSIT_ONL1 = 116893
// immutablex withdraw
// Testnet withdraw contract: 0x4527BE8f31E2ebFbEF4fCADDb5a17447B27d2aef
const IMX_ETH_WITHDRAW_ONL1 = 510000
// https://ropsten.etherscan.io/tx/0x791dfb4ed33a12dd0e58febd7de4f00ec3ca396dedc5d7f6ac3fd5291cd706c4
const IMX_ERC20_WITHDRAW_ONL1 = 91304
// dydx deposit
// Mainnet deposit contract: 0x8e8bd01b5A9eb272CC3892a2E40E64A716aa2A40
const DYDX_ETH_DEPOSIT_DEPOSIT_ONL1 = 260000

// boba
const BOBA_TRANSFER_OUT_LIMIT = 10123935
const BOBA_TRANSFER_IN_LIMIT = 1787707

// polygon zkEVM
const PG_EVM_ETH_DEPOSIT_DEPOSIT_ONL1 = 122939
const PG_EVM_ETH_WITHDRAW_ONPG = 94708

// zksync2 deposit
const ZK2_ETH_DEPOSIT_DEPOSIT_ONL1 = 142000
const ZK2_ERC20_DEPOSIT_DEPOSIT_ONL1 = 142000
// zksync2 withdraw
const ZK2_ETH_WITHDRAW_ONZK2 = 1111693
const ZK2_ERC20_WITHDRAW_ONZK2 = 1111693 // same with eth
// starkNet
const STARKNET_ETH_DEPOSIT_ONL1 = 110000
// const STARKNET_ETH_WITHDRAW_ONL1 = 60000

// scroll
const SCROLL_ETH_DEPOSIT = 21000
const SCROLL_ETH_WITHDRAW = 21000

export default function useTransferCalcute(props: PropsType) {
  let { connector } = useWeb3React()
  let { zksTokenList, getZKSpaceTransferGasFee } = useZkspace(props)
  let { web3State } = useLpData()
  let zktokenList = useSelector((state: AppState) => state.orbiter.zktokenList)
  let { getLpTokenInfo, getTransferFee, getLoopringBalance, getWithDrawFee } = useLoopring(props)

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
      const tokenAddress = typeof selectMakerConfig === 'undefined' || !selectMakerConfig || !Object.keys(selectMakerConfig).length ? '' : selectMakerConfig.fromChain.tokenAddress
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
  const transferOrginGasUsd = async (fromChainID:string, toChainID:string, isErc20 = true)=> {
    let ethGas = 0
    let maticGas = 0
    let metisGas = 0
    let bscGas = 0
    const { selectMakerConfig } = props.transferDataState

    // withdraw
    if (fromChainID === '2' || fromChainID === '22') {
      try {
        // Ar get
        const fromGasPrice = (await getGasPrice(fromChainID)) || 0
        // AR WithDraw
        const ARWithDrawARGas =
          fromGasPrice *
          (isErc20 ? AR_ERC20_WITHDRAW_ONAR : AR_ETH_WITHDRAW_ONAR)

        const L1ChainID = fromChainID === '2' ? 1 : 5
        const L1GasPrice = (await getGasPrice(L1ChainID+'')) || 0
        const ARWithDrawL1Gas =
          L1GasPrice * (isErc20 ? AR_ERC20_WITHDRAW_ONL1 : AR_ETH_WITHDRAW_ONL1)
        ethGas = ARWithDrawARGas + ARWithDrawL1Gas
      } catch (error) {
        throw new Error('ar withdraw error')
      }
    }

    if (fromChainID === '3' || fromChainID === '33') {
      try {
        // zk withdraw
        const syncHttpProvider = await getZkSyncProvider(fromChainID)
        const zkWithDrawFee = await syncHttpProvider.getTransactionFee(
          'Withdraw',
          selectMakerConfig.recipient,
          0
        )
        ethGas += Number(zkWithDrawFee.totalFee)
      } catch (error) {
        throw new Error('zksync withdraw error')
      }
    }
    if (fromChainID === '4' || fromChainID === '44') {
      // stark cost
      // ethGas = 200000000000000
      // // mainnet cost
      // const L1ChainID = fromChainID === 4 ? 1 : 5
      // const L1GasPrice = await getGasPrice(L1ChainID)
      // const SNWithDrawL1Gas = L1GasPrice * STARKNET_ETH_WITHDRAW_ONL1
      // ethGas += SNWithDrawL1Gas
    }
    if (fromChainID === '6' || fromChainID === '66') {
      try {
        const fromGasPrice = await getGasPrice(fromChainID)

        // Polygon WithDraw
        const PGWithDrawARGas = (fromGasPrice||0) * PG_ERC20_WITHDRAW_ONPG
        maticGas += PGWithDrawARGas

        const L1ChainID = fromChainID === '6' ? 1 : 5
        const L1GasPrice = await getGasPrice(L1ChainID+'')
        const PGWithDrawL1Gas = (L1GasPrice||0) * PG_ERC20_WITHDRAW_ONL1
        ethGas += PGWithDrawL1Gas
      } catch (error) {
        throw new Error('po withdraw error')
      }
    }
    if (fromChainID === '7' || fromChainID === '77') {
      try {
        // OP get
        let fromGasPrice = await getGasPrice(fromChainID)
        fromGasPrice = fromGasPrice || 0
        // op WithDraw
        const OPWithDrawOPGas =
          fromGasPrice *
          (isErc20 ? OP_ERC20_WITHDRAW_ONOP_L2 : OP_ETH_WITHDRAW_ONOP_L2)

        const L1ChainID = fromChainID === '7' ? 1 : 5

        let  L1GasPrice = await getGasPrice(L1ChainID+'')
        L1GasPrice = L1GasPrice || 0
        const OPWithDrawL1Gas =
          L1GasPrice * (isErc20 ? OP_ERC20_WITHDRAW_ONL1 : OP_ETH_WITHDRAW_ONL1)

        const OPWithDrawOP_L1 = await getOPFee(fromChainID)

        ethGas = OPWithDrawOPGas + OPWithDrawL1Gas + Number(OPWithDrawOP_L1)

        
      } catch (error) {
        throw new Error('op withdraw error')
      }
    }
    if (fromChainID === '8' || fromChainID === '88') {
      try {
        const L1ChainID = fromChainID === '8' ? 1 : 5
        let L1GasPrice = await getGasPrice(L1ChainID+'')
        L1GasPrice = L1GasPrice || 0
        const IMXWithDrawL1Gas =
          L1GasPrice *
          (isErc20 ? IMX_ERC20_WITHDRAW_ONL1 : IMX_ETH_WITHDRAW_ONL1)
        ethGas += IMXWithDrawL1Gas
      } catch (error) {
        throw new Error('imx withdraw error')
      }
    }
    if (fromChainID === '9' || fromChainID === '99') {
      try {
        const loopringWithDrawFee = await getWithDrawFee(
          web3State.coinbase,
          fromChainID,
          selectMakerConfig.fromChain.symbol
        )
        ethGas += Number(loopringWithDrawFee)
      } catch (error) {
        throw new Error('loopring withdraw error')
      }
    }
    if (fromChainID === '10' || fromChainID === '510') {
      try {
        // MT get
        let fromGasPrice = await getGasPrice(fromChainID)
        fromGasPrice = fromGasPrice || 0
        // MT WithDraw
        const MTWithDrawARGas = fromGasPrice * MT_ERC20_WITHDRAW_ONMT
        metisGas += MTWithDrawARGas
        const L1ChainID = fromChainID === '10' ? 1 : 5
        let L1GasPrice = await getGasPrice(L1ChainID+'')
        L1GasPrice = L1GasPrice || 0
        const MTWithDrawL1Gas = L1GasPrice * MT_ERC20_WITHDRAW_ONL1
        ethGas += MTWithDrawL1Gas
      } catch (error) {
        throw new Error('metis withdraw error')
      }
    }
    if (fromChainID === '12' || fromChainID === '512') {
      try {
        let zkspaceWithDrawFee = await zkspace.getZKSpaceWithDrawGasFee(
          fromChainID,
          web3State.coinbase ? web3State.coinbase : selectMakerConfig.recipient,
          props.transferDataState
        )
        zkspaceWithDrawFee = zkspaceWithDrawFee || 0 
        ethGas += Number(
          zkspaceWithDrawFee * 10 ** selectMakerConfig.fromChain.decimals
        )
      } catch (error) {
        throw new Error('zkspace withdraw error')
      }
    }
    if (fromChainID === '13' || fromChainID === '513') {
      // BOBA get
      const fromGasPrice = ( await getGasPrice(fromChainID)) || 0
      ethGas = fromGasPrice * BOBA_TRANSFER_OUT_LIMIT
    }
    if (fromChainID === '15' || fromChainID === '515') {
      try {
        const fromGasPrice = (await getGasPrice(fromChainID)) || 0
        // BSC WithDraw
        const bscWithDrawARGas = fromGasPrice * 150000
        bscGas += bscWithDrawARGas
      } catch (error) {
        throw new Error('bsc withdraw error')
      }
    }
    if (fromChainID === '14' || fromChainID === '514') {
      // zk2 widthdraw
      const fromGasPrice = (await getGasPrice(fromChainID)) || 0
      ethGas =
        fromGasPrice *
        (isErc20 ? ZK2_ERC20_WITHDRAW_ONZK2 : ZK2_ETH_WITHDRAW_ONZK2)
    }
    if (fromChainID === '16' || fromChainID === '516') {
      try {
        // Ar get
        const fromGasPrice = (await getGasPrice(fromChainID)) || 0
        // AR WithDraw
        const ARWithDrawARGas = fromGasPrice * (isErc20 ? 300000 : 65000)
        const L1ChainID = fromChainID === '16' ? 1 : 5
        const L1GasPrice = (await getGasPrice(L1ChainID+''))||0
        const WithDrawL1Gas = L1GasPrice * (isErc20 ? 160000 : 115000)
        ethGas = ARWithDrawARGas + WithDrawL1Gas
      } catch (error) {
        throw new Error('ar withdraw error')
      }
    }
    if (fromChainID === '17' || fromChainID === '517') {
      const fromGasPrice = (await getGasPrice(fromChainID))||0;
      ethGas =
          fromGasPrice * PG_EVM_ETH_WITHDRAW_ONPG;
    }
    if (fromChainID === '518' || fromChainID === '519') {
      try {
        // scroll get
        const fromGasPrice = (await getGasPrice(fromChainID))||0
        // scroll WithDraw
        ethGas = fromGasPrice * SCROLL_ETH_WITHDRAW
      } catch (error) {
        throw new Error('scroll withdraw error')
      }
    }

    // deposit
    if (toChainID === '2' || toChainID === '22') {
      try {
        // Ar deposit
        const toGasPrice = (await getGasPrice(toChainID === '2' ? '1' : '5'))||0
        const arDepositGas =
          toGasPrice *
          (isErc20
            ? AR_ERC20_DEPOSIT_DEPOSIT_ONL1
            : AR_ETH_DEPOSIT_DEPOSIT_ONL1)
        ethGas += arDepositGas
      } catch (error) {
        throw new Error('ar deposit error')
      }
    }
    if (toChainID === '3' || toChainID === '33') {
      try {
        // zk deposit
        const toGasPrice = (await getGasPrice(toChainID === '3' ? '1' : '5'))||0
        const zkDepositGas =
          toGasPrice *
          (isErc20
            ? ZK_ERC20_DEPOSIT_APPROVEL_ONL1 + ZK_ERC20_DEPOSIT_DEPOSIT_ONL1
            : ZK_ETH_DEPOSIT_DEPOSIT_ONL1)
        ethGas += zkDepositGas
      } catch (error) {
        throw new Error('zksync deposit error')
      }
    }
    if (toChainID === '4' || toChainID === '44') {
      const L1ChainID = toChainID == '4' ? 1 : 5
      const L1GasPrice = (await getGasPrice(L1ChainID+''))||0
      const SNDepositL1Gas = L1GasPrice * STARKNET_ETH_DEPOSIT_ONL1
      ethGas += SNDepositL1Gas
    }
    if (toChainID === '6' || toChainID === '66') {
      try {
        // Polygon deposit
        const toGasPrice = (await getGasPrice(toChainID === '6' ? '1' : '5'))||0
        const pgDepositGas = toGasPrice * PG_ERC20_DEPOSIT_DEPOSIT_ONL1
        ethGas += pgDepositGas
      } catch (error) {
        throw new Error('po deposit error')
      }
    }
    if (toChainID === '7' || toChainID === '77') {
      try {
        // op deposit
        const toGasPrice = (await getGasPrice(toChainID === '7' ? '1' : '5'))||0
        const opDepositGas =
          toGasPrice *
          (isErc20
            ? OP_ERC20_DEPOSIT_DEPOSIT_ONL1
            : OP_ETH_DEPOSIT_DEPOSIT_ONL1)
        ethGas += opDepositGas
      } catch (error) {
        throw new Error('op deposit error')
      }
    }
    if (toChainID === '8' || toChainID === '88') {
      try {
        // imx deposit
        const toGasPrice = (await getGasPrice(toChainID === '8' ? '1' : '5')) || 0
        const imxDepositGas =
          toGasPrice *
          (isErc20
            ? IMX_ERC20_DEPOSIT_DEPOSIT_ONL1
            : IMX_ETH_DEPOSIT_DEPOSIT_ONL1)
        ethGas += imxDepositGas
      } catch (error) {
        throw new Error('imx deposit error')
      }
    }
    if (toChainID === '9' || toChainID === '99') {
      try {
        // loopring deposit
        const toGasPrice = (await getGasPrice(toChainID === '9' ? '1' : '5'))||0
        const lpDepositGas =
          toGasPrice *
          (isErc20
            ? LP_ERC20_DEPOSIT_DEPOSIT_ONL1
            : LP_ETH_DEPOSIT_DEPOSIT_ONL1)
        ethGas += lpDepositGas
      } catch (error) {
        throw new Error('loopring deposit error')
      }
    }
    if (toChainID === '10' || toChainID === '510') {
      try {
        // MT deposit
        const toGasPrice = (await getGasPrice(toChainID === '10' ? '1' : '5'))||0
        // MT deposit
        const mtDepositGas = toGasPrice * MT_ERC20_DEPOSIT_DEPOSIT_ONL1
        ethGas += mtDepositGas
      } catch (error) {
        throw new Error('metis deposit error')
      }
    }
    if (toChainID === '11' || toChainID === '511') {
      try {
        // dydx deposit
        const toGasPrice = (await getGasPrice(toChainID === '11' ? '1' : '5'))||0
        const dydxDepositGas = toGasPrice * DYDX_ETH_DEPOSIT_DEPOSIT_ONL1
        ethGas += dydxDepositGas
      } catch (error) {
        throw new Error('metis deposit error')
      }
    }
    if (toChainID === '12' || toChainID === '512') {
      try {
        const toGasPrice = (await getGasPrice(toChainID === '12' ? '1' : '5'))||0
        const zkspaceDepositGas =
          toGasPrice *
          (isErc20
            ? ZKSPACE_ERC20_DEPOSIT_DEPOSIT_ONL1
            : ZKSPACE_ETH_DEPOSIT_DEPOSIT_ONL1)
        ethGas += zkspaceDepositGas
      } catch (error) {
        throw new Error('zkspace deposit error')
      }
    }
    if (toChainID === '13' || toChainID === '513') {
      // BOBA deposit
      const toGasPrice = (await getGasPrice(toChainID))||0
      const depositGas = toGasPrice * BOBA_TRANSFER_IN_LIMIT
      ethGas += depositGas
    }

    if (toChainID === '15' || toChainID === '515') {
      try {
        // MT deposit
        const toGasPrice = (await getGasPrice(toChainID))||0
        // MT deposit
        const mtDepositGas = toGasPrice * 150000
        bscGas += mtDepositGas
      } catch (error) {
        throw new Error('bsc deposit error')
      }
    }
    if (toChainID === '14' || toChainID === '514') {
      // zk2 get
      const toGasPrice = (await getGasPrice(toChainID === '14' ? '1' : '5'))||0
      ethGas =
        toGasPrice *
        (isErc20
          ? ZK2_ERC20_DEPOSIT_DEPOSIT_ONL1
          : ZK2_ETH_DEPOSIT_DEPOSIT_ONL1)
    }
    if (toChainID === '17' || toChainID === '517') {
      // zk2 get
      const toGasPrice = (await getGasPrice(toChainID))||0
      ethGas =
          toGasPrice * PG_EVM_ETH_DEPOSIT_DEPOSIT_ONL1
    }
    if (toChainID === '518' || toChainID === '519') {
      try {
        // scroll get
        const toGasPrice = (await getGasPrice(toChainID))||0
        // scroll DEPOSIT
        ethGas += toGasPrice * SCROLL_ETH_DEPOSIT
      } catch (error) {
        throw new Error('scroll deposit error')
      }
    }

    let usd = new BigNumber(0)
    if (ethGas > 0) {
      usd = usd.plus(
        await exchangeToUsd(new BigNumber(ethGas).dividedBy(10 ** 18))
      )
    }
    if (maticGas > 0) {
      usd = usd.plus(
        await exchangeToUsd(
          new BigNumber(maticGas).dividedBy(10 ** 18),
          'MATIC'
        )
      )
    }
    if (bscGas > 0) {
      usd = usd.plus(
        await exchangeToUsd(new BigNumber(bscGas).dividedBy(10 ** 18), 'BNB')
      )
    }
    if (metisGas > 0) {
      usd = usd.plus(
        await exchangeToUsd(
          new BigNumber(metisGas).dividedBy(10 ** 18),
          'METIS'
        )
      )
    }
    return usd.toNumber()
  }


  return {
    transferSpentGas,
    getTransferBalance,
    getTransferGasLimit,
    getTokenConvertUsd,
    transferOrginGasUsd
  }
}