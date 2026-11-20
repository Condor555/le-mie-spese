'use client';

import Icon from './Icon';

type Props={
  value:string;
  onChange:(value:string)=>void;
  id?:string;
  disabled?:boolean;
  min?:string;
  max?:string;
  ariaLabel:string;
};

/** Date input con icona applicativa: mantiene il picker nativo ma nasconde il glifo nero del browser. */
export default function DateInput({value,onChange,id,disabled=false,min,max,ariaLabel}:Props){
  return <span className="date-input-control">
    <Icon name="calendar" size={18}/>
    <input id={id} type="date" value={value} disabled={disabled} min={min} max={max} aria-label={ariaLabel} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>onChange(event.target.value)}/>
  </span>;
}
