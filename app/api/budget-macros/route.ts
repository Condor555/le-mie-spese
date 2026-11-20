import {NextResponse} from 'next/server';
import {z} from 'zod';
import {activeSpace} from '../../../lib/active-space';

const Color=/^#[0-9A-Fa-f]{6}$/;
const Create=z.object({space_id:z.string().uuid().optional(),name:z.string().trim().min(2).max(60),color:z.string().regex(Color),rollover_enabled:z.boolean().default(false)});
const Update=z.object({action:z.literal('update'),space_id:z.string().uuid().optional(),id:z.string().uuid(),name:z.string().trim().min(2).max(60),color:z.string().regex(Color),rollover_enabled:z.boolean()});
const Reorder=z.object({action:z.literal('reorder'),space_id:z.string().uuid().optional(),ids:z.array(z.string().uuid()).min(1).max(100)});
const Assign=z.object({action:z.literal('assign'),space_id:z.string().uuid().optional(),category_name:z.string().min(1),macro_category_id:z.string().uuid()});

export async function POST(req:Request){
  try{
    const body=Create.parse(await req.json());const {sb,user,spaceId}=await activeSpace(body.space_id);
    const {data:last}=await sb.from('budget_macro_categories').select('sort_order').eq('space_id',spaceId).order('sort_order',{ascending:false}).limit(1).maybeSingle();
    const {data,error}=await sb.from('budget_macro_categories').insert({space_id:spaceId,name:body.name,color:body.color,rollover_enabled:body.rollover_enabled,sort_order:Number(last?.sort_order||0)+10,created_by:user.id}).select().single();
    return NextResponse.json({data,error:error?.message},{status:error?400:200});
  }catch(error:any){if(error instanceof z.ZodError)return NextResponse.json({error:'Macro-categoria non valida.'},{status:400});return NextResponse.json({error:error?.message||'Unauthorized'},{status:400})}
}

export async function PATCH(req:Request){
  try{
    const raw=await req.json();const body=z.discriminatedUnion('action',[Update,Reorder,Assign]).parse(raw);const {sb,spaceId}=await activeSpace(body.space_id);
    if(body.action==='update'){
      const {data,error}=await sb.from('budget_macro_categories').update({name:body.name,color:body.color,rollover_enabled:body.rollover_enabled}).eq('space_id',spaceId).eq('id',body.id).select().single();
      return NextResponse.json({data,error:error?.message},{status:error?400:200});
    }
    if(body.action==='reorder'){
      const {error}=await sb.rpc('reorder_budget_macros',{p_space_id:spaceId,p_ids:body.ids});
      return NextResponse.json({ok:!error,error:error?.message},{status:error?400:200});
    }
    const {error}=await sb.rpc('assign_category_macro',{p_space_id:spaceId,p_category_name:body.category_name,p_macro_category_id:body.macro_category_id});
    return NextResponse.json({ok:!error,error:error?.message},{status:error?400:200});
  }catch(error:any){if(error instanceof z.ZodError)return NextResponse.json({error:'Operazione Budget non valida.'},{status:400});return NextResponse.json({error:error?.message||'Unauthorized'},{status:400})}
}

export async function DELETE(req:Request){
  try{
    const url=new URL(req.url);const id=z.string().uuid().parse(url.searchParams.get('id'));const fallbackId=z.string().uuid().parse(url.searchParams.get('fallbackId'));const {sb,spaceId}=await activeSpace(url.searchParams.get('spaceId'));
    const {error}=await sb.rpc('delete_budget_macro',{p_space_id:spaceId,p_macro_id:id,p_fallback_id:fallbackId});
    return NextResponse.json({ok:!error,error:error?.message},{status:error?400:200});
  }catch(error:any){return NextResponse.json({error:error?.message||'Operazione non valida.'},{status:400})}
}
