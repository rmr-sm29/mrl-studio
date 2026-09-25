import { useSyncExternalStore } from 'react';

// Consentimiento de cookies de terceros (solo el calendario de reservas las usa).
// Se guarda en localStorage: es almacenamiento técnico necesario para recordar la elección.
export type Consent = 'accepted' | 'rejected' | null;

const KEY = 'mrl-consent';
const listeners = new Set<() => void>();
let bannerOpen = false;

function read(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

let current: Consent = typeof window === 'undefined' ? null : read();
const emit = () => listeners.forEach((l) => l());

export function setConsent(value: Exclude<Consent, null>) {
  current = value;
  bannerOpen = false;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* sin almacenamiento: la elección vale para esta visita */
  }
  emit();
}

export function openConsentSettings() {
  bannerOpen = true;
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useConsent = () => useSyncExternalStore(subscribe, () => current, () => null);
export const useBannerOpen = () => useSyncExternalStore(subscribe, () => bannerOpen || current === null, () => false);
