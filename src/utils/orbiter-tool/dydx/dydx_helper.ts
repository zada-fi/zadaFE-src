import { DydxClient } from '@dydxprotocol/v3-client'
import { getAccountId } from '@dydxprotocol/v3-client/build/src/lib/db'
import BigNumber from 'bignumber.js'
import { ethers, utils } from 'ethers'
import { ensureWalletNetwork, equalsIgnoreCase } from '../../orbiter-tool'
// import config from '../../core/utils/config'

// import util from '../util'
import otherConfig from '../../orbiter-config/other'
const DYDX_MAKERS = {
  '0x694434EC84b7A8Ad8eFc57327ddD0A428e23f8D5': {
    starkKey:
      '04e69175389829db733f41ae75e7ba59ea2b2849690c734fcd291c94d6ec6017',
    positionId: '60620',
  },
}

const DYDX_CLIENTS = {}
const DYDX_ACCOUNTS = {}

export class DydxHelper {
  chainId = 0
  networkId = 0
  host = ''
  web3 = undefined
  signingMethod = ''
  connector = null

  /**
   * @param {number} chainId
   * @param {Web3 | undefined} web3
   * @param {string} signingMethod TypedData | MetaMask
   */
  constructor(chainId:number, web3: any, signingMethod = 'TypedData', connector: any) {
    if (chainId == 11) {
      this.networkId = 1
      this.host = otherConfig.dydx.Mainnet
    }
    if (chainId == 511) {
      this.networkId = 3
      this.host = otherConfig.dydx.Rinkeby
    }

    this.chainId = chainId
    this.web3 = web3
    this.signingMethod = signingMethod
    this.connector = connector
  }

  /**
   * @param {string} ethereumAddress
   * @param {boolean} alwaysNew
   * @param {boolean} alwaysDeriveStarkKey
   * @returns {Promise<DydxClient>}
   */
  async getDydxClient(
    ethereumAddress = '',
    alwaysNew = false,
    alwaysDeriveStarkKey = false
  ) {
    const dydxClientKey = ethereumAddress.toLowerCase()
    // @ts-ignore 
    const clientOld = DYDX_CLIENTS[dydxClientKey]

    if (clientOld && !alwaysNew) {
      if (alwaysDeriveStarkKey && ethereumAddress) {
        // Reset DyDxClient.private, It will new when use
        clientOld._private = null

        clientOld.starkPrivateKey = await clientOld.onboarding.deriveStarkKey(
          ethereumAddress,
          this.signingMethod
        )
      }

      return clientOld
    }

    if (!this.host) {
      throw new Error('Sorry, miss param [host]')
    }
    // if (!this.web3) {
    //   throw new Error('Sorry, miss param [web3]')
    // }
    // Ensure network
    if (!(await ensureWalletNetwork(this.chainId, this.connector))) {
      throw new Error('Network error')
    }
    const client = new DydxClient(this.host, {
      networkId: this.networkId,
      web3: this.web3,
    })
    if (ethereumAddress && this.web3) {
      const userExists = await client.public.doesUserExistWithAddress(
        ethereumAddress
      )
      if (userExists.exists) {
        if (alwaysDeriveStarkKey) {
          // @ts-ignore 
          client.starkPrivateKey = await client.onboarding.deriveStarkKey(
            ethereumAddress,
            // @ts-ignore 
            this.signingMethod
          )
        }

        const apiCredentials =
          await client.onboarding.recoverDefaultApiCredentials(
            ethereumAddress,
            // @ts-ignore 
            this.signingMethod
          )
        client.apiKeyCredentials = apiCredentials
      } else {
        const keyPair = await client.onboarding.deriveStarkKey(
          ethereumAddress,
          // @ts-ignore 
          this.signingMethod
        )
        // @ts-ignore 
        client.starkPrivateKey = keyPair

        const user = await client.onboarding.createUser(
          {
            starkKey: keyPair.publicKey,
            starkKeyYCoordinate: keyPair.publicKeyYCoordinate,
          },
          ethereumAddress,
          undefined,
          // @ts-ignore 
          this.signingMethod
        )
        client.apiKeyCredentials = user.apiKey
      }
    }
    // @ts-ignore 
    return (DYDX_CLIENTS[dydxClientKey] = client)
  }

  /**
   * @param {string} ethereumAddress
   * @param {boolean} ensureUser
   * @returns {Promise<ethers.BigNumber>}
   */
  async getBalanceUsdc(ethereumAddress:string , ensureUser = true) {
    if (!ethereumAddress) {
      throw new Error('Sorry, miss param [user]')
    }

    let balance = ethers.BigNumber.from(0)

    try {
      // @ts-ignore 
      let dydxClient = DYDX_CLIENTS[ethereumAddress]
      if (ensureUser && !dydxClient) {
        dydxClient = await this.getDydxClient(ethereumAddress, false, false)
      }

      if (dydxClient) {
        const { account } = await dydxClient.private.getAccount(ethereumAddress)
        // @ts-ignore 
        const usdc = parseInt((account.freeCollateral || 0) * 10 ** 6)
        balance = balance.add(usdc)
      }
    } catch (err) {
      console.warn('GetBalanceUsdc failed: ' , err)
    }

    return balance
  }

