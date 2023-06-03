
export type DataItem = {
  amount: number,
  icon: string,
  token: string,
  label?:string,
  value?: string,
  iconType?: string
}
export type  RaiseUpSelectPropType ={
  isShow: boolean,
  datas: Array<DataItem>,
  value: string|number ,
  onChange: (item:any)=>void,
  onCancel: ()=>void
}
export type ObSelectPropsType = {
  datas: Array<DataItem>,
  value: string | number,
  onChange: (item:any)=>void
}