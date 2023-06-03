
export type DataItem = {
  amount: number,
  icon: string,
  token: string,
  label?:string,
  value?: string,
  iconType?: string
}

export type ObSelectPropsType = {
  datas: Array<DataItem>,
  value: string | number,
  onChange: (item:any)=>void
}