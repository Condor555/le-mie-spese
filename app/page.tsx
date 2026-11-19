'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts';
import Icon from '../components/Icon';
import CategoryIcon from '../components/CategoryIcon';
import {categoryStyle} from '../lib/category-style';
import {onActiveSpaceChanged} from '../lib/active-space-client';

const eur=(value:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(value);
type TopCategory={name:string;value:number;percentage:number;previousValue:number;changePercent:number|null;comparison:'available'|'no-previous-data'};
type Stats={
  income:number;
  expense:number;
  balance:number;
  count:number;
  dailyAverageExpense:number;
  daysConsidered:number;
  daysInMonth:number;
  topCategory:TopCategory|null;
  categories:{name:string;value:number}[];
};
type Trend={month:string;income:number;expense:number};

export default function Home(){
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const [stats,setStats]=useState<Stats|null>(null);
  const [trends,setTrends]=useState<Trend[]>([]);
  const statsRequestRef=useRef(0);
  const trendsRequestRef=useRef(0);

  const loadStats=useCallback(async(targetSpaceId?:string)=>{
    const request=++statsRequestRef.current;
    try{
      const params=new URLSearchParams({month});
      if(targetSpaceId)params.set('spaceId',targetSpaceId);
      const result=await fetch(`/api/stats?${params}`,{cache:'no-store'}).then(response=>response.json());
      if(request===statsRequestRef.current&&!result.error)setStats(result);
    }catch{if(request===statsRequestRef.current)setStats(null)}
  },[month]);

  const loadTrends=useCallback(async(targetSpaceId?:string)=>{
    const request=++trendsRequestRef.current;
    try{
      const suffix=targetSpaceId?`?spaceId=${encodeURIComponent(targetSpaceId)}`:'';
      const result=await fetch(`/api/trends${suffix}`,{cache:'no-store'}).then(response=>response.json());
      if(request===trendsRequestRef.current)setTrends((result.data||[]).slice(-6));
    }catch{if(request===trendsRequestRef.current)setTrends([])}
  },[]);

  useEffect(()=>{
    loadStats();
    const onFocus=()=>loadStats();
    window.addEventListener('focus',onFocus);
    return()=>window.removeEventListener('focus',onFocus);
  },[loadStats]);

  useEffect(()=>{loadTrends()},[loadTrends]);
  useEffect(()=>onActiveSpaceChanged(spaceId=>{
    statsRequestRef.current++;
    trendsRequestRef.current++;
    setStats(null);
    setTrends([]);
    loadStats(spaceId);
    loadTrends(spaceId);
  }),[loadStats,loadTrends]);

  const total=stats?.expense||1;
  const top=stats?.topCategory;
  const comparison=top?.changePercent==null
    ?'Nessuna spesa il mese scorso'
    :`${top.changePercent>0?'+':''}${top.changePercent}% rispetto al mese scorso`;

  return <>
    <header className="page-head"><div><h1>Le Mie Spese</h1><p>Il tuo mese, a colpo d'occhio</p></div></header>
    <div className="hero-month surface"><Icon name="calendar" size={19}/><input type="month" value={month} onChange={event=>setMonth(event.target.value)}/><span>›</span></div>

    <section className="balance-card">
      <header><Icon name="wallet" size={18}/><span>Saldo del mese</span><Icon name="chart" size={20}/></header>
      <strong>{eur(stats?.balance||0)}</strong>
      <div className="balance-average"><span>Media giornaliera uscite</span><b>{eur(stats?.dailyAverageExpense||0)}</b><small>{stats?.daysConsidered?`su ${stats.daysConsidered} ${stats.daysConsidered===1?'giorno trascorso':'giorni trascorsi'}`:'nessun giorno trascorso'}</small></div>
    </section>

    <div className="money-grid">
      <section className="money-card surface"><header><span>Entrate</span><Icon name="arrowUp" size={16}/></header><strong className="green">{eur(stats?.income||0)}</strong></section>
      <section className="money-card surface"><header><span>Uscite</span><Icon name="arrowDown" size={16}/></header><strong className="red">{eur(stats?.expense||0)}</strong></section>
    </div>

    <section className="section surface">
      <div className="section-title"><h2>Andamento</h2><small>ultimi 6 mesi</small></div>
      <div className="home-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trends} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid stroke="var(--line)" vertical={false}/><XAxis dataKey="month" tickFormatter={value=>new Intl.DateTimeFormat('it-IT',{month:'short'}).format(new Date(`${value}-01`))} axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={value=>eur(Number(value))}/><Line dataKey="income" stroke="#35c38f" strokeWidth={3} dot={{r:3}}/><Line dataKey="expense" stroke="#ef6469" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
      <div className="chart-key"><span><i className="key-green"/>Entrate</span><span><i className="key-red"/>Uscite</span></div>
    </section>

    {top&&<section className="insight surface">
      <span className="insight-icon"><Icon name="chart" size={20}/></span>
      <div><small>Rispetto al solito</small><b>{top.name} è la voce principale</b><p>{eur(top.value)} · {top.percentage}% delle uscite</p><p className={top.changePercent==null?'insight-comparison neutral':top.changePercent>0?'insight-comparison up':'insight-comparison down'}>{comparison}</p></div>
    </section>}

    <section className="section surface">
      <div className="section-title"><h2>Categorie principali</h2><small>{stats?.count||0} movimenti</small></div>
      {stats?.categories?.slice(0,5).map(category=>{
        const style=categoryStyle(category.name);
        return <div className="category-row" key={category.name}><CategoryIcon name={category.name}/><div className="category-main"><div><b>{category.name}</b><strong>{eur(category.value)}</strong></div><div className="progress"><span style={{width:`${Math.max(4,category.value/(stats.categories[0]?.value||1)*100)}%`,background:style.color}}/></div><small>{Math.round(category.value/total*100)}%</small></div></div>;
      })}
    </section>
  </>;
}
