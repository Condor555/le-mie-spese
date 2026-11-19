export type RecurrenceFrequency='weekly'|'monthly'|'yearly';

const isoPattern=/^\d{4}-\d{2}-\d{2}$/;

export function addRecurringDate(value:string,frequency:RecurrenceFrequency,interval=1){
  if(!isoPattern.test(value))throw new Error('Data ricorrenza non valida');
  const [year,month,day]=value.split('-').map(Number);
  const step=Math.max(1,Math.trunc(interval));
  if(frequency==='weekly'){
    const date=new Date(Date.UTC(year,month-1,day+7*step));
    return date.toISOString().slice(0,10);
  }
  const targetMonth=frequency==='monthly'?month-1+step:month-1;
  const targetYear=frequency==='yearly'?year+step:year+Math.floor(targetMonth/12);
  const normalizedMonth=((targetMonth%12)+12)%12;
  const lastDay=new Date(Date.UTC(targetYear,normalizedMonth+1,0)).getUTCDate();
  return `${targetYear}-${String(normalizedMonth+1).padStart(2,'0')}-${String(Math.min(day,lastDay)).padStart(2,'0')}`;
}

export function futureOccurrences(start:string,frequency:RecurrenceFrequency,interval:number,through:string,limit=48){
  const dates:string[]=[];
  let cursor=start;
  while(cursor<=through&&dates.length<limit){
    dates.push(cursor);
    const next=addRecurringDate(cursor,frequency,interval);
    if(next<=cursor)break;
    cursor=next;
  }
  return dates;
}
