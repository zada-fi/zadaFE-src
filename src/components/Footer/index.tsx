import styled from "styled-components";
import React from 'react'
import Twitter from '../../assets/images/twitter.png'
import Discord from '../../assets/images/discord.png'
//import Tooltip from "@mui/material/Tooltip";
//import { SOCIAL_MEDIA_URL } from "../widget/projectParam";
//import { padWidth } from "../widget/utils";


const SOCIAL_MEDIA_URL = {
    'DISCORD': 'https://discord.gg/vepNRG3m9q',
    'TWITTER': 'https://twitter.com/ZadaFinance',
  }

const padWidth = "1024"

const FootertipsDiv = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  font-size:0.75rem;
  padding-top: 0.4rem;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  @media only screen and (max-width: ${padWidth}) {
  font-size:0.5rem;
  padding-top: 0.2rem;
  }
  `;

const SocialMediaImg = styled.img`
  cursor: "pointer";
  width: 2rem;
  @media only screen and (max-width: ${padWidth}) {
  width: 1.2rem;
}
`;
const FooterContainersDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.5rem;
  @media only screen and (max-width: ${padWidth}) {
  padding-top: 0.1rem;
  }
  `;

export default function Footer() {

  return (
    <FooterContainersDiv>
      <div>
        <a
          href= {SOCIAL_MEDIA_URL.DISCORD}
          target="_blank"
          rel="noopener noreferrer">
          <SocialMediaImg
            style={{
              marginRight: "40px",
            }}
            src={Discord}
          />
        </a>
        <a
          href= {SOCIAL_MEDIA_URL.TWITTER}
          target="_blank"
          rel="noopener noreferrer">
          <SocialMediaImg
            src={Twitter}/>
        </a>
      </div>
      <FootertipsDiv>© 2023 ZADA FINANCE. ALL RIGHTS RESERVED</FootertipsDiv>
    </FooterContainersDiv>
  );
}

