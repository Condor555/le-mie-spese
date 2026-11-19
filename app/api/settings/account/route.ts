import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createClient} from '../../../../lib/supabase/server';

const AccountSchema=z.object({name:z.string().trim().min(2,'Il nome del conto deve avere almeno 2 caratteri.').max(40,'Il nome del conto può contenere al massimo 40 caratteri.')});

async function currentAccount(sb:any,userId:string){
  const {data:account,error}=await sb.from('accounts').select('id,name,currency,created_at').eq('user_id',userId).order('created_at',{ascending:true}).limit(1).maybeSingle();
  if(error)throw error;
  if(account)return account;
  const {data:transaction}=await sb.from('transactions').select('account_name').eq('user_id',userId).not('account_name','is',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
  return {id:null,name:transaction?.account_name||'Spese',currency:'EUR'};
}

export async function GET(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  try{return NextResponse.json({data:await currentAccount(sb,user.id)})}
  catch(error:any){return NextResponse.json({error:error?.message||'Impossibile caricare il conto.'},{status:400})}
}

export async function PATCH(req:Request){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const parsed=AccountSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Nome non valido.'},{status:400});
  const name=parsed.data.name.replace(/\s+/g,' ');
  try{
    const current=await currentAccount(sb,user.id),oldName=String(current.name||'Spese');
    if(name===oldName)return NextResponse.json({data:{...current,name},updated:0});
    const accountResult=current.id
      ? await sb.from('accounts').update({name}).eq('id',current.id).eq('user_id',user.id)
      : await sb.from('accounts').insert({user_id:user.id,name,currency:'EUR'});
    if(accountResult.error)return NextResponse.json({error:accountResult.error.message},{status:400});
    const warnings:string[]=[];
    const {error:transactionError}=await sb.from('transactions').update({account_name:name}).eq('user_id',user.id).eq('account_name',oldName);
    if(transactionError)warnings.push('Alcuni movimenti storici non sono stati rinominati.');
    const {error:recurringError}=await sb.from('recurring_transactions').update({account_name:name}).eq('user_id',user.id).eq('account_name',oldName);
    if(recurringError)warnings.push('Alcune ricorrenze storiche non sono state rinominate.');
    return NextResponse.json({data:{id:current.id,name,currency:current.currency||'EUR'},oldName,warning:warnings.length?warnings.join(' '):undefined});
  }catch(error:any){return NextResponse.json({error:error?.message||'Impossibile rinominare il conto.'},{status:400})}
}
