import {NextResponse} from 'next/server';
import {createClient} from '../../../../lib/supabase/server';

export async function POST(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {code}=await req.json();
  const clean=String(code||'').trim().toUpperCase();
  if(!clean)return NextResponse.json({error:'Inserisci il codice invito.'},{status:400});
  const {data,error}=await sb.rpc('join_space_by_code',{p_code:clean});
  return NextResponse.json({data,error:error?.message},{status:error?400:200});
}
