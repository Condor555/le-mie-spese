'use client';

import {useId,useMemo,useRef} from 'react';
import {amountExpressionInput,evaluateAmountExpression,formatAmountPreview,sanitizeAmountExpression} from '../lib/amount-expression';
import {useI18n} from './LanguageProvider';

type Props={value:string;onChange:(value:string)=>void;id?:string;ariaLabel?:string;disabled?:boolean;className?:string;compact?:boolean;autoFocus?:boolean;placeholder?:string};

/** Input diretto: nessun tastierino/pulsante, parser sicuro e anteprima solo per espressioni. */
export default function AmountExpressionInput({value,onChange,id,ariaLabel='Importo',disabled=false,className='',compact=false,autoFocus=false}:Props){
  const {t}=useI18n();
  const generated=useId();const inputId=id||`amount-${generated.replace(/:/g,'')}`;const previewId=`${inputId}-preview`;const inputRef=useRef<HTMLInputElement|null>(null);
  const result=useMemo(()=>evaluateAmountExpression(value),[value]);
  const hasExpression=/[+\-*/×÷()]/.test(value.replace(/^\s*-?\d+(?:[.,]\d+)?\s*$/,''));
  function change(next:string){onChange(sanitizeAmountExpression(next))}
  function keys(event:React.KeyboardEvent<HTMLInputElement>){
    if(event.key==='='&&hasExpression&&result.ok){event.preventDefault();change(amountExpressionInput(result.value));requestAnimationFrame(()=>inputRef.current?.select())}
  }
  return <div className={`amount-expression${compact?' compact':''}${className?` ${className}`:''}`}>
    <div className="amount-expression-control"><input ref={inputRef} id={inputId} inputMode="text" enterKeyHint="done" autoComplete="off" spellCheck={false} autoFocus={autoFocus} disabled={disabled} value={value} onChange={event=>change(event.target.value)} onKeyDown={keys} placeholder="€ 0,00" aria-label={ariaLabel} aria-describedby={hasExpression?previewId:undefined} aria-invalid={Boolean(hasExpression&&!result.ok)}/></div>
    {hasExpression&&<div id={previewId} className={`amount-preview ${result.ok?'valid':'invalid'}`} role="status">{result.ok?<>{t('amount.result')} <b>{formatAmountPreview(result.value)}</b></>:<>{'error' in result?result.error:''}</>}</div>}
  </div>;
}
