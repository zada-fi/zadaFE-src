import { useState, useMemo, useEffect } from "react"
import { HistoryPanelStateType } from './bridge'
import { useWeb3React } from "@web3-react/core"
import { NetworkContextName } from "../../constants"
import * as util from './../../utils/orbiter-tool'

export default function useHistroyPanel() {
  let [historyPanelState, setHistoryPanelState] = useState<HistoryPanelStateType>({
    isLoading: false,
    transactionListInfo: {
      current: 1,
      size: 30,
      total: 0,
      pages: 1,
    },
    transactionList: null,
    historyInfo: null,
    isShowHistory: false,
  })
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)
  const walletIsLogin = useMemo(() => {
    return (contextNetwork.active || active)&&account
  }, [active, contextNetwork, account])
  useEffect(() => {
    if (!walletIsLogin) {
      setHistoryPanelState((prev) => {
        return {
          ...prev,
          transactionList: []
        }
      })
    }
  }, [walletIsLogin])


  async function getTransactionsHistory(params: any) {
    setHistoryPanelState((prev) => {
      return {
        ...prev,
        isLoading: true
      }
    })
    const walletAddress = account//compatibleGlobalWalletConf.value.walletPayload.walletAddress
    if (!walletAddress) {
      setHistoryPanelState((prev) => {
        return {
          ...prev,
          isLoading: false
        }
      })
      // historyPanelState.isLoading = false
      return
    }
    const cache = util.getCache(`history_${walletAddress}_${params.current || 1}`)
    try {
      let res;
      if (cache) {
        res = cache;
      } else {
        let response = await fetch(`${process.env.REACT_APP_OPEN_API_URL}/userHistory?address=${walletAddress}&page=${params.current || 1}`);
        let resultData = await response.json()
        let res = resultData.result
        // res = await openApiAx.get(
        //     `/userHistory?address=${ walletAddress }&page=${ params.current || 1 }`
        // );
        util.setCache(`history_${walletAddress}_${params.current || 1}`, res, 10000);
      }
      const { rows, page, total } = res;
      let transactionList = rows.map((row: any) => {
        let decimal = 18
        if (row.fromToken === 'USDC' || row.fromToken === 'USDT') {
          decimal = 6
        }
        const fromDate = new Date(row.fromTime);
        const toDate = new Date(row.toTime);
        row.fromTimeStampShow = util.formatDate(fromDate);
        row.toTimeStampShow = util.formatDate(toDate);
        row.fromTimeStampShowShort = util.formatDate(fromDate, true);
        row.toTimeStampShowShort = util.formatDate(toDate, true);
        row.fromAmountValue = (row.fromAmount / 10 ** decimal).toFixed(8);
        return row;
      })
      let transactionListInfo_current = Number(page || 1)
      let transactionListInfo_total = total * 10
      let isLoading = false

      setHistoryPanelState((prev) => {
        return {
          ...prev,
          isLoading,
          transactionListInfo: {
            ...prev.transactionListInfo,
            current: transactionListInfo_current,
            total: transactionListInfo_total,
          },
          transactionList
        }
      })

    } catch (error) {
      console.error(error)
    } finally {
      // historyPanelState.isLoading = false
      setHistoryPanelState((prev) => {
        return {
          ...prev,
          isLoading: false
        }
      })
    }
  }
  function getTraddingHistory(isRefresh = false) {
    if (walletIsLogin) {
      if (isRefresh) historyPanelState.transactionList = []
      getTransactionsHistory({ current: 1 })
    }
  }
  function setHistoryInfo(info :any, isShowHistory = true) {
    setHistoryPanelState((prev)=>({
      ...prev,
      isShowHistory,
      historyInfo: {
        fromChainID: info.fromChain,
        fromTimeStamp: info.fromTimeStampShow,
        fromTxHash: info.fromHash,
        makerAddress: info.replySender,
        state: 0,
        toChainID: info.toChain,
        toTimeStamp: info.toTimeStampShow,
        toTxHash: info.toHash,
        tokenName:info.toToken,
        userAddress: info.replyAccount,
        userAmount: info.fromAmountValue,
      }
    }))
    
   
  }

  return {
    historyPanelState,
    getTraddingHistory,
    setHistoryInfo
  }
}