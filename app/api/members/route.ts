import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';

export async function GET(req:Request){
  try{
    const {sb,spaceId}=await activeSpace(new URL(req.url).searchParams.get('spaceId'));
    const {data:members,error}=await sb.from('space_members').select('user_id,role,joined_at').eq('space_id',spaceId).order('joined_at');
    if(error)return NextResponse.json({error:error.message,data:[]},{status:400});
    const ids=(members||[]).map(member=>member.user_id);
    const {data:profiles,error:profileError}=ids.length
      ?await sb.from('profiles').select('user_id,display_name').in('user_id',ids)
      :{data:[],error:null};
    if(profileError)return NextResponse.json({error:profileError.message,data:[]},{status:400});
    const names=new Map((profiles||[]).map(profile=>[profile.user_id,profile.display_name]));
    return NextResponse.json({data:(members||[]).map(member=>({
      userId:member.user_id,
      role:member.role,
      name:names.get(member.user_id)||'Utente',
      joinedAt:member.joined_at,
    }))});
  }catch{
    return NextResponse.json({error:'Unauthorized'},{status:401});
  }
}
