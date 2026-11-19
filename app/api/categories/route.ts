import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';
import {inferredCategoryStyle} from '../../../lib/category-style';

export async function GET(req:Request){
  try{
    const {sb,user,spaceId:activeSpaceId}=await activeSpace();
    const requested=new URL(req.url).searchParams.get('spaceId');
    const spaceId=requested||activeSpaceId;
    if(spaceId!==activeSpaceId){
      const {data:membership}=await sb.from('space_members').select('space_id').eq('space_id',spaceId).eq('user_id',user.id).maybeSingle();
      if(!membership)return NextResponse.json({error:'Accesso negato'},{status:403});
    }
    const [{data:saved,error:a},{data:tx,error:b}]=await Promise.all([
      sb.from('categories').select('name,icon,color').eq('space_id',spaceId).order('name'),
      sb.from('transactions').select('category_name').eq('space_id',spaceId),
    ]);
    if(a||b)return NextResponse.json({error:(a||b)?.message},{status:400});
    const counts=new Map<string,number>();for(const row of tx||[])counts.set(row.category_name,(counts.get(row.category_name)||0)+1);
    const map=new Map<string,any>();for(const row of saved||[])map.set(row.name,row);for(const row of tx||[])if(!map.has(row.category_name))map.set(row.category_name,{name:row.category_name});
    return NextResponse.json({data:[...map.values()].map(row=>{const fallback=inferredCategoryStyle(row.name);return {name:row.name,icon:row.icon||fallback.icon,color:row.color||fallback.color,count:counts.get(row.name)||0}}).sort((a,b)=>a.name.localeCompare(b.name,'it'))});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}

export async function POST(req:Request){
  try{
    const {sb,user,spaceId}=await activeSpace(),body=await req.json(),name=String(body.name||'').trim();
    if(name.length<2)return NextResponse.json({error:'Nome troppo corto'},{status:400});
    const fallback=inferredCategoryStyle(name);
    const {data,error}=await sb.from('categories').upsert({user_id:user.id,space_id:spaceId,name,icon:body.icon||fallback.icon,color:body.color||fallback.color},{onConflict:'space_id,name'}).select().single();
    return NextResponse.json({data,error},{status:error?400:200});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}

export async function DELETE(req:Request){
  try{
    const {sb,spaceId}=await activeSpace(),name=String(new URL(req.url).searchParams.get('name')||'').trim();
    if(!name)return NextResponse.json({error:'Categoria non valida.'},{status:400});
    const [{count:transactions,error:txError},{count:recurring,error:recError}]=await Promise.all([
      sb.from('transactions').select('id',{count:'exact',head:true}).eq('space_id',spaceId).eq('category_name',name),
      sb.from('recurring_transactions').select('id',{count:'exact',head:true}).eq('space_id',spaceId).eq('category_name',name),
    ]);
    if(txError||recError)return NextResponse.json({error:(txError||recError)?.message},{status:400});
    if((transactions||0)+(recurring||0)>0)return NextResponse.json({error:'Categoria in uso.',count:transactions||0,recurringCount:recurring||0},{status:409});
    const {error}=await sb.from('categories').delete().eq('space_id',spaceId).eq('name',name);
    return NextResponse.json({ok:!error,error:error?.message},{status:error?400:200});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}
