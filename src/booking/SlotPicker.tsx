import { useMemo, useState } from 'react';
import { site } from '../content';
import { formatDay, localTime, visitorTz, type Day, type Slot } from './api';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const isoWeekday = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay() || 7;

const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Calendario de semanas (lunes a domingo) + lista de horas del día elegido.
 * Solo los días con huecos son pulsables.
 */
export function SlotPicker({
  days,
  selected,
  onSelect,
}: {
  days: Day[];
  selected: Slot | null;
  onSelect: (slot: Slot, date: string) => void;
}) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const firstOpen = days.find((d) => d.slots.length)?.date ?? null;
  const [date, setDate] = useState<string | null>(() => {
    if (selected) return days.find((d) => d.slots.some((s) => s.start === selected.start))?.date ?? firstOpen;
    return firstOpen;
  });
  const tz = useMemo(visitorTz, []);

  const weeks = useMemo(() => {
    if (!days.length) return [];
    const first = addDays(days[0].date, 1 - isoWeekday(days[0].date));
    const last = days[days.length - 1].date;
    const out: string[][] = [];
    for (let d = first; d <= last; d = addDays(d, 7)) out.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
    return out;
  }, [days]);

  const months = useMemo(() => {
    const names = [...new Set(days.map((d) => formatDay(d.date, { month: 'long', year: 'numeric' })))];
    return names.map(capitalize).join(' – ');
  }, [days]);

  const current = date ? byDate.get(date) : undefined;

  if (!firstOpen) {
    return (
      <div className="slots slots--empty">
        <p>No quedan huecos libres en las próximas semanas.</p>
        <p className="slots__hint">
          Escríbeme por <a href={site.instagramUrl} rel="noopener" target="_blank">Instagram</a> y buscamos un momento.
        </p>
      </div>
    );
  }

  return (
    <div className="slots">
      <div className="slots__cal">
        <p className="slots__month">{months}</p>
        <div className="slots__grid" role="grid" aria-label="Elige un día">
          <div className="slots__row slots__row--head" role="row">
            {WEEKDAYS.map((w, i) => (
              <span key={w} role="columnheader" className="slots__wd" aria-label={WEEKDAYS_LONG[i]}>
                {w}
              </span>
            ))}
          </div>
          {weeks.map((week) => (
            <div className="slots__row" role="row" key={week[0]}>
              {week.map((d) => {
                const day = byDate.get(d);
                const open = !!day?.slots.length;
                const label = formatDay(d, { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                  <span role="gridcell" key={d}>
                    <button
                      type="button"
                      className="slots__day"
                      disabled={!open}
                      aria-pressed={d === date}
                      aria-label={open ? `${label}, ${day!.slots.length} huecos` : `${label}, sin huecos`}
                      onClick={() => setDate(d)}
                      hidden={!day}
                    >
                      {Number(d.slice(8))}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="slots__times">
        {current && (
          <>
            <p className="slots__date">{capitalize(formatDay(current.date, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
            <ul className="slots__list" aria-label="Horas disponibles">
              {current.slots.map((s) => (
                <li key={s.start}>
                  <button
                    type="button"
                    className="slots__time"
                    aria-pressed={selected?.start === s.start}
                    onClick={() => onSelect(s, current.date)}
                  >
                    {s.label}
                    {tz && <span className="slots__local">{localTime(s.start, tz)} tu hora</span>}
                  </button>
                </li>
              ))}
            </ul>
            <p className="slots__hint">Hora de España peninsular (Madrid).</p>
          </>
        )}
      </div>
    </div>
  );
}
