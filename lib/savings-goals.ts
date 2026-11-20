import type {SupabaseClient} from '@supabase/supabase-js';

export type SavingGoalSummary={
  id:string;spaceId:string;name:string;icon:string;color:string;targetAmount:number;accumulated:number;remaining:number;progress:number;
  targetDate:string|null;status:'active'|'completed';linkedCategoryName:string|null;createdBy:string;canEdit:boolean;canContribute:boolean;
  monthsRemaining:number|null;weeksRemaining:number|null;suggestedMonthly:number|null;suggestedWeekly:number|null;forecastDate:string|null;
};

type SavingGoalRow={
  id:string;space_id:string;name:string;icon:string|null;color:string|null;
  target_amount:number|string;target_date:string|null;status:'active'|'completed';
  linked_category_name:string|null;created_by:string;
};
type SavingGoalContributionRow={goal_id:string;amount:number|string;contribution_date:string;contributed_by:string};
type SpaceMembershipRow={role:'owner'|'member'};
type SpaceOwnerRow={created_by:string};

const round=(value:number)=>Math.round((value+Number.EPSILON)*100)/100;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function periods(targetDate:string|null){
  if(!targetDate)return {months:null,weeks:null};const start=new Date(`${today()}T12:00:00Z`),end=new Date(`${targetDate}T12:00:00Z`);const days=Math.max(1,Math.ceil((end.getTime()-start.getTime())/86400000));return {months:Math.max(1,Math.ceil(days/30.4375)),weeks:Math.max(1,Math.ceil(days/7))};
}

export async function loadSavingGoals(sb:SupabaseClient,spaceId:string,userId:string):Promise<SavingGoalSummary[]>{
  const [{data:goals,error:goalError},{data:contributions,error:contributionError},{data:membership},{data:space}]=await Promise.all([
    sb.from('saving_goals').select('*').eq('space_id',spaceId).order('status').order('created_at'),
    sb.from('saving_goal_contributions').select('goal_id,amount,contribution_date,contributed_by').eq('space_id',spaceId).order('contribution_date'),
    sb.from('space_members').select('role').eq('space_id',spaceId).eq('user_id',userId).maybeSingle(),
    sb.from('spaces').select('created_by').eq('id',spaceId).single(),
  ]);
  const error=goalError||contributionError;if(error)throw new Error(error.message);
  const goalRows=(goals||[]) as unknown as SavingGoalRow[];
  const contributionRows=(contributions||[]) as unknown as SavingGoalContributionRow[];
  const membershipRow=membership as unknown as SpaceMembershipRow|null;
  const spaceRow=space as unknown as SpaceOwnerRow|null;
  const canEdit=membershipRow?.role==='owner'||spaceRow?.created_by===userId;
  const byGoal=new Map<string,SavingGoalContributionRow[]>();for(const item of contributionRows){const list=byGoal.get(item.goal_id)||[];list.push(item);byGoal.set(item.goal_id,list)}
  return goalRows.map((goal):SavingGoalSummary=>{
    const list=byGoal.get(goal.id)||[];const accumulated=round(list.reduce((sum,item)=>sum+Number(item.amount),0));const targetAmount=Number(goal.target_amount);const remaining=round(Math.max(0,targetAmount-accumulated));const {months,weeks}=periods(goal.target_date);const averageMonthly=list.length?list.reduce((sum,item)=>sum+Number(item.amount),0)/Math.max(1,new Set(list.map(item=>String(item.contribution_date).slice(0,7))).size):0;let forecastDate:string|null=null;
    if(remaining<=0)forecastDate=list.at(-1)?.contribution_date||today();else if(averageMonthly>0){const date=new Date(`${today()}T12:00:00Z`);date.setUTCMonth(date.getUTCMonth()+Math.ceil(remaining/averageMonthly));forecastDate=date.toISOString().slice(0,10)}
    return {id:goal.id,spaceId:goal.space_id,name:goal.name,icon:goal.icon||'piggy-bank',color:goal.color||'#35A96B',targetAmount,accumulated,remaining,progress:targetAmount>0?Math.min(100,Math.round(accumulated/targetAmount*100)):0,targetDate:goal.target_date,status:goal.status,linkedCategoryName:goal.linked_category_name,createdBy:goal.created_by,canEdit,canContribute:goal.status==='active',monthsRemaining:months,weeksRemaining:weeks,suggestedMonthly:months?round(remaining/months):null,suggestedWeekly:weeks?round(remaining/weeks):null,forecastDate};
  });
}
