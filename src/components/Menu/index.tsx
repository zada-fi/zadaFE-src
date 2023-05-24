import React, { useRef } from 'react'
//import { Info, BookOpen, Code, PieChart, MessageCircle } from 'react-feather'
import { Info, BookOpen, Code, MessageCircle } from 'react-feather'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import useToggle from '../../hooks/useToggle'

import { ExternalLink } from '../../theme'

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
  display: none ;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
  display: flex
`};
`

const MenuFlyout = styled.span`
  min-width: 8.125rem;
  background-color: ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
  z-index: 100;
`

const MenuItem = styled(NavLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  text-decoration: none;
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`
const MenuItemLast = styled(ExternalLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  text-decoration: none;
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

//const CODE_LINK = 'https://github.com/Uniswap/uniswap-interface'

export default function Menu() {
  const node = useRef<HTMLDivElement>()
  const [open, toggle] = useToggle(false)

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>
      {open && (
        <MenuFlyout>
          <MenuItem id={`faucet-nav-link`} exact={true}  to={'/'}>
            <Info size={14} />
            Faucet
          </MenuItem>
          <MenuItem id={`swap-nav-link`} to={'/swap'}>
            <MessageCircle size={14} />
            Swap
          </MenuItem>
          <MenuItemLast id={`l1bridge-nav-link`} href="https://scroll.io/alpha/bridge">
            <Code size={14} />
            L1 Bridge
          </MenuItemLast>
          <MenuItemLast id={`l2bridge-nav-link`} href="https://rinkeby.orbiter.finance/">
            <Code size={14} />
            L2 Bridge
          </MenuItemLast>
          <MenuItemLast id="link" href="https://zadafinance.gitbook.io/99009900/">
            <BookOpen size={14} />
            Docs
          </MenuItemLast>
          {/* <MenuItemLast id="link" href="https://uniswap.info/">
            <PieChart size={14} />
            Analytics
          </MenuItemLast> */}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
