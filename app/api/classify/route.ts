import {NextResponse} from 'next/server';
import {activeSpace} from '../../../lib/active-space';

const stop=new Set(['spesa','pagamento','pos','della','del','con','per']);
function tokens(value:string){
  return value.toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(token=>token.length>2&&!stop.has(token));
}

export async function POST(req:Request){
  try{
    const {note,spaceId:requestedSpaceId,kind:requestedKind}=await req.json();const kind=requestedKind==='income'?'income':'expense';const fallback=kind==='income'?'Altra entrata':'Altro';
    const query=tokens(String(note||''));
    const {sb,spaceId}=await activeSpace(typeof requestedSpaceId==='string'?requestedSpaceId:undefined);
    if(!query.length)return NextResponse.json({category:fallback,confidence:.1,reason:'Descrizione insufficiente'});
    let history=sb.from('transactions').select('note,category_name,amount').eq('space_id',spaceId).not('note','is',null).limit(5000);history=kind==='income'?history.gt('amount',0):history.lt('amount',0);const {data,error}=await history;
    if(error)return NextResponse.json({error:error.message},{status:400});
    const score=new Map<string,number>();
    for(const transaction of data||[]){
      const words=new Set(tokens(transaction.note||''));
      let points=0;
      query.forEach(token=>{
        if(words.has(token))points+=3;
        else if([...words].some(word=>word.includes(token)||token.includes(word)))points++;
      });
      if(points)score.set(transaction.category_name,(score.get(transaction.category_name)||0)+points);
    }
    const ranked=[...score].sort((a,b)=>b[1]-a[1]);
    const total=ranked.slice(0,5).reduce((sum,item)=>sum+item[1],0)||1;
    return NextResponse.json({
      category:ranked[0]?.[0]||fallback,
      confidence:Math.min(.99,(ranked[0]?.[1]||0)/total),
      alternatives:ranked.slice(1,4).map(item=>item[0]),
      reason:`Basato sullo storico dello spazio selezionato: ${query.join(', ')}`,
    });
  }catch(error:any){
    const message=error?.message||'Unauthorized';
    return NextResponse.json({error:message},{status:message==='Access denied'?403:401});
  }
}
