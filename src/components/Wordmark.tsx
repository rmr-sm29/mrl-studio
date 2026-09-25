type Props = { studio?: boolean; className?: string };

// `mrl.` con el punto como cuadrado sólido. El color del punto lo decide el CSS según la superficie.
export function Wordmark({ studio = true, className = '' }: Props) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="wordmark__mrl">
        mrl<span className="wordmark__dot" aria-hidden="true" />
      </span>
      {studio && <span className="wordmark__studio">Studio</span>}
      <span className="sr-only">mrl. studio</span>
    </span>
  );
}
