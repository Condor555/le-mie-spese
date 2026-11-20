import {TagIcon} from '@phosphor-icons/react/ssr';

/** Compatibility fallback only. Category artwork itself is resolved from Icons8. */
export default function CategoryPhosphorIcon({size=22,color='currentColor',className}:{icon?:string|null;size?:number;color?:string;className?:string}){
  return <TagIcon size={size} color={color} weight="duotone" className={className} aria-hidden/>;
}
