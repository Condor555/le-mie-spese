export type SuggestionRow={note:string|null;category_name:string|null;date:string|null;created_at:string|null};
export type TransactionSuggestion={note:string;category:string|null;categoryConfidence:number;frequency:number;lastUsed:string|null};
type Aggregate={key:string;label:string;count:number;latest:number;prefix:boolean;position:number;categories:Map<string,{count:number;latest:number}>};

export function normalizeSuggestionText(value:string){
  return value.trim().replace(/\s+/g,' ').toLocaleLowerCase('it');
}

export function rankTransactionSuggestions(rows:SuggestionRow[],rawQuery:string,limit=5):TransactionSuggestion[]{
  const query=normalizeSuggestionText(rawQuery);
  if(query.length<2)return [];
  const suggestions=new Map<string,Aggregate>();
  for(const row of rows){
    const label=String(row.note||'').trim().replace(/\s+/g,' ');
    const key=normalizeSuggestionText(label);
    if(!key||!key.includes(query))continue;
    const latest=Date.parse(row.created_at||row.date||'')||0;
    const current=suggestions.get(key)||{key,label,count:0,latest:0,prefix:key.startsWith(query),position:key.indexOf(query),categories:new Map()};
    current.count++;
    if(latest>=current.latest){current.latest=latest;current.label=label;}
    const category=String(row.category_name||'').trim();
    if(category){
      const categoryScore=current.categories.get(category)||{count:0,latest:0};
      categoryScore.count++;
      categoryScore.latest=Math.max(categoryScore.latest,latest);
      current.categories.set(category,categoryScore);
    }
    suggestions.set(key,current);
  }
  return [...suggestions.values()]
    .sort((a,b)=>Number(b.prefix)-Number(a.prefix)||a.position-b.position||b.count-a.count||b.latest-a.latest||a.label.localeCompare(b.label,'it'))
    .slice(0,limit)
    .map(item=>{
      const categories=[...item.categories.entries()].sort((a,b)=>b[1].count-a[1].count||b[1].latest-a[1].latest);
      const total=categories.reduce((sum,entry)=>sum+entry[1].count,0)||1;
      return {note:item.label,category:categories[0]?.[0]||null,categoryConfidence:categories[0]?categories[0][1].count/total:0,frequency:item.count,lastUsed:item.latest?new Date(item.latest).toISOString():null};
    });
}
