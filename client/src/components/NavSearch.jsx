import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  ClickAwayListener,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Typography
} from '@mui/material';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import SearchRounded from '@mui/icons-material/SearchRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import NorthEastRounded from '@mui/icons-material/NorthEastRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';

import useDebounce from '../hooks/useDebounce';
import { productService } from '../api/productService';
import { CATEGORY_ICON_NAMES, categoryLabel, mergeCatalogCategories, normalize, sortCategories } from '../utils/categories';
import DynamicIcon from './DynamicIcon';
import { imgBagOrange } from '../assets/media';
import { formatTRY, salePriceOf } from '../utils/price';

const FALLBACK_IMAGE = imgBagOrange;
const RECENT_KEY = 'nikbag:recent-searches';
const RECENT_LIMIT = 5;

const CategoryIcon = ({ value, ...props }) => (
  <DynamicIcon iconName={CATEGORY_ICON_NAMES[String(value || '').toLowerCase()]} {...props} />
);

// Kategori listesi oturum boyunca bir kez çekilir
let categoriesPromise = null;
const loadCategories = () => {
  if (!categoriesPromise) {
    categoriesPromise = productService
      .getFilterOptions()
      .then((data) => mergeCatalogCategories(data?.categories || []))
      .catch(() => mergeCatalogCategories());
  }
  return categoriesPromise;
};

const readRecent = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    // Eski kayıtlarda kategori alanı olabilir; arama artık yalnızca terimden ibaret
    return parsed
      .map((item) => (typeof item === 'string' ? item : item?.term))
      .filter(Boolean)
      .slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
};

const writeRecent = (list) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
};

const money = (value) => `₺${formatTRY(value)}`;

/** Eşleşen harfleri vurgulayarak sonucun neden geldiğini görünür kılar. */
function Highlight({ text, term }) {
  const source = String(text || '');
  if (!term) return source;

  const index = normalize(source).indexOf(normalize(term));
  if (index === -1) return source;

  return (
    <>
      {source.slice(0, index)}
      <Box component="span" sx={{ color: '#946D6D' }}>
        {source.slice(index, index + term.length)}
      </Box>
      {source.slice(index + term.length)}
    </>
  );
}

function SectionLabel({ children, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.6, pb: 0.6 }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: 1.2, color: '#A290B7' }}>
        {String(children).toLocaleUpperCase('tr-TR')}
      </Typography>
      {action}
    </Box>
  );
}

const rowSx = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.4,
  width: '100%',
  px: 2,
  py: 1.05,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color .16s ease, box-shadow .16s ease',
  backgroundColor: active ? 'rgba(176,205,230,0.42)' : 'transparent',
  // Klavyeyle gezinirken seçili satır soldaki şeritten anlaşılır
  boxShadow: active ? 'inset 3px 0 0 #946D6D' : 'none',
  '&:hover': { backgroundColor: active ? 'rgba(176,205,230,0.42)' : 'rgba(176,205,230,0.2)' }
});

