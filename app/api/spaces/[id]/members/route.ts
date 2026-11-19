import {NextResponse} from 'next/server';
import {createClient} from '../../../../../lib/supabase/server';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data:members,error}=await sb.from('space_members').select('user_id,role,joined_at').eq('space_id',id).order('joined_at');
  if(error)return NextResponse.json({data:[],error:error.message},{status:400});
  const ids=(members||[]).map(member=>member.user_id);
  const {data:profiles,error:profileError}=ids.length?await sb.from('profiles').select('user_id,display_name').in('user_id',ids):{data:[],error:null};
  if(profileError)return NextResponse.json({data:[],error:profileError.message},{status:400});
  const names=new Map((profiles||[]).map(profile=>[profile.user_id,profile.display_name]));
  return NextResponse.json({data:(members||[]).map(member=>({userId:member.user_id,role:member.role,name:names.get(member.user_id)||'Utente',joinedAt:member.joined_at}))});
}
