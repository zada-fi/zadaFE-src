import { ChainId } from 'zdnfsdk'
import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
  [ChainId.ROPSTEN]: '0x53C43764255c17BD724F74c4eF150724AC50a3ed',
  [ChainId.KOVAN]: '0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A',
  [ChainId.RINKEBY]: '0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821',
  [ChainId.GÖRLI]: '0x77dCa2C955b15e9dE4dbBCf1246B4B85b651e50e',
  [ChainId.SCROLL_ALPHA]: '0xE228a610F11ec741a431ca5BC752Be26C5C34b6A',
  [ChainId.SCROLL_SEPOLIA]: '0x14a65F4123576F6860986f04e2B37fCc5e301f0e',
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
