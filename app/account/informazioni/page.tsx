import BackToAccount from '../../../components/BackToAccount';

export default function Informazioni(){
  return <>
    <BackToAccount/>
    <header className="page-head"><div><h1>Informazioni</h1><p>Versione, licenze e attribuzioni</p></div></header>
    <section className="settings-card surface about-card">
      <h2>Le Mie Spese</h2>
      <p className="settings-help">Versione sperimentale basata sulla V3.6 REV2.2.</p>
      <div className="about-row"><span>Icone funzionali dell’interfaccia</span><b>Phosphor Icons</b></div>
      <div className="about-row"><span>Icone colorate di categorie e marchi</span><b>Icons8 Color</b></div>
      <p className="settings-help icons8-attribution">Icone di categorie e marchi fornite da <a href="https://icons8.com" target="_blank" rel="noreferrer">Icons8</a>.</p>
    </section>
  </>;
}