  /**
   * @param {string} ethereumAddress
   * @param {boolean} alwaysNew
   * @returns {Promise<import('@dydxprotocol/v3-client').AccountResponseObject>}
   */
  async getAccount(ethereumAddress: string, alwaysNew = false) {
    const dydxAccountKey = String(ethereumAddress)
    // @ts-ignore 
    if (DYDX_ACCOUNTS[dydxAccountKey] && !alwaysNew) {
      // @ts-ignore 
      return DYDX_ACCOUNTS[dydxAccountKey]
    }

    const dydxClient = await this.getDydxClient(ethereumAddress, false, false)
    const { account } = await dydxClient.private.getAccount(ethereumAddress)
    // @ts-ignore 
    return (DYDX_ACCOUNTS[dydxAccountKey] = account)
  }

  /**
   * @param {string} ethereumAddress
   * @returns {string}
   */
  getAccountId(ethereumAddress: string ) {
    return getAccountId({ address: ethereumAddress })
  }

  /**
   * @param {string} ethereumAddress
   * @returns {{starkKey: string, positionId: string}}
   */
  getMakerInfo(ethereumAddress: string) {
    //@ts-ignore
    const info = DYDX_MAKERS[ethereumAddress]
    if (!info) {
      throw new Error(`Sorry, miss DYDX_MAKERS: ${ethereumAddress}`)
    }
    return info
  }

  /**
   * @param {string} starkKey ex: 0x0367e161e41f692fc96ee22a8ab313d71bbd310617df4a02675bcfc87a3b708f
   * @param {string} positionId ex: 58011
   * @returns 0x...
   */
  conactStarkKeyPositionId(starkKey: string, positionId: string) {
    let positionIdStr = Number(positionId).toString(16)
    if (positionIdStr.length % 2 !== 0) {
      positionIdStr = `0${positionIdStr}`
    }
    return `${starkKey}${positionIdStr}`
  }

  /**
   * @param {string} data 0x...
   * @returns {{starkKey: string, positionId:string}}
   */
  splitStarkKeyPositionId(data: string) {
    const starkKey = utils.hexDataSlice(data, 0, 32)
    const positionId = parseInt(utils.hexDataSlice(data, 32), 16)
    return { starkKey, positionId: String(positionId) }
  }

  /**
   * @param {string} ethereumAddress 0x...
   * @returns {string}
   */
  generateClientId(ethereumAddress: string) {
    const time = new Date().getTime()
    let temp = Math.random() * 899 + 100
    const rand = parseInt(temp+'')
    let sourceStr = `${ethereumAddress}${time}${rand}`
    if (sourceStr.length % 2 != 0) {
      sourceStr += '0'
    }
    sourceStr = sourceStr.replace(/^0x/i, '')

    return Buffer.from(sourceStr, 'hex').toString('base64')
  }

  /**
   * @param {string} clientId base64 string
   * @returns {string} 0x...
   */
  getEthereumAddressFromClientId(clientId: string) {
    const sourceStr = Buffer.from(clientId, 'base64').toString('hex')
    return utils.hexDataSlice('0x' + sourceStr, 0, 20)
  }

  /**
   * DYDX transfer => Eth transaction
   * @param {any} transfer dYdX transfer
   * @param {string} ethereumAddress 0x...
   * @returns
   */
  static toTransaction(transfer:any, ethereumAddress: string) {
    const timeStampMs = new Date(transfer.createdAt).getTime()
    const nonce = DydxHelper.timestampToNonce(timeStampMs)

    const isTransferIn = equalsIgnoreCase('TRANSFER_IN', transfer.type)
    const isTransferOut = equalsIgnoreCase('TRANSFER_OUT', transfer.type)

    const transaction = {
      timeStamp: parseInt(timeStampMs / 1000 + ''),
      hash: transfer.id,
      nonce,
      blockHash: '',
      transactionIndex: 0,
      from: '',
      to: '',
      value: new BigNumber(
        isTransferIn ? transfer.creditAmount : transfer.debitAmount
      )
        .multipliedBy(10 ** 6)
        .toString(), // Only usdc
      txreceipt_status: transfer.status,
      contractAddress: '', // Only usdc
      confirmations: 0,
    }

    if (isTransferIn) {
      transaction.to = ethereumAddress
    }
    if (isTransferOut) {
      transaction.from = ethereumAddress
    }

    return transaction
  }

  /**
   * The api does not return the nonce value, timestamp(ms) last three number is the nonce
   *  (warnning: there is a possibility of conflict)
   * @param {number | string} timestamp ms
   * @returns {string}
   */
  static timestampToNonce(timestamp: number|string) {
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