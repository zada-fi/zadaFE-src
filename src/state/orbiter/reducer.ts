import { createSlice } from "@reduxjs/toolkit";
import { TransferDataStateType } from './../../components/Orbiter/bridge'
export const orbiterSlice = createSlice({
  name: 'orbiter',
  initialState: {
    storeTransferDataState: <TransferDataStateType>{
      fromChainID: '',
      toChainID: '',
      transferValue: 0,
      gasFee: 0,
      ethPrice: 0,
      // @ts-ignore
      selectMakerConfig: null,
      fromCurrency: undefined,
      toCurrency: undefined,
      isCrossAddress: undefined,
      crossAddressReceipt: undefined,
      transferExt: undefined
    },
    confirmData: {
      routeDescInfo: [],
    },
    proceedState: 1,
    proceedTXID: null,
    proceeding: {
      userTransfer: {
        localChainID: null,
        from: null,
        to: null,
        amount: null,
        txid: null,
        isConfirmed: null,
        nonce: null,
        timeStamp: null,
      },
      makerTransfer: {
        localChainID: null,
        from: null,
        to: null,
        amount: null,
        txid: null,
        isConfirmed: null,
        nonce: null,
        timeStamp: null,
      },
    },
    zktokenList: {
      rinkeby: [],
      mainnet: [],
    },
    lpTokenList: {
      rinkeby: [],
      mainnet: [],
    },
    zksTokenList: {
      rinkeby: [],
      mainnet: [],
    },
  },
  reducers: {
    updateProceedTxID(state, action) {
      state.proceedTXID = action.payload.txid
      state.proceedState = 1
      state.proceeding.userTransfer.localChainID = null
      state.proceeding.userTransfer.from = null
      state.proceeding.userTransfer.to = null
      state.proceeding.userTransfer.amount = null
      state.proceeding.userTransfer.txid = null
      state.proceeding.userTransfer.isConfirmed = null
      state.proceeding.userTransfer.nonce = null
      state.proceeding.userTransfer.timeStamp = null
      state.proceeding.makerTransfer.localChainID = null
      state.proceeding.makerTransfer.from = null
      state.proceeding.makerTransfer.to = null
      state.proceeding.makerTransfer.amount = null
      state.proceeding.makerTransfer.txid = null
      state.proceeding.makerTransfer.isConfirmed = null
      state.proceeding.makerTransfer.nonce = null
      state.proceeding.makerTransfer.timeStamp = null
    },
    updateProceedingUserTransfer(state, action){
      state.proceeding.userTransfer = {
        ...state.proceeding.userTransfer,
        ...action.payload
      }
    },
    updateProceedingMakerTransfer(state, action){
      state.proceeding.makerTransfer = {
        ...state.proceeding.makerTransfer,
        ...action.payload
      }
    },
    updateProceedState(state, action){
      state.proceedState = action.payload
    },
    updateStoreTransferDataState(state, action) {
      state.storeTransferDataState = action.payload
    },
    updateConfirmRouteDescInfo(state, action) {
      state.confirmData.routeDescInfo = action.payload
    },
    updateLpTokenList(state, action) {
      if (action.payload.chainID + '' === '9') {
        state.lpTokenList.mainnet = action.payload.tokenList
      }
      if (action.payload.chainID + '' === '99') {
        state.lpTokenList.rinkeby = action.payload.tokenList
      }
    },
    updateZKTokenList: (state, action) => {
      if (action.payload.chainID + '' === '3') {
        state.zktokenList.mainnet = action.payload.tokenList
      }
      if (action.payload.chainID + '' === '33') {
        state.zktokenList.rinkeby = action.payload.tokenList
      }
    },
    updateZksTokenList(state, action) {
      if (action.payload.chainID === 12) {
        state.zksTokenList.mainnet = action.payload.tokenList
      }
      if (action.payload.chainID === 512) {
        state.zksTokenList.rinkeby = action.payload.tokenList
      }
    },
  }


})

export const { updateZKTokenList, 
  updateLpTokenList, 
  updateZksTokenList, 
  updateConfirmRouteDescInfo,
   updateStoreTransferDataState,
   updateProceedTxID,
   updateProceedingUserTransfer,
   updateProceedingMakerTransfer,
   updateProceedState,
   
   } = orbiterSlice.actions
export default orbiterSlice.reducer