import React from 'react'
import styled from 'styled-components'

const Content = styled.div`
  width: 100%;
  display: flex;
  flex-flow: column;
  align-items: center;
  font-size: 2.5rem;
`

export function Bridge() {
    //const { t } = useTranslation()
    return (
        <Content> 
            <a href="https://scroll.io/alpha/bridge" target="_blank" rel="noopener noreferrer"> Click here to Bridge</a>
        </Content>
    )
}