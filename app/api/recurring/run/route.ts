import {NextResponse} from 'next/server';
import {createClient} from '../../../../lib/supabase/server';

function next(date:string,frequency:string,interval:number){
  const value=new Date(`${date}T12:00:00Z`);
  if(frequency==='weekly')value.setUTCDate(value.getUTCDate()+7*interval);
  if(frequency==='monthly')value.setUTCMonth(value.getUTCMonth()+interval);
  if(frequency==='yearly')value.setUTCFullYear(value.getUTCFullYear()+interval);
  return value.toISOString().slice(0,10);
}

export async function POST(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const today=new Date().toISOString().slice(0,10);
  const {data,error}=await sb.from('recurring_transactions').select('*').eq('created_by',user.id).eq('active',true).lte('next_run',today);
  if(error)return NextResponse.json({error:error.message},{status:400});
  let generated=0;
  const failures:string[]=[];
  for(const recurring of data||[]){
    const sourceId=`${recurring.id}:${recurring.next_run}`;
    const {error:insertError}=await sb.from('transactions').insert({
      user_id:recurring.user_id||recurring.created_by||user.id,
      created_by:recurring.created_by||recurring.user_id||user.id,
      space_id:recurring.space_id,
      source:'recurring',
      source_id:sourceId,
      date:recurring.next_run,
      category_name:recurring.category_name,
      amount:recurring.amount,
      currency:recurring.currency,
      note:recurring.note,
      account_name:recurring.account_name,
    });
    if(insertError){
      failures.push(`${recurring.id}: ${insertError.message}`);
      continue;
    }
    generated++;
    await sb.from('recurring_transactions').update({
      last_generated:recurring.next_run,
      next_run:next(recurring.next_run,recurring.frequency,recurring.interval_count),
    }).eq('id',recurring.id).eq('created_by',user.id);
  }
  return NextResponse.json({generated,failures});
}
