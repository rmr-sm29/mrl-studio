import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useInViewOnce } from '../hooks';
import { ApiError, book, formatDay, getSlots, type Booked, type Day, type Slot } from '../booking/api';
import { SlotPicker } from '../booking/SlotPicker';
import '../styles/booking.css';

type Step = 'pick' | 'form' | 'done';
type Fields = Record<'name' | 'email' | 'company' | 'website' | 'goal', string>;

const EMPTY: Fields = { name: '', email: '', company: '', website: '', goal: '' };

/** Agenda propia: huecos desde /api/slots (Google Calendar + reservas), formulario y confirmación. */
export function Booking() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInViewOnce(ref, '600px 0px');
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState<Step>('pick');
  const [slot, setSlot] = useState<{ slot: Slot; date: string } | null>(null);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [booked, setBooked] = useState<Booked | null>(null);
  const openedAt = useRef(0);
  const hp = useRef<HTMLInputElement>(null);
  const formTitle = useRef<HTMLHeadingElement>(null);
  const doneTitle = useRef<HTMLHeadingElement>(null);

  const load = () => {
    setLoadError('');
    getSlots()
      .then((r) => setDays(r.days))
      .catch((e: ApiError) => setLoadError(e.message));
  };

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  useEffect(() => {
    if (step === 'form') formTitle.current?.focus();
    if (step === 'done') doneTitle.current?.focus();
  }, [step]);

  const choose = (s: Slot, date: string) => {
    setSlot({ slot: s, date });
    setFormError('');
    openedAt.current = Date.now();
    setStep('form');
  };

  const set = (k: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!slot || sending) return;
    setSending(true);
    setFormError('');
    try {
      const res = await book({
        ...fields,
        startsAt: slot.slot.start,
        consent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hp: hp.current?.value ?? '',
        elapsed: Date.now() - openedAt.current,
      });
      setBooked(res);
      setStep('done');
    } catch (err) {
      const e = err as ApiError;
      setErrors(e.fields ?? {});
      setFormError(e.message);
      if (e.code === 'slot_taken') {
        setDays(null);
        load();
        setStep('pick');
        setSlot(null);
      }
    } finally {
      setSending(false);
    }
  }

  const when = slot
    ? `${formatDay(slot.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${slot.slot.label} h`
    : '';

  return (
    <div className="booking agenda sd-rise" ref={ref}>
      {step === 'pick' && (
        <>
          {formError && (
            <p className="agenda__alert" role="alert">
              {formError}
            </p>
          )}
          {days ? (
            <SlotPicker days={days} selected={slot?.slot ?? null} onSelect={choose} />
          ) : loadError ? (
            <div className="agenda__state" role="alert">
              <p>{loadError}</p>
              <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
                Reintentar
              </button>
            </div>
          ) : (
            <div className="agenda__state" aria-busy="true">
              <span className="agenda__spinner" aria-hidden="true" />
              <p>Cargando huecos libres…</p>
            </div>
          )}
        </>
      )}

      {step === 'form' && slot && (
        <form className="agenda__form" onSubmit={submit} noValidate>
          <div className="agenda__head">
            <button type="button" className="agenda__back" onClick={() => setStep('pick')}>
              <span aria-hidden="true">←</span> Cambiar hora
            </button>
            <h3 className="agenda__when" ref={formTitle} tabIndex={-1}>
              <span className="agenda__label">Tu llamada</span>
              <span className="agenda__date">{when}</span>
            </h3>
          </div>

          <div className="agenda__fields">
            <Field label="Nombre" name="name" value={fields.name} onChange={set('name')} error={errors.name} autoComplete="name" required />
            <Field label="Email" name="email" type="email" value={fields.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
            <Field label="Marca o empresa" name="company" value={fields.company} onChange={set('company')} error={errors.company} autoComplete="organization" required />
            <Field label="Web o Instagram" name="website" value={fields.website} onChange={set('website')} optional autoComplete="url" />
            <Field label="¿Qué quieres conseguir?" name="goal" value={fields.goal} onChange={set('goal')} optional textarea wide />
          </div>

          {/* Campo trampa: invisible para personas, los bots lo rellenan. */}
          <div className="agenda__hp" aria-hidden="true">
            <label>
              No rellenes este campo
              <input ref={hp} type="text" name="company_url" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <label className={`agenda__consent ${errors.consent ? 'has-error' : ''}`}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <span>
              He leído la <a href="/privacidad" target="_blank">política de privacidad</a> y acepto que se usen mis datos para
              gestionar la llamada.
            </span>
          </label>
          {errors.consent && <p className="agenda__error">{errors.consent}</p>}

          {formError && (
            <p className="agenda__alert" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="btn btn--primary agenda__submit" disabled={sending}>
            {sending ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </form>
      )}

      {step === 'done' && booked && (
        <div className="agenda__done" role="status">
          <span className="agenda__check" aria-hidden="true">✓</span>
          <h3 ref={doneTitle} tabIndex={-1}>Reserva confirmada</h3>
          <p className="agenda__date">{booked.when} h</p>
          <p>
            Te llegará a <strong>{fields.email}</strong> la invitación de Google Calendar con el enlace de la videollamada.
          </p>
          {booked.meetUrl && (
            <a className="btn btn--primary" href={booked.meetUrl} target="_blank" rel="noopener">
              Enlace de Google Meet
            </a>
          )}
          <p className="agenda__fine">
            ¿Te viene mal? <a href={booked.manageUrl}>Cambia la hora o cancela</a>.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  optional,
  textarea,
  wide,
  ...rest
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  error?: string;
  optional?: boolean;
  textarea?: boolean;
  wide?: boolean;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = `agenda-${name}`;
  const common = {
    id,
    name,
    value,
    onChange,
    'aria-invalid': !!error || undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
    ...rest,
  };
  return (
    <div className={`agenda__field ${wide ? 'agenda__field--wide' : ''} ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="agenda__opt"> · opcional</span>}
      </label>
      {textarea ? <textarea rows={3} maxLength={1000} {...common} /> : <input {...common} maxLength={254} />}
      {error && (
        <p className="agenda__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
