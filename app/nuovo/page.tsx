'use client';

import {useEffect,useRef,useState} from 'react';
import CategoryIcon from '../../components/CategoryIcon';
import SpacePicker,{type SpacePickerOption} from '../../components/SpacePicker';

type Category={name:string;icon?:string|null;color?:string|null};
type Space=SpacePickerOption;
type Kind='expense'|'income';
type Suggestion={note:string;category:string|null;categoryConfidence:number;frequency:number;lastUsed:string|null};

export default function Nuovo(){
  const [amount,setAmount]=useState('');
  const [note,setNote]=useState('');
  const [category,setCategory]=useState('');
  const [categories,setCategories]=useState<Category[]>([]);
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [spaceId,setSpaceId]=useState('');
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [kind,setKind]=useState<Kind>('expense');
  const [account,setAccount]=useState('Spese');
  const [recurring,setRecurring]=useState(false);
  const [frequency,setFrequency]=useState('monthly');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [loadingSpace,setLoadingSpace]=useState(true);
  const [suggestions,setSuggestions]=useState<Suggestion[]>([]);
  const [suggestionsOpen,setSuggestionsOpen]=useState(false);
  const [suggestionsBusy,setSuggestionsBusy]=useState(false);
  const [activeSuggestion,setActiveSuggestion]=useState(0);
  const destinationRequestRef=useRef(0);
  const suggestionRequestRef=useRef(0);
  const suppressAutocompleteRef=useRef(false);
  const suggestionRefs=useRef<Array<HTMLButtonElement|null>>([]);

  useEffect(()=>{
    fetch('/api/spaces',{cache:'no-store'})
      .then(async response=>({ok:response.ok,result:await response.json()}))
      .then(({ok,result})=>{
        if(!ok){setMessage(result.error||'Impossibile caricare gli spazi.');return;}
        const list:Space[]=result.data||[];
        const selected=result.activeSpaceId||list.find(item=>item.type==='personal')?.id||list[0]?.id||'';
        setSpaces(list);
        setSpaceId(selected);
        if(selected)void loadDestination(selected);
        else setLoadingSpace(false);
      })
      .catch(()=>{setMessage('Errore di connessione.');setLoadingSpace(false);});
  },[]);

  async function loadDestination(targetSpaceId:string){
    const request=++destinationRequestRef.current;
    suggestionRequestRef.current++;
    setLoadingSpace(true);
    setCategory('');
    setCategories([]);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setMessage('');
    try{
      const [categoryResponse,accountResponse]=await Promise.all([
        fetch(`/api/categories?spaceId=${encodeURIComponent(targetSpaceId)}`,{cache:'no-store'}),
        fetch(`/api/settings/account?spaceId=${encodeURIComponent(targetSpaceId)}`,{cache:'no-store'}),
      ]);
      const [categoryResult,accountResult]=await Promise.all([categoryResponse.json(),accountResponse.json()]);
      if(request!==destinationRequestRef.current)return;
      if(!categoryResponse.ok||!accountResponse.ok){
        setMessage(categoryResult.error||accountResult.error||'Impossibile caricare lo spazio.');
        return;
      }
      setCategories(Array.isArray(categoryResult.data)?categoryResult.data:[]);
      setAccount(accountResult.data?.name||'Spese');
    }catch{
      if(request===destinationRequestRef.current)setMessage('Errore di connessione.');
    }finally{
      if(request===destinationRequestRef.current)setLoadingSpace(false);
    }
  }

  function chooseSpace(nextSpaceId:string){
    setSpaceId(nextSpaceId);
    void loadDestination(nextSpaceId);
  }

  useEffect(()=>{
    const clean=note.trim();
    if(suppressAutocompleteRef.current){
      suppressAutocompleteRef.current=false;
      return;
    }
    if(clean.length<2||!spaceId||loadingSpace){
      suggestionRequestRef.current++;
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggestionsBusy(false);
      return;
    }
    const request=++suggestionRequestRef.current;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setSuggestionsBusy(true);
      try{
        const suggestionPromise=fetch(`/api/transactions/suggestions?spaceId=${encodeURIComponent(spaceId)}&q=${encodeURIComponent(clean)}`,{cache:'no-store',signal:controller.signal}).then(async response=>({ok:response.ok,result:await response.json()}));
        const classifyPromise=clean.length>=3
          ?fetch('/api/classify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({note:clean,spaceId}),signal:controller.signal}).then(async response=>({ok:response.ok,result:await response.json()}))
          :Promise.resolve({ok:false,result:{}});
        const [suggestionResult,classifyResult]=await Promise.all([suggestionPromise,classifyPromise]);
        if(request!==suggestionRequestRef.current)return;
        const nextSuggestions=suggestionResult.ok&&Array.isArray(suggestionResult.result.data)?suggestionResult.result.data:[];
        setSuggestions(nextSuggestions);
        setActiveSuggestion(0);
        setSuggestionsOpen(nextSuggestions.length>0);
        if(classifyResult.ok&&typeof classifyResult.result.category==='string'&&categories.some(item=>item.name===classifyResult.result.category))setCategory(classifyResult.result.category);
      }catch(error:any){
        if(error?.name!=='AbortError'&&request===suggestionRequestRef.current){setSuggestions([]);setSuggestionsOpen(false);}
      }finally{
        if(request===suggestionRequestRef.current)setSuggestionsBusy(false);
      }
    },240);
    return()=>{clearTimeout(timer);controller.abort();};
  },[note,spaceId,loadingSpace,categories]);

  function changeNote(value:string){
    setNote(value);
    if(value.trim().length<2){setSuggestions([]);setSuggestionsOpen(false);}
  }

  function selectSuggestion(suggestion:Suggestion){
    suppressAutocompleteRef.current=true;
    suggestionRequestRef.current++;
    setNote(suggestion.note);
    if(suggestion.category&&categories.some(item=>item.name===suggestion.category))setCategory(suggestion.category);
    setSuggestions([]);
    setSuggestionsOpen(false);
  }

  function noteKeys(event:React.KeyboardEvent<HTMLInputElement>){
    if(event.key==='ArrowDown'&&suggestionsOpen&&suggestions.length){
      event.preventDefault();setActiveSuggestion(0);requestAnimationFrame(()=>suggestionRefs.current[0]?.focus());
    }else if(event.key==='Escape')setSuggestionsOpen(false);
  }

  function suggestionKeys(event:React.KeyboardEvent<HTMLButtonElement>,index:number){
    if(event.key==='ArrowDown'){
      event.preventDefault();const next=(index+1)%suggestions.length;setActiveSuggestion(next);suggestionRefs.current[next]?.focus();
    }else if(event.key==='ArrowUp'){
      event.preventDefault();const next=(index-1+suggestions.length)%suggestions.length;setActiveSuggestion(next);suggestionRefs.current[next]?.focus();
    }else if(event.key==='Home'){
      event.preventDefault();setActiveSuggestion(0);suggestionRefs.current[0]?.focus();
    }else if(event.key==='End'){
      event.preventDefault();const next=suggestions.length-1;setActiveSuggestion(next);suggestionRefs.current[next]?.focus();
    }else if(event.key==='Escape'){
      event.preventDefault();setSuggestionsOpen(false);document.getElementById('transaction-note')?.focus();
    }
  }

  function nextDate(value:string,selectedFrequency:string){
    const next=new Date(`${value}T12:00:00`);
    if(selectedFrequency==='weekly')next.setDate(next.getDate()+7);
    else if(selectedFrequency==='yearly')next.setFullYear(next.getFullYear()+1);
    else next.setMonth(next.getMonth()+1);
    return next.toISOString().slice(0,10);
  }

  async function save(){
    const numeric=Number(amount.replace(',','.'));
    if(!spaceId){setMessage('Seleziona lo spazio di destinazione.');return;}
    if(!Number.isFinite(numeric)||numeric<=0){setMessage('Inserisci un importo valido.');return;}
    if(!category||!categories.some(item=>item.name===category)){setMessage('Seleziona una categoria valida per lo spazio scelto.');return;}
    setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/transactions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({space_id:spaceId,date,category_name:category,amount:Math.abs(numeric),currency:'EUR',note,account_name:account,kind})});
      const result=await response.json();
      if(!response.ok){setMessage(result.error||'Errore nel salvataggio.');return;}
      if(recurring){
        const recurringResponse=await fetch('/api/recurring',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({space_id:spaceId,note,category_name:category,amount:kind==='expense'?-Math.abs(numeric):Math.abs(numeric),account_name:account,frequency,interval_count:1,next_run:nextDate(date,frequency)})});
        if(!recurringResponse.ok){
          const recurringResult=await recurringResponse.json();
          setMessage(`Movimento salvato, ma ricorrenza non creata: ${recurringResult.error||'errore sconosciuto'}`);return;
        }
      }
      setMessage('Movimento salvato nello spazio selezionato.');
      setAmount('');setNote('');setCategory('');setSuggestions([]);setSuggestionsOpen(false);setRecurring(false);
    }catch{setMessage('Errore di connessione.');}
    finally{setBusy(false);}
  }

  const selectedCategory=categories.find(item=>item.name===category);

  return <>
    <header className="page-head"><div><h1>Nuova transazione</h1><p>Registra un movimento in pochi secondi</p></div></header>
    <section className="entry-card surface">
      <SpacePicker spaces={spaces} value={spaceId} onChange={chooseSpace} variant="destination" label="Spazio di destinazione" help="Il movimento e l’eventuale ricorrenza saranno salvati qui. Il Conto rimane una proprietà distinta dello spazio." disabled={busy||loadingSpace}/>
      <div className="segmented"><button type="button" className={kind==='expense'?'active':''} onClick={()=>setKind('expense')}>Uscita</button><button type="button" className={kind==='income'?'active':''} onClick={()=>setKind('income')}>Entrata</button></div>
      <input className="amount-input" inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="€ 0,00"/>
      <div className="field autocomplete-field"><label htmlFor="transaction-note">Descrizione</label><input id="transaction-note" value={note} autoComplete="off" aria-autocomplete="list" aria-expanded={suggestionsOpen} aria-controls={suggestionsOpen?'transaction-note-suggestions':undefined} onFocus={()=>{if(suggestions.length)setSuggestionsOpen(true)}} onKeyDown={noteKeys} onChange={event=>changeNote(event.target.value)} placeholder="Es. Spesa Conad"/>{suggestionsBusy&&<span className="autocomplete-busy" aria-live="polite">Ricerca suggerimenti…</span>}{suggestionsOpen&&suggestions.length>0&&<div id="transaction-note-suggestions" className="autocomplete-list" role="listbox" aria-label="Descrizioni già usate">{suggestions.map((suggestion,index)=><button ref={node=>{suggestionRefs.current[index]=node}} key={suggestion.note.toLocaleLowerCase('it')} type="button" role="option" aria-selected={index===activeSuggestion} tabIndex={index===activeSuggestion?0:-1} onMouseDown={event=>event.preventDefault()} onMouseEnter={()=>setActiveSuggestion(index)} onKeyDown={event=>suggestionKeys(event,index)} onClick={()=>selectSuggestion(suggestion)}><span><b>{suggestion.note}</b><small>{suggestion.category||'Categoria non disponibile'} · usata {suggestion.frequency} {suggestion.frequency===1?'volta':'volte'}</small></span><strong>↵</strong></button>)}</div>}</div>
      <div className="field"><label>Categoria</label><div className="category-picker"><CategoryIcon name={category||'Categoria'} icon={selectedCategory?.icon} color={selectedCategory?.color}/><select value={category} disabled={loadingSpace} onChange={event=>setCategory(event.target.value)}><option value="">{loadingSpace?'Caricamento categorie…':categories.length?'Seleziona categoria':'Nessuna categoria nello spazio'}</option>{categories.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></div></div>
      <div className="two-col"><div className="field"><label>Data</label><input type="date" value={date} onChange={event=>setDate(event.target.value)}/></div><div className="field"><label>Conto</label><input value={account} readOnly aria-readonly="true" title="Modificabile da Impostazioni > Conto per lo spazio selezionato"/></div></div>
      <label className="toggle-card"><span><b>Transazione ricorrente</b><small>Generala nello stesso spazio</small></span><input type="checkbox" checked={recurring} onChange={event=>setRecurring(event.target.checked)}/></label>
      {recurring&&<select value={frequency} onChange={event=>setFrequency(event.target.value)}><option value="weekly">Ogni settimana</option><option value="monthly">Ogni mese</option><option value="yearly">Ogni anno</option></select>}
      <button className="save-btn" disabled={busy||loadingSpace||!spaceId} onClick={save}>{busy?'Salvataggio...':`Salva${amount?' € '+amount:''}`}</button>
      {message&&<div className="notice" role="status">{message}</div>}
    </section>
  </>;
}
