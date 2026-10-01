import { useEffect, useState } from 'react';
import { Wordmark } from '../components/Wordmark';
import { Footer } from '../components/Footer';
import { ApiError, getBooking, getSlots, manageBooking, type BookingView, type Day, type Slot } from './api';
import { SlotPicker } from './SlotPicker';

type Mode = 'view' | 'reschedule' | 'confirm-cancel';

/** /reserva?id=…&t=… — enlace firmado de los emails para cambiar la hora o cancelar. */
export function ManagePage() {
  const q = new URLSearchParams(location.search);
  const id = q.get('id') ?? '';
  const t = q.get('t') ?? '';
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('view');
  const [days, setDays] = useState<Day[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!id || !t) return setError('Enlace incompleto. Ábrelo desde el email de confirmación.');
    getBooking(id, t)
      .then(setBooking)
      .catch((e: ApiError) => setError(e.message));
  }, [id, t]);

  const startReschedule = () => {
    setMode('reschedule');
    setNotice('');
    setDays(null);
    getSlots(id)
      .then((r) => setDays(r.days))
      .catch((e: ApiError) => setNotice(e.message));
  };

  async function run(action: 'cancel' | 'reschedule', slot?: Slot) {
    setBusy(true);
    setNotice('');
    try {
      const b = await manageBooking({ id, t, action, startsAt: slot?.start });
      setBooking(b);
      setMode('view');
      setNotice(action === 'cancel' ? 'Llamada cancelada. Te hemos enviado la confirmación por email.' : 'Hora cambiada. Te llegará la invitación actualizada.');
    } catch (e) {
      setNotice((e as ApiError).message);
      if ((e as ApiError).code === 'slot_taken') startReschedule();
    } finally {
      setBusy(false);
    }
  }

  const active = booking?.status === 'confirmed' && !booking.past;

  return (
    <>
      <header className="header legal-header is-solid">
        <div className="header__inner">
          <a href="/" aria-label="mrl. studio, volver a la página principal">
            <Wordmark />
          </a>
        </div>
      </header>
      <main className="legal manage">
        <div className="container">
          <h1>Tu reserva</h1>

          {error && <p className="manage__notice" role="alert">{error}</p>}
          {!error && !booking && <p className="legal__meta">Cargando…</p>}

          {booking && (
            <>
              <div className="manage__card">
                <p className="manage__label">
                  {booking.status === 'cancelled' ? 'Cancelada' : booking.past ? 'Ya celebrada' : 'Confirmada'}
                </p>
                <p className={`manage__when ${booking.status === 'cancelled' ? 'is-cancelled' : ''}`}>{booking.when} h</p>
                <p className="legal__meta">Videollamada de 15 minutos · hora de España peninsular (Madrid)</p>
                {active && booking.meetUrl && (
                  <a className="btn btn--primary" href={booking.meetUrl} target="_blank" rel="noopener">
                    Entrar en Google Meet
                  </a>
                )}
              </div>

              {notice && <p className="manage__notice" role="status">{notice}</p>}

              {active && mode === 'view' && (
                <div className="manage__actions">
                  <button type="button" className="btn btn--ghost" onClick={startReschedule}>
                    Cambiar de hora
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => setMode('confirm-cancel')}>
                    Cancelar llamada
                  </button>
                </div>
              )}

              {active && mode === 'confirm-cancel' && (
                <div className="manage__confirm">
                  <p>¿Seguro que quieres cancelar la llamada?</p>
                  <div className="manage__actions">
                    <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run('cancel')}>
                      {busy ? 'Cancelando…' : 'Sí, cancelar'}
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => setMode('view')}>
                      No, mantenerla
                    </button>
                  </div>
                </div>
              )}

              {active && mode === 'reschedule' && (
                <div className="manage__picker">
                  <div className="booking agenda">
                    {days ? (
                      <SlotPicker days={days} selected={null} onSelect={(s) => !busy && run('reschedule', s)} />
                    ) : (
                      <div className="agenda__state" aria-busy="true">
                        <span className="agenda__spinner" aria-hidden="true" />
                        <p>{busy ? 'Cambiando…' : 'Cargando huecos libres…'}</p>
                      </div>
                    )}
                  </div>
                  <button type="button" className="linklike manage__back" onClick={() => setMode('view')}>
                    Volver sin cambiar
                  </button>
                </div>
              )}

              {booking.status === 'cancelled' && (
                <p>
                  <a href="/#agendar">Reservar otra llamada</a>
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
