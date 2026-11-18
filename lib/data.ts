import seed from '../data/seed.json';
export type Tx={sourceId:number;date:string;category:string;amount:number;currency:string;note:string;wallet:string};
export const transactions=seed as Tx[];
export const categories=[...new Set(transactions.map(x=>x.category))].sort();
export function eur(v:number){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(v)}
export function monthData(){const key=new Date().toISOString().slice(0,7);return transactions.filter(x=>x.date.startsWith(key))}
