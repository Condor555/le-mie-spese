'use client';

import {useRef} from 'react';
import Icon from './Icon';

const formatter=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric',timeZone:'UTC'});
export function readableMonth(value:string){
  const [year,month]=value.split('-').map(Number);
  return Number.isFinite(year)&&Number.isFinite(month)?formatter.format(new Date(Date.UTC(year,month-1,1))):value;
}

export default function MonthPicker({value,onChange,className='',label='Periodo visualizzato'}:{value:string;onChange:(value:string)=>void;className?:string;label?:string}){
  const inputRef=useRef<HTMLInputElement>(null);
  function openPicker(){
    const input=inputRef.current;
    if(!input)return;
    try{input.showPicker?.()}catch{input.focus();input.click()}
  }
  return <div className={`month-picker-pill ${className}`.trim()}>
    <button type="button" className="month-picker-visible" onClick={openPicker} aria-hidden="true" tabIndex={-1}><Icon name="calendar" size={22}/><strong>{readableMonth(value)}</strong></button>
    <input ref={inputRef} className="month-picker-native" type="month" value={value} onChange={event=>onChange(event.target.value)} aria-label={`${label}: ${readableMonth(value)}`}/>
  </div>;
}
