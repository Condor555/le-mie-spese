export const ACTIVE_SPACE_CHANGED='le-mie-spese:active-space-changed';

export type ActiveSpaceChangedDetail={spaceId:string};

export function announceActiveSpace(spaceId:string){
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent<ActiveSpaceChangedDetail>(ACTIVE_SPACE_CHANGED,{detail:{spaceId}}));
}

export function onActiveSpaceChanged(listener:(spaceId:string)=>void){
  if(typeof window==='undefined')return()=>{};
  const handler=(event:Event)=>listener((event as CustomEvent<ActiveSpaceChangedDetail>).detail.spaceId);
  window.addEventListener(ACTIVE_SPACE_CHANGED,handler);
  return()=>window.removeEventListener(ACTIVE_SPACE_CHANGED,handler);
}
