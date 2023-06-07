import React from "react";

type SvgiconPropsType = {
  iconName: string,
  className?: string
}
// @ts-ignore 
const requireAll = (requireContext: __WebpackModuleApi.requireContext) => requireContext.keys().map(requireContext)
// @ts-ignore 
const req = require.context('../../icons/svg', true, /\.svg$/)
requireAll(req)
// @ts-ignore 
const req2 = require.context('../../icons/v2', true, /\.svg$/)
requireAll(req2)
// @ts-ignore 
const req3 = require.context('../../icons/tokenlogos', true, /\.svg$/)
requireAll(req3)


export default function SvgIcon(props: SvgiconPropsType){
  return ( <svg className={`svg ${props.className||''}`}>
  <use xlinkHref={`#${props.iconName || 'tokenLogo'}`} />
</svg>)
}