'use client';
import {useId,useMemo,useRef,useState} from 'react';
import {amountExpressionInput,evaluateAmountExpression,formatAmountPreview,sanitizeAmountExpression} from '../lib/amount-expression';

type Props={
  value:string;
  onChange:(value:string)=>void;
  id?:string;
  ariaLabel?:string;
  placeholder?:string;
  disabled?:boolean;
  className?:string;
  compact?:boolean;
  autoFocus?:boolean;
};

const keys=['7','8','9','÷','4','5','6','×','1','2','3','−','0',',','(',')','+','⌫','C','='] as const;

export default function AmountExpressionInput({value,onChange,id,ariaLabel='Importo',placeholder='0,00',disabled=false,className='',compact=false,autoFocus=false}:Props){
  const generated=useId();const inputId=id||`amount-${generated.replace(/:/g,'')}`;const previewId=`${inputId}-preview`;
  const inputRef=useRef<HTMLInputElement|null>(null);const [open,setOpen]=useState(false);
  const result=useMemo(()=>evaluateAmountExpression(value),[value]);
  const hasExpression=/[+\-*/×÷()]/.test(value.replace(/^\s*-/,''));
  function change(next:string){onChange(sanitizeAmountExpression(next))}
  function insert(token:string){
    const input=inputRef.current;const start=input?.selectionStart??value.length;const end=input?.selectionEnd??start;
    const translated=token==='−'?'-':token;
    change(value.slice(0,start)+translated+value.slice(end));
    requestAnimationFrame(()=>{const position=start+translated.length;input?.focus();input?.setSelectionRange(position,position)});
  }
  function press(token:typeof keys[number]){
    if(token==='C'){change('');inputRef.current?.focus();return}
    if(token==='⌫'){
      const input=inputRef.current;const start=input?.selectionStart??value.length;const end=input?.selectionEnd??start;
      if(start!==end)change(value.slice(0,start)+value.slice(end));
      else if(start>0)change(value.slice(0,start-1)+value.slice(end));
      requestAnimationFrame(()=>input?.focus());return;
    }
    if(token==='='){
      if(result.ok){change(amountExpressionInput(result.value));setOpen(false)}
      inputRef.current?.focus();return;
    }
    insert(token);
  }
  return <div className={`amount-expression${compact?' compact':''}${className?` ${className}`:''}`}>
    <div className="amount-expression-control">
      <input ref={inputRef} id={inputId} inputMode="text" autoComplete="off" spellCheck={false} autoFocus={autoFocus} disabled={disabled} value={value} onChange={event=>change(event.target.value)} onKeyDown={event=>{if(event.key==='='&&result.ok){event.preventDefault();press('=')}}} placeholder={placeholder} aria-label={ariaLabel} aria-describedby={value?previewId:undefined} aria-invalid={Boolean(value&&!result.ok&&hasExpression)}/>
      <button type="button" className="amount-calculator-toggle" aria-label={open?'Chiudi mini-calcolatrice':'Apri mini-calcolatrice'} aria-expanded={open} disabled={disabled} onClick={()=>setOpen(current=>!current)}>⌗</button>
    </div>
    {value&&<div id={previewId} className={`amount-preview ${result.ok?'valid':'invalid'}`} role="status">{result.ok?<>Risultato <b>{formatAmountPreview(result.value)}</b></>:hasExpression?<>{result.error}</>:<>Inserisci un numero valido.</>}</div>}
    {open&&<div className="amount-keypad" aria-label="Mini-calcolatrice">{keys.map(token=><button key={token} type="button" className={/[÷×−+=]/.test(token)?'operator':''} disabled={disabled||(token==='='&&!result.ok)} onClick={()=>press(token)}>{token}</button>)}</div>}
  </div>;
}
