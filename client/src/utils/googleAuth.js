import { getSitePublic } from '../api/siteService';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let loadPromise = null;
let resolvedClientId = '';

export const getGoogleClientId = () =>
  resolvedClientId || (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const resolveGoogleClientId = async () => {
  const fromEnv = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (fromEnv) {
    resolvedClientId = fromEnv;
    return fromEnv;
  }
  if (resolvedClientId) return resolvedClientId;
  const site = await getSitePublic();
  resolvedClientId = String(site?.googleClientId || '').trim();
  return resolvedClientId;
};

export const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity yalnızca tarayıcıda çalışır.'));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      const done = () => {
        if (window.google?.accounts?.oauth2) resolve(window.google);
        else reject(new Error('Google Identity hazır değil.'));
      };
      if (window.google?.accounts?.oauth2) {
        done();
        return;
      }
      existing.addEventListener('load', done);
      existing.addEventListener('error', () => {
        loadPromise = null;
        reject(new Error('Google script yüklenemedi.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) resolve(window.google);
      else {
        loadPromise = null;
        reject(new Error('Google Identity hazır değil.'));
      }
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Google script yüklenemedi.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Opens Google account popup and resolves with an OAuth access token.
 */
export const requestGoogleAccessToken = async () => {
  const clientId = await resolveGoogleClientId();
  if (!clientId) {
    const err = new Error('MISSING_CLIENT_ID');
    err.code = 'MISSING_CLIENT_ID';
    throw err;
  }

  const google = await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (response) => {
          if (response?.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (!response?.access_token) {
            reject(new Error('Google erişim jetonu alınamadı.'));
            return;
          }
          resolve(response.access_token);
        },
        error_callback: (error) => {
          reject(new Error(error?.message || 'Google penceresi iptal edildi.'));
        }
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      reject(error);
    }
  });
};
