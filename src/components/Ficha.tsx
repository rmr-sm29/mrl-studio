import { useId, useState } from 'react';

type Props = { meta: string; tech?: string };

// Ficha de dos niveles: la línea de formato siempre visible y la técnica en hover (escritorio) o tap (móvil).
export function Ficha({ meta, tech }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!tech) return <p className="ficha"><span className="ficha__meta">{meta}</span></p>;
  return (
    <div className={`ficha ficha--tech ${open ? 'is-open' : ''}`}>
      <button type="button" className="ficha__meta" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {meta}
        <span className="ficha__more" aria-hidden="true" />
      </button>
      <p id={id} className="ficha__tech">{tech}</p>
    </div>
  );
}
