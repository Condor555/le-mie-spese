import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '../../../../../lib/supabase/server';

const Payload=z.object({
  spaceId:z.string().uuid(),
  categories:z.array(z.object({
    name:z.string().min(1),
    icon:z.string().nullable().optional(),
    color:z.string().nullable().optional(),
    action:z.enum(['import','skip']),
  })).max(200),
});

export async function POST(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const payload=Payload.parse(await req.json());
    const {data:membership}=await sb.from('space_members').select('role').eq('space_id',payload.spaceId).eq('user_id',user.id).maybeSingle();
    if(!membership)return NextResponse.json({error:'Accesso negato'},{status:403});

    const chosen=payload.categories.filter(category=>category.action==='import');
    if(!chosen.length)return NextResponse.json({added:0,skipped:payload.categories.length});
    const rows=chosen.map(category=>({
      user_id:user.id,
      space_id:payload.spaceId,
      name:category.name,
      icon:category.icon||'tag',
      color:category.color||'#7C849D',
    }));
    const {data,error}=await sb.from('categories').upsert(rows,{onConflict:'space_id,name',ignoreDuplicates:true}).select('name');
    if(error)return NextResponse.json({error:error.message},{status:400});
    return NextResponse.json({added:data?.length||0,skipped:payload.categories.length-(data?.length||0)});
  }catch(error){
    if(error instanceof z.ZodError)return NextResponse.json({error:'Selezione categorie non valida.'},{status:400});
    return NextResponse.json({error:'Impossibile importare le categorie.'},{status:400});
  }
}
