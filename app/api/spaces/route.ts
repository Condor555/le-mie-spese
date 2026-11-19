import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createClient} from '../../../lib/supabase/server';

const invite=()=>crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();
const cookieOptions={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',maxAge:60*60*24*365,path:'/'};

export async function GET(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data:memberships,error:membershipError}=await sb.from('space_members').select('space_id,role').eq('user_id',user.id);
  if(membershipError)return NextResponse.json({error:membershipError.message},{status:400});
  const ids=(memberships||[]).map(item=>item.space_id);
  const {data:spaces,error}=ids.length
    ?await sb.from('spaces').select('id,name,type,invite_code,created_by,account_name').in('id',ids)
    :{data:[],error:null};
  if(error)return NextResponse.json({error:error.message},{status:400});
  const data=(spaces||[]).map(space=>({...space,role:(memberships||[]).find(item=>item.space_id===space.id)?.role||'member'})).sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name,'it'):a.type==='personal'?-1:1);
  const store=await cookies();
  const saved=store.get('active_space')?.value||'';
  const activeSpaceId=data.some(space=>space.id===saved)?saved:data.find(space=>space.type==='personal')?.id||data[0]?.id||'';
  const response=NextResponse.json({data,activeSpaceId});
  if(activeSpaceId!==saved&&activeSpaceId)response.cookies.set('active_space',activeSpaceId,cookieOptions);
  return response;
}

export async function POST(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {name}=await req.json();
  const clean=String(name||'').trim();
  if(clean.length<2)return NextResponse.json({error:'Nome troppo corto'},{status:400});
  const {data:space,error}=await sb.from('spaces').insert({name:clean,type:'shared',invite_code:invite(),created_by:user.id,account_name:'Spese'}).select().single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  const {error:memberError}=await sb.from('space_members').insert({space_id:space.id,user_id:user.id,role:'owner'});
  if(memberError)return NextResponse.json({error:memberError.message},{status:400});
  const {data:copied,error:copyError}=await sb.rpc('copy_personal_categories_to_space',{p_space_id:space.id});
  if(copyError)return NextResponse.json({error:`Spazio creato ma copia categorie fallita: ${copyError.message}`,data:space},{status:500});
  return NextResponse.json({data:{...space,copiedCategories:Number(copied||0)}});
}
