import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';
const key=(date:Date)=>`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;
export async function GET(req:Request){
  try{
    const url=new URL(req.url);const {sb,spaceId}=await activeSpace(url.searchParams.get('spaceId'));const requested=Number(url.searchParams.get('months')||6);const months=requested===12?12:6;const endValue=/^\d{4}-(0[1-9]|1[0-2])$/.test(url.searchParams.get('month')||'')?url.searchParams.get('month')!:new Date().toISOString().slice(0,7);const [year,month]=endValue.split('-').map(Number);const startDate=new Date(Date.UTC(year,month-months,1));const endDate=new Date(Date.UTC(year,month,1));
    const {data,error}=await sb.from('transactions').select('date,amount').eq('space_id',spaceId).gte('date',startDate.toISOString().slice(0,10)).lt('date',endDate.toISOString().slice(0,10));if(error)return NextResponse.json({error:error.message},{status:400});
    const values=new Map<string,{income:number;expense:number}>();for(let i=0;i<months;i++){const date=new Date(Date.UTC(startDate.getUTCFullYear(),startDate.getUTCMonth()+i,1));values.set(key(date),{income:0,expense:0})}for(const row of data||[]){const value=values.get(row.date.slice(0,7));if(!value)continue;const amount=Number(row.amount);amount>=0?value.income+=amount:value.expense-=amount}
    return NextResponse.json({months,data:[...values].map(([month,value])=>({month,...value,balance:value.income-value.expense}))});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}
