import { TransferDataStateType } from "../../components/Orbiter/bridge"
import otherConfig from "../orbiter-config/other"
import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'
import * as zksync from 'zksync'
import { private_key_to_pubkey_hash, sign_musig } from 'zksync-crypto'

type ZKspaceBalanceReq = {
  account: string,
  localChainID: number
}
export default {
  getZKspaceBalance: async function (req: ZKspaceBalanceReq) {
    if (req.localChainID !== 12 && req.localChainID !== 512) {
      throw new Error('getZKSpaceBalance Error: wrongChainID')
    }
    const url = `${req.localChainID === 512 ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet
      }/account/${req.account}/balances`
    try {
      let fetchReponse = await fetch(url)
      let response = await fetchReponse.json()
      // const response = await axios.get(url)
      if (response.status === 200 && response.data.success) {
        return response.data.data.balances.tokens
      } else {
        throw new Error('getZKSpaceBalance error: response.status not 200')
      }
    } catch (error) {
      // @ts-ignore 
      throw new Error(`getZKSpaceBalance error: ${(error || {}).message || ''}`)
    }
  },

  getZKSpaceTransferGasFee: async function (localChainID: number, account: string, transferDataState: TransferDataStateType) {
    if (!account) {
      return 0
    }
    const ethPrice = transferDataState.ethPrice
      ? transferDataState.ethPrice
      : 2000

    if (localChainID !== 12 && localChainID !== 512) {
      throw new Error('getZKSpaceTransferGasFee：wrongChainID')
    }
    const url = `${localChainID === 512 ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet
      }/account/${account}/fee`
    try {
      let fetchRes = await fetch(url) // await axios.get(url)
      const response = await fetchRes.json()
      if (response.status === 200) {
        const respData = response.data
        if (respData.success === true) {
          const gasFee = new BigNumber(respData.data.transfer).dividedBy(
            new BigNumber(ethPrice)
          )
          const gasFee_fix = gasFee.decimalPlaces(6, BigNumber.ROUND_UP)
          return Number(gasFee_fix)
        } else {
          throw new Error('getZKSpaceGasFee->respData.success no true')
        }
      } else {
        throw new Error('getZKSpaceGasFee->response.status not 200')
      }
    } catch (error) {
      throw new Error('getZKSpaceGasFee->network error')
    }
  },

  /**
   *
   * @param {localChianID,account} req
   * @returns
   */
  getZKAccountInfo: function (localChainID: number, account: string) {
    return new Promise((resolve, reject) => {
      if (localChainID !== 12 && localChainID !== 512) {
        reject({
          errorCode: 1,
          errMsg: 'getZKSpaceAccountInfoError_wrongChainID',
        })
      }
      const url =
        (localChainID === 512
          ? otherConfig.ZKSpace.Rinkeby
          : otherConfig.ZKSpace.Mainnet) +
        '/account/' +
        account +
        '/' +
        'info'
      // axios
      //   .get(url)
      fetch(url).then(res => res.json())
        .then(function (response) {
          if (response.status === 200) {
            const respData = response.data
            if (respData.success == true) {
              resolve(respData.data)
            } else {
              reject(respData.data)
            }
          } else {
            reject({
              errorCode: 1,
              errMsg: 'NetWorkError',
            })
          }
        })
        .catch(function (error) {
          reject({
            errorCode: 2,
            errMsg: error,
          })
        })
    })
  },

  sendTransfer: async function (localChainID: number, req: any) {
    if (localChainID !== 12 && localChainID !== 512) {
      return {
        code: '1',
        error: 'sendZKSpaceTransferError_wrongChainID',
      }
    }
    let tempUrl = (localChainID === 512 ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet) +
      '/tx'
    let fetchResponse = await fetch(
      tempUrl,
      {
        method: 'POST',
        body: JSON.stringify({
          signature: req.signature,
          fastProcessing: req.fastProcessing,
          tx: req.tx,
        })
      }
    )
    const response = await fetchResponse.json()
    return response
  },

  getZKSpaceTransactionData: async function (localChainID: number, txHash: any) {
    if (localChainID !== 12 && localChainID !== 512) {
      throw new Error('getZKTransactionDataError_wrongChainID')
    }
    const url =
      (localChainID === 512 ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet) +
      '/tx/' +
      txHash
    let fetchResp = await fetch(url)
    const response = await fetchResp.json()//await axios.get(url)

    if (response.status === 200) {
      const respData = response.data
      if (respData.success === true) {
        return respData
      } else {
        throw new Error(respData)
      }
    } else {
      throw new Error('getZKSpaceTransactionData NetWorkError')
    }
  },
  getZKSpaceWithDrawGasFee: async function (localChainID: string, account: any, transferDataState: TransferDataStateType) {
    if (!account) {
      return
    }
    const ethPrice = transferDataState.ethPrice
      ? transferDataState.ethPrice
      : 2000

    if (localChainID !== '12' && localChainID !== '512') {
      throw new Error('getZKSpaceGasFeeError：wrongChainID')
    }
    const url = `${localChainID === '512' ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet
      }/account/${account}/fee`
    try {
      // const response = await axios.get(url)
      let fetchResp = await fetch(url)
      let response = await fetchResp.json()
      if (response.status === 200 && response.data.success) {
        const respData = response.data
        const gasFee = new BigNumber(respData.data.withdraw).dividedBy(
          new BigNumber(ethPrice)
        )
        const gasFee_fix = gasFee.decimalPlaces(6, BigNumber.ROUND_UP)
        return Number(gasFee_fix)
      }
      throw new Error('getZKSpaceWithDrawGasFee response.status not 200')
    } catch (error) {
      throw new Error(`getZKSpaceWithDrawGasFee error：${error}`)
    }
  },
  async getL1SigAndPriVateKey(signer: any) {
    try {
      const msg =
        'Access ZKSwap account.\n\nOnly sign this message for a trusted client!'
      const signature = await signer.signMessage(msg)
      const seed = ethers.utils.arrayify(signature)
      const privateKey = await zksync.crypto.privateKeyFromSeed(seed)
      return privateKey
    } catch (error) {
      // @ts-ignore 
      throw new Error(`getL1SigAndPriVateKey error ${error.message}`)
    }
  },

  async getL2SigTwoAndPK(
    signer: any,
    accountInfo: any,
    transferValue: any,
    fee: any,
    zksChainID: any,
    tokenInfo: any,
    transferDataState: TransferDataStateType
  ) {
    const { selectMakerConfig } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return {}
    }
    try {
      const l2MsgParams = {
        accountId: accountInfo.id,
        to: selectMakerConfig.recipient,
        tokenSymbol: tokenInfo ? tokenInfo.symbol : 'ETH',
        tokenAmount: ethers.utils.formatUnits(
          transferValue,
          tokenInfo.decimals
        ),
        feeSymbol: 'ETH',
        fee: fee.toString(),
        zksChainID,
        nonce: accountInfo.nonce,
      }
      const l2Msg =
        `Transfer ${l2MsgParams.tokenAmount} ${l2MsgParams.tokenSymbol}\n` +
        `To: ${l2MsgParams.to.toLowerCase()}\n` +
        `Chain Id: ${l2MsgParams.zksChainID}\n` +
        `Nonce: ${l2MsgParams.nonce}\n` +
        `Fee: ${l2MsgParams.fee} ${l2MsgParams.feeSymbol}\n` +
        `Account Id: ${l2MsgParams.accountId}`
      return await signer.signMessage(l2Msg)
    } catch (error) {
      // @ts-ignore 
      throw new Error(`getL2SigTwoAndPK error ${error.message}`)
    }
  },
  getL2SigOneAndPK(
    privateKey: any,
    accountInfo: any,
    walletAccount: string,
    tokenId: number,
    transferValue: any,
    feeTokenId: any,
    transferFee: any,
    zksChainID: any,
    transferDataState: TransferDataStateType
  ) {
    const { selectMakerConfig } = transferDataState
    if (!selectMakerConfig || Object.keys(selectMakerConfig).length === 0) {
      return {}
    }
    const msgBytes = ethers.utils.concat([
      '0x05',
      zksync.utils.numberToBytesBE(accountInfo.id, 4),
      walletAccount,
      selectMakerConfig.recipient,
      zksync.utils.numberToBytesBE(tokenId, 2),
      zksync.utils.packAmountChecked(transferValue),
      zksync.utils.numberToBytesBE(feeTokenId, 1),
      zksync.utils.packFeeChecked(transferFee),
      zksync.utils.numberToBytesBE(zksChainID, 1),
      zksync.utils.numberToBytesBE(accountInfo.nonce, 4),
    ])
    const signaturePacked = sign_musig(privateKey, msgBytes)
    const pubKey = ethers.utils.hexlify(signaturePacked.slice(0, 32)).substr(2)
    const l2SignatureOne = ethers.utils
      .hexlify(signaturePacked.slice(32))
      .substr(2)
    return { pubKey, l2SignatureOne }
  },

  async getAccountInfo(fromChainID: number, privateKey: any, signer: any, walletAccount: string) {
    try {
      const accountInfo = await this.getZKAccountInfo(
        fromChainID,
        walletAccount
      )
      // @ts-ignore 
      if (accountInfo && accountInfo.pub_key_hash ==
        'sync:0000000000000000000000000000000000000000'
      ) {
        const new_pub_key_hash = await this.registerAccount(
          accountInfo,
          privateKey,
          fromChainID,
          signer,
          walletAccount
        )
        // @ts-ignore 
        accountInfo.pub_key_hash = new_pub_key_hash
        // @ts-ignore 
        accountInfo.nonce = accountInfo.nonce + 1
      }
      return accountInfo
    } catch (error) {
      // @ts-ignore 
      throw new Error(`getAccountInfo error ${error.message}`)
    }
  },
  async registerAccount(
    accountInfo: any,
    privateKey: any,
    fromChainID: number,
    signer: any,
    walletAccount: string
  ) {
    try {
      const pubKeyHash = ethers.utils
        .hexlify(private_key_to_pubkey_hash(privateKey))
        .substr(2)
      const hexlifiedAccountId = this.toHex(accountInfo.id, 4)
      const hexlifiedNonce = this.toHex(accountInfo.nonce, 4)
      // Don't move here any way and don't format it anyway!!!
      // Don't move here any way and don't format it anyway!!!
      // Don't move here any way and don't format it anyway!!!
      // Don't move here any way and don't format it anyway!!!
      // Don't move here any way and don't format it anyway!!!
      const resgiterMsg = `Register ZKSwap pubkey:

${pubKeyHash}
nonce: ${hexlifiedNonce}
account id: ${hexlifiedAccountId}

Only sign this message for a trusted client!`

      const registerSignature = await signer.signMessage(resgiterMsg)
      const url = `${fromChainID == 512 ? otherConfig.ZKSpace.Rinkeby : otherConfig.ZKSpace.Mainnet
        }/tx`
      let fetchResponse = await fetch(
        url, {
        method: 'POST',
        body: JSON.stringify({
          signature: null,
          fastProcessing: null,
          extraParams: null,
          tx: {
            account: walletAccount,
            accountId: accountInfo.id,
            ethSignature: registerSignature,
            newPkHash: 'sync:' + pubKeyHash,
            nonce: 0,
            type: 'ChangePubKey',
          },
        }),
        headers: {
          'zk-account': walletAccount,
        },

      }

      )
      const transferResult = await fetchResponse.json()
      if (transferResult.status == 200 && transferResult.data.success) {
        return transferResult.data
      } else {
        throw new Error('registerAccount fail')
      }
    } catch (error) {
      // @ts-ignore 
      throw new Error(`registerAccount error ${error.message}`)
    }
  },
  toHex(num: number, length: number) {
    const charArray = ['a', 'b', 'c', 'd', 'e', 'f']
    const strArr = Array(length * 2).fill('0')
    let i = length * 2 - 1
    while (num > 15) {
      const yushu = num % 16
      if (yushu >= 10) {
        const index = yushu % 10
        strArr[i--] = charArray[index]
      } else {
        strArr[i--] = yushu.toString()
      }
      num = Math.floor(num / 16)
    }

    if (num != 0) {
      if (num >= 10) {
        const index = num % 10
        strArr[i--] = charArray[index]
      } else {
        strArr[i--] = num.toString()
      }
    }
    strArr.unshift('0x')
    const hex = strArr.join('')
    return hex
  },
}
