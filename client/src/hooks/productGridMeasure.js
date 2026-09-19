/**
 * Grid page-size math used by useProductGridPageSize.
 *
 * productCardGridSx (and the catalog list grid) use breakpoint minmax values
 * of 150 / 200 / 240 / 260 — not a single 260px card. Column count must follow
 * the live CSS template, otherwise mobile “Daha fazla” requests limit=1.
 */

export const PRODUCT_GRID_MIN_CARD = 260;
export const PRODUCT_GRID_CARD_HEIGHT = 480;

/** Split a CSS track list without breaking nested functions such as minmax(). */
export function splitCssTracks(value) {
  const src = String(value || '').trim();
  if (!src || src === 'none') return [];
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (/\s/.test(ch) && depth === 0) {
      if (current) parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function parseGridMinCardPx(template, fallback = PRODUCT_GRID_MIN_CARD) {
  const match = String(template || '').match(/minmax\(\s*([\d.]+)px/i);
  if (match) {
    const parsed = Number.parseFloat(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const n = Number(fallback);
  return Number.isFinite(n) && n > 0 ? n : PRODUCT_GRID_MIN_CARD;
}

export function columnsFromWidth(width, minCard, colGap = 0) {
  const cardMin = Math.max(1, minCard);
  const gap = Number.isFinite(colGap) ? Math.max(0, colGap) : 0;
  const w = Math.max(0, width);
  return Math.max(1, Math.floor((w + gap) / (cardMin + gap)));
}

/**
 * Prefer the browser’s resolved track list. If the template is still a
 * `repeat(auto-fill, minmax(Npx, 1fr))` form (empty / collapsed grids),
 * derive columns from that N — not from a hardcoded 260px fallback.
 */
export function columnsFromTemplate(template, width, colGap, fallbackMinCard = PRODUCT_GRID_MIN_CARD) {
  const tracks = splitCssTracks(template).filter((track) => track && track !== 'none' && track !== '0px');
  const isRepeat = tracks.length === 1 && /^repeat\(/i.test(tracks[0]);
  if (tracks.length > 0 && !isRepeat) return Math.max(1, tracks.length);

  const source = isRepeat ? tracks[0] : template;
  return columnsFromWidth(width, parseGridMinCardPx(source, fallbackMinCard), colGap);
}

export function rowsForViewport({
  fillViewport = false,
  minRows = 1,
  maxRows = 6,
  availableHeight = 0,
  rowGap = 16,
  cardHeight = PRODUCT_GRID_CARD_HEIGHT
} = {}) {
  const min = Math.max(1, minRows);
  const max = Math.max(min, maxRows);
  let rows = min;
  if (fillViewport) {
    const fit = Math.floor((Math.max(0, availableHeight) + rowGap) / (Math.max(1, cardHeight) + rowGap));
    rows = Math.max(min, fit);
  }
  return Math.min(Math.max(rows, min), max);
}

export function measureProductGridPageSize(node, {
  fillViewport = false,
  minRows = 1,
  maxRows = 6,
  minCard = PRODUCT_GRID_MIN_CARD,
  cardHeight = PRODUCT_GRID_CARD_HEIGHT,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
} = {}) {
  if (!node) return 0;
  const width = node.clientWidth;
  if (!width) return 0;

  const styles = getComputedStyle(node);
  const colGap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
  const rowGap = Number.parseFloat(styles.rowGap || styles.gap) || colGap;
  const cols = columnsFromTemplate(styles.gridTemplateColumns, width, colGap, minCard);

  let available = 0;
  if (fillViewport) {
    const top = node.getBoundingClientRect().top;
    available = Math.max(320, viewportHeight - top - 72);
  }
  const rows = rowsForViewport({
    fillViewport,
    minRows,
    maxRows,
    availableHeight: available,
    rowGap,
    cardHeight
  });

  return cols * rows;
}

/** Keep skip/limit stable after the first page so resize cannot desync pagination. */
export function resolveFetchLimit(page, pageSize, lockedRef) {
  if (!pageSize || pageSize < 1) return 0;
  if (page <= 1) {
    lockedRef.current = pageSize;
    return pageSize;
  }
  return lockedRef.current || pageSize;
}
