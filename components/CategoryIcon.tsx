import CategoryPhosphorIcon from './CategoryPhosphorIcon';
import {categoryStyle} from '../lib/category-style';

function pastel(hex:string){
  const clean=hex.replace('#','');
  if(!/^[0-9a-f]{6}$/i.test(clean))return 'rgba(104,115,140,.16)';
  const r=parseInt(clean.slice(0,2),16),g=parseInt(clean.slice(2,4),16),b=parseInt(clean.slice(4,6),16);
  return `rgba(${r},${g},${b},.16)`;
}

export default function CategoryIcon({name,icon,color,size=42}:{name:string;icon?:string|null;color?:string|null;size?:number}){
  const style=categoryStyle(name,{icon:icon||undefined,color:color||undefined});
  return <span className="category-icon" style={{background:pastel(style.color),color:style.color,width:size,height:size}}>
    <CategoryPhosphorIcon icon={style.icon} size={Math.round(size*.54)} color={style.color}/>
  </span>;
}
