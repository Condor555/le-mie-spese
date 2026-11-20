import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';
import {loadMacroBudgetSnapshot} from '../../../lib/macro-budget';
import {loadSavingGoals,type SavingGoalSummary} from '../../../lib/savings-goals';

type StatsTransactionRow={amount:number|string;category_name:string;date?:string;created_by?:string|null};
type ProfileRow={user_id:string;display_name:string|null};

function monthBounds(month:string){
  const [year,monthNumber]=month.split('-').map(Number);const start=`${year}-${String(monthNumber).padStart(2,'0')}-01`;const nextDate=new Date(Date.UTC(year,monthNumber,1));const end=nextDate.toISOString().slice(0,10);const previousDate=new Date(Date.UTC(year,monthNumber-2,1));const previous=`${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth()+1).padStart(2,'0')}`;return {year,monthNumber,start,end,previous};
}
function romeToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);return {year:value('year'),month:value('month'),day:value('day')}}
const percentChange=(current:number,previous:number)=>previous>0?Math.round((current-previous)/previous*100):null;

export async function GET(req:Request){
  try{
    const url=new URL(req.url);const {sb,user,spaceId}=await activeSpace(url.searchParams.get('spaceId'));const requested=url.searchParams.get('month')||new Date().toISOString().slice(0,7);const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(requested)?requested:new Date().toISOString().slice(0,7);const bounds=monthBounds(month);const previousBounds=monthBounds(bounds.previous);
    const [{data,error},{data:previousRows,error:previousError},macroBudget,savingGoals]=await Promise.all([
      sb.from('transactions').select('amount,category_name,date,created_by').eq('space_id',spaceId).gte('date',bounds.start).lt('date',bounds.end),
      sb.from('transactions').select('amount,category_name').eq('space_id',spaceId).gte('date',previousBounds.start).lt('date',previousBounds.end),
      loadMacroBudgetSnapshot(sb,spaceId,month),
      loadSavingGoals(sb,spaceId,user.id),
    ]);
    if(error||previousError)return NextResponse.json({error:error?.message||previousError?.message},{status:400});
    const rows=(data||[]) as unknown as StatsTransactionRow[];const previous=(previousRows||[]) as unknown as StatsTransactionRow[];
    const income=rows.filter(row=>Number(row.amount)>0).reduce((sum,row)=>sum+Number(row.amount),0);const expense=-rows.filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const previousIncome=previous.filter(row=>Number(row.amount)>0).reduce((sum,row)=>sum+Number(row.amount),0);const previousExpense=-previous.filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const byCategory=new Map<string,number>();const byIncomeCategory=new Map<string,number>();const byAuthor=new Map<string,number>();
    rows.filter(row=>Number(row.amount)<0).forEach(row=>{byCategory.set(row.category_name,(byCategory.get(row.category_name)||0)-Number(row.amount));const author=row.created_by||'imported';byAuthor.set(author,(byAuthor.get(author)||0)-Number(row.amount))});
    rows.filter(row=>Number(row.amount)>0).forEach(row=>byIncomeCategory.set(row.category_name,(byIncomeCategory.get(row.category_name)||0)+Number(row.amount)));
    const categories=[...byCategory].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,value])=>({name,value,budget:0,budgetPercentage:0}));
    const incomeSources=[...byIncomeCategory].sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value,percentage:income>0?Math.round(value/income*100):0}));
    const top=categories[0];const previousTopExpense=top?previous.filter(row=>row.category_name===top.name&&Number(row.amount)<0).reduce((sum,row)=>sum-Number(row.amount),0):0;
    const authorIds=[...byAuthor.keys()].filter(id=>id!=='imported');const {data:profiles}=authorIds.length?await sb.from('profiles').select('user_id,display_name').in('user_id',authorIds):{data:[]};const profileRows=(profiles||[]) as unknown as ProfileRow[];const names=new Map(profileRows.map(profile=>[profile.user_id,profile.display_name]));const authors=[...byAuthor].sort((a,b)=>b[1]-a[1]).map(([userId,value])=>({userId,name:userId==='imported'?'Importato':names.get(userId)||'Utente',value,percentage:expense?Math.round(value/expense*100):0}));
    const today=romeToday();const selectedKey=bounds.year*12+bounds.monthNumber;const currentKey=today.year*12+today.month;const daysInMonth=new Date(Date.UTC(bounds.year,bounds.monthNumber,0)).getUTCDate();const daysConsidered=selectedKey<currentKey?daysInMonth:selectedKey===currentKey?Math.min(today.day,daysInMonth):0;const dailyAverageExpense=daysConsidered>0?expense/daysConsidered:0;
    const activeSavingGoals:SavingGoalSummary[]=savingGoals.filter((goal:SavingGoalSummary)=>goal.status==='active').slice(0,4);
    return NextResponse.json({
      month,income,expense,balance:income-expense,count:rows.length,previousIncome,previousExpense,
      incomeChangePercent:percentChange(income,previousIncome),expenseChangePercent:percentChange(expense,previousExpense),categories,incomeSources,authors,
      dailyAverageExpense,projectedExpense:macroBudget.projectedExpense,daysConsidered,daysInMonth,
      budget:{amount:macroBudget.totalBudget,spent:macroBudget.totalSpent,available:macroBudget.totalAvailable,percentage:macroBudget.totalPercentage,status:macroBudget.totalBudget>0&&macroBudget.totalSpent>=macroBudget.totalBudget?'over':macroBudget.totalBudget>0&&macroBudget.totalSpent>=macroBudget.totalBudget*.8?'warning':'ok',commitments:macroBudget.commitments,distributable:macroBudget.distributable,projected:macroBudget.projectedExpense,projectedOverage:macroBudget.projectedOverage},
      macroCategories:macroBudget.macros,
      savingGoals:activeSavingGoals,
      topCategory:top?{name:top.name,value:top.value,percentage:expense>0?Math.round(top.value/expense*100):0,previousValue:previousTopExpense,changePercent:percentChange(top.value,previousTopExpense),comparison:previousTopExpense>0?'available':'no-previous-data'}:null,
    });
  }catch(error:unknown){const message=error instanceof Error?error.message:'Unauthorized';return NextResponse.json({error:message},{status:message==='Unauthorized'?401:400})}
}
