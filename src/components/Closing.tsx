import { closing } from '../content';
import { Booking } from './Booking';
import { Clock } from './Clock';

export function Closing() {
  return (
    <section id="agendar" className="section closing" aria-labelledby="agendar-title">
      <Clock />
      <div className="container closing__inner">
        <h2 id="agendar-title" className="closing__title">{closing.heading}</h2>
        <p className="closing__sub">{closing.sub}</p>
        <Booking />
        <p className="closing__below">{closing.below}</p>
      </div>
    </section>
  );
}
