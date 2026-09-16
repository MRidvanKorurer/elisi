import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, IconButton } from '@mui/material';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import ZoomInRounded from '@mui/icons-material/ZoomInRounded';
import { useReducedMotion } from 'framer-motion';

const ZOOM = 2.5;
const LENS = 132;
const DRAG_THRESHOLD = 56;

/**
 * Ürün galerisi: sürükle / ok / swipe ile kaydırma.
 * Desktop hover → ana görsel sabit; büyütme portal popup’ta.
 */
export default function ProductImageGallery({
  images = [],
  activeSrc,
  onSelect,
  title = '',
  badges = null,
  fallback = '',
  onOpenLightbox
}) {
  const reduced = useReducedMotion();
  const frameRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(0);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    dx: 0,
    moved: false
  });

  const [hovering, setHovering] = useState(false);
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const [popupBox, setPopupBox] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const list = (images.length ? images : (activeSrc || fallback ? [activeSrc || fallback] : []))
    .filter(Boolean)
    .filter((src, i, arr) => arr.indexOf(src) === i);

  const index = Math.max(0, list.findIndex((src) => src === activeSrc));
  const safeIndex = index >= 0 ? index : 0;
  const current = list[safeIndex] || activeSrc || fallback;
  const multi = list.length > 1;
  const showZoom = canHoverZoom && hovering && !reduced && !dragging && Boolean(current) && Boolean(popupBox);

  const selectIndex = useCallback(
    (next) => {
      if (!list.length) return;
      const wrapped = ((next % list.length) + list.length) % list.length;
      onSelect?.(list[wrapped]);
    },
    [list, onSelect]
  );

  const go = useCallback(
    (dir) => {
      if (!multi) return;
      selectIndex(safeIndex + dir);
    },
    [multi, safeIndex, selectIndex]
  );

  const measurePopup = useCallback(() => {
    const node = frameRef.current;
    if (!node) {
      setPopupBox(null);
      return;
    }
    const rect = node.getBoundingClientRect();
    const gap = 20;
    const maxRight = window.innerWidth - 20;
    const spaceRight = maxRight - (rect.right + gap);
    const spaceLeft = rect.left - gap - 20;
    const size = Math.min(
      Math.max(rect.height * 0.92, 280),
      440,
      Math.max(spaceRight, spaceLeft, 260)
    );

    let left = rect.right + gap;
    if (spaceRight < size + 8 && spaceLeft >= size + 8) {
      left = rect.left - gap - size;
    } else if (spaceRight < size + 8) {
      left = Math.max(20, Math.min(rect.right + gap, maxRight - size));
    }

    let top = rect.top;
    if (top + size > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - size - 16);
    }
    if (top < 16) top = 16;

    setPopupBox({ left, top, size });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 960px)');
    const sync = () => setCanHoverZoom(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useLayoutEffect(() => {
    if (!hovering || !canHoverZoom || dragging) {
      setPopupBox(null);
      return undefined;
    }
    measurePopup();
    const onScrollOrResize = () => measurePopup();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hovering, canHoverZoom, dragging, current, measurePopup]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // activeSrc listede yoksa ilk görsele senkronla
  useEffect(() => {
    if (!list.length) return;
    if (index < 0) onSelect?.(list[0]);
  }, [index, list, onSelect]);

  const updateLens = (clientX, clientY) => {
    const node = frameRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const halfX = ((LENS / 2) / rect.width) * 100;
    const halfY = ((LENS / 2) / rect.height) * 100;
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    setLens({
      x: Math.min(100 - halfX, Math.max(halfX, rawX)),
      y: Math.min(100 - halfY, Math.max(halfY, rawY))
    });
  };

  const endDrag = (clientX) => {
    const state = dragRef.current;
    if (!state.active) return;
    const dx = clientX - state.startX;
    state.active = false;
    state.pointerId = null;
    setDragging(false);
    setDragX(0);

    if (Math.abs(dx) >= DRAG_THRESHOLD && multi) {
      go(dx < 0 ? 1 : -1);
      state.moved = true;
    }
  };

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    // Ok / kontroller kendi tıklamasını yönetsin
    if (event.target?.closest?.('[data-gallery-nav="true"]')) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      moved: false
    };
    setDragging(true);
    setHovering(false);
    setDragX(0);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (event) => {
    const state = dragRef.current;
    if (!state.active || state.pointerId !== event.pointerId) {
      if (canHoverZoom && !dragging && !reduced) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const { clientX, clientY } = event;
        rafRef.current = requestAnimationFrame(() => updateLens(clientX, clientY));
      }
      return;
    }

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) state.moved = true;

    // Dikey kaydırma baskınsa sürüklemeyi bırak (sayfa scroll)
    if (!state.moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      state.active = false;
      setDragging(false);
      setDragX(0);
      return;
    }

    state.dx = dx;
    setDragX(multi ? dx : 0);
  };

  const onPointerUp = (event) => {
    const state = dragRef.current;
    if (!state.active || (state.pointerId != null && state.pointerId !== event.pointerId)) return;

    const moved = state.moved || Math.abs(event.clientX - state.startX) >= DRAG_THRESHOLD;
    endDrag(event.clientX);

    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }

    if (!moved && onOpenLightbox) {
      onOpenLightbox(Math.max(0, safeIndex));
    }
  };

  const onPointerCancel = (event) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
    setDragX(0);
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const widthPct = multi ? -safeIndex * 100 : 0;
  const slideOffset = multi
    ? `calc(${widthPct}% + ${dragging ? dragX : 0}px)`
    : '0px';

  const zoomPopup = showZoom && typeof document !== 'undefined'
    ? createPortal(
      <Box
        role="presentation"
        aria-hidden
        sx={{
          position: 'fixed',
          left: popupBox.left,
          top: popupBox.top,
          width: popupBox.size,
          height: popupBox.size,
          borderRadius: '24px',
          overflow: 'hidden',
          bgcolor: '#fff',
          border: '1px solid rgba(148,109,109,0.18)',
          boxShadow: '0 30px 70px -24px rgba(46,59,85,0.55)',
          zIndex: 1400,
          pointerEvents: 'none',
          backgroundImage: `url(${JSON.stringify(current)})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${ZOOM * 100}%`,
          backgroundPosition: `${lens.x}% ${lens.y}%`
        }}
      />,
      document.body
    )
    : null;

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={frameRef}
        onMouseEnter={() => {
          if (canHoverZoom && !reduced && !dragging) setHovering(true);
        }}
        onMouseLeave={() => {
          setHovering(false);
          if (dragRef.current.active) {
            endDrag(dragRef.current.startX + dragRef.current.dx);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        sx={{
          width: '100%',
          aspectRatio: { xs: '1 / 1', md: '4 / 5' },
          borderRadius: { xs: '22px', md: '28px' },
          overflow: 'hidden',
          position: 'relative',
          isolation: 'isolate',
          backgroundColor: '#fff',
          border: '1px solid rgba(148,109,109,0.12)',
          boxShadow: '0 22px 50px -24px rgba(46,59,85,0.35)',
          cursor: dragging ? 'grabbing' : (canHoverZoom ? 'crosshair' : (multi ? 'grab' : 'zoom-in')),
          userSelect: 'none',
          touchAction: 'pan-y',
          WebkitUserSelect: 'none'
        }}
      >
        {badges}

        <Box
          ref={trackRef}
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            transform: `translate3d(${slideOffset}, 0, 0)`,
            transition: dragging || reduced ? 'none' : 'transform 0.32s cubic-bezier(.22,.61,.36,1)',
            willChange: 'transform'
          }}
        >
          {(multi ? list : [current]).map((src, i) => (
            <Box
              key={`${src}-${i}`}
              component="img"
              src={src}
              alt={multi ? `${title} ${i + 1}` : title}
              draggable={false}
              onError={(e) => {
                if (!fallback) return;
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallback;
              }}
              sx={{
                flex: '0 0 100%',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none'
              }}
            />
          ))}
        </Box>

        {showZoom ? (
          <Box
            sx={{
              position: 'absolute',
              left: `calc(${lens.x}% - ${LENS / 2}px)`,
              top: `calc(${lens.y}% - ${LENS / 2}px)`,
              width: LENS,
              height: LENS,
              borderRadius: '16px',
              border: '2px solid #fff',
              boxShadow: '0 0 0 1px rgba(148,109,109,0.5), 0 12px 28px rgba(46,59,85,0.28)',
              bgcolor: 'rgba(253,244,210,0.12)',
              pointerEvents: 'none',
              zIndex: 4
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute',
              right: 16,
              bottom: 16,
              zIndex: 2,
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: { xs: 'none', md: multi ? 'none' : 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2E3B55',
              backgroundColor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
              pointerEvents: 'none'
            }}
          >
            <ZoomInRounded sx={{ fontSize: 18 }} />
          </Box>
        )}

        {multi ? (
          <>
            <IconButton
              data-gallery-nav="true"
              aria-label="Önceki görsel"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                go(-1);
              }}
              sx={navBtnSx('left')}
            >
              <ChevronLeftRounded />
            </IconButton>
            <IconButton
              data-gallery-nav="true"
              aria-label="Sonraki görsel"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                go(1);
              }}
              sx={navBtnSx('right')}
            >
              <ChevronRightRounded />
            </IconButton>
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                bottom: 14,
                transform: 'translateX(-50%)',
                zIndex: 2,
                display: 'flex',
                gap: 0.6,
                px: 1,
                py: 0.55,
                borderRadius: '999px',
                bgcolor: 'rgba(255,255,255,0.82)',
                boxShadow: '0 6px 16px rgba(46,59,85,0.12)',
                pointerEvents: 'none'
              }}
            >
              {list.map((src, i) => (
                <Box
                  key={`${src}-dot-${i}`}
                  sx={{
                    width: i === safeIndex ? 16 : 7,
                    height: 7,
                    borderRadius: 99,
                    bgcolor: i === safeIndex ? '#946D6D' : 'rgba(46,59,85,0.28)',
                    transition: 'width 0.2s ease, background-color 0.2s ease'
                  }}
                />
              ))}
            </Box>
          </>
        ) : null}
      </Box>

      {zoomPopup}

      {multi ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(4, minmax(0, 1fr))', sm: 'repeat(6, minmax(0, 1fr))' },
            gap: 1.2,
            mt: 1.5,
            position: 'relative',
            zIndex: 1
          }}
        >
          {list.map((img, idx) => {
            const active = safeIndex === idx;
            return (
              <Box
                key={`${img}-thumb-${idx}`}
                component="button"
                type="button"
                onClick={() => selectIndex(idx)}
                aria-label={`${title} görsel ${idx + 1}`}
                aria-current={active ? 'true' : undefined}
                sx={{
                  p: 0,
                  aspectRatio: '1 / 1',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: active ? '2px solid #946D6D' : '2px solid transparent',
                  opacity: active ? 1 : 0.72,
                  transition: 'opacity 0.2s ease, border-color 0.2s ease',
                  bgcolor: 'transparent',
                  font: 'inherit'
                }}
              >
                <Box
                  component="img"
                  src={img}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
}

const navBtnSx = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: { xs: 6, md: 10 },
  transform: 'translateY(-50%)',
  zIndex: 5,
  width: { xs: 36, md: 42 },
  height: { xs: 36, md: 42 },
  bgcolor: 'rgba(255,255,255,0.95)',
  color: '#2E3B55',
  boxShadow: '0 8px 22px rgba(46,59,85,0.2)',
  '&:hover': { bgcolor: '#fff', color: '#946D6D' }
});
