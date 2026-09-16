import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

/**
 * Below-the-fold sections: mount children only when near the viewport.
 * Keeps the first paint lighter without changing layout once revealed.
 */
export default function DeferredMount({
  children,
  rootMargin = '320px 0px',
  minHeight = 120,
  fallback = null
}) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, rootMargin]);

  return (
    <Box ref={ref} sx={{ minHeight: ready ? undefined : minHeight }}>
      {ready ? children : fallback}
    </Box>
  );
}
