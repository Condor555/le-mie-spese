'use client';
import {useEffect,useState} from 'react';
const eur=(v:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(v);
type Stats={income:number;expense:number;balance:number;count:number;categories:{name:string;value:number}[]};
export default function Home(){const [month,setMonth]=useState(new Date().toISOString().slice(0,7));const [s,setS]=useState<Stats|null>(null);
 useEffect(()=>{fetch('/api/stats?month='+month).then(r=>r.json()).then(setS)},[month]);
 return <><div className="top"><div><div className="brand">Le Mie Spese</div><div className="sub">Dashboard mensile</div></div><input style={{width:155}} type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
 <h2>Riepilogo</h2><section className="grid"><div className="card"><div className="sub">Uscite</div><div className="metric red">{eur(s?.expense||0)}</div></div><div className="card"><div className="sub">Entrate</div><div className="metric green">{eur(s?.income||0)}</div></div><div className="card"><div className="sub">Saldo</div><div className="metric">{eur(s?.balance||0)}</div></div><div className="card"><div className="sub">Movimenti</div><div className="metric">{s?.count||0}</div></div></section>
 <h2>Categorie principali</h2><div className="card">{s?.categories?.map((c,i)=><div className="row" key={c.name}><div className="ico">{i+1}</div><div className="grow"><b>{c.name}</b><div className="bar"><span style={{width:`${Math.max(4,c.value/(s.categories[0]?.value||1)*100)}%`}}/></div></div><b>{eur(c.value)}</b></div>)}</div></>}
