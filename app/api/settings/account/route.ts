import {NextResponse} from 'next/server';
import {z} from 'zod';
import {activeSpace} from '../../../../lib/active-space';

const AccountSchema=z.object({
  name:z.string().trim().min(2,'Il nome del conto deve avere almeno 2 caratteri.').max(40,'Il nome del conto può contenere al massimo 40 caratteri.'),
  spaceId:z.string().uuid().optional(),
});

async function resolveSpace(sb:any,userId:string,requested:string|undefined,activeSpaceId:string){
  const spaceId=requested||activeSpaceId;
  const {data:membership,error:membershipError}=await sb.from('space_members').select('role').eq('space_id',spaceId).eq('user_id',userId).maybeSingle();
  if(membershipError)throw membershipError;
  if(!membership)throw new Error('Accesso negato');
  const {data:space,error}=await sb.from('spaces').select('id,name,type,account_name,created_by').eq('id',spaceId).single();
  if(error)throw error;
  const canEdit=membership.role==='owner'&&space.created_by===userId;
  return {spaceId,space,membership,canEdit};
}

export async function GET(req:Request){
  try{
    const {sb,user,spaceId:activeSpaceId}=await activeSpace();
    const requested=new URL(req.url).searchParams.get('spaceId')||undefined;
    const resolved=await resolveSpace(sb,user.id,requested,activeSpaceId);
    return NextResponse.json({data:{
      id:resolved.space.id,
      name:resolved.space.account_name||'Spese',
      currency:'EUR',
      spaceName:resolved.space.name,
      spaceType:resolved.space.type,
      role:resolved.membership.role,
      canEdit:resolved.canEdit,
    }});
  }catch(error:any){
    const forbidden=error?.message==='Accesso negato';
    return NextResponse.json({error:forbidden?'Accesso negato':error?.message||'Impossibile caricare il conto.'},{status:forbidden?403:400});
  }
}

export async function PATCH(req:Request){
  const parsed=AccountSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Nome non valido.'},{status:400});
  try{
    const {sb,user,spaceId:activeSpaceId}=await activeSpace();
    const resolved=await resolveSpace(sb,user.id,parsed.data.spaceId,activeSpaceId);
    if(!resolved.canEdit){
      return NextResponse.json({error:'Solo il creatore/owner dello spazio può rinominare il Conto.'},{status:403});
    }
    const name=parsed.data.name.replace(/\s+/g,' ');
    const oldName=String(resolved.space.account_name||'Spese');
    if(name===oldName)return NextResponse.json({data:{name,currency:'EUR',spaceName:resolved.space.name,canEdit:true},updated:0});

    const {error:updateError}=await sb.from('spaces').update({account_name:name}).eq('id',resolved.spaceId).eq('created_by',user.id);
    if(updateError)return NextResponse.json({error:updateError.message},{status:400});
    const warnings:string[]=[];
    const {error:transactionError}=await sb.from('transactions').update({account_name:name}).eq('space_id',resolved.spaceId).eq('account_name',oldName);
    if(transactionError)warnings.push('Alcuni movimenti storici non sono stati rinominati.');
    const {error:recurringError}=await sb.from('recurring_transactions').update({account_name:name}).eq('space_id',resolved.spaceId).eq('account_name',oldName);
    if(recurringError)warnings.push('Alcune ricorrenze storiche non sono state rinominate.');
    return NextResponse.json({data:{name,currency:'EUR',spaceName:resolved.space.name,canEdit:true},oldName,warning:warnings.length?warnings.join(' '):undefined});
  }catch(error:any){
    const forbidden=error?.message==='Accesso negato';
    return NextResponse.json({error:forbidden?'Accesso negato':error?.message||'Impossibile rinominare il conto.'},{status:forbidden?403:400});
  }
}
