'use client';

import {useEffect,useState} from 'react';
import BackToAccount from '../../components/BackToAccount';
import SpacePicker,{type SpacePickerOption} from '../../components/SpacePicker';

type Space=SpacePickerOption;

export default function Importa(){
  const [file,setFile]=useState<File>();
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [spaceId,setSpaceId]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loadingSpaces,setLoadingSpaces]=useState(true);

  useEffect(()=>{
    fetch('/api/spaces',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{
        if(!ok){setMessage(result.error||'Impossibile caricare gli spazi.');return;}
        const list:Space[]=result.data||[];
        const selected=result.activeSpaceId||list.find(space=>space.type==='personal')?.id||list[0]?.id||'';
        setSpaces(list);
        setSpaceId(selected);
      })
      .catch(()=>setMessage('Errore di connessione.'))
      .finally(()=>setLoadingSpaces(false));
  },[]);

  async function run(){
    if(!spaceId){setMessage('Seleziona lo spazio di destinazione.');return;}
    if(!file){setMessage('Seleziona un file CSV.');return;}
    setBusy(true);
    setMessage('Importazione in corso…');
    try{
      const form=new FormData();
      form.set('file',file);
      form.set('space_id',spaceId);
      const response=await fetch('/api/import-csv',{method:'POST',body:form});
      const result=await response.json();
      if(!response.ok){setMessage(result.error||'Importazione non riuscita.');return;}
      setMessage(`Letti ${result.read}, importati ${result.imported}, duplicati ${result.duplicates}, ignorati ${result.skipped||0}.`);
    }catch{
      setMessage('Errore di connessione.');
    }finally{
      setBusy(false);
    }
  }

  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Importazione CSV</h1><p>Scegli file e spazio in cui importare i movimenti</p></div></header>
    <section className="settings-card surface import-csv-card">
      <h2>Seleziona destinazione e file</h2>
      <SpacePicker
        spaces={spaces}
        value={spaceId}
        onChange={setSpaceId}
        variant="destination"
        label="Spazio di destinazione"
        help="I movimenti, le categorie mancanti e il Conto configurato saranno associati esclusivamente a questo spazio."
        disabled={busy||loadingSpaces}
      />
      <p className="settings-help">Sono accettati CSV con separatore punto e virgola o virgola e intestazioni italiane/inglesi: <code>Id/ID</code>, <code>Data/Date</code>, <code>Categoria/Category</code>, <code>Importo/Amount</code>. Valuta e nota sono facoltative. Il formato esportato da Money Lover rimane compatibile.</p>
      <p className="settings-help">Il file viene inviato direttamente al database protetto e non è salvato nella repository.</p>
      <input className="import-file-input" type="file" accept=".csv,text/csv" onChange={event=>setFile(event.target.files?.[0])}/>
    </section>
    <button className="save-btn import-csv-submit" disabled={busy||loadingSpaces||!spaceId||!file} onClick={run}>{busy?'Importazione…':'Importa CSV'}</button>
    {message&&<div className="notice" role="status">{message}</div>}
  </>;
}
