import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
//import { useTranslation } from 'react-i18next'
import {NavLink} from 'react-router-dom'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  height: 3rem;

${({ theme }) => theme.mediaWidth.upToExtraSmall`
  display: none;
`};
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 20px;
  padding:10px 20px;
  font-weight:500 ;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`
const DocuA = styled.a`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 20px;
  padding:10px 20px;
  font-weight:500;

  :hover{
    color: ${({ theme }) => darken(0.1, theme.text1)};
    font-weight:600;
  }
`


// function clickTab(){
//   let clickDone: boolean = false;

// }


export function HomeTabs() {
  //const { t } = useTranslation()
  //let clickDone: boolean = false;
  //const [faucetIsActive, setfaucetIsActive] = useState<boolean>(true)

  return (
    <Tabs>
      <StyledNavLink id={`faucet-nav-link`} exact={true}  to={'/'}>
        Faucet
      </StyledNavLink>
      <StyledNavLink id={`swap-nav-link`} to={'/swap'} >
        Swap
      </StyledNavLink>
      <DocuA href="https://scroll.io/alpha/bridge" target="_blank" rel="noopener noreferrer" >
       L1 Bridge
      </DocuA>
      <DocuA href="https://rinkeby.orbiter.finance/" target="_blank" rel="noopener noreferrer" >
        L2 Bridge
      </DocuA>
      <DocuA href="https://zadafinance.gitbook.io/99009900/" target="_blank" rel="noopener noreferrer">
        Docs
      </DocuA>
    </Tabs>
  )
}