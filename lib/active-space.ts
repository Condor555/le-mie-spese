import {cookies} from 'next/headers';
import {createClient} from './supabase/server';

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
    id=(spaces||[]).find(space=>space.type==='personal')?.id||ids[0];
  }
  return {sb,user,spaceId:id,spaces:ids.map(spaceId=>({id:spaceId}))};
}
