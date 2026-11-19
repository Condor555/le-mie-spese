import {NextResponse} from 'next/server';
import Papa from 'papaparse';
import {activeSpace} from '../../../lib/active-space';
import {inferredCategoryStyle} from '../../../lib/category-style';

const aliases={
  id:['id','transaction id','transactionid'],
  date:['data','date'],
  category:['categoria','category'],
  amount:['importo','amount'],
  currency:['valuta','currency'],
  note:['nota','note','descrizione','description'],
};

function value(row:Record<string,string>,names:string[]){
  const entry=Object.entries(row).find(([key])=>names.includes(key.trim().toLocaleLowerCase('it')));
  return String(entry?.[1]||'').trim();
}

function dateISO(input:string){
  const clean=input.trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(clean))return clean;
  const match=clean.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  return match?`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`:'';
}

function amountNumber(input:string){
  let clean=input.trim().replace(/\s/g,'').replace(/€/g,'');
  if(clean.includes(',')&&clean.includes('.'))clean=clean.lastIndexOf(',')>clean.lastIndexOf('.')?clean.replace(/\./g,'').replace(',','.'):clean.replace(/,/g,'');
  else if(clean.includes(','))clean=clean.replace(',','.');
  return Number(clean);
}

export async function POST(req:Request){
  try{
    const form=await req.formData();
    const requestedSpaceId=String(form.get('space_id')||'').trim();
    if(!requestedSpaceId)return NextResponse.json({error:'Spazio di destinazione mancante.'},{status:400});
    const {sb,user,spaceId}=await activeSpace(requestedSpaceId);
    const file=form.get('file');
    if(!(file instanceof File))return NextResponse.json({error:'File mancante'},{status:400});
    let text=await file.text();
    if(text.charCodeAt(0)===0xfffd){
      const buffer=await file.arrayBuffer();
      text=new TextDecoder('utf-16').decode(buffer);
    }
    const firstLine=text.split(/\r?\n/).find(line=>line.trim())||'';
    const delimiter=(firstLine.match(/;/g)||[]).length>=(firstLine.match(/,/g)||[]).length?';':',';
    const parsed=Papa.parse<Record<string,string>>(text,{header:true,delimiter,skipEmptyLines:true,transformHeader:header=>header.replace(/^\uFEFF/,'').trim()});
    const {data:space,error:spaceError}=await sb.from('spaces').select('account_name').eq('id',spaceId).single();
    if(spaceError)return NextResponse.json({error:spaceError.message},{status:400});

    const rows=parsed.data.map(row=>{
      const sourceId=value(row,aliases.id);
      const date=dateISO(value(row,aliases.date));
      const categoryName=value(row,aliases.category);
      const amount=amountNumber(value(row,aliases.amount));
      return {
        user_id:user.id,
        created_by:user.id,
        space_id:spaceId,
        source:'moneylover',
        source_id:sourceId,
        date,
        category_name:categoryName,
        amount,
        currency:value(row,aliases.currency)||'EUR',
        note:value(row,aliases.note),
        account_name:space?.account_name||'Spese',
      };
    });
    const valid=rows.filter(row=>row.source_id&&row.date&&row.category_name&&Number.isFinite(row.amount));
    const skipped=rows.length-valid.length;

    const distinctCategories=[...new Set(valid.map(row=>row.category_name))];
    if(distinctCategories.length){
      const categoryRows=distinctCategories.map(name=>{
        const style=inferredCategoryStyle(name);
        return {user_id:user.id,space_id:spaceId,name,icon:style.icon,color:style.color};
      });
      const {error:categoryError}=await sb.from('categories').upsert(categoryRows,{onConflict:'space_id,name',ignoreDuplicates:true});
      if(categoryError)return NextResponse.json({error:categoryError.message,imported:0},{status:400});
    }

    let imported=0;
    for(let index=0;index<valid.length;index+=500){
      const {data,error}=await sb.from('transactions').upsert(valid.slice(index,index+500),{onConflict:'user_id,source,source_id',ignoreDuplicates:true}).select('id');
      if(error)return NextResponse.json({error:error.message,imported,read:rows.length,skipped},{status:400});
      imported+=data?.length||0;
    }
    return NextResponse.json({imported,read:rows.length,duplicates:valid.length-imported,skipped,format:delimiter===';'?'semicolon':'comma'});
  }catch(error:any){
    return NextResponse.json({error:error?.message||'Unauthorized'},{status:401});
  }
}
