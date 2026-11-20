'use client';

import {useEffect,useId,useRef,useState} from 'react';
import Icon from './Icon';

export type MovementFilterOption={value:string;label:string};

type Props={
  label:string;
  value:string;
  options:MovementFilterOption[];
  onChange:(value:string)=>void;
  disabled?:boolean;
};

export default function MovementFilterDropdown({label,value,options,onChange,disabled=false}:Props){
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(0);
  const rootRef=useRef<HTMLDivElement>(null);
  const triggerRef=useRef<HTMLButtonElement>(null);
  const optionRefs=useRef<Array<HTMLButtonElement|null>>([]);
  const listboxId=useId();
  const selectedIndex=Math.max(0,options.findIndex(option=>option.value===value));
  const selected=options[selectedIndex]||options[0];

  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node))setOpen(false)};
    document.addEventListener('pointerdown',outside);
    return()=>document.removeEventListener('pointerdown',outside);
  },[open]);

  useEffect(()=>{
    if(open)requestAnimationFrame(()=>optionRefs.current[activeIndex]?.focus());
  },[open,activeIndex]);

  useEffect(()=>{
    if(!options.some(option=>option.value===value)&&options.length)setActiveIndex(0);
  },[options,value]);

  useEffect(()=>{
    setActiveIndex(index=>Math.min(Math.max(0,index),Math.max(0,options.length-1)));
  },[options.length]);

  function show(index=selectedIndex){
    if(disabled||!options.length)return;
    setActiveIndex(Math.max(0,index));setOpen(true);
  }
  function close(restoreFocus=true){
    setOpen(false);
    if(restoreFocus)requestAnimationFrame(()=>triggerRef.current?.focus());
  }
  function choose(next:string){
    if(next!==value)onChange(next);
    close();
  }
  function triggerKeys(event:React.KeyboardEvent<HTMLButtonElement>){
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();show(selectedIndex);
    }
  }
  function listKeys(event:React.KeyboardEvent<HTMLDivElement>){
    if(event.key==='ArrowDown'){
      event.preventDefault();setActiveIndex(index=>(index+1)%options.length);
    }else if(event.key==='ArrowUp'){
      event.preventDefault();setActiveIndex(index=>(index-1+options.length)%options.length);
    }else if(event.key==='Home'){
      event.preventDefault();setActiveIndex(0);
    }else if(event.key==='End'){
      event.preventDefault();setActiveIndex(options.length-1);
    }else if(event.key==='Enter'||event.key===' '){
      event.preventDefault();const option=options[activeIndex];if(option)choose(option.value);
    }else if(event.key==='Escape'){
      event.preventDefault();close();
    }else if(event.key==='Tab')setOpen(false);
    else if(event.key.length===1&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
      const needle=event.key.toLocaleLowerCase('it');
      const next=options.findIndex((option,index)=>index>activeIndex&&option.label.toLocaleLowerCase('it').startsWith(needle));
      const wrapped=options.findIndex(option=>option.label.toLocaleLowerCase('it').startsWith(needle));
      const target=next>=0?next:wrapped;
      if(target>=0){event.preventDefault();setActiveIndex(target)}
    }
  }

  return <div ref={rootRef} className={`movement-filter-dropdown${open?' is-open':''}`}>
    <button ref={triggerRef} type="button" className="movement-filter-trigger" aria-label={`${label}: ${selected?.label||'nessuna'}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listboxId:undefined} disabled={disabled||!options.length} onClick={()=>open?close(false):show()} onKeyDown={triggerKeys}>
      <span><small>{label}</small><strong>{selected?.label||'Seleziona'}</strong></span><Icon name="arrowDown" size={15}/>
    </button>
    {open&&<div id={listboxId} className="movement-filter-list surface" role="listbox" aria-label={label} onKeyDown={listKeys}>
      {options.map((option,index)=>{const chosen=option.value===value;return <button ref={node=>{optionRefs.current[index]=node}} key={option.value||'__all__'} type="button" role="option" aria-selected={chosen} tabIndex={index===activeIndex?0:-1} className={chosen?'selected':''} onMouseEnter={()=>setActiveIndex(index)} onClick={()=>choose(option.value)}><span>{option.label}</span><b aria-hidden="true">{chosen?'✓':''}</b></button>})}
    </div>}
  </div>;
}
