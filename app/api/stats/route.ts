import {NextResponse} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
export async function GET(req:Request){
 const sb=await createClient(); const {data:{user}}=await sb.auth.getUser();
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=new URL(req.url); const month=url.searchParams.get('month')||new Date().toISOString().slice(0,7);
 const start=`${month}-01`; const end=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),1).toISOString().slice(0,10);
 const {data,error}=await sb.from('transactions').select('amount,category_name,date').gte('date',start).lt('date',end);
 if(error)return NextResponse.json({error:error.message},{status:400});
 const rows=data||[]; const income=rows.filter(x=>Number(x.amount)>0).reduce((s,x)=>s+Number(x.amount),0);
 const expense=-rows.filter(x=>Number(x.amount)<0).reduce((s,x)=>s+Number(x.amount),0); const groups=new Map<string,number>();
 rows.filter(x=>Number(x.amount)<0).forEach(x=>groups.set(x.category_name,(groups.get(x.category_name)||0)-Number(x.amount)));
 return NextResponse.json({month,income,expense,balance:income-expense,count:rows.length,categories:[...groups].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,value])=>({name,value}))});
}
