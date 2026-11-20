import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '../../../../lib/supabase/server';

const ProfileSchema=z.object({
  displayName:z.string().trim().min(2,'Il nome deve avere almeno 2 caratteri.').max(60,'Il nome può contenere al massimo 60 caratteri.').optional(),
  language:z.enum(['it','en']).optional(),
}).refine(value=>value.displayName!==undefined||value.language!==undefined,{message:'Nessuna modifica valida.'});

export async function GET(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data,error}=await sb.from('profiles').select('display_name,language').eq('user_id',user.id).maybeSingle();
  if(error)return NextResponse.json({error:error.message},{status:400});
  const fallback=String(user.user_metadata?.display_name||user.email?.split('@')[0]||'Utente');
  return NextResponse.json({data:{displayName:data?.display_name||fallback,email:user.email||'',language:data?.language==='en'?'en':'it'}});
}

export async function PATCH(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const parsed=ProfileSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Nome non valido.'},{status:400});
  const displayName=parsed.data.displayName?.replace(/\s+/g,' ');
  const fallback=String(user.user_metadata?.display_name||user.email?.split('@')[0]||'Utente');
  const update:{user_id:string;display_name?:string;language?:'it'|'en'}={user_id:user.id};
  if(displayName!==undefined)update.display_name=displayName;
  if(parsed.data.language!==undefined)update.language=parsed.data.language;
  const {data:existing}=await sb.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle();
  if(!existing?.display_name&&update.display_name===undefined)update.display_name=fallback;
  const {error}=await sb.from('profiles').upsert(update,{onConflict:'user_id'});
  if(error)return NextResponse.json({error:error.message},{status:400});
  const metadataError=displayName!==undefined?(await sb.auth.updateUser({data:{display_name:displayName}})).error:null;
  return NextResponse.json({data:{displayName:displayName??existing?.display_name??fallback,language:parsed.data.language},warning:metadataError?'Nome salvato nel profilo; metadati di accesso non aggiornati.':undefined});
}
