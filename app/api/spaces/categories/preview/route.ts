import {NextResponse} from 'next/server';
import {createClient} from '../../../../../lib/supabase/server';
import {similarity} from '../../../../../lib/category-match';

export async function GET(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});

  const requested=new URL(req.url).searchParams.get('spaceId');
  let targetSpaceId=requested||'';
  if(!targetSpaceId){
    const {data:membership}=await sb.from('space_members').select('space_id').eq('user_id',user.id).limit(1).maybeSingle();
    targetSpaceId=membership?.space_id||'';
  }
  const {data:membership}=await sb.from('space_members').select('role').eq('space_id',targetSpaceId).eq('user_id',user.id).maybeSingle();
  if(!membership)return NextResponse.json({error:'Accesso negato'},{status:403});

  const {data:space,error:spaceError}=await sb.from('spaces').select('type,created_by').eq('id',targetSpaceId).single();
  if(spaceError||!space)return NextResponse.json({error:spaceError?.message||'Spazio non trovato.'},{status:404});
  if(space.type!=='shared')return NextResponse.json({data:[],shared:false});

  const {data:personal}=await sb.from('spaces').select('id').eq('created_by',user.id).eq('type','personal').maybeSingle();
  if(!personal)return NextResponse.json({data:[],shared:true});
  const [{data:source,error:sourceError},{data:destination,error:destinationError}]=await Promise.all([
    sb.from('categories').select('name,icon,color').eq('space_id',personal.id).order('name'),
    sb.from('categories').select('name,icon,color').eq('space_id',targetSpaceId).order('name'),
  ]);
  if(sourceError||destinationError)return NextResponse.json({error:sourceError?.message||destinationError?.message},{status:400});

  const data=(source||[]).map(category=>{
    const ranked=(destination||[]).map(item=>({...item,score:similarity(category.name,item.name)})).sort((a,b)=>b.score-a.score);
    const suggestion=ranked[0]?.score>=.72?ranked[0]:null;
    return {...category,suggestion,defaultAction:suggestion?'skip':'import'};
  });
  return NextResponse.json({data,shared:true,isOwner:space.created_by===user.id});
}
