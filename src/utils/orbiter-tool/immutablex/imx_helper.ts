import { ETHTokenType, ImmutableXClient } from '@imtbl/imx-sdk'
import { ethers, providers } from 'ethers'
import Web3 from 'web3'
import otherConfig from '../../orbiter-config/other'
import {  provider } from 'web3-core';
// import { compatibleGlobalWalletConf } from '../../composition/walletsResponsiveData'
const CONTRACTS = {
  ropsten: {
    starkContractAddress: '0x7917eDb51ecD6CdB3F9854c3cc593F33de10c623',
    registrationContractAddress: '0x1C97Ada273C9A52253f463042f29117090Cd7D83',
  },
  mainnet: {
    starkContractAddress: '0x5FDCCA53617f4d2b9134B29090C87D01058e27e9',
    registrationContractAddress: '0x72a06bf2a1CE5e39cBA06c0CAb824960B587d64c',
  },
}

const IMMUTABLEX_CLIENTS = {}
type ErrorType = {
  message: string
} | any
export class IMXHelper {
  publicApiUrl = ''
  starkContractAddress = ''
  registrationContractAddress = ''

  /**
   * @param {number} chainId
   */
  constructor(chainId: number) {
    if (chainId == 8) {
      this.publicApiUrl = otherConfig.immutableX.Mainnet
      this.starkContractAddress = CONTRACTS.mainnet.starkContractAddress
      this.registrationContractAddress =
        CONTRACTS.mainnet.registrationContractAddress
    }
    if (chainId == 88) {
      this.publicApiUrl = otherConfig.immutableX.Rinkeby
      this.starkContractAddress = CONTRACTS.ropsten.starkContractAddress
      this.registrationContractAddress =
        CONTRACTS.ropsten.registrationContractAddress
    }
  }

  /**
   * @param {string | number | undefined} addressOrIndex
   * @param {boolean} alwaysNew
   * @returns {Promise<ImmutableXClient>}
   */
  async getImmutableXClient( userWalletProvider: any, addressOrIndex = '', alwaysNew = false): Promise<ImmutableXClient> {
    const immutableXClientKey = String(addressOrIndex)
    // @ts-ignore 
    if (IMMUTABLEX_CLIENTS[immutableXClientKey] && !alwaysNew) {
      // @ts-ignore 
      return IMMUTABLEX_CLIENTS[immutableXClientKey]
    }

    if (!this.starkContractAddress) {
      throw new Error('Sorry, miss param [starkContractAddress]')
    }
    if (!this.registrationContractAddress) {
      throw new Error('Sorry, miss param [registrationContractAddress]')
    }
    let signer

    if (addressOrIndex) {
      const web3Provider = new Web3(userWalletProvider as provider)
      // compatibleGlobalWalletConf.value.walletPayload.provider
      const provider = new providers.Web3Provider(web3Provider.currentProvider as providers.ExternalProvider)
      signer = provider.getSigner(addressOrIndex)
    }
    const client = await ImmutableXClient.build({
      publicApiUrl: this.publicApiUrl,
      signer,
      starkContractAddress: this.starkContractAddress,
      registrationContractAddress: this.registrationContractAddress,
    })
    // @ts-ignore 
    return (IMMUTABLEX_CLIENTS[immutableXClientKey] = client)
  }

  /**
   * @param {string} user
   * @param {string} s
   * @returns {Promise<ethers.BigNumber>}
   */
  async getBalanceBySymbol(user: string, tokenName = 'ETH', userWalletProvider:any) {
    if (!user) {
      throw new Error('Sorry, miss param [user]')
    }
    if (!tokenName) {
      throw new Error('Sorry, miss param [s]')
    }

    let balance = ethers.BigNumber.from(0)

    try {
      const imxc = await this.getImmutableXClient(userWalletProvider)
      const data = await imxc.listBalances({ user })

      if (!data.result) {
        return balance
      }

      for (const item of data.result) {
        if (item.symbol.toUpperCase() != tokenName.toUpperCase()) {
          continue
        }

        balance = balance.add(item.balance)
      }
    } catch (err) {
      console.warn('GetBalanceBySymbol failed: ' + err)
    }

    return balance
  }

  
  /**
   * @param {string} user
   */
  async ensureUser(user: string, userWalletProvider: any) {
    if (!user) {
      throw new Error('Sorry, miss param [user]')
    }

    try {
      const imxClient = await this.getImmutableXClient(userWalletProvider)
      await imxClient.getUser({ user })
    } catch (err) {
      let tempErr = err as ErrorType
      if (!tempErr.message || !/account_not_found/i.test(tempErr.message)) {
        throw err
      }
      const userClient = await this.getImmutableXClient(userWalletProvider,user)
      await userClient.registerImx({
        etherKey: userClient.address,
        starkPublicKey: userClient.starkPublicKey,
      })
    }
  }

  /**
   * IMX transfer => Eth transaction
   * @param {any} transfer IMX transfer
   * @returns
   */
  toTransaction(transfer: any) {
    const timeStampMs = transfer.timestamp.getTime()
    const nonce = this.timestampToNonce(timeStampMs)

    // When it is ETH
    let contractAddress = transfer.token.data.token_address
    if (transfer.token.type == ETHTokenType.ETH) {
      contractAddress = '0x0000000000000000000000000000000000000000'
    }

    const transaction = {
      timeStamp: parseInt((timeStampMs / 1000)+''),
      hash: transfer.transaction_id,
      nonce,
      blockHash: '',
      transactionIndex: 0,
      from: transfer.user,
      to: transfer.receiver,
      value: transfer.token.data.quantity + '',
      txreceipt_status: transfer.status,
      contractAddress,
      tokenDecimal: transfer.token.data.decimals,
      confirmations: 0,
    }

    return transaction
  }

  /**
   * The api does not return the nonce value, timestamp(ms) last three number is the nonce
   *  (warnning: there is a possibility of conflict)
   * @param {number | string} timestamp ms
   * @returns {string}
   */
  timestampToNonce(timestamp: number|string): string {
    let nonce = 0

    if (timestamp) {
      timestamp = String(timestamp)
      const match = timestamp.match(/(\d{3})$/i)
      if (match && match.length > 1) {
        nonce = Number(match[1]) || 0
      }

      if (nonce > 900) {
        nonce = nonce - 100
      }
    }

    return nonce + ''
  }
}
