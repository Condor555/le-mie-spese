export type AmountExpressionResult=
  |{ok:true;value:number;normalized:string}
  |{ok:false;error:string;normalized:string};

const MAX_LENGTH=120;
const MAX_ABS=1_000_000_000_000;
const MAX_OPERATIONS=64;

function normalizedSource(source:string){
  return source.trim().replace(/[−–—]/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/\s+/g,'');
}

export function sanitizeAmountExpression(source:string){
  return source.replace(/[−–—]/g,'-').replace(/[^0-9+\-*/×÷(),.\s]/g,'').slice(0,MAX_LENGTH);
}

export function evaluateAmountExpression(source:string):AmountExpressionResult{
  const normalized=normalizedSource(source);
  if(!normalized)return {ok:false,error:'Inserisci un importo.',normalized};
  if(normalized.length>MAX_LENGTH)return {ok:false,error:'Il calcolo è troppo lungo.',normalized};
  let index=0;
  let operations=0;
  const fail=(message:string):never=>{throw new Error(message)};
  const checked=(value:number)=>{
    if(!Number.isFinite(value)||Math.abs(value)>MAX_ABS)fail('Risultato fuori limite.');
    return value;
  };
  const count=()=>{operations++;if(operations>MAX_OPERATIONS)fail('Il calcolo contiene troppe operazioni.')};
  function number():number{
    const start=index;let separator=false;let digits=0;
    while(index<normalized.length){
      const char=normalized[index];
      if(/[0-9]/.test(char)){digits++;index++;continue}
      if(char==='.'||char===','){
        if(separator)fail('Usa una sola virgola o punto per ogni numero.');
        separator=true;index++;continue;
      }
      break;
    }
    if(!digits)fail('Numero mancante.');
    const raw=normalized.slice(start,index).replace(',','.');
    const value=Number(raw);
    if(!Number.isFinite(value))fail('Numero non valido.');
    return checked(value);
  }
  function factor():number{
    const char=normalized[index];
    if(char==='+'||char==='-'){
      index++;count();const value=factor();return char==='-'?-value:value;
    }
    if(char==='('){
      index++;const value=expression();
      if(normalized[index]!==')')fail('Parentesi non chiusa.');
      index++;return value;
    }
    if(char===')'||char===undefined)fail('Espressione incompleta.');
    return number();
  }
  function term():number{
    let value=factor();
    while(normalized[index]==='*'||normalized[index]==='/'){
      const operator=normalized[index++];count();const right=factor();
      if(operator==='/'&&Math.abs(right)<Number.EPSILON)fail('Non è possibile dividere per zero.');
      value=checked(operator==='*'?value*right:value/right);
    }
    return value;
  }
  function expression():number{
    let value=term();
    while(normalized[index]==='+'||normalized[index]==='-'){
      const operator=normalized[index++];count();const right=term();
      value=checked(operator==='+'?value+right:value-right);
    }
    return value;
  }
  try{
    const value=expression();
    if(index!==normalized.length)fail(normalized[index]===')'?'Parentesi non aperta.':'Espressione non valida.');
    return {ok:true,value:checked(value),normalized};
  }catch(error){
    return {ok:false,error:error instanceof Error?error.message:'Espressione non valida.',normalized};
  }
}

export function amountForSave(source:string,allowZero=false){
  const result=evaluateAmountExpression(source);
  if(!result.ok)return null;
  const rounded=Math.round((result.value+Number.EPSILON)*100)/100;
  if(allowZero?rounded<0:rounded<=0)return null;
  return rounded;
}

export function amountExpressionInput(value:number){
  const rounded=Math.round((value+Number.EPSILON)*100)/100;
  return String(rounded).replace('.',',');
}

export function formatAmountPreview(value:number){
  return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
}
