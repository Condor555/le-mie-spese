import BackToAccount from '../../../components/BackToAccount';

export default function Informazioni(){
  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Informazioni</h1><p>Versione, licenze e attribuzioni</p></div></header>
    <section className="settings-card surface about-card">
      <h2>Le Mie Spese</h2>
      <p className="settings-help">Versione 3.9.1 Smart UX.</p>
      <div className="about-row"><span>Icone funzionali dell’interfaccia</span><b>Phosphor Icons</b></div>
      <div className="about-row"><span>Icone colorate e marchi storici</span><b>Icons8 Color</b></div>
      <div className="about-row"><span>Catalogo locale esteso</span><b>Font Awesome Free · trattamento Color locale</b></div>
      <p className="settings-help icons8-attribution">Icone e marchi storici forniti da <a href="https://icons8.com" target="_blank" rel="noreferrer">Icons8</a>. Il catalogo locale esteso usa glifi <a href="https://fontawesome.com" target="_blank" rel="noreferrer">Font Awesome Free</a> (CC BY 4.0), senza chiamate API runtime.</p>
    </section>
  </>;
}
