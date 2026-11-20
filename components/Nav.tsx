'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowsDownUpIcon} from '@phosphor-icons/react/ssr';
import Icon,{type IconName} from './Icon';

type Tab={href:string;label:string;icon:IconName|'movements';active:(pathname:string)=>boolean};
const tabs:Tab[]=[
  {href:'/',label:'Home',icon:'home',active:pathname=>pathname==='/'},
  {href:'/movimenti',label:'Movimenti',icon:'movements',active:pathname=>pathname==='/movimenti'||pathname.startsWith('/movimenti/')},
  {href:'/statistiche',label:'Statistiche',icon:'chart',active:pathname=>pathname==='/statistiche'||pathname.startsWith('/statistiche/')||pathname==='/budget'||pathname.startsWith('/budget/')},
  {href:'/account',label:'Impostazioni',icon:'settings',active:pathname=>pathname==='/account'||pathname.startsWith('/account/')||pathname==='/spazi'||pathname.startsWith('/spazi/')||pathname==='/importa'||pathname.startsWith('/importa/')},
];

export default function Nav(){
  const pathname=usePathname();
  if(pathname==='/login'||pathname==='/registrati'||pathname==='/onboarding')return null;
  const first=tabs.slice(0,2),last=tabs.slice(2);
  const render=(tab:Tab)=>{const active=tab.active(pathname);return <Link key={tab.href} href={tab.href} className={active?'active':''} aria-current={active?'page':undefined}><span className="nav-tab-icon">{tab.icon==='movements'?<ArrowsDownUpIcon size={22} weight="regular" aria-hidden/>:<Icon name={tab.icon}/>}</span><span>{tab.label}</span></Link>};
  return <nav className="bottom-nav" aria-label="Navigazione principale">
    {first.map(render)}
    <Link className="nav-plus" href="/nuovo" aria-label="Nuova transazione"><Icon name="plus" size={28}/></Link>
    {last.map(render)}
  </nav>;
}
