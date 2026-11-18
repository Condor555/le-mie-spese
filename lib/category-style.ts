export type CategoryStyle={icon:string;color:string};
const rules:[RegExp,CategoryStyle][]=[
 [/amazon/i,{icon:'A',color:'#111827'}],[/supermercato|spesa/i,{icon:'🛒',color:'#3978f6'}],[/benzina|carburante|gpl/i,{icon:'⛽',color:'#8b5cf6'}],[/trasport|treni|auto|parcheggio/i,{icon:'🚆',color:'#6657df'}],[/cibo|bevande|ristor|bar|pizza/i,{icon:'🍴',color:'#f59a3d'}],[/salute|farmacia|benessere/i,{icon:'✚',color:'#ef5f83'}],[/bollette|utenze|casa|domestica/i,{icon:'⌂',color:'#17a97b'}],[/netflix|prime|apple|abbonament/i,{icon:'▶',color:'#e5484d'}],[/regali/i,{icon:'🎁',color:'#e8af27'}],[/viaggi|vacanze|mare/i,{icon:'✈',color:'#18a0ae'}],[/figli|family|famiglia/i,{icon:'♥',color:'#ec6694'}],[/acquisti|shopping|ordini online/i,{icon:'🛍',color:'#a855f7'}]
];
export function categoryStyle(name:string):CategoryStyle{return rules.find(([r])=>r.test(name))?.[1]||{icon:'●',color:'#667085'}}
