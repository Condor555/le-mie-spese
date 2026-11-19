import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {createClient} from '../../../../lib/supabase/server';

const Payload=z.object({spaceId:z.string().uuid()});

export async function POST(req:Request){
  const parsed=Payload.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:'Spazio non valido'},{status:400});
  const {spaceId}=parsed.data;
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {data}=await sb.from('space_members').select('space_id').eq('space_id',spaceId).eq('user_id',user.id).maybeSingle();
  if(!data)return NextResponse.json({error:'Accesso negato'},{status:403});
  const store=await cookies();
  store.set('active_space',spaceId,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*365,path:'/'});
  return NextResponse.json({ok:true,spaceId});
}
