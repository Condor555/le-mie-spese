import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';
import {inferredCategoryStyle} from '../../../lib/category-style';

export async function GET(req:Request){
  try{
    const url=new URL(req.url);const requested=url.searchParams.get('spaceId');const requestedKind=url.searchParams.get('kind');
    const {sb,spaceId}=await activeSpace(requested);
    const [{data:saved,error:a},{data:tx,error:b}]=await Promise.all([
      sb.from('categories').select('name,icon,color,kind').eq('space_id',spaceId).order('name'),
      sb.from('transactions').select('category_name,amount').eq('space_id',spaceId),
    ]);
    if(a||b)return NextResponse.json({error:(a||b)?.message},{status:400});
    const counts=new Map<string,number>(),signs=new Map<string,{positive:boolean;negative:boolean}>();for(const row of tx||[]){counts.set(row.category_name,(counts.get(row.category_name)||0)+1);const sign=signs.get(row.category_name)||{positive:false,negative:false};Number(row.amount)>=0?sign.positive=true:sign.negative=true;signs.set(row.category_name,sign)}
    const map=new Map<string,any>();for(const row of saved||[])map.set(row.name,row);for(const row of tx||[])if(!map.has(row.category_name)){const sign=signs.get(row.category_name);map.set(row.category_name,{name:row.category_name,kind:sign?.positive&&!sign.negative?'income':'expense'})}
    const data=[...map.values()].map(row=>{const fallback=inferredCategoryStyle(row.name);return {name:row.name,kind:row.kind==='income'?'income':'expense',icon:row.icon||fallback.icon,color:row.color||fallback.color,count:counts.get(row.name)||0}}).filter(row=>requestedKind==='income'||requestedKind==='expense'?row.kind===requestedKind:true).sort((a,b)=>a.name.localeCompare(b.name,'it'));
    return NextResponse.json({data});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}

export async function POST(req:Request){
  try{
    const body=await req.json(),{sb,user,spaceId}=await activeSpace(String(body.spaceId||'')||null),name=String(body.name||'').trim(),kind=body.kind==='income'?'income':'expense';
    if(name.length<2)return NextResponse.json({error:'Nome troppo corto'},{status:400});
    const fallback=inferredCategoryStyle(name);
    const {data:existing}=await sb.from('categories').select('name,kind').eq('space_id',spaceId).eq('name',name).maybeSingle();
    if(existing)return NextResponse.json({error:'Esiste già una categoria con questo nome.'},{status:409});
    const {data,error}=await sb.from('categories').insert({user_id:user.id,space_id:spaceId,name,kind,icon:body.icon||fallback.icon,color:body.color||fallback.color}).select().single();
    return NextResponse.json({data,error},{status:error?400:200});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}

export async function DELETE(req:Request){
  try{
    const url=new URL(req.url),{sb,spaceId}=await activeSpace(url.searchParams.get('spaceId')),name=String(url.searchParams.get('name')||'').trim();
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
