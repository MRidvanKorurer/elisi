import clipHero from '../assets/optimized/1.mp4';
import clipDoku from '../assets/optimized/2.mp4';
import clipSap from '../assets/optimized/3.mp4';
import clipAtolye from '../assets/optimized/4.mp4';
import clipHareket from '../assets/optimized/5.mp4';
import clipClutch from '../assets/optimized/6.mp4';
import clipCanta1 from '../assets/canta1.mp4';

/** Vite'ın verdiği yerel klip URL'leri — uploads boş olsa da oynar */
export const SITE_CLIPS = {
  hero: clipHero,
  canta1: clipCanta1,
  doku: clipDoku,
  sap: clipSap,
  atolye: clipAtolye,
  hareket: clipHareket,
  clutch: clipClutch
};

export const LOOKBOOK_CLIPS = {
  'orgu-doku': clipDoku,
  'ahsap-sap': clipSap,
  'atolye-isigi': clipAtolye,
  'canta-hareket': clipHareket,
  'clutch-detay': clipClutch,
  canta1: clipCanta1,
  hero: clipHero
};

/** Sunucu kopyası (lookbook API / ürün klipleri) */
export const SITE_VIDEO = {
  hero: '/uploads/videos/hero-orgu.mp4',
  canta1: '/uploads/videos/canta1.mp4',
  doku: '/uploads/videos/orgu-doku.mp4',
  sap: '/uploads/videos/ahsap-bambu-sap.mp4',
  atolye: '/uploads/videos/atolye-isigi.mp4',
  hareket: '/uploads/videos/canta-hareket.mp4',
  clutch: '/uploads/videos/clutch-detay.mp4'
};
