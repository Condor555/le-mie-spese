import {findIconEntry} from './category-icon-catalog';

/** Resolve only identifiers from the static allow-list. No saved value becomes a URL. */
export function categoryIconAsset(icon?:string|null){
  if(icon==='amazon')return '/icons/brands/amazon.svg';
  return findIconEntry(icon)?.asset||'/icons/color/tag.svg';
}
