import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
  return {
    id:'/',
    name:'Qoomia — Spese, Budget e Famiglia',
    short_name:'Qoomia',
    description:'Dai senso alle tue spese, in privato o in famiglia.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    orientation:'portrait-primary',
    background_color:'#090D16',
    theme_color:'#0F766E',
    categories:['finance','productivity','utilities'],
    lang:'it',
    icons:[
      {src:'/icons/qoomia-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/icons/qoomia-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/icons/qoomia-512-maskable.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
    ],
  };
}
