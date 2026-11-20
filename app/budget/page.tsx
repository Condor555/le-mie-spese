'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import AmountExpressionInput from '../../components/AmountExpressionInput';
import CategoryIcon from '../../components/CategoryIcon';
import {useI18n} from '../../components/LanguageProvider';
import MonthPicker from '../../components/MonthPicker';
import Icon from '../../components/Icon';
import {onActiveSpaceChanged} from '../../lib/active-space-client';
import {useSharedMonth} from '../../lib/selected-period-client';
import {amountForSave} from '../../lib/amount-expression';

const numeric=(value:string)=>{const parsed=Number(value.replace(',','.'));return Number.isFinite(parsed)?parsed:null};
const moneyInput=(value:number)=>value?String(Math.round(value*100)/100).replace('.',','):'';
const percentInput=(value:number)=>value?String(Math.round(value*1000)/1000).replace('.',','):'';
type Status='ok'|'warning'|'over';
type Category={name:string;icon?:string|null;color?:string|null;spent:number;fixedSpent:number;discretionarySpent:number};
type Macro={id:string;name:string;color:string;sortOrder:number;rolloverEnabled:boolean;allocationPercent:number;allocationAmount:number;rolloverAmount:number;commitments:number;budget:number;spent:number;available:number;percentage:number;status:Status;projected:number;projectedPercentage:number;categories:Category[]};
type BudgetData={month:string;spaceId:string;canEdit:boolean;hasBudgetPlan:boolean;totalBudget:number;totalSpent:number;totalPercentage:number;totalAvailable:number;commitments:number;distributable:number;allocated:number;unallocated:number;overcommitted:number;discretionarySpent:number;fixedSpent:number;projectedExpense:number;projectedOverage:number;daysInMonth:number;daysConsidered:number;previousExpense:number;changePercent:number|null;macros:Macro[]};
type AllocationDraft={percent:string;euro:string;last:'percent'|'euro'};
type StructureDraft={name:string;color:string;rolloverEnabled:boolean};

function ProgressBar({value,status}:{value:number;status:Status}){return <div className={`budget-progress ${status}`}><span style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>}

const numberValue=(value:unknown)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:0};
const statusValue=(value:unknown):Status=>value==='warning'||value==='over'?value:'ok';
function normalizeBudgetData(value:unknown,month:string):BudgetData{
  const source=value&&typeof value==='object'?value as Record<string,unknown>:{};
  const macros=Array.isArray(source.macros)?source.macros.filter((item):item is Record<string,unknown>=>Boolean(item)&&typeof item==='object').map(item=>({
    id:String(item.id||''),name:String(item.name||''),color:String(item.color||'#68738C'),sortOrder:numberValue(item.sortOrder),rolloverEnabled:Boolean(item.rolloverEnabled),allocationPercent:numberValue(item.allocationPercent),allocationAmount:numberValue(item.allocationAmount),rolloverAmount:numberValue(item.rolloverAmount),commitments:numberValue(item.commitments),budget:numberValue(item.budget),spent:numberValue(item.spent),available:numberValue(item.available),percentage:numberValue(item.percentage),status:statusValue(item.status),projected:numberValue(item.projected),projectedPercentage:numberValue(item.projectedPercentage),categories:Array.isArray(item.categories)?item.categories.filter((category):category is Record<string,unknown>=>Boolean(category)&&typeof category==='object').map(category=>({name:String(category.name||''),icon:category.icon==null?null:String(category.icon),color:category.color==null?null:String(category.color),spent:numberValue(category.spent),fixedSpent:numberValue(category.fixedSpent),discretionarySpent:numberValue(category.discretionarySpent)})):[],
  })).filter(item=>item.id&&item.name):[];
  return {month:String(source.month||month),spaceId:String(source.spaceId||''),canEdit:Boolean(source.canEdit),hasBudgetPlan:Boolean(source.hasBudgetPlan),totalBudget:numberValue(source.totalBudget),totalSpent:numberValue(source.totalSpent),totalPercentage:numberValue(source.totalPercentage),totalAvailable:numberValue(source.totalAvailable),commitments:numberValue(source.commitments),distributable:numberValue(source.distributable),allocated:numberValue(source.allocated),unallocated:numberValue(source.unallocated),overcommitted:numberValue(source.overcommitted),discretionarySpent:numberValue(source.discretionarySpent),fixedSpent:numberValue(source.fixedSpent),projectedExpense:numberValue(source.projectedExpense),projectedOverage:numberValue(source.projectedOverage),daysInMonth:numberValue(source.daysInMonth),daysConsidered:numberValue(source.daysConsidered),previousExpense:numberValue(source.previousExpense),changePercent:source.changePercent==null?null:numberValue(source.changePercent),macros};
}

