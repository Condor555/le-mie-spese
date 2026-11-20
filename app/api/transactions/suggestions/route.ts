import {NextResponse} from 'next/server';
import {activeSpace} from '../../../../lib/active-space';
import {normalizeSuggestionText,rankTransactionSuggestions,type SuggestionRow} from '../../../../lib/transaction-suggestions';

function pattern(value:string){
  return value.replace(/[\\%_]/g,match=>`\\${match}`);
}

export async function GET(req:Request){
  try{
    const url=new URL(req.url);
    const query=normalizeSuggestionText(url.searchParams.get('q')||'');
    const requestedSpaceId=url.searchParams.get('spaceId');
    const kind=url.searchParams.get('kind')==='income'?'income':'expense';
    if(query.length<2)return NextResponse.json({data:[]},{headers:{'cache-control':'no-store'}});
    const {sb,spaceId}=await activeSpace(requestedSpaceId);
    let history=sb
      .from('transactions')
      .select('note,category_name,date,created_at,amount')
      .eq('space_id',spaceId)
      .not('note','is',null)
      .ilike('note',`%${pattern(query)}%`)
      .order('date',{ascending:false})
      .order('created_at',{ascending:false})
      .limit(400);
    history=kind==='income'?history.gt('amount',0):history.lt('amount',0);
    const {data,error}=await history;
    if(error)return NextResponse.json({error:error.message,data:[]},{status:400});
    return NextResponse.json({data:rankTransactionSuggestions((data||[]) as SuggestionRow[],query,5)},{headers:{'cache-control':'no-store'}});
  }catch(error:any){
    const message=error?.message||'Unauthorized';
    return NextResponse.json({error:message,data:[]},{status:message==='Access denied'?403:401});
  }
}
