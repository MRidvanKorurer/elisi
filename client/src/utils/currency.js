import { useSyncExternalStore } from 'react';
import API from '../api/api';
import i18n from '../i18n';
import { formatTRY, roundMoney } from './price';

/**
 * İngilizce arayüzde fiyatlar anlık USD/TRY kuruyla dolar olarak gösterilir.
 * Tahsilat her zaman TL'dir; ödenecek tutarlarda TL karşılığı da yazılır.
 */
const STORAGE_KEY = 'nb:usdTry';
const STALE_MS = 10 * 60_000;

const readStored = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved && Number(saved.rate) > 1 ? saved : null;
  } catch {
    return null;
  }
};

let state = typeof window === 'undefined' ? null : readStored();
let inflight = null;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export const loadUsdRate = () => {
  if (state && Date.now() - state.at < STALE_MS) return Promise.resolve(state.rate);
  if (inflight) return inflight;
  inflight = API.get('/site/rates')
    .then(({ data }) => {
      const rate = Number(data?.usdTry);
      if (rate > 1) {
        state = { rate, at: Date.now() };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* gizli sekme */ }
        emit();
      }
      return state?.rate || null;
    })
    .catch(() => state?.rate || null)
    .finally(() => { inflight = null; });
  return inflight;
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const snapshot = () => state?.rate || null;

/** Kur gelince fiyat gösteren ağacın yeniden çizilmesi için. */
export const useUsdRate = () => useSyncExternalStore(subscribe, snapshot, () => null);

const usdRate = () => (i18n.language === 'en' ? snapshot() : null);

export const toUsd = (value, rate = usdRate()) => (rate ? roundMoney(Number(value || 0) / rate) : null);

const formatUsd = (value) =>
  Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Vitrin fiyatı: İngilizcede dolar, Türkçede TL. */
export const money = (value, { tryPrefix = false } = {}) => {
  const usd = toUsd(value);
  if (usd != null) return formatUsd(usd);
  return tryPrefix ? `₺${formatTRY(value)}` : `${formatTRY(value)} ₺`;
};

/** Ödenecek tutar: İngilizcede "$24.50 (1,000.00 ₺)", Türkçede TL. */
export const moneyCharged = (value) => {
  const usd = toUsd(value);
  const tl = `${formatTRY(value)} ₺`;
  return usd != null ? `${formatUsd(usd)} (${tl})` : tl;
};

/** Havale ve WhatsApp gibi TL ile ödenen yerler: "1,000.00 ₺ (≈ $24.50)". */
export const tryWithUsd = (value) => {
  const usd = toUsd(value);
  const tl = `${formatTRY(value)} ₺`;
  return usd != null ? `${tl} (≈ ${formatUsd(usd)})` : tl;
};
