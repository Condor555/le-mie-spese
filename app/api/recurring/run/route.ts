import {NextResponse} from 'next/server';
import {createClient} from '../../../../lib/supabase/server';
import {addRecurringDate} from '../../../../lib/recurrence';
export async function POST(){
  const sb=await createClient();const {data:{user}}=await sb.auth.getUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const today=new Date().toISOString().slice(0,10);const {data,error}=await sb.from('recurring_transactions').select('id,next_run,frequency,interval_count').eq('created_by',user.id).eq('active',true).eq('auto_post',true).lte('next_run',today);if(error)return NextResponse.json({error:error.message},{status:400});let generated=0;const failures:string[]=[];
  for(const recurring of data||[]){let due=recurring.next_run;let guard=0;while(due<=today&&guard++<12){const {data:result,error:confirmError}=await sb.rpc('confirm_recurring_payment',{p_recurring_id:recurring.id,p_due_date:due});if(confirmError){failures.push(`${recurring.id}: ${confirmError.message}`);break}if(result?.status==='confirmed')generated++;due=addRecurringDate(due,recurring.frequency,recurring.interval_count)}}return NextResponse.json({generated,failures});
}
