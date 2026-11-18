'use client';
import {useRouter} from 'next/navigation';import {createClient} from '../lib/supabase/client';
export default function LogoutButton(){const router=useRouter();async function logout(){const sb=createClient();await sb.auth.signOut();router.replace('/login');router.refresh()}return <button type="button" className="logout" onClick={logout} aria-label="Esci dall'account">Esci</button>}