export default function NavSearch({ solid = true, variant = 'desktop', onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const inputRef = useRef(null);
  const isMobile = variant === 'mobile';

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState(readRecent);

  const term = query.trim();
  const debouncedTerm = useDebounce(term, 240);
  // Tuşlara basıldığı anda beklemeye geçilir; sorgu oturmadan "sonuç yok" yazılmaz
  const busy = loading || (term.length >= 2 && term !== debouncedTerm);
  const settled = term.length >= 2 && term === debouncedTerm && !loading;

  useEffect(() => {
    let alive = true;
    loadCategories().then((list) => {
      if (alive) setCategories(list);
    });
    return () => { alive = false; };
  }, []);

  // Ürünler sayfasındaki arama kutusuyla aynı terim gösterilsin.
  // Kategori filtresi yalnızca soldaki panelin işidir, buradan okunmaz.
  useEffect(() => {
    if (location.pathname !== '/products') return;
    setQuery(new URLSearchParams(location.search).get('q') || '');
  }, [location.pathname, location.search]);

  // Mobil arama alanı açıldığında imleç doğrudan girişe gelsin
  useEffect(() => {
    if (isMobile) {
      setOpen(true);
      inputRef.current?.focus();
    }
  }, [isMobile]);

  useEffect(() => {
    if (debouncedTerm.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    productService
      .getFilteredProducts({ search: debouncedTerm, limit: 6, page: 1, sort: 'popular' })
      .then((response) => {
        if (cancelled) return;
        const list = response?.products || (Array.isArray(response) ? response : []);
        setResults(list.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedTerm]);

  const matchedCategories = useMemo(() => {
    if (!term) return [];
    const needle = normalize(term);
    return categories
      .filter((value) => normalize(categoryLabel(value)).includes(needle) || normalize(value).includes(needle))
      .slice(0, 3);
  }, [categories, term]);

  const options = useMemo(() => {
    const list = [];

    if (!term) {
      recent.forEach((value) => list.push({ kind: 'recent', section: 'Son aramalar', value }));
      sortCategories(categories)
        .slice(0, 6)
        .forEach((value) => list.push({ kind: 'category', section: 'Kategoriye göz at', value }));
      return list;
    }

    matchedCategories.forEach((value) => list.push({ kind: 'category', section: 'Kategoriler', value }));
    results.forEach((product) => list.push({ kind: 'product', section: 'Ürünler', product }));
    if (term.length >= 2) list.push({ kind: 'all', section: null });
    return list;
  }, [term, recent, categories, matchedCategories, results]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [term]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const pushRecent = useCallback((value) => {
    if (!value) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((item) => item !== value)].slice(0, RECENT_LIMIT);
      writeRecent(next);
      return next;
    });
  }, []);

  /**
   * Yalnızca arama terimini günceller.
   * Ürünler sayfasındaysak kategori/renk/fiyat gibi mevcut filtreler olduğu gibi korunur;
   * böylece navbar araması soldaki panelin seçimini ezmez.
   */
  const goToResults = useCallback(
    (nextTerm = term) => {
      const params =
        location.pathname === '/products' ? new URLSearchParams(location.search) : new URLSearchParams();

      if (nextTerm) params.set('q', nextTerm);
      else params.delete('q');

      pushRecent(nextTerm);
      navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
      close();
      onNavigate?.();
    },
    [term, location.pathname, location.search, navigate, pushRecent, close, onNavigate]
  );

  /** Kategori satırı doğrudan o kategorinin listesini açar; arama terimi taşınmaz. */
  const goToCategory = useCallback(
    (value) => {
      setQuery('');
      close();
      onNavigate?.();
      navigate(`/products?category=${encodeURIComponent(value)}`);
    },
    [close, onNavigate, navigate]
  );

  const runOption = useCallback(
    (option) => {
      if (!option) return;

      if (option.kind === 'recent') {
        setQuery(option.value);
        goToResults(option.value);
        return;
      }

      if (option.kind === 'category') {
        goToCategory(option.value);
        return;
      }

      if (option.kind === 'product') {
        pushRecent(term);
        setQuery('');
        close();
        onNavigate?.();
        navigate(`/product/${option.product._id}`);
        return;
      }

      goToResults();
    },
    [term, goToResults, goToCategory, pushRecent, close, onNavigate, navigate]
  );

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => (options.length ? Math.min(prev + 1, options.length - 1) : -1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && options[activeIndex]) runOption(options[activeIndex]);
      else goToResults();
      return;
    }
    if (event.key === 'Escape') {
      close();
      inputRef.current?.blur();
    }
  };

  // Masaüstünde "/" veya Ctrl+K arama alanına odaklanır
  useEffect(() => {
    if (isMobile) return undefined;

    const onKeyDown = (event) => {
      const tag = event.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable;
      const shortcut = event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
      if (!shortcut || typing) return;
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobile]);

  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

  const removeRecent = (value) => {
    setRecent((prev) => {
      const next = prev.filter((item) => item !== value);
      writeRecent(next);
      return next;
    });
  };

  const showPanel = open && (options.length > 0 || busy || settled);

  const field = (
    <Paper
      elevation={0}
      onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        pl: 2,
        pr: 0.8,
        py: 0.85,
        borderRadius: '999px',
        backgroundColor: open ? '#FFFFFF' : solid ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.92)',
        border: `1.5px solid ${open ? 'rgba(148,109,109,0.55)' : 'transparent'}`,
        boxShadow: open
          ? '0 0 0 4px rgba(176,205,230,0.34), 0 14px 32px -18px rgba(46,59,85,0.5)'
          : '0 6px 18px rgba(46,59,85,0.08)',
        transition: 'box-shadow .25s ease, border-color .25s ease, background-color .25s ease'
      }}
    >
      <SearchRounded sx={{ color: '#946D6D', fontSize: 21, mr: 1.1, flexShrink: 0 }} />
      <InputBase
        inputRef={inputRef}
        value={query}
        placeholder="Ürün, kategori veya renk ara"
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: '0.9rem',
          fontWeight: 600,
          color: '#2E3B55',
          '& input::placeholder': { color: '#6E5252', opacity: 0.7 }
        }}
      />

      {busy && <CircularProgress size={16} sx={{ color: '#946D6D', mr: 0.6, flexShrink: 0 }} />}

      {query ? (
        <IconButton
          size="small"
          aria-label="Aramayı temizle"
          onClick={(event) => { event.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
          sx={{ color: '#946D6D', flexShrink: 0 }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      ) : (
        !isMobile && (
          <Box
            sx={{
              display: { xs: 'none', lg: 'grid' },
              placeItems: 'center',
              minWidth: 22,
              height: 22,
              px: 0.7,
              mr: 0.4,
              flexShrink: 0,
              borderRadius: '7px',
              border: '1px solid rgba(46,59,85,0.16)',
              color: '#6E5252',
              fontSize: '0.7rem',
              fontWeight: 800,
              opacity: open ? 0 : 1,
              transition: 'opacity .2s ease'
            }}
          >
            /
          </Box>
        )
      )}
    </Paper>
  );

  const panelBody = (
    <Paper
      elevation={0}
      data-lenis-prevent
      sx={{
        mt: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        maxHeight: { xs: '58vh', md: '70vh' },
        borderRadius: '22px',
        border: '1px solid rgba(148,109,109,0.16)',
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 30px 60px -24px rgba(46,59,85,0.45)'
      }}
    >
      {options.map((option, index) => {
        const previous = options[index - 1];
        const showSection = option.section && option.section !== previous?.section;
        const active = index === activeIndex;

        return (
          <React.Fragment key={`${option.kind}-${option.value || option.product?._id || index}`}>
            {showSection && (
              <SectionLabel
                action={
                  option.kind === 'recent' ? (
                    <ButtonBase
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={clearRecent}
                      sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#6E5252', borderRadius: '8px', px: 0.6, py: 0.2 }}
                    >
                      Temizle
                    </ButtonBase>
                  ) : null
                }
              >
                {option.section}
              </SectionLabel>
            )}

            {option.kind === 'recent' && (
              <Box
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runOption(option)}
                sx={rowSx(active)}
              >
                <HistoryRounded sx={{ fontSize: 20, color: '#A290B7', flexShrink: 0 }} />
                <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: 700, color: '#2E3B55' }}>
                  {option.value}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Aramayı sil"
                  onClick={(event) => { event.stopPropagation(); removeRecent(option.value); }}
                  sx={{ color: '#A290B7', flexShrink: 0 }}
                >
                  <CloseRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}

            {option.kind === 'category' && (
              <Box
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runOption(option)}
                sx={rowSx(active)}
              >
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: '12px',
                    color: '#946D6D',
                    backgroundColor: 'rgba(148,109,109,0.1)'
                  }}
                >
                  <CategoryIcon value={option.value} sx={{ fontSize: 19 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#2E3B55' }}>
                    <Highlight text={categoryLabel(option.value)} term={term} />
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#6E5252' }}>
                    Koleksiyonu görüntüle
                  </Typography>
                </Box>
                <NorthEastRounded sx={{ fontSize: 16, color: '#A290B7', flexShrink: 0 }} />
              </Box>
            )}

            {option.kind === 'product' && (() => {
              const product = option.product;
              const title = product.title || product.baslik || 'Ürün';
              const price = salePriceOf(product);
              const hasDiscount = Number(product.discountPercentage) > 0;

              return (
                <Box
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runOption(option)}
                  sx={rowSx(active)}
                >
                  <Box
                    component="img"
                    src={product.image || FALLBACK_IMAGE}
                    alt={title}
                    loading="lazy"
                    onError={(event) => { event.target.src = FALLBACK_IMAGE; }}
                    sx={{ width: 46, height: 46, flexShrink: 0, borderRadius: '13px', objectFit: 'cover', bgcolor: '#F8F5F0' }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#2E3B55' }}>
                      <Highlight text={title} term={term} />
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mt: 0.2 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#6E5252' }}>
                        {categoryLabel(product.category)}
                      </Typography>
                      {product.stock === 0 && (
                        <Chip label="Tükendi" size="small" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(46,59,85,0.08)', color: '#6E5252' }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#946D6D' }}>
                      {money(price)}
                    </Typography>
                    {hasDiscount && (
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#A290B7', textDecoration: 'line-through' }}>
                        {money(product.price)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })()}

            {option.kind === 'all' && (
              <>
                <Divider sx={{ mt: 0.8, borderColor: 'rgba(148,109,109,0.14)' }} />
                <Box
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runOption(option)}
                  sx={{
                    ...rowSx(active),
                    py: 1.25,
                    justifyContent: 'space-between',
                    backgroundColor: active ? 'rgba(176,205,230,0.42)' : 'rgba(253,244,210,0.5)'
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#2E3B55' }}>
                    Tüm sonuçları gör
                  </Typography>
                  <ArrowForwardRounded sx={{ fontSize: 18, color: '#946D6D' }} />
                </Box>
              </>
            )}
          </React.Fragment>
        );
      })}

      {settled && results.length === 0 && (
        <Box sx={{ px: 2, py: 2.4, textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>Sonuç bulunamadı</Typography>
          <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.4 }}>
            “{term}” ile eşleşen ürün yok. Farklı bir kelime deneyebilirsiniz.
          </Typography>
        </Box>
      )}

      {busy && options.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, px: 2, py: 2 }}>
          <CircularProgress size={17} sx={{ color: '#946D6D' }} />
          <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.85rem' }}>Aranıyor…</Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ width: '100%', position: 'relative' }}>
        {field}

        <AnimatePresence>
          {showPanel && (
            <Box
              component={motion.div}
              initial={reduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
              sx={
                isMobile
                  ? { position: 'relative', zIndex: 20 }
                  : { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20 }
              }
            >
              {panelBody}
            </Box>
          )}
        </AnimatePresence>
      </Box>
    </ClickAwayListener>
  );
}
