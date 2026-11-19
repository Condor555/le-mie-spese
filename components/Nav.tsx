'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Icon from './Icon';
export default function Nav(){const pathname=usePathname();if(pathname==='/login'||pathname==='/registrati'||pathname==='/onboarding')return null;return <nav className="bottom-nav"><Link href="/"><Icon name="home"/><span>Home</span></Link><Link href="/movimenti"><Icon name="list"/><span>Movimenti</span></Link><Link className="nav-plus" href="/nuovo" aria-label="Nuova transazione"><Icon name="plus" size={28}/></Link><Link href="/statistiche"><Icon name="chart"/><span>Statistiche</span></Link><Link href="/account"><Icon name="settings"/><span>Impostazioni</span></Link></nav>}
