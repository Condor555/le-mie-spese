'use client';

import {useState} from 'react';
import BackToAccount from '../../components/BackToAccount';

export default function Importa(){
  const [file,setFile]=useState<File>();
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  async function run(){
    if(!file){setMessage('Seleziona un file CSV.');return;}
    setBusy(true);
    setMessage('Importazione in corso…');
    try{
      const form=new FormData();
      form.set('file',file);
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
    <header className="page-head"><div><h1>Importazione CSV</h1><p>Importa movimenti nello spazio visualizzato</p></div></header>
    <section className="settings-card surface import-csv-card">
      <h2>Seleziona il file</h2>
      <p className="settings-help">Sono accettati CSV con separatore punto e virgola o virgola e intestazioni italiane/inglesi: <code>Id/ID</code>, <code>Data/Date</code>, <code>Categoria/Category</code>, <code>Importo/Amount</code>. Valuta e nota sono facoltative. Il formato esportato da Money Lover rimane compatibile.</p>
      <p className="settings-help">Il file viene inviato direttamente al database protetto e non è salvato nella repository. Il Conto applicato è quello configurato per lo spazio di destinazione.</p>
      <input className="import-file-input" type="file" accept=".csv,text/csv" onChange={event=>setFile(event.target.files?.[0])}/>
    </section>
    <button className="save-btn import-csv-submit" disabled={busy||!file} onClick={run}>{busy?'Importazione…':'Importa CSV'}</button>
    {message&&<div className="notice" role="status">{message}</div>}
  </>;
}
