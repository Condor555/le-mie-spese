import Link from 'next/link';
export default function Nav(){return <nav className="nav"><Link href="/">Home</Link><Link href="/movimenti">Movimenti</Link><Link className="fab" href="/nuovo">＋</Link><Link href="/statistiche">Statistiche</Link><Link href="/importa">Importa</Link></nav>}
