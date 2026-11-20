import {cookies} from 'next/headers';
import {createClient} from './supabase/server';

const activeSpaceCookie={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',maxAge:60*60*24*365,path:'/'};

export async function resolveDefaultSpaceId(sb:any,ids:string[],personalSpaceId?:string){
  if(!ids.length)return '';
  const {data:recent}=await sb
    .from('transactions')
    .select('space_id,date,created_at')
    .in('space_id',ids)
    .order('date',{ascending:false})
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  return recent?.space_id||personalSpaceId||ids[0];
}

export async function activeSpace(requestedSpaceId?:string|null){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)throw new Error('Unauthorized');
  const store=await cookies();
  const {data:members,error}=await sb.from('space_members').select('space_id').eq('user_id',user.id);
  if(error)throw error;
  const ids=(members||[]).map(member=>member.space_id);
  if(!ids.length)throw new Error('No space');
  if(requestedSpaceId&&!ids.includes(requestedSpaceId))throw new Error('Access denied');
  let id=requestedSpaceId&&ids.includes(requestedSpaceId)?requestedSpaceId:store.get('active_space')?.value;
  if(!id||!ids.includes(id)){
    const {data:spaces}=await sb.from('spaces').select('id,type').in('id',ids);
    const personalId=(spaces||[]).find(space=>space.type==='personal')?.id;
    id=await resolveDefaultSpaceId(sb,ids,personalId);
    if(id){try{store.set('active_space',id,activeSpaceCookie)}catch{}}
  }
  if(!id)throw new Error('No space');
  return {sb,user,spaceId:id,spaces:ids.map(spaceId=>({id:spaceId}))};
}
