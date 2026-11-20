'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {InfoIcon} from '@phosphor-icons/react/ssr';
import {createClient} from '../../lib/supabase/client';
import Icon,{type IconName} from '../../components/Icon';

type SettingsItem={href:string;icon:IconName|'info';title:string;sub:string};

const items:SettingsItem[]=[
  {href:'/account/profilo',icon:'user',title:'Profilo',sub:'Nome utente e password'},
  {href:'/account/conto',icon:'wallet',title:'Conto',sub:'Scegli il nome del Conto per ogni spazio'},
  {href:'/account/aspetto',icon:'sun',title:'Aspetto',sub:'Tema chiaro, scuro o automatico'},
  {href:'/account/categorie',icon:'category',title:'Categorie',sub:'Crea, modifica, unisci o elimina'},
  {href:'/budget',icon:'chart',title:'Budget',sub:'Limiti mensili, macro-categorie e impegni'},
  {href:'/account/obiettivi',icon:'gift',title:'Obiettivi di risparmio',sub:'Traguardi, contributi e previsioni'},
  {href:'/account/ricorrenze',icon:'repeat',title:'Ricorrenze e abbonamenti',sub:'Scadenze, movimenti futuri e pagamenti'},
  {href:'/spazi',icon:'family',title:'Spazi e membri',sub:'Gestisci Personale, Famiglia e inviti'},
  {href:'/account/dati',icon:'download',title:'Importazione / esportazione dati',sub:'Importa o esporta file CSV'},
  {href:'/account/informazioni',icon:'info',title:'Informazioni',sub:'Versione, licenze e attribuzioni'},
];

function SettingsIcon({name}:{name:SettingsItem['icon']}){
  return name==='info'?<InfoIcon size={22} weight="regular" aria-hidden="true"/>:<Icon name={name}/>;
}

export default function Impostazioni(){
  const router=useRouter();
  async function logout(){await createClient().auth.signOut();router.replace('/login');router.refresh()}
  return <>
    <header className="page-head"><div><h1>Impostazioni</h1><p>Profilo e gestione dell'app</p></div></header>
    <section className="profile-menu surface">{items.map(item=><Link key={item.href} href={item.href} className="profile-menu-row"><span className="profile-menu-icon"><SettingsIcon name={item.icon}/></span><div><b>{item.title}</b><small>{item.sub}</small></div><strong>›</strong></Link>)}</section>
    <button className="danger profile-logout" onClick={logout}><Icon name="logout" size={18}/> Esci dall'account</button>
  </>;
}
