'use client';
import {useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
type Space={id:string;name:string;type:string};
export default function SpaceSwitcher(){
 const [spaces,setSpaces]=useState<Space[]>([]); const [active,setActive]=useState(''); const [ready,setReady]=useState(false);
 const router=useRouter(); const pathname=usePathname();
 async function load(){setReady(false);try{const j=await fetch('/api/spaces',{cache:'no-store'}).then(r=>r.json());const list:Space[]=j.data||[];setSpaces(list);const saved=localStorage.getItem('active_space');const wanted=list.some(s=>s.id===saved)?saved||'':list.find(s=>s.type==='personal')?.id||list[0]?.id||'';if(wanted){setActive(wanted);localStorage.setItem('active_space',wanted);await fetch('/api/spaces/select',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({spaceId:wanted})});}}finally{setReady(true)}}
 useEffect(()=>{load()},[pathname]);
 async function choose(id:string){setActive(id);localStorage.setItem('active_space',id);await fetch('/api/spaces/select',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({spaceId:id})});router.refresh()}
 if(!ready)return <div className="space-switcher space-loading">Caricamento spazio…</div>;
 if(!spaces.length)return null;
 return <div className="space-switcher space-switcher-only"><select value={active} onChange={e=>choose(e.target.value)}>{spaces.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
}
