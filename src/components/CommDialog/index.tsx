import React from "react"

type CommonDialogPropsType = {
  isShow: false
}

export default function CommonDialog(props: CommonDialogPropsType){
  if(props.isShow === false){
    return null
  }
  return (
    <div className="comm-dialog-box">

    </div>
  )
}