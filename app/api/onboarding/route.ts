import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '../../../lib/supabase/server';

const OnboardingPayload=z.object({
  displayName:z.string().trim().min(2,'Il nome deve contenere almeno 2 caratteri.').max(60),
  inviteCode:z.string().trim().max(24).optional().default(''),
});

export async function GET(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});

  const [{data:profile,error:profileError},{data:memberships,error:membershipError}]=await Promise.all([
    sb.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle(),
    sb.from('space_members').select('space_id,role').eq('user_id',user.id),
  ]);
  if(profileError)return NextResponse.json({error:profileError.message},{status:400});
  if(membershipError)return NextResponse.json({error:membershipError.message},{status:400});

  const spaceIds=(memberships||[]).map(item=>item.space_id);
  const {data:spaces,error:spacesError}=spaceIds.length
    ?await sb.from('spaces').select('id,name,type').in('id',spaceIds)
    :{data:[],error:null};
  if(spacesError)return NextResponse.json({error:spacesError.message},{status:400});

  const list=(spaces||[]).map(space=>({
    ...space,
    role:(memberships||[]).find(item=>item.space_id===space.id)?.role||'member',
  }));
  const displayName=profile?.display_name||String(user.user_metadata?.display_name||'');
  const metadataInvite=String(user.user_metadata?.invite_code||'').trim().toUpperCase();

  return NextResponse.json({
    data:{
      displayName,
      metadataInvite,
      spaces:list,
      personalSpaceId:list.find(space=>space.type==='personal')?.id||null,
      complete:Boolean(profile?.display_name&&list.some(space=>space.type==='personal')),
    },
  });
}

export async function POST(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});

  try{
    const payload=OnboardingPayload.parse(await req.json());
    const {data,error}=await sb.rpc('complete_user_onboarding',{
      p_display_name:payload.displayName,
      p_invite_code:payload.inviteCode||null,
    });
    if(error)return NextResponse.json({error:error.message},{status:400});
    const personalSpaceId=data?.personalSpaceId;
    if(personalSpaceId){
      const {error:incomeError}=await sb.rpc('ensure_default_income_categories',{p_space_id:personalSpaceId});
      if(incomeError)return NextResponse.json({error:`Profilo creato, ma categorie entrata non inizializzate: ${incomeError.message}`},{status:500});
    }
    await sb.auth.updateUser({data:{display_name:payload.displayName,invite_code:null}});
    return NextResponse.json({data});
  }catch(error){
    if(error instanceof z.ZodError){
      return NextResponse.json({error:error.issues[0]?.message||'Dati non validi.'},{status:400});
    }
    return NextResponse.json({error:'Impossibile completare la configurazione.'},{status:400});
  }
}
