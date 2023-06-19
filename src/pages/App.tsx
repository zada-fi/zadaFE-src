import React, { Suspense } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'
import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import {
  RedirectDuplicateTokenIds,
  RedirectOldAddLiquidityPathStructure,
  RedirectToAddLiquidity
} from './AddLiquidity/redirects'
import { Faucet } from './Faucet'
//import { Bridge } from './Bridge'
import MigrateV1 from './MigrateV1'
import MigrateV1Exchange from './MigrateV1/MigrateV1Exchange'
import RemoveV1Exchange from './MigrateV1/RemoveV1Exchange'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import Launchpad from './Launchpad'
import Analytics from './Analytics'

import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import OrbiterBridage from './Orbiter/bridage'
import Claim from './Claim'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  min-height: 100vh;
  overflow-x: hidden;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-height: 80vh;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`
const FooterWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  display: flex;
  justify-content: center; 
  margin-bottom: 1rem;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 160px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      padding: 16px;
  `};
  z-index: 1;
`

const Marginer = styled.div`
  margin-top: 5rem;
`


export default function App() {
  return (
    <Suspense fallback={null}>
      <BrowserRouter>
        <Route component={GoogleAnalyticsReporter} />
        <Route component={DarkModeQueryParamReader} />
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Web3ReactManager>
              <Switch>
                <Route exact strict path="/" component={Faucet} />
                {/* <Route exact strict path="/bridge" component={Bridge} /> */}
                {/* <Route exact strict path="/docs" component={Docs} /> */}
                <Route exact strict path="/swap" component={Swap} />
                <Route exact strict path="/launchpad" component={Launchpad}/>
                <Route exact strict path="/claim" component={Claim}></Route>
                <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/orbiter" component={OrbiterBridage}/>
                <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
                <Route exact strict path="/find" component={PoolFinder} />
                <Route exact strict path="/pool" component={Pool} />
                <Route exact strict path="/analytics" component={Analytics}/>
                <Route exact strict path="/create" component={RedirectToAddLiquidity} />
                <Route exact path="/add" component={AddLiquidity} />
                <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                <Route exact path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                <Route exact strict path="/remove/v1/:address" component={RemoveV1Exchange} />
                <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />
                <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
                <Route exact strict path="/migrate/v1" component={MigrateV1} />
                <Route exact strict path="/migrate/v1/:address" component={MigrateV1Exchange} />
                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Web3ReactManager>
            <Marginer />
          </BodyWrapper>
          <FooterWrapper>
          <Footer/>
          </FooterWrapper>
        </AppWrapper>
      </BrowserRouter>
    </Suspense>
  )
}
