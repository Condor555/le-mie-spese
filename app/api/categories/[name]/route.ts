import {NextResponse} from 'next/server';
import {activeSpace} from '../../../../lib/active-space';

export async function PATCH(req:Request,{params}:{params:Promise<{name:string}>}){
  try{
    const {name}=await params,oldName=decodeURIComponent(name),body=await req.json(),{sb,user,spaceId}=await activeSpace(String(body.spaceId||'')||null);
    const newName=String(body.newName||oldName).trim(),icon=String(body.icon||'tag'),color=String(body.color||'#68738C'),kind=body.kind==='income'?'income':'expense';
    if(newName.length<2)return NextResponse.json({error:'Il nome deve avere almeno 2 caratteri.'},{status:400});
    const {data:currentCategory}=await sb.from('categories').select('kind').eq('space_id',spaceId).eq('name',oldName).maybeSingle();
    if(!currentCategory)return NextResponse.json({error:'Categoria non trovata.'},{status:404});
    if(newName!==oldName){
      const {data:existing}=await sb.from('categories').select('name').eq('space_id',spaceId).eq('name',newName).maybeSingle();
      if(existing)return NextResponse.json({error:'Esiste già una categoria con questo nome. Usa "Migra ed elimina" per unirle.'},{status:409});
    }
    if(kind!==currentCategory.kind){
      const [{count:wrongTransactions},{count:wrongRecurring}]=await Promise.all([
        kind==='income'?sb.from('transactions').select('id',{count:'exact',head:true}).eq('space_id',spaceId).eq('category_name',oldName).lt('amount',0):sb.from('transactions').select('id',{count:'exact',head:true}).eq('space_id',spaceId).eq('category_name',oldName).gt('amount',0),
        kind==='income'?sb.from('recurring_transactions').select('id',{count:'exact',head:true}).eq('space_id',spaceId).eq('category_name',oldName).lt('amount',0):sb.from('recurring_transactions').select('id',{count:'exact',head:true}).eq('space_id',spaceId).eq('category_name',oldName).gt('amount',0),
      ]);
      if((wrongTransactions||0)+(wrongRecurring||0)>0)return NextResponse.json({error:`Impossibile cambiare tipo: la categoria contiene ${(wrongTransactions||0)+(wrongRecurring||0)} movimenti/ricorrenze di segno opposto.`},{status:409});
    }
    const {error:categoryError}=await sb.from('categories').update({name:newName,icon,color,kind}).eq('space_id',spaceId).eq('name',oldName);
    if(categoryError)return NextResponse.json({error:categoryError.message},{status:400});
    if(newName!==oldName){
      const {error:transactionError}=await sb.from('transactions').update({category_name:newName}).eq('space_id',spaceId).eq('category_name',oldName);
      if(transactionError)return NextResponse.json({error:transactionError.message},{status:400});
      const {error:recurringError}=await sb.from('recurring_transactions').update({category_name:newName}).eq('space_id',spaceId).eq('category_name',oldName);
      if(recurringError)return NextResponse.json({error:recurringError.message},{status:400});
      await sb.from('classifier_feedback').update({category_name:newName}).eq('user_id',user.id).eq('category_name',oldName);
    }
    return NextResponse.json({ok:true,oldName,newName,icon,color,kind});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}
