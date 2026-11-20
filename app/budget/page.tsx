'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import AmountExpressionInput from '../../components/AmountExpressionInput';
import CategoryIcon from '../../components/CategoryIcon';
import MonthPicker from '../../components/MonthPicker';
import {onActiveSpaceChanged} from '../../lib/active-space-client';
import {useSharedMonth} from '../../lib/selected-period-client';
import {amountForSave} from '../../lib/amount-expression';

type Progress={spent:number;budget:number;available:number;percentage:number;status:'ok'|'warning'|'over'};
type BudgetData={month:string;spaceId:string;canEdit:boolean;total:Progress;previousExpense:number;changePercent:number|null;categories:Array<{name:string;icon?:string;color?:string}&Progress>};
const eur=(value:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(value);
const amountValue=(value:string)=>amountForSave(value||'0',true);

function ProgressBar({value,status}:{value:number;status:Progress['status']}){return <div className={`budget-progress ${status}`}><span style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>}

export default function Budget(){
  const {month,setMonth}=useSharedMonth();
  const [data,setData]=useState<BudgetData|null>(null);const [spaceId,setSpaceId]=useState('');const [drafts,setDrafts]=useState<Record<string,string>>({});const [message,setMessage]=useState('');const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const requestRef=useRef(0);
  const load=useCallback(async(targetSpaceId=spaceId)=>{const request=++requestRef.current;setLoading(true);setMessage('');try{const params=new URLSearchParams({month});if(targetSpaceId)params.set('spaceId',targetSpaceId);const response=await fetch(`/api/budgets?${params}`,{cache:'no-store'});const result=await response.json();if(request!==requestRef.current)return;if(!response.ok)throw new Error(result.error||'Impossibile caricare i budget.');setData(result);setSpaceId(result.spaceId);setDrafts({__TOTAL__:String(result.total.budget||''),...Object.fromEntries(result.categories.map((item:any)=>[item.name,String(item.budget||'')]))});}catch(error:any){if(request===requestRef.current){setData(null);setMessage(error.message)}}finally{if(request===requestRef.current)setLoading(false)}},[month,spaceId]);
  useEffect(()=>{load()},[month]);
  useEffect(()=>onActiveSpaceChanged(id=>{requestRef.current++;setSpaceId(id);setData(null);void load(id)}),[month]);
  async function save(){if(!data?.canEdit)return;const entries=[{category_name:null,key:'__TOTAL__'},...data.categories.map(item=>({category_name:item.name,key:item.name}))];const payloads=[];for(const item of entries){const amount=amountValue(drafts[item.key]||'0');if(amount===null){setMessage(`Importo non valido per ${item.category_name||'budget mensile'}.`);return}payloads.push({space_id:data.spaceId,month,category_name:item.category_name,amount})}setSaving(true);setMessage('');try{for(const payload of payloads){const response=await fetch('/api/budgets',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Impossibile salvare i budget.')}setMessage('Budget aggiornati.');await load(data.spaceId)}catch(error:any){setMessage(error.message)}finally{setSaving(false)}}
  const comparison=data?.changePercent==null?'Nessun confronto disponibile':`${data.changePercent>0?'+':''}${data.changePercent}% rispetto al mese precedente`;
  return <>
    <header className="page-head budget-head"><div><h1>Budget</h1><p>Limiti mensili per spazio e categoria</p></div><MonthPicker value={month} onChange={setMonth}/></header>
    {message&&<div className="notice" role="status">{message}</div>}
    {loading&&<div className="empty-state surface"><b>Caricamento budget…</b></div>}
    {data&&<>
      <section className={`budget-hero surface ${data.total.status}`}><div className="budget-hero-head"><div><small>Budget mensile</small><strong>{eur(data.total.spent)} <span>spesi</span></strong></div><b>{data.total.budget?`${data.total.percentage}%`:'—'}</b></div><ProgressBar value={data.total.percentage} status={data.total.status}/><div className="budget-numbers"><span>Disponibile <b className={data.total.available<0?'red':''}>{eur(data.total.available)}</b></span><span>{comparison}</span></div><label className="budget-input"><span>Limite dello spazio</span><AmountExpressionInput compact disabled={!data.canEdit} value={drafts.__TOTAL__||''} onChange={value=>setDrafts({...drafts,__TOTAL__:value})} ariaLabel="Budget mensile dello spazio" placeholder="0,00 o 150 × 4"/></label>{!data.canEdit&&<small>Solo l’owner dello spazio può modificare i budget.</small>}</section>
      <section className="section surface"><div className="section-title"><div><h2>Budget per categoria</h2><small>Le soglie cambiano colore all’80% e al 100%</small></div></div><div className="category-budget-list">{data.categories.map(item=><article className="category-budget" key={item.name}><CategoryIcon name={item.name} icon={item.icon} color={item.color}/><div className="category-budget-main"><div><b>{item.name}</b><span>{eur(item.spent)} / {item.budget?eur(item.budget):'nessun limite'}</span></div><ProgressBar value={item.percentage} status={item.status}/><small className={item.available<0?'red':''}>{item.budget?`${eur(item.available)} disponibili · ${item.percentage}%`:'Imposta un budget per monitorare la categoria'}</small></div><label><AmountExpressionInput compact ariaLabel={`Budget ${item.name}`} disabled={!data.canEdit} value={drafts[item.name]||''} onChange={value=>setDrafts({...drafts,[item.name]:value})} placeholder="0"/></label></article>)}</div></section>
      {data.canEdit&&<button className="save-btn budget-save" disabled={saving} onClick={save}>{saving?'Salvataggio…':'Salva tutti i budget'}</button>}
      <p className="budget-link"><Link href="/statistiche">Apri Analytics 2.0 →</Link></p>
    </>}
  </>;
}
