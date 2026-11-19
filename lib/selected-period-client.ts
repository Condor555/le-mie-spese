'use client';

import {useCallback,useEffect,useState} from 'react';

const STORAGE_KEY='le-mie-spese:selected-month';
const EVENT_NAME='le-mie-spese:selected-month-changed';
const valid=(value:string|null):value is string=>Boolean(value&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value));
export const currentMonth=()=>new Date().toISOString().slice(0,7);

export function useSharedMonth(){
  const [month,setMonthState]=useState(currentMonth);
  useEffect(()=>{
    const stored=window.localStorage.getItem(STORAGE_KEY);
    if(valid(stored))setMonthState(stored);
    const sync=(event:Event)=>{
      const value=(event as CustomEvent<string>).detail||window.localStorage.getItem(STORAGE_KEY);
      if(valid(value))setMonthState(value);
    };
    window.addEventListener(EVENT_NAME,sync);
    window.addEventListener('storage',sync);
    return()=>{window.removeEventListener(EVENT_NAME,sync);window.removeEventListener('storage',sync)};
  },[]);
  const setMonth=useCallback((value:string)=>{
    if(!valid(value))return;
    setMonthState(value);
    window.localStorage.setItem(STORAGE_KEY,value);
    window.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:value}));
  },[]);
  return {month,setMonth,isCurrent:month===currentMonth()};
}
