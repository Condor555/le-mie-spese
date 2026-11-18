'use client';
import {useEffect,useState} from 'react';
type Stats={categories:{name:string;value:number}[]};
export default function Statistiche(){const [month,setMonth]=useState(new Date().toISOString().slice(0,7));const [s,setS]=useState<Stats|null>(null);useEffect(()=>{fetch('/api/stats?month='+month).then(r=>r.json()).then(setS)},[month]);return <><div className="brand">Statistiche</div><input style={{marginTop:16}} type="month" value={month} onChange={e=>setMonth(e.target.value)}/><div className="card" style={{marginTop:16}}>{s?.categories?.map(c=><div className="row" key={c.name}><div className="grow"><b>{c.name}</b><div className="bar"><span style={{width:`${c.value/(s.categories[0]?.value||1)*100}%`}}/></div></div><b>{c.value.toFixed(2)} €</b></div>)}</div></>}
