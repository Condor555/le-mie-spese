import CategoryColorIcon from './CategoryColorIcon';

/** @deprecated Categories use the local color catalog. Kept as a compatibility shim. */
export default function CategoryPhosphorIcon({icon,size=22,className}:{icon?:string|null;size?:number;color?:string;className?:string}){
  return <CategoryColorIcon icon={icon} size={size} className={className}/>;
}
