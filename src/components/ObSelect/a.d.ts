
export type DataItem = {
  amount: number,
  icon: string,
  token: string,
  label?:string,
  value?: string,
  iconType?: string
}
type NodeRefType = React.RefObject<HTMLDivElement>
export type  RaiseUpSelectPropType ={
  isShow: boolean,
  datas: Array<DataItem>,
  value: string|number ,
  onChange: (item:any)=>void,
  onCancel: ()=>void,
  node?:NodeRefType
}
export type ObSelectPropsType = {
  datas: Array<DataItem>,
  value: string | number,
  onChange: (item:any)=>void
}