import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name:'Le Mie Spese', short_name:'Spese', description:'Gestione personale di entrate e uscite', start_url:'/', display:'standalone', background_color:'#f6f7fb', theme_color:'#4f46e5', icons:[] }; }
