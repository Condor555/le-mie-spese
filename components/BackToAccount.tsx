import Link from 'next/link';
import Icon from './Icon';
export default function BackToAccount(){return <Link href="/account" className="back-link" aria-label="Torna a Impostazioni"><span aria-hidden="true"><Icon name="chevronLeft" size={18}/></span> Impostazioni</Link>}
