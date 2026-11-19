import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';

function monthBounds(month:string){
  const [year,monthNumber]=month.split('-').map(Number);const start=`${year}-${String(monthNumber).padStart(2,'0')}-01`;const nextDate=new Date(Date.UTC(year,monthNumber,1));const end=nextDate.toISOString().slice(0,10);const previousDate=new Date(Date.UTC(year,monthNumber-2,1));const previous=`${previousDate.getUTCFullYear()}-${String(previousDate.getUTCMonth()+1).padStart(2,'0')}`;return {year,monthNumber,start,end,previous};
}
function romeToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const value=(type:string)=>Number(parts.find(part=>part.type===type)?.value||0);return {year:value('year'),month:value('month'),day:value('day')}}
const percentChange=(current:number,previous:number)=>previous>0?Math.round((current-previous)/previous*100):null;

export async function GET(req:Request){
  try{
    const url=new URL(req.url);const {sb,spaceId}=await activeSpace(url.searchParams.get('spaceId'));const requested=url.searchParams.get('month')||new Date().toISOString().slice(0,7);const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(requested)?requested:new Date().toISOString().slice(0,7);const bounds=monthBounds(month);const previousBounds=monthBounds(bounds.previous);
    const [{data,error},{data:previousRows,error:previousError},{data:budgetRows,error:budgetError}]=await Promise.all([
      sb.from('transactions').select('amount,category_name,date,created_by').eq('space_id',spaceId).gte('date',bounds.start).lt('date',bounds.end),
      sb.from('transactions').select('amount,category_name').eq('space_id',spaceId).gte('date',previousBounds.start).lt('date',previousBounds.end),
      sb.from('budgets').select('category_name,amount').eq('space_id',spaceId).eq('month',bounds.start),
    ]);
    if(error||previousError||budgetError)return NextResponse.json({error:error?.message||previousError?.message||budgetError?.message},{status:400});
    const rows=data||[];const previous=previousRows||[];
    const income=rows.filter(row=>Number(row.amount)>0).reduce((sum,row)=>sum+Number(row.amount),0);const expense=-rows.filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const previousIncome=previous.filter(row=>Number(row.amount)>0).reduce((sum,row)=>sum+Number(row.amount),0);const previousExpense=-previous.filter(row=>Number(row.amount)<0).reduce((sum,row)=>sum+Number(row.amount),0);
    const budgetByCategory=new Map<string,number>((budgetRows||[]).filter((row:any)=>row.category_name).map((row:any)=>[String(row.category_name),Number(row.amount)] as [string,number]));const totalBudget=Number((budgetRows||[]).find((row:any)=>row.category_name===null)?.amount||0);
    const byCategory=new Map<string,number>();const byAuthor=new Map<string,number>();
    rows.filter(row=>Number(row.amount)<0).forEach(row=>{byCategory.set(row.category_name,(byCategory.get(row.category_name)||0)-Number(row.amount));const author=row.created_by||'imported';byAuthor.set(author,(byAuthor.get(author)||0)-Number(row.amount))});
    const categories=[...byCategory].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([name,value])=>({name,value,budget:budgetByCategory.get(name)||0,budgetPercentage:budgetByCategory.get(name)?Math.round(value/(budgetByCategory.get(name)||1)*100):0}));
    const top=categories[0];const previousTopExpense=top?previous.filter(row=>row.category_name===top.name&&Number(row.amount)<0).reduce((sum,row)=>sum-Number(row.amount),0):0;
    const authorIds=[...byAuthor.keys()].filter(id=>id!=='imported');const {data:profiles}=authorIds.length?await sb.from('profiles').select('user_id,display_name').in('user_id',authorIds):{data:[]};const names=new Map((profiles||[]).map(profile=>[profile.user_id,profile.display_name]));const authors=[...byAuthor].sort((a,b)=>b[1]-a[1]).map(([userId,value])=>({userId,name:userId==='imported'?'Importato':names.get(userId)||'Utente',value,percentage:expense?Math.round(value/expense*100):0}));
    const today=romeToday();const selectedKey=bounds.year*12+bounds.monthNumber;const currentKey=today.year*12+today.month;const daysInMonth=new Date(Date.UTC(bounds.year,bounds.monthNumber,0)).getUTCDate();const daysConsidered=selectedKey<currentKey?daysInMonth:selectedKey===currentKey?Math.min(today.day,daysInMonth):0;const dailyAverageExpense=daysConsidered>0?expense/daysConsidered:0;const projectedExpense=selectedKey<currentKey?expense:selectedKey===currentKey?dailyAverageExpense*daysInMonth:0;const budgetPercentage=totalBudget>0?Math.round(expense/totalBudget*100):0;
    return NextResponse.json({month,income,expense,balance:income-expense,count:rows.length,previousIncome,previousExpense,incomeChangePercent:percentChange(income,previousIncome),expenseChangePercent:percentChange(expense,previousExpense),categories,authors,dailyAverageExpense,projectedExpense,daysConsidered,daysInMonth,budget:{amount:totalBudget,spent:expense,available:totalBudget-expense,percentage:budgetPercentage,status:totalBudget>0&&expense>=totalBudget?'over':totalBudget>0&&expense>=totalBudget*.8?'warning':'ok'},topCategory:top?{name:top.name,value:top.value,percentage:expense>0?Math.round(top.value/expense*100):0,previousValue:previousTopExpense,changePercent:percentChange(top.value,previousTopExpense),comparison:previousTopExpense>0?'available':'no-previous-data'}:null});
  }catch(error:any){return NextResponse.json({error:error?.message||'Unauthorized'},{status:401})}
}
