import {NextResponse} from 'next/server';
import {z} from 'zod';
import {activeSpace} from '../../../lib/active-space';

type SpaceRow={id:string;name:string;type:'personal'|'shared'};

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
const RecurringUpdate=RecurringPayload.pick({
  note:true,
  category_name:true,
  amount:true,
  frequency:true,
  interval_count:true,
  next_run:true,
});

export async function GET(){
  try{
    const {sb,spaceId:activeSpaceId,spaces:memberships}=await activeSpace();
    const ids:string[]=memberships.map((item:{id:string})=>item.id);
    const [{data,error},{data:spaceRows,error:spaceError}]=await Promise.all([
      sb.from('recurring_transactions').select('*').in('space_id',ids).order('next_run'),
      sb.from('spaces').select('id,name,type').in('id',ids),
    ]);
    if(error||spaceError)return NextResponse.json({data:[],spaces:[],error:error?.message||spaceError?.message},{status:400});
    const spaceMap=new Map<string,SpaceRow>((spaceRows||[]).map((space:SpaceRow)=>[space.id,space]));
    const spaces=ids.map((id:string)=>spaceMap.get(id)).filter((space:SpaceRow|undefined):space is SpaceRow=>Boolean(space)).sort((a:SpaceRow,b:SpaceRow)=>a.type===b.type?a.name.localeCompare(b.name,'it'):a.type==='personal'?-1:1);
    const enriched=(data||[]).map((row:any)=>({...row,space_name:spaceMap.get(row.space_id)?.name||'Spazio',space_type:spaceMap.get(row.space_id)?.type||'shared'}));
    return NextResponse.json({data:enriched,spaces,activeSpaceId});
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

export async function PATCH(req:Request){
  try{
    const {sb,spaces}=await activeSpace();
    const id=new URL(req.url).searchParams.get('id');
    if(!id)return NextResponse.json({error:'Ricorrenza non valida.'},{status:400});
    const body=RecurringUpdate.parse(await req.json());
    const ids:string[]=spaces.map((space:{id:string})=>space.id);
    const {data:current,error:readError}=await sb.from('recurring_transactions').select('id,space_id').eq('id',id).in('space_id',ids).maybeSingle();
    if(readError||!current)return NextResponse.json({error:readError?.message||'Ricorrenza non trovata.'},{status:404});
    const {data:category}=await sb.from('categories').select('name').eq('space_id',current.space_id).eq('name',body.category_name).maybeSingle();
    if(!category)return NextResponse.json({error:'La categoria selezionata non appartiene allo spazio della ricorrenza.'},{status:409});
    const {data,error}=await sb.from('recurring_transactions').update(body).eq('id',id).eq('space_id',current.space_id).select().single();
    return NextResponse.json({data,error:error?.message},{status:error?400:200});
  }catch(error){
    if(error instanceof z.ZodError)return NextResponse.json({error:'Dati ricorrenza non validi.'},{status:400});
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }
}

export async function DELETE(req:Request){
  try{
    const {sb,spaces}=await activeSpace();
    const id=new URL(req.url).searchParams.get('id');
    if(!id)return NextResponse.json({error:'Ricorrenza non valida.'},{status:400});
    const {error}=await sb.from('recurring_transactions').delete().in('space_id',spaces.map((space:{id:string})=>space.id)).eq('id',id);
    return NextResponse.json({ok:!error,error:error?.message},{status:error?400:200});
  }catch{return NextResponse.json({error:'Unauthorized'},{status:401})}
}
