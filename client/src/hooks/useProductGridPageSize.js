import { useLayoutEffect, useRef, useState } from 'react';

/** productCardGridSx ile uyumlu: minmax(260px) + gap */
export const PRODUCT_GRID_MIN_CARD = 260;
/** fullWidth ProductCard yaklaşık yüksekliği (kare görsel + metin + buton) */
export const PRODUCT_GRID_CARD_HEIGHT = 480;

/**
 * Grid genişliğine (ve isteğe bağlı olarak viewport’a) göre kaç kart gösterileceğini ölçer.
 * İlk görünür adet = pageSize; “Daha fazla” ile pageSize kadar eklenir.
 *
 * pageSize 0 = henüz ölçülmedi (fetch etme).
 */
export default function useProductGridPageSize({
  enabled = true,
  deps = [],
  fillViewport = false,
  minRows = 1,
  maxRows = 6,
  minCard = PRODUCT_GRID_MIN_CARD,
  cardHeight = PRODUCT_GRID_CARD_HEIGHT
} = {}) {
  const gridRef = useRef(null);
  const [pageSize, setPageSize] = useState(0);

  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const node = gridRef.current;
    if (!node) return undefined;

    const measure = () => {
      const width = node.clientWidth;
      if (!width) return;
      const styles = getComputedStyle(node);
      const colGap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
      const rowGap = Number.parseFloat(styles.rowGap || styles.gap) || colGap;
      const cardMin = Math.max(1, minCard);
      const cols = Math.max(1, Math.floor((width + colGap) / (cardMin + colGap)));

      let rows = Math.max(1, minRows);
      if (fillViewport) {
        const top = node.getBoundingClientRect().top;
        const available = Math.max(320, window.innerHeight - top - 72);
        const fit = Math.floor((available + rowGap) / (cardHeight + rowGap));
        rows = Math.max(minRows, fit);
      }
      rows = Math.min(Math.max(rows, minRows), Math.max(minRows, maxRows));

      setPageSize(cols * rows);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, [enabled, fillViewport, minRows, maxRows, minCard, cardHeight, ...deps]);

  return { gridRef, pageSize };
}

/** Ölçüm yoksa dokunma; ilk dilimi doldur; “daha fazla” sonrası koru. */
export const nextVisibleCount = (prev, pageSize) => {
  if (!pageSize || pageSize < 1) return prev || 0;
  if (!prev || prev < pageSize) return pageSize;
  return prev;
};
