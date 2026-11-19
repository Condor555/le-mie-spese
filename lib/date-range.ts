export type DateRange={start:string;end:string};
const toIso=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const offset=(date:Date,days:number)=>new Date(date.getFullYear(),date.getMonth(),date.getDate()+days);
export function presetRange(preset:'today'|'yesterday'|'this-month'|'last-month'|'last-30',now=new Date()):DateRange{
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(preset==='today')return {start:toIso(today),end:toIso(today)};
  if(preset==='yesterday'){const value=offset(today,-1);return {start:toIso(value),end:toIso(value)}}
  if(preset==='this-month')return {start:toIso(new Date(today.getFullYear(),today.getMonth(),1)),end:toIso(today)};
  if(preset==='last-month')return {start:toIso(new Date(today.getFullYear(),today.getMonth()-1,1)),end:toIso(new Date(today.getFullYear(),today.getMonth(),0))};
  return {start:toIso(offset(today,-29)),end:toIso(today)};
}
const shortDate=(value:string)=>new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`)).replaceAll('.','');
export const rangeLabel=(start:string,end:string)=>!start||!end?'Tutte le date':start===end?shortDate(start):`${shortDate(start)} – ${shortDate(end)}`;
