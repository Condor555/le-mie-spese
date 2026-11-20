import {NextResponse} from 'next/server';
import {activeSpace} from '../../../../lib/active-space';
export async function POST(req:Request){
  try{
    const body=await req.json(),{sb,user,spaceId}=await activeSpace(String(body.spaceId||'')||null),{source,target}=body;
    if(!source||!target||source===target)return NextResponse.json({error:'Categorie non valide'},{status:400});
    const [{data:targetCat},{data:sourceCat}]=await Promise.all([
      sb.from('categories').select('name,kind').eq('space_id',spaceId).eq('name',target).maybeSingle(),
      sb.from('categories').select('name,kind').eq('space_id',spaceId).eq('name',source).maybeSingle(),
    ]);
    if(!targetCat)return NextResponse.json({error:'Categoria destinazione inesistente'},{status:400});
    if(!sourceCat||sourceCat.kind!==targetCat.kind)return NextResponse.json({error:'Puoi unire soltanto categorie dello stesso tipo.'},{status:409});
    const {error:e1}=await sb.from('transactions').update({category_name:target}).eq('space_id',spaceId).eq('category_name',source);
    if(e1)return NextResponse.json({error:e1.message},{status:400});
    const {error:e2}=await sb.from('recurring_transactions').update({category_name:target}).eq('space_id',spaceId).eq('category_name',source);
    if(e2)return NextResponse.json({error:e2.message},{status:400});
    await sb.from('classifier_feedback').update({category_name:target}).eq('user_id',user.id).eq('category_name',source);
    const {error:e3}=await sb.from('categories').delete().eq('space_id',spaceId).eq('name',source);
    return NextResponse.json({ok:!e3,error:e3?.message},{status:e3?400:200});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}
