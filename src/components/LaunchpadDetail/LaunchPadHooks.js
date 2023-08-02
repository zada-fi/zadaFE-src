import { useMemo } from 'react'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { MaxUint256 } from '@ethersproject/constants'
import LAUNCHPAD_ABI from './abis/Launchpad.json'
import PROJECT_ABI from './abis/Project.json'
import {useSingleContractMultipleMethodData, NEVER_RELOAD} from '../../state/multicall/hooks'
import ERC20_ABI from '../../constants/abis/erc20.json'
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js'

const LAUNCHPAD_INTERFACE = new Interface(LAUNCHPAD_ABI);
const PROJECT_INTERFACE = new Interface(PROJECT_ABI);
const ERC20_INTERFACE = new Interface(ERC20_ABI);
const LAUNCHPAD_ADDRESS = '0x719376dbcEaeBFEF9a90133D69443f3f2552AA41';
export function getPadContractData(){
  console.log('function getPadContractData(){');
  const launchContract = new Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_INTERFACE);
  const res = useSingleContractMultipleMethodData(launchContract, ['getProjects', 'governor'], [['hello'], []], {blocksPerFetch:3});
  res.forEach(it=>console.log(it.result))

}

export function getProjectData(projectAddress, userAddress = '0x0000000000000000000000000000000000000000'){
  console.log('function getProjectData(){');
  const projectContract = new Contract(projectAddress, PROJECT_INTERFACE);
  const res = useSingleContractMultipleMethodData(projectContract, ['totalUSDCReceived', 'maxCap', 'tokenPrice', 'users'], [[], [],[],[userAddress]], {blocksPerFetch:3});
  res.forEach(it=>console.log(it.result))
  //

}

export function getProjectCommonData(projectAddress){
  console.log('getProjectCommonData-enter-', projectAddress)
  const projectContract = new Contract(projectAddress, PROJECT_INTERFACE);
  const res = useSingleContractMultipleMethodData(projectContract, ['minUserCap',
   'maxUserCap','tokenPrice',
   'ERC20Interface','tokenAddress',
   'totalUSDCReceived','maxCap',
   'saleStart', 'saleEnd'], [[], [],[],[],[],[],[],[],[]]);
  console.log('getProjectCommonData- res-', res)
  
  return useMemo(()=>{
      return res.reduce((result,item, index)=>{
      if(item.result&&item.result.length){
        if(index === 3 || index === 4){
          result.push(item.result[0])
        }else if(index === 7 || index === 8){
          result.push(item.result[0].toNumber()* 1000)
        }else{
          result.push(item.result[0].toString())
        }
      }else{
        if(index === 7 || index === 8){
          result.push(0)
        }else{
          result.push('')
        }
      }
      return result
    },[])
  },[res])
  
}
export function getProjectUserData(projectAddress, userAddress){
  console.log('getProjectUserData--', projectAddress, userAddress)
  let methodName = ['users','whiteList','claimedList']
  let projectContract = null
  if(!userAddress || !projectAddress){
    methodName = []
  }else{
    projectContract = new Contract(projectAddress, PROJECT_INTERFACE);
  }
  console.log('getProjectUserData start--')
  
  const res = useSingleContractMultipleMethodData(projectContract, methodName, [[userAddress],[userAddress],[userAddress]]);
  console.log('getProjectUserData--', res)
  return useMemo(()=>{
    let tempList = res.reduce((result,item, index)=>{
      if(item.result&&item.result.length){
        if(index === 0){
          result.push(item.result[0].toString())
        }else{
          result.push(item.result[0])
        }
      }else{
        if(index === 1){
          result.push(false)
        }else if(index === 2){
          result.push(false)
        }else{
          result.push('0')
        }
      }
      return result
    },[])
    console.log('getProjectUserData--tempList=', tempList)
  
    return tempList
  },[res])
  
}

export function getTokenAllowanceAndBalance(tokenAddress,projectAddress, userAddress){
  console.log('getTokenAllowanceAndBalance enter--','token=', tokenAddress,'--proj=',projectAddress, userAddress)
  let methodName = ['allowance', 'balanceOf' ]
  let contract = null
  if(!tokenAddress || !userAddress || !projectAddress){
    // return ['0','0']
    methodName = []
  }else{
    contract = new Contract(tokenAddress, ERC20_INTERFACE);
  }
  console.log('getTokenAllowanceAndBalance start---')
  const res = useSingleContractMultipleMethodData(contract,methodName , [[userAddress, projectAddress], [userAddress]]);
  console.log('getTokenAllowanceAndBalance res---',res)
  return useMemo(()=>{
    let tempList = res.reduce((result, item)=>{
      if(item.result&&item.result.length){
        result.push(item.result[0].toString())
      }else{
        result.push('0')
      }
      return result
    },[]);
    console.log('getTokenAllowanceAndBalance res tempList---',tempList)
    return tempList
  },[res])
  
}
export function getTokenInfo(tokenAddress){
  const contract = new Contract(tokenAddress, ERC20_INTERFACE);
  const res = useSingleContractMultipleMethodData(projectContract, ['symbol', 'decimals' ], [[], []], NEVER_RELOAD);
  return res;
}

export function sendApprove(tokenAddress,projectAddress, signer){
  const contract = new Contract(tokenAddress, ERC20_INTERFACE, signer);
  return contract.approve(projectAddress, MaxUint256)
}

export function sendBuy(projectAddress, amount, signer){
  const contract = new Contract(projectAddress, PROJECT_INTERFACE, signer);
  return contract.buyTokens(amount)
}

export function sendClaim(projectAddress, signer){
  const contract = new Contract(projectAddress, PROJECT_INTERFACE, signer);
  return contract.claimTokens()
}

//0x58e460dEE0bFAd1E40F959dEbef4B096177feedb  tokenA
//0xaA52AA28DBDA222C42Ec29744c7F118b413B6019  tokenB

/** 
 * proj
 * 0xEE5970AE95C802F8BbabeB7b93F0A3482837F244
 * 0x63e2c3Ded1a6892eEce49076Da103b2F1B364907
 * 
 * LaunchPad
 * 0x3D54DDD96959b691BA4fD5C1c522c5a920c1279B
 */

