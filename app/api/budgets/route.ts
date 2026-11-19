import {NextResponse} from 'next/server';
import {z} from 'zod';
import {activeSpace} from '../../../lib/active-space';

const Month=/^\d{4}-(0[1-9]|1[0-2])$/;
const Payload=z.object({space_id:z.string().uuid().optional(),month:z.string().regex(Month),category_name:z.string().nullable().optional(),amount:z.number().min(0)});
const monthStart=(month:string)=>`${month}-01`;
const previousMonth=(month:string)=>{const [year,value]=month.split('-').map(Number);const date=new Date(Date.UTC(year,value-2,1));return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`};
const monthEnd=(month:string)=>{const [year,value]=month.split('-').map(Number);const date=new Date(Date.UTC(year,value,1));return date.toISOString().slice(0,10)};

export async function GET(req:Request){
  try{
    const url=new URL(req.url);const requested=url.searchParams.get('month')||new Date().toISOString().slice(0,7);const month=Month.test(requested)?requested:new Date().toISOString().slice(0,7);
    const {sb,user,spaceId}=await activeSpace(url.searchParams.get('spaceId'));
    const previous=previousMonth(month);
    const [{data:budgets,error:budgetError},{data:rows,error:rowError},{data:previousRows,error:previousError},{data:categories,error:categoryError},{data:membership}]=await Promise.all([
      sb.from('budgets').select('id,category_name,amount').eq('space_id',spaceId).eq('month',monthStart(month)),
      sb.from('transactions').select('amount,category_name').eq('space_id',spaceId).gte('date',monthStart(month)).lt('date',monthEnd(month)),
      sb.from('transactions').select('amount').eq('space_id',spaceId).gte('date',monthStart(previous)).lt('date',monthEnd(previous)),
      sb.from('categories').select('name,icon,color').eq('space_id',spaceId).order('name'),
      sb.from('space_members').select('role').eq('space_id',spaceId).eq('user_id',user.id).maybeSingle(),
    ]);
    const error=budgetError||rowError||previousError||categoryError;if(error)return NextResponse.json({error:error.message},{status:400});
    const expense=-(rows||[]).filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const previousExpense=-(previousRows||[]).filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const spent=new Map<string,number>();for(const row of rows||[])if(Number(row.amount)<0)spent.set(row.category_name,(spent.get(row.category_name)||0)-Number(row.amount));
    const totalBudget=Number((budgets||[]).find(row=>row.category_name===null)?.amount||0);
    const categoryBudgets=new Map<string,number>((budgets||[]).filter((row:any)=>row.category_name!==null).map((row:any)=>[String(row.category_name),Number(row.amount)] as [string,number]));
    const progress=(used:number,limit:number)=>({spent:used,budget:limit,available:limit-used,percentage:limit>0?Math.round(used/limit*100):0,status:limit>0&&used>=limit?'over':limit>0&&used>=limit*.8?'warning':'ok'});
    return NextResponse.json({month,spaceId,canEdit:membership?.role==='owner',total:progress(expense,totalBudget),previousExpense,changePercent:previousExpense>0?Math.round((expense-previousExpense)/previousExpense*100):null,categories:(categories||[]).map(category=>({...category,...progress(spent.get(category.name)||0,categoryBudgets.get(category.name)||0)}))});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}

export async function PUT(req:Request){
  try{
    const payload=Payload.parse(await req.json());const {sb,spaceId}=await activeSpace(payload.space_id);
    const {data,error}=await sb.rpc('set_space_budget',{p_space_id:spaceId,p_month:monthStart(payload.month),p_category_name:payload.category_name||null,p_amount:payload.amount});
    return NextResponse.json({data,error:error?.message},{status:error?400:200});
  }catch(error:any){if(error instanceof z.ZodError)return NextResponse.json({error:'Budget non valido.'},{status:400});return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}
