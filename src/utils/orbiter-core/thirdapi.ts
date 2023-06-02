// util/thirdapi.js
// import Axios from '../utils/Axios'
// import axios from 'axios'
import OrbiterOtherConfig from '../../utils/orbiter-config/other'
// Axios.axios()

// const zkConfigNet = OrbiterOtherConfig.zkSync.TestNet
// var arConfigNet = config.arbitrum.Ropsten
// var l1ConfigNet = config.L1.Mainnet
type ZKAccountParamsType = {
  account: string,
  localChainID: number,
  stateType: string,
}
export default {
  getZKAccountInfo: function (req: ZKAccountParamsType) {
    return new Promise(async (resolve, reject) => {
      if (req.localChainID !== 3 && req.localChainID !== 33) {
        reject({
          errorCode: 1,
          errMsg: 'getZKAccountError_wrongChainID',
        })
      }
      const prefix =
        req.localChainID === 33 ? OrbiterOtherConfig.zkSync.TestNet : OrbiterOtherConfig.zkSync.Mainnet
      try {
        let fetchResponse = await fetch(`${prefix}/accounts/${req.account}/${req.stateType}`)
        let response = await fetchResponse.json()
        if (response.status === 200) {
          const respData = response.data
          if (respData.status === 'success') {
            resolve(respData)
          } else {
            reject(respData)
          }
        } else {
          reject({
            errorCode: 1,
            errMsg: 'NetWorkError',
          })
        }
      } catch (error) {
        reject({
          errorCode: 2,
          errMsg: error,
        })
      }
      // axios
      // .get(`${prefix}/accounts/${req.account}/${req.stateType}`)
      // .then(function (response) {
      //   if (response.status === 200) {
      //     const respData = response.data
      //     if (respData.status === 'success') {
      //       resolve(respData)
      //     } else {
      //       reject(respData)
      //     }
      //   } else {
      //     reject({
      //       errorCode: 1,
      //       errMsg: 'NetWorkError',
      //     })
      //   }
      // })
      // .catch(function (error) {
      // reject({
      //   errorCode: 2,
      //   errMsg: error,
      // })
      // })
    })
  },

  // get an account transactionList
  /* req
    localChainID: localChainID,
    account: from,
    from: 'latest',
    limit: 30,
    direction: 'older',
  */
  // getZKInfo: function (req) {
  //   return new Promise((resolve, reject) => {
  //     if (req.localChainID !== 3 && req.localChainID !== 33) {
  //       reject({
  //         errorCode: 1,
  //         errMsg: 'getZKInfoError_wrongChainID',
  //       })
  //     }
  //     const params = {
  //       from: req.from,
  //       limit: req.limit,
  //       direction: req.direction,
  //     }
  //     const prefix =
  //       req.localChainID === 33 ? OrbiterOtherConfig.zkSync.TestNet : OrbiterOtherConfig.zkSync.Mainnet
  //     axios
  //       .get(`${prefix}/accounts/${req.account}/transactions`, {
  //         params,
  //       })
  //       .then(function (response) {
  //         if (response.status === 200) {
  //           const respData = response.data
  //           if (respData.status === 'success') {
  //             resolve(respData)
  //           } else {
  //             reject(respData)
  //           }
  //         } else {
  //           reject({
  //             errorCode: 1,
  //             errMsg: 'NetWorkError',
  //           })
  //         }
  //       })
  //       .catch(function (error) {
  //         reject({
  //           errorCode: 2,
  //           errMsg: error,
  //         })
  //       })
  //   })
  // },
  // getZKTokenInfo: function (req) {
  //   return new Promise((resolve, reject) => {
  //     /* req
  //       token : id / address
  //     */
  //     const url = zkConfigNet + '/tokens/' + req.token
  //     axios
  //       .get(url)
  //       .then(function (response) {
  //         if (response.status === 200) {
  //           const respData = response.data
  //           if (respData.status === 'success') {
  //             resolve(respData)
  //           } else {
  //             reject(respData)
  //           }
  //         } else {
  //           reject({
  //             errorCode: 1,
  //             errMsg: 'NetWorkError',
  //           })
  //         }
  //       })
  //       .catch(function (error) {
  //         reject({
  //           errorCode: 2,
  //           errMsg: error,
  //         })
  //       })
  //   })
  // },
  // getZKTokenList: function (req) {
  //   return new Promise((resolve, reject) => {
  //     /* req
  //       localChainID: localChainID,
  //       from: 0,
  //       limit: 100,
  //       direction: 'newer',
  //     */
  //     const zkSync = OrbiterOtherConfig.zkSync
  //     const baseUrl = req.localChainID === 33 ? zkSync.TestNet : zkSync.Mainnet
  //     const url = `${baseUrl}/tokens?from=${req.from}&limit=${req.limit}&direction=${req.direction}`

  //     axios
  //       .get(url)
  //       .then(function (response) {
  //         if (response.status === 200) {
  //           const respData = response.data
  //           if (respData.status === 'success') {
  //             resolve(respData)
  //           } else {
  //             reject(respData)
  //           }
  //         } else {
  //           reject({
  //             errorCode: 1,
  //             errMsg: 'NetWorkError',
  //           })
  //         }
  //       })
  //       .catch(function (error) {
  //         reject({
  //           errorCode: 2,
  //           errMsg: error,
  //         })
  //       })
  //   })
  // },
}
