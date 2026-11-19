import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const {sb,spaceId}=await activeSpace(url.searchParams.get('spaceId'));
    const now=new Date();
    const start=new Date(now.getFullYear(),now.getMonth()-11,1).toISOString().slice(0,10);
    const {data,error}=await sb.from('transactions').select('date,amount').eq('space_id',spaceId).gte('date',start);
    if(error)return NextResponse.json({error:error.message},{status:400});
    const months=new Map<string,{income:number;expense:number}>();
    for(const row of data||[]){
      const key=row.date.slice(0,7);
      const value=months.get(key)||{income:0,expense:0};
      const amount=Number(row.amount);
      amount>=0?value.income+=amount:value.expense-=amount;
      months.set(key,value);
    }
    return NextResponse.json({data:[...months].sort().map(([month,value])=>({month,...value,balance:value.income-value.expense}))});
  }catch{return NextResponse.json({error:'Unauthorized'},{status:401})}
}
