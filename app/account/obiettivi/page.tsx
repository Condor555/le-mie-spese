import {redirect} from 'next/navigation';

/** Compatibilità con il precedente percorso nelle Impostazioni. */
export default function ObiettiviRedirect(){
  redirect('/obiettivi');
}
