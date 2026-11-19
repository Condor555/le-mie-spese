import {categoryIconAsset} from '../lib/category-icon-assets';

export default function CategoryColorIcon({icon,size=24,className}:{icon?:string|null;size?:number;className?:string}){
  return <img className={`category-color-icon${className?` ${className}`:''}`} src={categoryIconAsset(icon)} width={size} height={size} alt="" aria-hidden="true" loading="lazy" decoding="async"/>;
}
