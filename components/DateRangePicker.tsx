'use client';

import {useEffect,useRef,useState} from 'react';
import Icon from './Icon';
import {presetRange,rangeLabel,type DateRange} from '../lib/date-range';
export type {DateRange} from '../lib/date-range';

export default function DateRangePicker({start,end,onChange}:{start:string;end:string;onChange:(range:DateRange)=>void}){
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
  return <div className="date-range" ref={rootRef}>
    <div className={`date-range-pill ${active?'active':''}`}>
      <button type="button" className="date-range-open" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><Icon name="calendar" size={18}/><span><small>Periodo ·</small><b>{rangeLabel(start,end)}</b></span></button>
      {active&&<button type="button" className="date-range-clear" aria-label="Cancella solo il filtro periodo" onClick={()=>onChange({start:'',end:''})}>×</button>}
    </div>
    {open&&<div className="date-range-popover surface" role="dialog" aria-label="Scegli periodo">
      <div className="date-presets"><button onClick={()=>choose('today')}>Oggi</button><button onClick={()=>choose('yesterday')}>Ieri</button><button onClick={()=>choose('this-month')}>Questo mese</button><button onClick={()=>choose('last-month')}>Mese scorso</button><button onClick={()=>choose('last-30')}>Ultimi 30 giorni</button></div>
      <div className="custom-range"><b>Intervallo personalizzato</b><div><label><span>Dal</span><span className="date-themed-input"><Icon name="calendar" size={16}/><input type="date" value={customStart} max={customEnd||undefined} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>custom(event.target.value,customEnd)}/></span></label><label><span>Al</span><span className="date-themed-input"><Icon name="calendar" size={16}/><input type="date" value={customEnd} min={customStart||undefined} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>custom(customStart,event.target.value)}/></span></label></div>{customStart&&customEnd&&customStart>customEnd&&<small className="red">La data finale deve seguire quella iniziale.</small>}</div>
    </div>}
  </div>;
}
