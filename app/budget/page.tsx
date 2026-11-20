'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import AmountExpressionInput from '../../components/AmountExpressionInput';
import CategoryIcon from '../../components/CategoryIcon';
import MonthPicker from '../../components/MonthPicker';
import {onActiveSpaceChanged} from '../../lib/active-space-client';
import {useSharedMonth} from '../../lib/selected-period-client';
import {amountForSave} from '../../lib/amount-expression';

const eur=(value:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(value);
const numeric=(value:string)=>{const parsed=Number(value.replace(',','.'));return Number.isFinite(parsed)?parsed:null};
const moneyInput=(value:number)=>value?String(Math.round(value*100)/100).replace('.',','):'';
const percentInput=(value:number)=>value?String(Math.round(value*1000)/1000).replace('.',','):'';
type Status='ok'|'warning'|'over';
type Category={name:string;icon?:string|null;color?:string|null;spent:number;fixedSpent:number;discretionarySpent:number};
type Macro={id:string;name:string;color:string;sortOrder:number;rolloverEnabled:boolean;allocationPercent:number;allocationAmount:number;rolloverAmount:number;commitments:number;budget:number;spent:number;available:number;percentage:number;status:Status;projected:number;projectedPercentage:number;categories:Category[]};
type BudgetData={month:string;spaceId:string;canEdit:boolean;totalBudget:number;totalSpent:number;totalPercentage:number;totalAvailable:number;commitments:number;distributable:number;allocated:number;unallocated:number;overcommitted:number;discretionarySpent:number;fixedSpent:number;projectedExpense:number;projectedOverage:number;daysInMonth:number;daysConsidered:number;previousExpense:number;changePercent:number|null;macros:Macro[]};
type AllocationDraft={percent:string;euro:string;last:'percent'|'euro'};
type StructureDraft={name:string;color:string;rolloverEnabled:boolean};

function ProgressBar({value,status}:{value:number;status:Status}){return <div className={`budget-progress ${status}`}><span style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>}

export default function Budget(){
  const {month,setMonth}=useSharedMonth();
  const [data,setData]=useState<BudgetData|null>(null);const [spaceId,setSpaceId]=useState('');const [totalDraft,setTotalDraft]=useState('');
  const [allocations,setAllocations]=useState<Record<string,AllocationDraft>>({});const [structure,setStructure]=useState<Record<string,StructureDraft>>({});
  const [newName,setNewName]=useState('');const [newColor,setNewColor]=useState('#68738C');const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [structureBusy,setStructureBusy]=useState(false);
  const requestRef=useRef(0);const abortRef=useRef<AbortController|null>(null);

  const applyData=useCallback((result:BudgetData)=>{
    setData(result);setSpaceId(result.spaceId);setTotalDraft(moneyInput(result.totalBudget));
    setAllocations(Object.fromEntries(result.macros.map(item=>[item.id,{percent:percentInput(item.allocationPercent),euro:moneyInput(item.allocationAmount),last:'percent' as const}])));
    setStructure(Object.fromEntries(result.macros.map(item=>[item.id,{name:item.name,color:item.color,rolloverEnabled:item.rolloverEnabled}])));
  },[]);
  const load=useCallback(async(targetSpaceId=spaceId)=>{
    const request=++requestRef.current;abortRef.current?.abort();const controller=new AbortController();abortRef.current=controller;setLoading(true);setMessage('');
    try{const params=new URLSearchParams({month});if(targetSpaceId)params.set('spaceId',targetSpaceId);const response=await fetch(`/api/budgets?${params}`,{cache:'no-store',signal:controller.signal});const result=await response.json();if(request!==requestRef.current)return;if(!response.ok)throw new Error(result.error||'Impossibile caricare i budget.');applyData(result)}catch(error:any){if(error?.name!=='AbortError'&&request===requestRef.current){setData(null);setMessage(error.message)}}finally{if(request===requestRef.current)setLoading(false)}
  },[month,spaceId,applyData]);
  useEffect(()=>{void load();return()=>abortRef.current?.abort()},[load]);
  useEffect(()=>onActiveSpaceChanged(id=>{requestRef.current++;abortRef.current?.abort();setSpaceId(id);setData(null)}),[]);

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
    if(!data?.canEdit)return;const total=amountForSave(totalDraft||'0',true);if(total===null){setMessage('Budget totale non valido.');return}
    const payload=data.macros.map(item=>({macro_category_id:item.id,percentage:numeric(allocations[item.id]?.percent||'0')||0}));const sum=payload.reduce((value,item)=>value+item.percentage,0);
    if(payload.some(item=>item.percentage<0||item.percentage>100)||sum>100.001){setMessage('Le percentuali devono essere tra 0 e 100 e la somma non può superare il 100%.');return}
    setSaving(true);setMessage('');try{const response=await fetch('/api/budgets',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({space_id:data.spaceId,month,total_budget:total,allocations:payload})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Impossibile salvare il piano budget.');setMessage('Piano macro-budget aggiornato.');await load(data.spaceId)}catch(error:any){setMessage(error.message)}finally{setSaving(false)}
  }
  async function macroRequest(method:'POST'|'PATCH'|'DELETE',body?:any,query=''){
    if(!data?.canEdit)return false;setStructureBusy(true);setMessage('');try{const response=await fetch(`/api/budget-macros${query}`,{method,headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify({...body,space_id:data.spaceId}):undefined});const result=await response.json();if(!response.ok)throw new Error(result.error||'Operazione non riuscita.');await load(data.spaceId);return true}catch(error:any){setMessage(error.message);return false}finally{setStructureBusy(false)}
  }
  async function createMacro(){if(newName.trim().length<2){setMessage('Inserisci un nome di almeno 2 caratteri.');return}if(await macroRequest('POST',{name:newName.trim(),color:newColor,rollover_enabled:false})){setNewName('');setNewColor('#68738C');setMessage('Macro-categoria creata.')}}
  async function updateMacro(item:Macro){const draft=structure[item.id];if(!draft)return;if(await macroRequest('PATCH',{action:'update',id:item.id,name:draft.name,color:draft.color,rollover_enabled:draft.rolloverEnabled}))setMessage('Macro-categoria aggiornata.')}
  async function moveMacro(index:number,direction:-1|1){if(!data)return;const next=[...data.macros];const target=index+direction;if(target<0||target>=next.length)return;[next[index],next[target]]=[next[target],next[index]];if(await macroRequest('PATCH',{action:'reorder',ids:next.map(item=>item.id)}))setMessage('Ordine aggiornato.')}
  async function assignCategory(categoryName:string,macroId:string){if(await macroRequest('PATCH',{action:'assign',category_name:categoryName,macro_category_id:macroId}))setMessage('Categoria assegnata.')}
  async function removeMacro(item:Macro){if(!data||data.macros.length<2)return;const fallback=data.macros.find(macro=>macro.id!==item.id&&macro.name==='Altro')||data.macros.find(macro=>macro.id!==item.id);if(!fallback)return;if(!confirm(`Eliminare “${item.name}”? Le categorie saranno spostate in “${fallback.name}”.`))return;const query=`?spaceId=${encodeURIComponent(data.spaceId)}&id=${encodeURIComponent(item.id)}&fallbackId=${encodeURIComponent(fallback.id)}`;if(await macroRequest('DELETE',undefined,query))setMessage('Macro-categoria eliminata.')}
  const comparison=data?.changePercent==null?'Nessun confronto disponibile':`${data.changePercent>0?'+':''}${data.changePercent}% rispetto al mese precedente`;

  return <>
    <header className="page-head budget-head"><div><h1>Budget</h1><p>Dal totale alle macro-categorie</p></div><MonthPicker value={month} onChange={setMonth}/></header>
    {message&&<div className="notice" role="status">{message}</div>}
    {loading&&<div className="empty-state surface"><b>Caricamento macro-budget…</b></div>}
    {data&&<>
      <section className={`budget-hero macro-budget-hero surface ${data.totalBudget>0&&data.totalSpent>=data.totalBudget?'over':data.totalBudget>0&&data.totalSpent>=data.totalBudget*.8?'warning':'ok'}`}>
        <div className="budget-hero-head"><div><small>Budget totale mensile</small><strong>{eur(data.totalSpent)} <span>spesi</span></strong></div><b>{data.totalBudget?`${data.totalPercentage}%`:'—'}</b></div><ProgressBar value={data.totalPercentage} status={data.totalBudget>0&&data.totalSpent>=data.totalBudget?'over':data.totalBudget>0&&data.totalSpent>=data.totalBudget*.8?'warning':'ok'}/>
        <div className="budget-numbers"><span>Residuo totale <b className={data.totalAvailable<0?'red':''}>{eur(data.totalAvailable)}</b></span><span>{comparison}</span></div>
        <div className="commitment-grid"><div><small>Impegni programmati</small><b>{eur(data.commitments)}</b></div><div><small>Disponibile da distribuire</small><b>{eur(draftDistributable)}</b></div><div><small>Non allocato</small><b>{eur(Math.max(0,draftDistributable-draftDistributable*Math.min(100,allocationPercentTotal)/100))}</b></div></div>
        {data.overcommitted>0&&<div className="budget-warning" role="alert">Gli impegni programmati superano il budget totale di {eur(data.overcommitted)}.</div>}
        <label className="budget-input"><span>Limite dello spazio</span><AmountExpressionInput compact disabled={!data.canEdit} value={totalDraft} onChange={changeTotal} ariaLabel="Budget mensile dello spazio" placeholder="0,00 o 150 × 4"/></label>
        {!data.canEdit&&<small>Solo owner/creatore può modificare struttura, allocazioni e rollover.</small>}
      </section>

      <section className="section surface"><div className="section-title"><div><h2>Distribuzione per macro-categoria</h2><small>Percentuale del budget disponibile, equivalente in euro e impegni fissi</small></div><b className={allocationPercentTotal>100?'red':''}>{Math.round(allocationPercentTotal*100)/100}%</b></div>
        <div className="macro-allocation-list">{data.macros.map(item=>{const draft=allocations[item.id]||{percent:'',euro:'',last:'percent' as const};return <article className={`macro-allocation ${item.status}`} key={item.id}>
          <header><i style={{background:item.color}}/><div><h3>{item.name}</h3><small>{item.categories.length} categorie · {eur(item.commitments)} impegni</small></div><strong>{item.percentage}%</strong></header>
          <ProgressBar value={item.percentage} status={item.status}/><div className="macro-values"><span>Speso <b>{eur(item.spent)}</b></span><span>Budget <b>{eur(item.budget)}</b></span><span>Disponibile <b className={item.available<0?'red':''}>{eur(item.available)}</b></span></div>
          {item.rolloverAmount>0&&<small className="rollover-credit">+ {eur(item.rolloverAmount)} residuo dal mese precedente</small>}
          <div className="macro-allocation-inputs"><label><span>Percentuale</span><div><input inputMode="decimal" disabled={!data.canEdit} value={draft.percent} onChange={event=>changePercent(item.id,event.target.value)} aria-label={`Percentuale ${item.name}`}/><i>%</i></div></label><label><span>Equivalente in euro</span><AmountExpressionInput compact disabled={!data.canEdit} value={draft.euro} onChange={value=>changeEuro(item.id,value)} ariaLabel={`Allocazione euro ${item.name}`} placeholder="0,00"/></label></div>
        </article>})}</div>
      </section>

      <section className="section surface macro-analysis"><div className="section-title"><div><h2>Analisi categorie</h2><small>Le categorie restano il dettaglio analitico sotto ogni macro</small></div></div>{data.macros.map(item=><details key={item.id}><summary><i style={{background:item.color}}/><span><b>{item.name}</b><small>{eur(item.spent)} spesi · proiezione {eur(item.projected)}</small></span><strong>{item.projectedPercentage}%</strong></summary><div>{item.categories.length?item.categories.map(category=><div className="macro-category-row" key={category.name}><CategoryIcon name={category.name} icon={category.icon} color={category.color} size={34}/><span><b>{category.name}</b><small>{category.fixedSpent?`${eur(category.fixedSpent)} fissi · `:''}${eur(category.discretionarySpent)} discrezionali</small></span><strong>{eur(category.spent)}</strong></div>):<p>Nessuna categoria assegnata.</p>}</div></details>)}</section>

      {data.canEdit&&<section className="section surface macro-structure"><div className="section-title"><div><h2>Struttura macro-categorie</h2><small>Crea, rinomina, colora, riordina e configura il rollover</small></div></div>
        <div className="macro-create"><input value={newName} onChange={event=>setNewName(event.target.value)} placeholder="Nuova macro-categoria"/><input type="color" value={newColor} onChange={event=>setNewColor(event.target.value)} aria-label="Colore nuova macro-categoria"/><button disabled={structureBusy} onClick={createMacro}>Aggiungi</button></div>
        <div className="macro-structure-list">{data.macros.map((item,index)=>{const draft=structure[item.id]||{name:item.name,color:item.color,rolloverEnabled:item.rolloverEnabled};return <article key={item.id}><div className="macro-structure-main"><input type="color" value={draft.color} onChange={event=>setStructure(current=>({...current,[item.id]:{...draft,color:event.target.value}}))} aria-label={`Colore ${item.name}`}/><input value={draft.name} onChange={event=>setStructure(current=>({...current,[item.id]:{...draft,name:event.target.value}}))} aria-label={`Nome ${item.name}`}/><button aria-label={`Sposta su ${item.name}`} disabled={index===0||structureBusy} onClick={()=>moveMacro(index,-1)}>↑</button><button aria-label={`Sposta giù ${item.name}`} disabled={index===data.macros.length-1||structureBusy} onClick={()=>moveMacro(index,1)}>↓</button></div><label className="macro-rollover"><input type="checkbox" checked={draft.rolloverEnabled} onChange={event=>setStructure(current=>({...current,[item.id]:{...draft,rolloverEnabled:event.target.checked}}))}/><span>Riporta il residuo al mese successivo</span></label><div className="macro-structure-actions"><button disabled={structureBusy} onClick={()=>updateMacro(item)}>Salva</button><button className="delete-link" disabled={structureBusy||data.macros.length<2} onClick={()=>removeMacro(item)}>Elimina</button></div><div className="macro-assignments">{item.categories.map(category=><label key={category.name}><span>{category.name}</span><select value={item.id} onChange={event=>assignCategory(category.name,event.target.value)}>{data.macros.map(target=><option key={target.id} value={target.id}>{target.name}</option>)}</select></label>)}</div></article>})}</div>
      </section>}
      {data.canEdit&&<button className="save-btn budget-save" disabled={saving||allocationPercentTotal>100.001} onClick={savePlan}>{saving?'Salvataggio…':'Salva piano macro-budget'}</button>}
      <p className="budget-link"><Link href="/statistiche">Apri Analytics macro →</Link></p>
    </>}
  </>;
}
