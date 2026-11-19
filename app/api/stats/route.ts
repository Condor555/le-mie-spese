import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';

function monthBounds(month:string){
  const [year,monthNumber]=month.split('-').map(Number);
  const start=`${year}-${String(monthNumber).padStart(2,'0')}-01`;
  const nextDate=new Date(Date.UTC(year,monthNumber,1));
  const end=`${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth()+1).padStart(2,'0')}-01`;
  const previousDate=new Date(Date.UTC(year,monthNumber-2,1));
  const previous=`${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth()+1).padStart(2,'0')}`;
  return {year,monthNumber,start,end,previous};
}

function romeToday(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);
  return {year:value('year'),month:value('month'),day:value('day')};
}

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const {sb,spaceId}=await activeSpace(url.searchParams.get('spaceId'));
    const requestedMonth=url.searchParams.get('month')||new Date().toISOString().slice(0,7);
    const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)?requestedMonth:new Date().toISOString().slice(0,7);
    const bounds=monthBounds(month);
    const previousBounds=monthBounds(bounds.previous);

    const [{data,error},{data:previousRows,error:previousError}]=await Promise.all([
      sb.from('transactions').select('amount,category_name,date').eq('space_id',spaceId).gte('date',bounds.start).lt('date',bounds.end),
      sb.from('transactions').select('amount,category_name').eq('space_id',spaceId).gte('date',previousBounds.start).lt('date',previousBounds.end),
    ]);
    if(error||previousError)return NextResponse.json({error:error?.message||previousError?.message},{status:400});

    const rows=data||[];
    const income=rows.filter(row=>Number(row.amount)>0).reduce((sum,row)=>sum+Number(row.amount),0);
    const expense=-rows.filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const byCategory=new Map<string,number>();
    rows.filter(row=>Number(row.amount)<0).forEach(row=>byCategory.set(row.category_name,(byCategory.get(row.category_name)||0)-Number(row.amount)));
    const categories=[...byCategory].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,value])=>({name,value}));

    const top=categories[0];
    const previousTopExpense=top?(previousRows||[]).filter(row=>row.category_name===top.name&&Number(row.amount)<0).reduce((sum,row)=>sum-Number(row.amount),0):0;
    const topCategoryChangePercent=top&&previousTopExpense>0?Math.round(((top.value-previousTopExpense)/previousTopExpense)*100):null;

    const today=romeToday();
    const selectedKey=bounds.year*12+bounds.monthNumber;
    const currentKey=today.year*12+today.month;
    const daysInMonth=new Date(Date.UTC(bounds.year,bounds.monthNumber,0)).getUTCDate();
    const daysConsidered=selectedKey<currentKey?daysInMonth:selectedKey===currentKey?Math.min(today.day,daysInMonth):0;
    const dailyAverageExpense=daysConsidered>0?expense/daysConsidered:0;

    return NextResponse.json({
      month,
      income,
      expense,
      balance:income-expense,
      count:rows.length,
      categories,
      dailyAverageExpense,
      daysConsidered,
      daysInMonth,
      topCategory:top?{
        name:top.name,
        value:top.value,
        percentage:expense>0?Math.round(top.value/expense*100):0,
        previousValue:previousTopExpense,
        changePercent:topCategoryChangePercent,
        comparison:previousTopExpense>0?'available':'no-previous-data',
      }:null,
    });
  }catch{
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }
}
