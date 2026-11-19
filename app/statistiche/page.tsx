'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {PieChart,Pie,Cell,ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip} from 'recharts';
import {categoryStyle} from '../../lib/category-style';
import {onActiveSpaceChanged} from '../../lib/active-space-client';
import Icon from '../../components/Icon';

const eur=(value:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(value);
type Stats={expense:number;income:number;balance:number;categories:{name:string;value:number}[]};
type Trend={month:string;income:number;expense:number};
const monthFormatter=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric',timeZone:'UTC'});
const readableMonth=(value:string)=>{
  const [year,month]=value.split('-').map(Number);
  return Number.isFinite(year)&&Number.isFinite(month)
    ?monthFormatter.format(new Date(Date.UTC(year,month-1,1)))
    :value;
};

export default function Statistiche(){
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

  useEffect(()=>{loadStats()},[loadStats]);
  useEffect(()=>{loadTrends()},[loadTrends]);
  useEffect(()=>onActiveSpaceChanged(spaceId=>{
    statsRequestRef.current++;
    trendsRequestRef.current++;
    setStats(null);
    setTrends([]);
    loadStats(spaceId);
    loadTrends(spaceId);
  }),[loadStats,loadTrends]);

  const categories=stats?.categories?.slice(0,6)||[];
  return <>
    <header className="page-head stats-head"><div><h1>Statistiche</h1><p>Scopri dove va il tuo denaro</p></div><label className="stats-month-control"><Icon name="calendar" size={24}/><span>{readableMonth(month)}</span><input className="stats-month-picker" type="month" value={month} onChange={event=>setMonth(event.target.value)} onClick={event=>event.currentTarget.showPicker?.()} aria-label={`Mese selezionato: ${readableMonth(month)}`}/></label></header>
    <section className="section surface"><div className="section-title"><div><small>Uscite del mese</small><h2>{eur(stats?.expense||0)}</h2></div></div><div className="donut-wrap"><ResponsiveContainer><PieChart><Pie data={categories} dataKey="value" innerRadius="61%" outerRadius="88%" paddingAngle={2}>{categories.map(category=><Cell key={category.name} fill={categoryStyle(category.name).color}/>)}</Pie><Tooltip formatter={value=>eur(Number(value))}/></PieChart></ResponsiveContainer><div className="donut-center"><small>Spese</small><b>{eur(stats?.expense||0)}</b></div></div><div className="legend-list">{categories.map(category=><div key={category.name}><i style={{background:categoryStyle(category.name).color}}/><span>{category.name}</span><b>{Math.round(category.value/(stats?.expense||1)*100)}%</b></div>)}</div></section>
    <section className="section surface"><div className="section-title"><h2>Entrate e uscite</h2><small>ultimi 6 mesi</small></div><div className="stat-chart"><ResponsiveContainer><BarChart data={trends}><XAxis dataKey="month" tickFormatter={value=>value.slice(5)} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip formatter={value=>eur(Number(value))}/><Bar dataKey="income" fill="#35c38f" radius={[5,5,0,0]}/><Bar dataKey="expense" fill="#ef6469" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section>
    <div className="metric-grid"><section className="metric surface"><small>Risparmio</small><b>{eur(stats?.balance||0)}</b></section><section className="metric surface"><small>Tasso di risparmio</small><b>{stats?.income?Math.round(stats.balance/stats.income*100):0}%</b></section></div>
  </>;
}
