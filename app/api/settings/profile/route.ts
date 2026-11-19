import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '../../../../lib/supabase/server';

const ProfileSchema=z.object({displayName:z.string().trim().min(2,'Il nome deve avere almeno 2 caratteri.').max(60,'Il nome può contenere al massimo 60 caratteri.')});

export async function GET(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data,error}=await sb.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle();
  if(error)return NextResponse.json({error:error.message},{status:400});
  const fallback=String(user.user_metadata?.display_name||user.email?.split('@')[0]||'Utente');
  return NextResponse.json({data:{displayName:data?.display_name||fallback,email:user.email||''}});
}

export async function PATCH(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const parsed=ProfileSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Nome non valido.'},{status:400});
  const displayName=parsed.data.displayName.replace(/\s+/g,' ');
  const {error}=await sb.from('profiles').upsert({user_id:user.id,display_name:displayName},{onConflict:'user_id'});
  if(error)return NextResponse.json({error:error.message},{status:400});
  const {error:metadataError}=await sb.auth.updateUser({data:{display_name:displayName}});
  return NextResponse.json({data:{displayName},warning:metadataError?'Nome salvato nel profilo; metadati di accesso non aggiornati.':undefined});
}
