import {NextResponse} from 'next/server';
import {z} from 'zod';
import {activeSpace} from '../../../lib/active-space';

const RecurringPayload=z.object({
  space_id:z.string().uuid().optional(),
  note:z.string().default(''),
  category_name:z.string().min(1),
  amount:z.number(),
  account_name:z.string().optional(),
  frequency:z.enum(['weekly','monthly','yearly']),
  interval_count:z.number().int().positive().default(1),
  next_run:z.string(),
});

export async function GET(){
  try{
    const {sb,spaceId}=await activeSpace();
    const {data,error}=await sb.from('recurring_transactions').select('*').eq('space_id',spaceId).order('next_run');
    return NextResponse.json({data,error:error?.message},{status:error?400:200});
  }catch{return NextResponse.json({error:'Unauthorized'},{status:401})}
}

export async function POST(req:Request){
  try{
    const {sb,user,spaceId:activeSpaceId}=await activeSpace();
    const body=RecurringPayload.parse(await req.json());
    const spaceId=body.space_id||activeSpaceId;
    const {data:membership}=await sb.from('space_members').select('space_id').eq('space_id',spaceId).eq('user_id',user.id).maybeSingle();
    if(!membership)return NextResponse.json({error:'Non puoi creare ricorrenze in questo spazio.'},{status:403});
    const {data:category}=await sb.from('categories').select('name').eq('space_id',spaceId).eq('name',body.category_name).maybeSingle();
    if(!category)return NextResponse.json({error:'La categoria selezionata non appartiene allo spazio di destinazione.'},{status:409});
    const {data:space,error:spaceError}=await sb.from('spaces').select('account_name').eq('id',spaceId).single();
    if(spaceError)return NextResponse.json({error:spaceError.message},{status:400});
    const {data,error}=await sb.from('recurring_transactions').insert({
      user_id:user.id,
      created_by:user.id,
      space_id:spaceId,
      note:body.note,
      category_name:body.category_name,
      amount:body.amount,
      currency:'EUR',
      account_name:space?.account_name||'Spese',
      frequency:body.frequency,
      interval_count:body.interval_count,
      next_run:body.next_run,
      active:true,
    }).select().single();
    return NextResponse.json({data,error:error?.message},{status:error?400:200});
  }catch(error){
    if(error instanceof z.ZodError)return NextResponse.json({error:'Dati ricorrenza non validi.'},{status:400});
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }
}

export async function DELETE(req:Request){
  try{
    const {sb,spaceId}=await activeSpace();
    const id=new URL(req.url).searchParams.get('id');
    const {error}=await sb.from('recurring_transactions').delete().eq('space_id',spaceId).eq('id',id);
    return NextResponse.json({ok:!error,error:error?.message},{status:error?400:200});
  }catch{return NextResponse.json({error:'Unauthorized'},{status:401})}
}
