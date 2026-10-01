import { useId, useState } from 'react';

type Props = { meta: string; tech?: string };

const Pills = ({ meta }: { meta: string }) => (
  <span className="ficha__pills">
    {meta.split(' · ').map((p) => (
      <span key={p} className="ficha__pill">
        {p}
      </span>
    ))}
  </span>
);

// Parche 3: la ficha son etiquetas tipo píldora; la línea técnica aparece en hover (escritorio) o tap (móvil).
export function Ficha({ meta, tech }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const label = meta.replace(/\s·\s/g, ', ');
  if (!tech)
    return (
      <p className="ficha" aria-label={label}>
        <Pills meta={meta} />
      </p>
    );
  return (
    <div className={`ficha ficha--tech ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="ficha__meta"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${label}. Ver detalle técnico`}
        onClick={() => setOpen((o) => !o)}
      >
        <Pills meta={meta} />
        <span className="ficha__more" aria-hidden="true" />
      </button>
      <p id={id} className="ficha__tech">
        {tech}
      </p>
    </div>
  );
}
