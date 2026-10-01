import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Portfolio } from './components/Portfolio';
import { Problem } from './components/Problem';
import { Volt } from './components/Volt';
import { Why } from './components/Why';
import { Faq } from './components/Faq';
import { Closing } from './components/Closing';
import { Footer } from './components/Footer';

export function App() {
  return (
    <>
      <a className="skip" href="#trabajo">Saltar al contenido</a>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Portfolio />
        <Problem />
        <Volt />
        <Why />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
