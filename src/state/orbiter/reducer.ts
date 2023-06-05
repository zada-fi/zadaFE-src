import { createSlice } from "@reduxjs/toolkit";

export const orbiterSlice = createSlice({
  name:'orbiter',
  initialState:{
    storeTransferDataState:{
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
  reducers:{
    updateStoreTransferDataState(state, action){
      state.storeTransferDataState = action.payload
    },
    updateConfirmRouteDescInfo(state, action) {
      state.confirmData.routeDescInfo = action.payload
    },
    updateLpTokenList(state, action) {
      if (action.payload.chainID+'' === '9') {
        state.lpTokenList.mainnet = action.payload.tokenList
      }
      if (action.payload.chainID+'' === '99') {
        state.lpTokenList.rinkeby = action.payload.tokenList
      }
    },
    updateZKTokenList:(state, action)=> {
      if (action.payload.chainID+'' === '3') {
        state.zktokenList.mainnet = action.payload.tokenList
      }
      if (action.payload.chainID+'' === '33') {
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

export const { updateZKTokenList,updateLpTokenList,updateZksTokenList,updateConfirmRouteDescInfo,updateStoreTransferDataState } = orbiterSlice.actions
export default orbiterSlice.reducer