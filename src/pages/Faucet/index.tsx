import React from 'react'
import styled from 'styled-components'
import { ButtonLight } from '../../components/Button'
//import { getContract, getSigner } from '../../utils'
import AppBody from '../AppBody'
//import ZADA_FAUCET_ABI from '../../constants/abis/zada_faucet.json'
import { useActiveWeb3React } from '../../hooks'
import { darken } from 'polished'
import { ChainId } from 'zdnfsdk'

//import {useWalletModalToggle } from '../../state/application/hooks'



const FaucetTitle = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  outline: none;
  text-decoration: none;
  color: ${({ theme }) => theme.text1};
  font-size: 20px;
  padding:10px 20px;
`
const FaucetTips = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  outline: none;
  text-decoration: none;
  color: ${({ theme }) => theme.text1};
  font-size: 16px;
  padding-top: 10px;
  padding-left: 20px;
  padding-right: 20px;
  text-align: center;
  line-height: 28px;
`

const DocuA = styled.a`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.primaryText1};
  font-size: 14px;
  font-style: italic;
  text-decoration: underline;
  font-weight:500;
  margin-bottom: 26px;

  :hover{
    color: ${({ theme }) => darken(0.1, theme.primaryText1)};
    font-weight:600;
  }
`
//const FaucetContractAddress = "0x3b11769B5332Efb999606c06563fC371dE6eF90A"
//const ZDATokenractAddress = "0x457F5Bacd72a096B78CAA6E4cC27c1b5175746c3"

export function Faucet() {
  //const { t } = useTranslation()
  // toggle wallet when disconnected
  //const toggleWalletModal = useWalletModalToggle()
  const { account, library, connector } = useActiveWeb3React()

  const requestTokens = async () => {
    if (!library || !connector) {
      return;
    }
    if (!account) {//没有连接钱包或者是非scroll网络
      var scrollchainId = '0x' + ChainId.SCROLL_ALPHA.toString(16)
      try {
        await (window.ethereum as any)?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: scrollchainId }]
        })
      } catch (switchError) {
        if (switchError?.code === 4902) {
          try {
            const data = [{
              chainId: scrollchainId,
              chainName: 'Scroll Alpha',
              nativeCurrency:
              {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: [process.env.REACT_APP_NETWORK_URL],
              blockExplorerUrls: ['https://blockscout.scroll.io/'],
            }]
            await (window.ethereum as any)?.request({
              method: 'wallet_addEthereumChain',
              params: data
            })
          } catch (error) {
            console.error("wallet_addEthereumChain", error)
          }
        }
      }
      return;
    }

    // try {
    //   const contract = getContract(FaucetContractAddress, ZADA_FAUCET_ABI, library, account).connect(getSigner(library, account));
    //   const tx = await contract.FaucetClaim(ZDATokenractAddress);
    //   const response = await tx.wait();
    // } catch (error) {
    //   const data = error.data;
    //   if (data !== null || data !== undefined || data !== "") {
    //     const message = data.message
    //     if (message) {
    //       alert(message)
    //     }
    //   }
    //   //throw error
    // }

    const text = `I'm+claiming+testnet+tokens+for+%40ZadaFinance%2C+the+first+cross-rollup+DEX+built+on+Scroll Alpha.+%0AZada+Finance+testnet+has+been+launched:+https://zadafinance.com+%0A%0AMy+Address:+${account}`
    const twitterText = `https://twitter.com/intent/tweet?text=${text}`
    window.open(twitterText, '_blank');
  }

  return (
    <AppBody>
      <FaucetTitle>
        Retweet to get 10 ZDA
      </FaucetTitle>
      <FaucetTips>
        Funds you receive through the Zada faucet are not real funds. Request tokens every 24h and receive 10 ZDA per request. Please click the Retweet button bellow then retweet to get 10 ZDA.
      </FaucetTips>
      <DocuA href="https://blockscout.scroll.io/address/0x457F5Bacd72a096B78CAA6E4cC27c1b5175746c3" target="_blank" rel="noopener noreferrer">
        ZDA Contract Address
      </DocuA>
      <ButtonLight onClick={() => { requestTokens() }}>Retweet</ButtonLight>
    </AppBody>
  )
}