export default function Budget(){
  const {currency,t}=useI18n();
  const {month,setMonth}=useSharedMonth();
  const [data,setData]=useState<BudgetData|null>(null);const [spaceId,setSpaceId]=useState('');const [totalDraft,setTotalDraft]=useState('');
  const [allocations,setAllocations]=useState<Record<string,AllocationDraft>>({});const [structure,setStructure]=useState<Record<string,StructureDraft>>({});
  const [newName,setNewName]=useState('');const [newColor,setNewColor]=useState('#68738C');const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [structureBusy,setStructureBusy]=useState(false);
  const [initializing,setInitializing]=useState(false);
  const requestRef=useRef(0);const abortRef=useRef<AbortController|null>(null);

  const applyData=useCallback((raw:unknown)=>{const result=normalizeBudgetData(raw,month);
    setData(result);setSpaceId(result.spaceId);setTotalDraft(moneyInput(result.totalBudget));setInitializing(false);
    setAllocations(Object.fromEntries(result.macros.map(item=>[item.id,{percent:percentInput(item.allocationPercent),euro:moneyInput(item.allocationAmount),last:'percent' as const}])));
    setStructure(Object.fromEntries(result.macros.map(item=>[item.id,{name:item.name,color:item.color,rolloverEnabled:item.rolloverEnabled}])));
  },[month]);
  const load=useCallback(async(targetSpaceId=spaceId)=>{
    const request=++requestRef.current;abortRef.current?.abort();const controller=new AbortController();abortRef.current=controller;setLoading(true);setMessage('');
    try{const params=new URLSearchParams({month});if(targetSpaceId)params.set('spaceId',targetSpaceId);const response=await fetch(`/api/budgets?${params}`,{cache:'no-store',signal:controller.signal});const result=await response.json();if(request!==requestRef.current)return;if(!response.ok)throw new Error('load-failed');applyData(result)}catch(error:unknown){const cause=error as {name?:string};if(cause?.name!=='AbortError'&&request===requestRef.current){setData(null);setMessage(t('budget.loadError'))}}finally{if(request===requestRef.current)setLoading(false)}
  },[month,spaceId,applyData,t]);
  useEffect(()=>{void load();return()=>abortRef.current?.abort()},[load]);
  useEffect(()=>onActiveSpaceChanged(id=>{requestRef.current++;abortRef.current?.abort();setSpaceId(id);setData(null);setInitializing(false)}),[]);

  const draftTotal=amountForSave(totalDraft||'0',true)??0;
  const draftDistributable=Math.max(0,draftTotal-(data?.commitments||0));
  const allocationPercentTotal=useMemo(()=>Object.values(allocations).reduce((sum,item)=>sum+(numeric(item.percent)||0),0),[allocations]);

  function changeTotal(value:string){
    const nextTotal=amountForSave(value||'0',true)??0;const nextDistributable=Math.max(0,nextTotal-(data?.commitments||0));setTotalDraft(value);
    setAllocations(current=>Object.fromEntries(Object.entries(current).map(([id,item])=>{
      if(item.last==='euro'){const euro=amountForSave(item.euro||'0',true)??0;return [id,{...item,percent:nextDistributable>0?percentInput(euro/nextDistributable*100):''}]}
      const percent=numeric(item.percent)||0;return [id,{...item,euro:moneyInput(nextDistributable*percent/100)}];
    })));
  }
  function changePercent(id:string,value:string){
    const clean=value.replace('.',',').replace(/[^0-9,]/g,'').slice(0,8);const percent=numeric(clean)||0;
    setAllocations(current=>({...current,[id]:{percent:clean,euro:moneyInput(draftDistributable*percent/100),last:'percent'}}));
  }
  function changeEuro(id:string,value:string){
    const euro=amountForSave(value||'0',true);
    setAllocations(current=>({...current,[id]:{percent:euro!==null&&draftDistributable>0?percentInput(euro/draftDistributable*100):current[id]?.percent||'',euro:value,last:'euro'}}));
  }
  async function savePlan(){
    if(!data?.canEdit)return;const total=amountForSave(totalDraft||'0',true);if(total===null){setMessage(t('budget.invalidTotal'));return}
    const payload=data.macros.map(item=>({macro_category_id:item.id,percentage:numeric(allocations[item.id]?.percent||'0')||0}));const sum=payload.reduce((value,item)=>value+item.percentage,0);
    if(payload.some(item=>item.percentage<0||item.percentage>100)||sum>100.001){setMessage(t('budget.invalidPercent'));return}
    setSaving(true);setMessage('');try{const response=await fetch('/api/budgets',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({space_id:data.spaceId,month,total_budget:total,allocations:payload})});const result=await response.json();if(!response.ok)throw new Error(result.error||t('budget.saveError'));setMessage(t('budget.planSaved'));await load(data.spaceId)}catch(error:unknown){setMessage(error instanceof Error?error.message:t('budget.saveError'))}finally{setSaving(false)}
  }
  async function macroRequest(method:'POST'|'PATCH'|'DELETE',body?:any,query=''){
    if(!data?.canEdit)return false;setStructureBusy(true);setMessage('');try{const response=await fetch(`/api/budget-macros${query}`,{method,headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify({...body,space_id:data.spaceId}):undefined});const result=await response.json();if(!response.ok)throw new Error(result.error||'Operazione non riuscita.');await load(data.spaceId);return true}catch(error:any){setMessage(error.message);return false}finally{setStructureBusy(false)}
  }
  async function createMacro(){if(newName.trim().length<2){setMessage('Inserisci un nome di almeno 2 caratteri.');return}if(await macroRequest('POST',{name:newName.trim(),color:newColor,rollover_enabled:false})){setNewName('');setNewColor('#68738C');setMessage('Macro-categoria creata.')}}
  async function updateMacro(item:Macro){const draft=structure[item.id];if(!draft)return;if(await macroRequest('PATCH',{action:'update',id:item.id,name:draft.name,color:draft.color,rollover_enabled:draft.rolloverEnabled}))setMessage('Macro-categoria aggiornata.')}
  async function moveMacro(index:number,direction:-1|1){if(!data)return;const next=[...data.macros];const target=index+direction;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];if(await macroRequest('PATCH',{action:'reorder',ids:next.map(item=>item.id)}))setMessage('Ordine aggiornato.')}
  async function assignCategory(categoryName:string,macroId:string){if(await macroRequest('PATCH',{action:'assign',category_name:categoryName,macro_category_id:macroId}))setMessage('Categoria assegnata.')}
  async function removeMacro(item:Macro){if(!data||data.macros.length<2)return;const fallback=data.macros.find(macro=>macro.id!==item.id&&macro.name==='Altro')||data.macros.find(macro=>macro.id!==item.id);if(!fallback)return;if(!confirm(`Eliminare “${item.name}”? Le categorie saranno spostate in “${fallback.name}”.`))return;const query=`?spaceId=${encodeURIComponent(data.spaceId)}&id=${encodeURIComponent(item.id)}&fallbackId=${encodeURIComponent(fallback.id)}`;if(await macroRequest('DELETE',undefined,query))setMessage('Macro-categoria eliminata.')}
  const comparison=data?.changePercent==null?t('budget.noComparison'):t('budget.vsPrevious',{value:`${data.changePercent>0?'+':''}${data.changePercent}`});
  const activeTotal=data?.hasBudgetPlan?data.totalBudget:draftTotal;
  const hasActiveLimit=activeTotal>0;
  const activePercentage=hasActiveLimit&&data?Math.round(data.totalSpent/activeTotal*100):0;
  const activeAvailable=hasActiveLimit&&data?activeTotal-data.totalSpent:null;
  const activeStatus:Status=hasActiveLimit&&data&&data.totalSpent>=activeTotal?'over':hasActiveLimit&&data&&data.totalSpent>=activeTotal*.8?'warning':'ok';
  const previewOvercommitted=hasActiveLimit&&data?Math.max(0,data.commitments-activeTotal):0;

  return <>
    <nav className="subpage-breadcrumb" aria-label={t('budget.breadcrumb')}><Link href="/statistiche" className="back-link budget-back"><span aria-hidden="true"><Icon name="chevronLeft" size={18}/></span>{t('budget.back')}</Link></nav>
    <header className="page-head budget-head"><div><h1>{t('budget.title')}</h1><p>{t('budget.subtitle')}</p></div><MonthPicker value={month} onChange={setMonth}/></header>
    {message&&<div className="notice" role="status">{message}</div>}
    {loading&&<div className="empty-state surface"><b>{t('budget.loading')}</b></div>}
    {data&&!data.hasBudgetPlan&&!initializing&&<section className="empty-state surface budget-empty"><span className="empty-state-icon"><Icon name="chart" size={25}/></span><b>{t('budget.emptyTitle')}</b><p>{t(data.canEdit?'budget.emptyOwner':'budget.emptyMember')}</p>{data.canEdit&&<button type="button" onClick={()=>setInitializing(true)}>{t('budget.configure')}</button>}</section>}
    {data&&(data.hasBudgetPlan||initializing)&&<>
      {initializing&&!data.hasBudgetPlan&&<button type="button" className="secondary budget-cancel-setup" onClick={()=>setInitializing(false)}>{t('budget.cancelSetup')}</button>}
      <section className={`budget-hero macro-budget-hero surface ${activeStatus}`}>
        <div className="budget-hero-head"><div><small>{t('budget.totalMonthly')}</small><strong>{currency(data.totalSpent)} <span>{t('budget.spent')}</span></strong></div><b>{hasActiveLimit?`${activePercentage}%`:'—'}</b></div><ProgressBar value={activePercentage} status={activeStatus}/>
        <div className="budget-numbers"><span>{t('budget.totalRemaining')} <b className={(activeAvailable??0)<0?'red':''}>{activeAvailable==null?'—':currency(activeAvailable)}</b></span>{data.hasBudgetPlan&&<span>{comparison}</span>}</div>
        <div className="commitment-grid"><div><small>{t('budget.commitments')}</small><b>{currency(data.commitments)}</b></div><div><small>{t('budget.distributable')}</small><b>{currency(draftDistributable)}</b></div><div><small>{t('budget.unallocated')}</small><b>{currency(Math.max(0,draftDistributable-draftDistributable*Math.min(100,allocationPercentTotal)/100))}</b></div></div>
        {previewOvercommitted>0&&<div className="budget-warning" role="alert">{t('budget.overcommitted',{amount:currency(previewOvercommitted)})}</div>}
        <label className="budget-input"><span>{t('budget.spaceLimit')}</span><AmountExpressionInput compact disabled={!data.canEdit} value={totalDraft} onChange={changeTotal} ariaLabel={t('budget.spaceLimitAria')}/></label>
        {!data.canEdit&&<small>{t('budget.readOnly')}</small>}
      </section>

      <section className="section surface"><div className="section-title"><div><h2>{t('budget.distribution')}</h2><small>{t('budget.distributionSub')}</small></div><b className={allocationPercentTotal>100?'red':''}>{Math.round(allocationPercentTotal*100)/100}%</b></div>
        <div className="macro-allocation-list">{data.macros.map(item=>{const draft=allocations[item.id]||{percent:'',euro:'',last:'percent' as const};const previewAllocation=amountForSave(draft.euro||'0',true)??0;const displayBudget=data.hasBudgetPlan?item.budget:item.commitments+previewAllocation;const hasMacroLimit=displayBudget>0;const displayAvailable=hasMacroLimit?displayBudget-item.spent:null;const displayPercentage=hasMacroLimit?Math.round(item.spent/displayBudget*100):0;const displayStatus:Status=hasMacroLimit&&item.spent>=displayBudget?'over':hasMacroLimit&&item.spent>=displayBudget*.8?'warning':'ok';return <article className={`macro-allocation ${displayStatus}`} key={item.id}>
          <header><i style={{background:item.color}}/><div><h3>{item.name}</h3><small>{t('budget.categoriesCount',{count:item.categories.length,amount:currency(item.commitments)})}</small></div><strong>{hasMacroLimit?`${displayPercentage}%`:'—'}</strong></header>
          <ProgressBar value={displayPercentage} status={displayStatus}/><div className="macro-values"><span>{t('budget.spent')} <b>{currency(item.spent)}</b></span><span>Budget <b>{hasMacroLimit?currency(displayBudget):'—'}</b></span><span>{t('budget.available')} <b className={(displayAvailable??0)<0?'red':''}>{displayAvailable==null?'—':currency(displayAvailable)}</b></span></div>
          {item.rolloverAmount>0&&<small className="rollover-credit">{t('budget.rolloverCredit',{amount:currency(item.rolloverAmount)})}</small>}
          <div className="macro-allocation-inputs"><label><span>{t('budget.percentage')}</span><div><input inputMode="decimal" disabled={!data.canEdit} value={draft.percent} onChange={event=>changePercent(item.id,event.target.value)} aria-label={`${t('budget.percentage')} ${item.name}`}/><i>%</i></div></label><label><span>{t('budget.euroEquivalent')}</span><AmountExpressionInput compact disabled={!data.canEdit} value={draft.euro} onChange={value=>changeEuro(item.id,value)} ariaLabel={`${t('budget.euroEquivalent')} ${item.name}`}/></label></div>
        </article>})}</div>
      </section>

      <section className="section surface macro-analysis"><div className="section-title"><div><h2>{t('budget.analysis')}</h2><small>{t('budget.analysisSub')}</small></div></div>{data.macros.map(item=><details key={item.id}><summary><i style={{background:item.color}}/><span><b>{item.name}</b><small>{t('budget.actualProjection',{spent:currency(item.spent),projected:currency(item.projected)})}</small></span><strong>{item.projectedPercentage}%</strong></summary><div>{item.categories.length?item.categories.map(category=><div className="macro-category-row" key={category.name}><CategoryIcon name={category.name} icon={category.icon} color={category.color} size={34}/><span><b>{category.name}</b><small>{category.fixedSpent?`${currency(category.fixedSpent)} ${t('stats.fixed')} · `:''}${currency(category.discretionarySpent)} ${t('stats.discretionary')}</small></span><strong>{currency(category.spent)}</strong></div>):<p>{t('stats.noAssigned')}</p>}</div></details>)}</section>

      {data.canEdit&&<section className="section surface macro-structure"><div className="section-title"><div><h2>{t('budget.structure')}</h2><small>{t('budget.structureSub')}</small></div></div>
        <div className="macro-create"><input value={newName} onChange={event=>setNewName(event.target.value)} placeholder={t('budget.newMacro')}/><input type="color" value={newColor} onChange={event=>setNewColor(event.target.value)} aria-label={t('budget.newMacro')}/><button disabled={structureBusy} onClick={createMacro}>{t('budget.add')}</button></div>
        <div className="macro-structure-list">{data.macros.map((item,index)=>{const draft=structure[item.id]||{name:item.name,color:item.color,rolloverEnabled:item.rolloverEnabled};return <article key={item.id}><div className="macro-structure-main"><input type="color" value={draft.color} onChange={event=>setStructure(current=>({...current,[item.id]:{...draft,color:event.target.value}}))} aria-label={`Colore ${item.name}`}/><input value={draft.name} onChange={event=>setStructure(current=>({...current,[item.id]:{...draft,name:event.target.value}}))} aria-label={`Nome ${item.name}`}/><button aria-label={`Sposta su ${item.name}`} disabled={index===0||structureBusy} onClick={()=>moveMacro(index,-1)}>↑</button><button aria-label={`Sposta giù ${item.name}`} disabled={index===data.macros.length-1||structureBusy} onClick={()=>moveMacro(index,1)}>↓</button></div><label className="macro-rollover"><input type="checkbox" checked={draft.rolloverEnabled} onChange={event=>setStructure(current=>({...current,[item.id]:{...draft,rolloverEnabled:event.target.checked}}))}/><span>Riporta il residuo al mese successivo</span></label><div className="macro-structure-actions"><button disabled={structureBusy} onClick={()=>updateMacro(item)}>Salva</button><button className="delete-link" disabled={structureBusy||data.macros.length<2} onClick={()=>removeMacro(item)}>Elimina</button></div><div className="macro-assignments">{item.categories.map(category=><label key={category.name}><span>{category.name}</span><select value={item.id} onChange={event=>assignCategory(category.name,event.target.value)}>{data.macros.map(target=><option key={target.id} value={target.id}>{target.name}</option>)}</select></label>)}</div></article>})}</div>
      </section>}
      {data.canEdit&&<button className="save-btn budget-save" disabled={saving||allocationPercentTotal>100.001} onClick={savePlan}>{saving?t('common.saving'):t('budget.savePlan')}</button>}
      <p className="budget-link"><Link href="/statistiche">{t('budget.openAnalytics')}</Link></p>
    </>}
  </>;
}
