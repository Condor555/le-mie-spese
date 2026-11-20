'use client';

import {useEffect,useId,useMemo,useRef,useState} from 'react';
import Icon from './Icon';
import {useI18n} from './LanguageProvider';

export function readableMonth(value:string,locale='it-IT'){
  const [year,month]=value.split('-').map(Number);
  return Number.isFinite(year)&&Number.isFinite(month)?new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1))):value;
}

function parsedYear(value:string){
  const year=Number(value.slice(0,4));
  return Number.isFinite(year)?year:new Date().getFullYear();
}

export default function MonthPicker({value,onChange,className='',label}:{value:string;onChange:(value:string)=>void;className?:string;label?:string}){
  const {localeTag,t}=useI18n();
  const [open,setOpen]=useState(false);
  const [visibleYear,setVisibleYear]=useState(()=>parsedYear(value));
  const [activeMonth,setActiveMonth]=useState(()=>Math.max(0,Number(value.slice(5,7))-1));
  const rootRef=useRef<HTMLDivElement>(null);
  const triggerRef=useRef<HTMLButtonElement>(null);
  const monthRefs=useRef<Array<HTMLButtonElement|null>>([]);
  const dialogId=useId();
  const selectedYear=parsedYear(value);
  const selectedMonth=Math.max(0,Number(value.slice(5,7))-1);

  useEffect(()=>{
    if(!open){setVisibleYear(selectedYear);setActiveMonth(selectedMonth)}
  },[open,selectedYear,selectedMonth]);

  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node))close(false)};
    document.addEventListener('pointerdown',outside);
    requestAnimationFrame(()=>monthRefs.current[activeMonth]?.focus());
    return()=>document.removeEventListener('pointerdown',outside);
  },[open]);

  const options=useMemo(()=>Array.from({length:12},(_,index)=>({name:new Intl.DateTimeFormat(localeTag,{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,index,1))).replace('.',''),value:`${visibleYear}-${String(index+1).padStart(2,'0')}`})),[visibleYear,localeTag]);
  const accessibleLabel=label||t('month.period');

  function show(){
    setVisibleYear(selectedYear);setActiveMonth(selectedMonth);setOpen(true);
  }
  function close(restoreFocus=true){
    setOpen(false);
    if(restoreFocus)requestAnimationFrame(()=>triggerRef.current?.focus());
  }
  function choose(next:string){
    if(next!==value)onChange(next);
    close();
  }
  function moveYear(delta:number){
    setVisibleYear(year=>Math.min(9999,Math.max(1,year+delta)));
    requestAnimationFrame(()=>monthRefs.current[activeMonth]?.focus());
  }
  function triggerKeys(event:React.KeyboardEvent<HTMLButtonElement>){
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();show();
    }
  }
  function gridKeys(event:React.KeyboardEvent<HTMLDivElement>){
    if(event.key==='Escape'){event.preventDefault();close();return}
    if(event.key==='PageUp'){event.preventDefault();moveYear(-1);return}
    if(event.key==='PageDown'){event.preventDefault();moveYear(1);return}
    const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:event.key==='ArrowDown'?3:event.key==='ArrowUp'?-3:0;
    if(delta){
      event.preventDefault();
      const next=Math.min(11,Math.max(0,activeMonth+delta));
      setActiveMonth(next);requestAnimationFrame(()=>monthRefs.current[next]?.focus());
    }else if(event.key==='Home'){
      event.preventDefault();setActiveMonth(0);monthRefs.current[0]?.focus();
    }else if(event.key==='End'){
      event.preventDefault();setActiveMonth(11);monthRefs.current[11]?.focus();
    }else if(event.key==='Tab')setOpen(false);
  }
  function current(){
    const now=new Date();choose(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  }

  return <div ref={rootRef} className={`month-picker ${open?'is-open ':''}${className}`.trim()}>
    <button ref={triggerRef} type="button" className="month-picker-pill" aria-label={`${accessibleLabel}: ${readableMonth(value,localeTag)}. ${t('month.open')}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?dialogId:undefined} onClick={()=>open?close(false):show()} onKeyDown={triggerKeys}>
      <Icon name="calendar" size={21}/><strong>{readableMonth(value,localeTag)}</strong>
    </button>
    {open&&<div id={dialogId} className="month-picker-popover surface" role="dialog" aria-modal="false" aria-label={t('month.choose')}>
      <div className="month-picker-year"><button type="button" aria-label={`${t('month.previousYear')}, ${visibleYear-1}`} onClick={()=>moveYear(-1)}>‹</button><strong aria-live="polite">{visibleYear}</strong><button type="button" aria-label={`${t('month.nextYear')}, ${visibleYear+1}`} onClick={()=>moveYear(1)}>›</button></div>
      <div className="month-picker-grid" role="grid" aria-label={`${t('month.grid')} ${visibleYear}`} onKeyDown={gridKeys}>
        {options.map((option,index)=>{const selected=option.value===value;return <button ref={node=>{monthRefs.current[index]=node}} key={option.value} type="button" role="gridcell" aria-selected={selected} tabIndex={index===activeMonth?0:-1} className={selected?'selected':''} onMouseEnter={()=>setActiveMonth(index)} onClick={()=>choose(option.value)}>{option.name}</button>})}
      </div>
      <div className="month-picker-actions"><button type="button" onClick={current}>{t('month.current')}</button><button type="button" onClick={()=>close()}>{t('month.close')}</button></div>
    </div>}
  </div>;
}
