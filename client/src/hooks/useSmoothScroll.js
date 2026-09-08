import { useEffect } from 'react';
import Lenis from 'lenis';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenisInstance = null;

export const scrollPageTo = (target, { offset = 0, immediate = false } = {}) => {
  if (typeof window === 'undefined' || !target) return;

  const node = typeof target === 'string' ? document.querySelector(target) : target;
  if (!(node instanceof HTMLElement)) return;

  if (lenisInstance) {
    lenisInstance.scrollTo(node, { offset, immediate, duration: immediate ? 0 : 1.05 });
    return;
  }

  const top = window.scrollY + node.getBoundingClientRect().top + offset;
  window.scrollTo({ top: Math.max(0, top), behavior: immediate ? 'auto' : 'smooth' });
};

/**
 * Filtre paneli, açılır liste gibi kendi içinde kayan alanlarda
 * tekerleği sayfaya değil o alana bırakır.
 */
const isInnerScrollArea = (node) => {
  if (!(node instanceof HTMLElement)) return false;
  if (node.hasAttribute('data-lenis-prevent')) return true;

  const { overflowY } = window.getComputedStyle(node);
  if (!/(auto|scroll|overlay)/.test(overflowY)) return false;
  return node.scrollHeight > node.clientHeight + 1;
};

/**
 * Sayfa genelinde yumuşak kaydırma.
 * MUI dialog/drawer body kilidi açıkken devre dışı kalır, mobilde native kaydırma korunur.
 */
export default function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      prevent: isInnerScrollArea
    });
    lenisInstance = lenis;

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    // Modal açıldığında MUI body scroll'u kilitler; Lenis'i de durdur
    const syncLock = () => {
      if (document.body.style.overflow === 'hidden') lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      if (lenisInstance === lenis) lenisInstance = null;
      lenis.destroy();
    };
  }, [enabled]);
}
