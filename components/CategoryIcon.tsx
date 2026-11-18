import Icon from './Icon';import {categoryStyle} from '../lib/category-style';
export default function CategoryIcon({name,size=42}:{name:string;size?:number}){const s=categoryStyle(name);return <span className="category-icon" style={{background:s.color,width:size,height:size}}><Icon name={s.icon} size={Math.round(size*.52)}/></span>}
