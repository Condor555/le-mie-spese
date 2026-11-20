import {NextResponse} from 'next/server';
import {z} from 'zod';
import {activeSpace} from '../../../../lib/active-space';

const Contribution=z.object({space_id:z.string().uuid().optional(),goal_id:z.string().uuid(),amount:z.number().positive().max(1_000_000_000),contribution_date:z.string(),note:z.string().max(200).default('')});
export async function POST(req:Request){
  try{const body=Contribution.parse(await req.json());const {sb,user,spaceId}=await activeSpace(body.space_id);const {data:goal}=await sb.from('saving_goals').select('id,status').eq('space_id',spaceId).eq('id',body.goal_id).maybeSingle();if(!goal||goal.status!=='active')return NextResponse.json({error:'Obiettivo non disponibile.'},{status:409});const {data,error}=await sb.from('saving_goal_contributions').insert({space_id:spaceId,goal_id:body.goal_id,amount:body.amount,contribution_date:body.contribution_date,note:body.note,contributed_by:user.id}).select().single();return NextResponse.json({data,error:error?.message,transactionCreated:false},{status:error?400:200})}catch(error:any){if(error instanceof z.ZodError)return NextResponse.json({error:'Contributo non valido.'},{status:400});return NextResponse.json({error:error?.message||'Unauthorized'},{status:400})}
}
export async function GET(req:Request){
  try{const url=new URL(req.url);const goalId=z.string().uuid().parse(url.searchParams.get('goalId'));const {sb,spaceId}=await activeSpace(url.searchParams.get('spaceId'));const {data,error}=await sb.from('saving_goal_contributions').select('id,amount,contribution_date,note,contributed_by,created_at').eq('space_id',spaceId).eq('goal_id',goalId).order('contribution_date',{ascending:false});return NextResponse.json({data:data||[],error:error?.message},{status:error?400:200})}catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:400})}
}
