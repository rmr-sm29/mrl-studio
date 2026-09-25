import { closing } from '../content';
import { Booking } from './Booking';

export function Closing() {
  return (
    <section id="agendar" className="section closing" aria-labelledby="agendar-title">
      <div className="container closing__inner">
        <h2 id="agendar-title" className="closing__title sd-rise">{closing.heading}</h2>
        <p className="closing__sub sd-rise">{closing.sub}</p>
        <Booking />
        <p className="closing__below">{closing.below}</p>
      </div>
    </section>
  );
}
