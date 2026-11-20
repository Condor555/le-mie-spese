import AppHeader from '../components/AppHeader';
import LanguageProvider from '../components/LanguageProvider';
import Nav from '../components/Nav';
import ThemeProvider from '../components/ThemeProvider';
import './globals.css';

export const metadata={title:'Le Mie Spese',description:'Finanze personali'};

export default function Layout({children}:{children:React.ReactNode}){
  return <html lang="it" suppressHydrationWarning><body><ThemeProvider/><LanguageProvider><main className="shell"><AppHeader/>{children}</main><Nav/></LanguageProvider></body></html>;
}
