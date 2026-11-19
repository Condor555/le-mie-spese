const BRANDS: Record<string, {mark:string;background:string;color:string}> = {
  'brand:netflix': {mark:'N',background:'#E50914',color:'#fff'},
  'brand:apple': {mark:'A',background:'#111827',color:'#fff'},
  'brand:spotify': {mark:'S',background:'#1DB954',color:'#061b0d'},
  'brand:amazon': {mark:'a',background:'#FF9900',color:'#111827'},
  'brand:disney': {mark:'D+',background:'#113CCF',color:'#fff'},
  'brand:youtube': {mark:'▶',background:'#FF0000',color:'#fff'},
  'brand:playstation': {mark:'PS',background:'#006FCD',color:'#fff'},
  'brand:xbox': {mark:'X',background:'#107C10',color:'#fff'},
  'brand:google': {mark:'G',background:'#4285F4',color:'#fff'},
  'brand:uber': {mark:'U',background:'#111827',color:'#fff'},
  'brand:airbnb': {mark:'A',background:'#FF5A5F',color:'#fff'},
  'brand:paypal': {mark:'P',background:'#003087',color:'#fff'},
};

export default function BrandMark({id,size=22}:{id:string;size?:number}) {
  const brand = BRANDS[id] || {mark:'•',background:'#68738C',color:'#fff'};
  return <span aria-hidden="true" style={{
    width:size,height:size,borderRadius:Math.max(5,Math.round(size*.28)),display:'inline-grid',
    placeItems:'center',background:brand.background,color:brand.color,fontSize:Math.max(9,Math.round(size*.43)),
    lineHeight:1,fontWeight:900,letterSpacing:'-.04em',fontFamily:'Inter, ui-sans-serif, sans-serif',
  }}>{brand.mark}</span>;
}
