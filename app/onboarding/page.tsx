'use client';

import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import CategoryIcon from '../../components/CategoryIcon';
import Icon from '../../components/Icon';

type CategoryPreview={
  name:string;
  icon?:string|null;
  color?:string|null;
  suggestion?:{name:string;score:number}|null;
  defaultAction:'import'|'skip';
};
type SetupResult={
  personalSpaceId:string;
  sharedSpace?:{id:string;name:string}|null;
  displayName:string;
};

export default function Onboarding(){
  const router=useRouter();
  const [displayName,setDisplayName]=useState('');
  const [inviteCode,setInviteCode]=useState('');
  const [setup,setSetup]=useState<SetupResult|null>(null);
  const [categories,setCategories]=useState<CategoryPreview[]>([]);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  useEffect(()=>{
    const pendingName=localStorage.getItem('onboarding_display_name')||'';
    const pendingInvite=localStorage.getItem('onboarding_invite_code')||'';
    fetch('/api/onboarding',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{
        if(!ok){setMessage(result.error||'Impossibile caricare la configurazione.');return;}
        const data=result.data||{};
        setDisplayName(pendingName||data.displayName||'');
        setInviteCode((pendingInvite||data.metadataInvite||'').toUpperCase());
        if(data.complete&&!pendingInvite&&!data.metadataInvite){
          router.replace('/');
          router.refresh();
        }
      })
      .catch(()=>setMessage('Errore di connessione.'))
      .finally(()=>setLoading(false));
  },[router]);

  async function start(){
    if(displayName.trim().length<2){setMessage('Inserisci un nome di almeno 2 caratteri.');return;}
    setBusy(true);
    setMessage('');
    try{
      const response=await fetch('/api/onboarding',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({displayName,inviteCode}),
      });
      const result=await response.json();
      if(!response.ok){setMessage(result.error||'Impossibile completare la configurazione.');return;}
      const next:SetupResult=result.data;
      setSetup(next);
      if(next.sharedSpace?.id){
        const previewResponse=await fetch(`/api/spaces/categories/preview?spaceId=${encodeURIComponent(next.sharedSpace.id)}`,{cache:'no-store'});
        const preview=await previewResponse.json();
        if(!previewResponse.ok){setMessage(preview.error||'Spazio collegato, ma categorie non disponibili.');return;}
        const list:CategoryPreview[]=preview.data||[];
        setCategories(list);
        setSelected(new Set(list.filter(item=>item.defaultAction==='import').map(item=>item.name)));
      }else{
        await finish(next.personalSpaceId);
      }
    }catch{
      setMessage('Errore di connessione.');
    }finally{
      setBusy(false);
    }
  }

  function toggle(name:string){
    setSelected(current=>{
      const next=new Set(current);
      if(next.has(name))next.delete(name);else next.add(name);
      return next;
    });
  }

  async function importAndFinish(){
    if(!setup)return;
    setBusy(true);
    setMessage('');
    try{
      if(setup.sharedSpace?.id&&categories.length){
        const response=await fetch('/api/spaces/categories/import',{
          method:'POST',
          headers:{'content-type':'application/json'},
          body:JSON.stringify({
            spaceId:setup.sharedSpace.id,
            categories:categories.map(item=>({...item,action:selected.has(item.name)?'import':'skip'})),
          }),
        });
        const result=await response.json();
        if(!response.ok){setMessage(result.error||'Impossibile copiare le categorie.');return;}
      }
      await finish(setup.sharedSpace?.id||setup.personalSpaceId);
    }catch{
      setMessage('Errore di connessione.');
    }finally{
      setBusy(false);
    }
  }

  async function finish(spaceId:string){
    const response=await fetch('/api/spaces/select',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({spaceId}),
    });
    if(!response.ok){
      const result=await response.json();
      throw new Error(result.error||'Impossibile selezionare lo spazio.');
    }
    localStorage.removeItem('onboarding_display_name');
    localStorage.removeItem('onboarding_invite_code');
    localStorage.setItem('active_space',spaceId);
    router.replace('/');
    router.refresh();
  }

  const importCount=useMemo(()=>selected.size,[selected]);

  if(loading)return <div className="onboarding-loading">Preparazione del tuo spazio…</div>;

  return <div className="onboarding-screen">
    <header className="onboarding-head">
      <span className="onboarding-logo">€</span>
      <div><small>LE MIE SPESE · V3.6</small><h1>{setup?.sharedSpace?'Scegli le categorie':'Configura il tuo account'}</h1></div>
    </header>

    {!setup&&<section className="onboarding-card surface">
      <div className="onboarding-step"><span>1</span><div><b>Il tuo profilo</b><small>Il nome identifica l’autore dei movimenti condivisi.</small></div></div>
      <label className="field"><span>Nome visualizzato</span><input value={displayName} onChange={event=>setDisplayName(event.target.value)} maxLength={60} autoComplete="name" placeholder="Es. Fabrizio"/></label>
      <div className="onboarding-step onboarding-step-second"><span>2</span><div><b>Spazio condiviso</b><small>Inserisci il codice ricevuto, oppure continua solo con lo spazio personale.</small></div></div>
      <label className="field"><span>Codice invito <em>facoltativo</em></span><input value={inviteCode} onChange={event=>setInviteCode(event.target.value.toUpperCase())} maxLength={24} autoCapitalize="characters" placeholder="Es. F37BCDD9"/></label>
      <button className="save-btn" disabled={busy} onClick={start}>{busy?'Configurazione…':inviteCode?'Crea profilo e unisciti':'Crea il mio spazio personale'}</button>
    </section>}

    {setup?.sharedSpace&&<section className="onboarding-card surface">
      <div className="onboarding-shared"><Icon name="family" size={24}/><div><small>SPAZIO CONDIVISO</small><b>{setup.sharedSpace.name}</b></div></div>
      <p className="onboarding-copy">Scegli quali categorie personali copiare nello spazio condiviso. Le categorie già presenti o molto simili sono deselezionate per evitare duplicati.</p>
      <div className="onboarding-select-actions"><button type="button" onClick={()=>setSelected(new Set(categories.map(item=>item.name)))}>Seleziona tutte</button><button type="button" onClick={()=>setSelected(new Set())}>Deseleziona</button></div>
      <div className="onboarding-categories">
        {categories.map(item=><label key={item.name} className={selected.has(item.name)?'selected':''}>
          <input type="checkbox" checked={selected.has(item.name)} onChange={()=>toggle(item.name)}/>
          <CategoryIcon name={item.name} icon={item.icon||undefined} color={item.color||undefined} size={40}/>
          <span><b>{item.name}</b><small>{item.suggestion?`Simile a “${item.suggestion.name}” già presente`:'Nuova nello spazio condiviso'}</small></span>
        </label>)}
      </div>
      <button className="save-btn" disabled={busy} onClick={importAndFinish}>{busy?'Completamento…':`Continua · copia ${importCount} ${importCount===1?'categoria':'categorie'}`}</button>
    </section>}

    {message&&<div className="notice" role="status">{message}</div>}
  </div>;
}
