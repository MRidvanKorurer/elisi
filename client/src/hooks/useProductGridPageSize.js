import { useCallback, useLayoutEffect, useState } from 'react';
import {
  PRODUCT_GRID_CARD_HEIGHT,
  PRODUCT_GRID_MIN_CARD,
  measureProductGridPageSize
} from './productGridMeasure';

export { PRODUCT_GRID_CARD_HEIGHT, PRODUCT_GRID_MIN_CARD };
export { resolveFetchLimit } from './productGridMeasure';

/**
 * Grid genişliğine (ve isteğe bağlı olarak viewport’a) göre kaç kart gösterileceğini ölçer.
 * İlk görünür adet = pageSize; “Daha fazla” ile pageSize kadar eklenir.
 *
 * Column count follows the node’s live CSS grid (productCardGridSx minmax
 * 150/200/240/260), not a single 260px guess.
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
  const [gridNode, setGridNode] = useState(null);
  const [pageSize, setPageSize] = useState(0);
  const gridRef = useCallback((node) => {
    setGridNode((prev) => (prev === node ? prev : node));
  }, []);

  useLayoutEffect(() => {
    if (!enabled || !gridNode) return undefined;

    const measure = () => {
      const next = measureProductGridPageSize(gridNode, {
        fillViewport,
        minRows,
        maxRows,
        minCard,
        cardHeight
      });
      if (next > 0) setPageSize((prev) => (prev === next ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(gridNode);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, [enabled, gridNode, fillViewport, minRows, maxRows, minCard, cardHeight, ...deps]);

  return { gridRef, pageSize };
}

/** Ölçüm yoksa dokunma; ilk dilimi doldur; “daha fazla” sonrası koru. */
export const nextVisibleCount = (prev, pageSize) => {
  if (!pageSize || pageSize < 1) return prev || 0;
  if (!prev || prev < pageSize) return pageSize;
  return prev;
};
