'use client';

import {useEffect,useRef,useState} from 'react';
import Icon from './Icon';
import {presetRange,type DateRange} from '../lib/date-range';
import {useI18n} from './LanguageProvider';
export type {DateRange} from '../lib/date-range';

export default function DateRangePicker({start,end,onChange}:{start:string;end:string;onChange:(range:DateRange)=>void}){
  const {date,t}=useI18n();
  const [open,setOpen]=useState(false);
  const [customStart,setCustomStart]=useState(start);
  const [customEnd,setCustomEnd]=useState(end);
  const rootRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setCustomStart(start);setCustomEnd(end)},[start,end]);
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!rootRef.current?.contains(event.target as Node))setOpen(false)};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    document.addEventListener('pointerdown',outside);window.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape)};
  },[open]);
  function choose(preset:Parameters<typeof presetRange>[0]){onChange(presetRange(preset));setOpen(false)}
  function custom(nextStart:string,nextEnd:string){setCustomStart(nextStart);setCustomEnd(nextEnd);if(nextStart&&nextEnd&&nextStart<=nextEnd)onChange({start:nextStart,end:nextEnd})}
  const active=Boolean(start&&end);
  const short=(value:string)=>date(value,{day:'numeric',month:'short',year:'numeric'}).replaceAll('.','');
  const label=!start||!end?t('date.all'):start===end?short(start):`${short(start)} – ${short(end)}`;
  return <div className="date-range" ref={rootRef}>
    <div className={`date-range-pill ${active?'active':''}`}>
      <button type="button" className="date-range-open" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><Icon name="calendar" size={18}/><span><small>{t('date.period')} ·</small><b>{label}</b></span></button>
      {active&&<button type="button" className="date-range-clear" aria-label={t('movements.clearFilters')} onClick={()=>onChange({start:'',end:''})}>×</button>}
    </div>
    {open&&<div className="date-range-popover surface" role="dialog" aria-label={t('date.choose')}>
      <div className="date-presets"><button onClick={()=>choose('today')}>{t('date.today')}</button><button onClick={()=>choose('yesterday')}>{t('date.yesterday')}</button><button onClick={()=>choose('this-month')}>{t('date.thisMonth')}</button><button onClick={()=>choose('last-month')}>{t('date.lastMonth')}</button><button onClick={()=>choose('last-30')}>{t('date.last30')}</button></div>
      <div className="custom-range"><b>{t('date.custom')}</b><div><label><span>{t('date.from')}</span><span className="date-themed-input"><Icon name="calendar" size={16}/><input type="date" value={customStart} max={customEnd||undefined} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>custom(event.target.value,customEnd)}/></span></label><label><span>{t('date.to')}</span><span className="date-themed-input"><Icon name="calendar" size={16}/><input type="date" value={customEnd} min={customStart||undefined} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>custom(customStart,event.target.value)}/></span></label></div>{customStart&&customEnd&&customStart>customEnd&&<small className="red">{t('date.invalid')}</small>}</div>
    </div>}
  </div>;
}
