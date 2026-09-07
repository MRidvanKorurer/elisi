import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Slider,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import StarBorderRounded from '@mui/icons-material/StarBorderRounded';

import ProductCard from '../components/ProductCard';
import productService from '../api/productService';
import useDebounce from '../hooks/useDebounce';
import { imgMood4 } from '../assets/media';
import Seo from '../components/Seo';
import { breadcrumbSchema, itemListSchema } from '../utils/schema';
import { categoryLabel, mergeCatalogCategories } from '../utils/categories';

const ITEMS_PER_PAGE = 12;
const DEFAULT_MAX_PRICE = 10000;

const SORT_OPTIONS = [
    { value: 'newest', label: 'En yeniler' },
    { value: 'popular', label: 'Çok satanlar' },
    { value: 'rating', label: 'En yüksek puan' },
    { value: 'priceAsc', label: 'Fiyat: düşükten yükseğe' },
    { value: 'priceDesc', label: 'Fiyat: yüksekten düşüğe' },
    { value: 'discount', label: 'En yüksek indirim' }
];

const parseList = (value) =>
    (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const isHexColor = (value) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value || '').trim());

const formatPrice = (value) =>
    Number(value || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

function buildQueryParams({
    search,
    categories,
    colors,
    priceRange,
    priceBounds,
    sortBy,
    inStock,
    onSale,
    isNew,
    immediateDelivery,
    minRating
}) {
    const next = new URLSearchParams();
    if (search.trim()) next.set('q', search.trim());
    if (categories.length) next.set('category', categories.join(','));
    if (colors.length) next.set('color', colors.join(','));
    if (priceRange[0] > priceBounds[0]) next.set('min', String(priceRange[0]));
    if (priceRange[1] < priceBounds[1]) next.set('max', String(priceRange[1]));
    if (sortBy && sortBy !== 'newest') next.set('sort', sortBy);
    if (inStock) next.set('stock', '1');
    if (onSale) next.set('sale', '1');
    if (isNew) next.set('new', '1');
    if (immediateDelivery) next.set('ship', '1');
    if (minRating) next.set('rating', String(minRating));
    return next;
}

const QUICK_FILTERS = [
    { key: 'inStock', label: 'Stokta', Icon: Inventory2Outlined },
    { key: 'onSale', label: 'İndirim', Icon: LocalOfferOutlined },
    { key: 'isNew', label: 'Yeni', Icon: AutoAwesomeOutlined },
    { key: 'immediateDelivery', label: 'Hızlı kargo', Icon: LocalShippingOutlined },
    { key: 'minRating', label: '4+ puan', Icon: StarBorderRounded }
];

const NAMED_SWATCHES = {
    'Adaçayı': '#8FA37A',
    'Altın Kaplama': '#C9A227',
    'Amber': '#E0A106',
    'Açık Meşe': '#C4A484',
    'Bordo': '#6E2A32',
    'Buz Mavisi': '#A7C7D8',
    'Ceviz': '#6F4E37',
    'Ekru': '#F3E6D0',
    'Gümüş': '#C0C4C8',
    'Hardal': '#C4A035',
    'Karamel': '#C68642',
    'Kiremit': '#B5523A',
    'Kiremit Rengi': '#B5523A',
    'Krem': '#F3E6C8',
    'Krem Benekli': '#E8D5B5',
    'Kum Beji': '#D8C3A5',
    'Nar Kırmızısı': '#9B2335',
    'Taba': '#8B5A2B',
    'Tarçın': '#9C5A3C',
    'Zeytin Yeşili': '#6B7C3A',
    kara: '#2A2A2A',
    mavi: '#4F7CAC',
    siyah: '#1C1C1C'
};

function colorTone(value) {
    if (isHexColor(value)) return value;
    if (NAMED_SWATCHES[value]) return NAMED_SWATCHES[value];
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = value.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360} 32% 58%)`;
}

const COLOR_PREVIEW_LIMIT = 12;

function ColorFilter({ colors, selectedColors, onToggleColor }) {
    const [query, setQuery] = useState('');
    const needle = query.trim().toLocaleLowerCase('tr-TR');

    const visible = useMemo(() => {
        const matches = colors.filter((color) =>
            String(color).toLocaleLowerCase('tr-TR').includes(needle)
        );
        if (!needle && matches.length > COLOR_PREVIEW_LIMIT) {
            return { items: matches.slice(0, COLOR_PREVIEW_LIMIT), extra: matches.length - COLOR_PREVIEW_LIMIT };
        }
        return { items: matches, extra: 0 };
    }, [colors, needle]);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.8 }}>
                <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.4 }}>
                    RENK
                </Typography>
                <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.68rem' }}>
                    {colors.length} seçenek
                </Typography>
            </Box>

            {selectedColors.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
                    {selectedColors.map((color) => (
                        <Chip
                            key={color}
                            size="small"
                            onDelete={() => onToggleColor(color)}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: colorTone(color),
                                            border: '1px solid rgba(46,59,85,0.16)'
                                        }}
                                    />
                                    {color}
                                </Box>
                            }
                            sx={{
                                height: 26,
                                backgroundColor: 'rgba(148,109,109,0.1)',
                                color: '#2E3B55',
                                fontWeight: 700,
                                fontSize: '0.7rem'
                            }}
                        />
                    ))}
                </Box>
            )}

            <TextField
                fullWidth
                size="small"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Renk adı yaz"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchOutlinedIcon sx={{ color: '#A290B7', fontSize: '1rem' }} />
                        </InputAdornment>
                    )
                }}
                sx={{
                    mb: 0.8,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '999px',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.8rem',
                        '& fieldset': { borderColor: 'rgba(148,109,109,0.14)' }
                    }
                }}
            />

            {visible.items.length === 0 ? (
                <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.75rem', px: 0.4 }}>
                    Bu ada uygun renk yok.
                </Typography>
            ) : (
                <Box
                    sx={{
                        maxHeight: 196,
                        overflowY: 'auto',
                        pr: 0.4,
                        '&::-webkit-scrollbar': { width: 5 },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(162,144,183,0.4)',
                            borderRadius: 99
                        }
                    }}
                >
                    {visible.items.map((color) => {
                        const selected = selectedColors.includes(color);
                        return (
                            <Box
                                key={color}
                                component="button"
                                type="button"
                                onClick={() => onToggleColor(color)}
                                aria-pressed={selected}
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    m: 0,
                                    px: 0.85,
                                    py: 0.65,
                                    border: 'none',
                                    borderRadius: '12px',
                                    backgroundColor: selected ? 'rgba(148,109,109,0.12)' : 'transparent',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    textAlign: 'left',
                                    '&:hover': { backgroundColor: selected ? 'rgba(148,109,109,0.16)' : 'rgba(253,244,210,0.7)' }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 18,
                                        height: 18,
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        backgroundColor: colorTone(color),
                                        border: selected ? '2px solid #2E3B55' : '1px solid rgba(46,59,85,0.14)',
                                        boxShadow: selected ? '0 0 0 2px rgba(148,109,109,0.28)' : 'inset 0 -4px 6px rgba(46,59,85,0.08)'
                                    }}
                                />
                                <Typography
                                    sx={{
                                        color: '#2E3B55',
                                        fontWeight: selected ? 800 : 600,
                                        fontSize: '0.8rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {color}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {visible.extra > 0 && (
                <Typography sx={{ mt: 0.8, color: '#6E5252', fontWeight: 600, fontSize: '0.7rem', lineHeight: 1.45 }}>
                    +{visible.extra} renk daha var. Görmek için yukarıya yaz.
                </Typography>
            )}
        </Box>
    );
}

function FilterRow({ selected, onClick, children }) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                m: 0,
                px: 1.05,
                py: 0.75,
                border: 'none',
                borderRadius: '14px',
                backgroundColor: selected ? 'rgba(148,109,109,0.12)' : 'transparent',
                color: '#2E3B55',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background-color 160ms ease',
                '&:hover': { backgroundColor: selected ? 'rgba(148,109,109,0.16)' : 'rgba(253,244,210,0.7)' }
            }}
        >
            <Box
                sx={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    borderRadius: '50%',
                    border: selected ? '4px solid #946D6D' : '1.5px solid rgba(148,109,109,0.35)',
                    backgroundColor: selected ? '#FFF' : 'transparent',
                    boxSizing: 'border-box'
                }}
            />
            {children}
        </Box>
    );
}

function FilterPanel({
    searchTerm,
    onSearchChange,
    categories,
    categoriesLoading,
    selectedCategories,
    onToggleCategory,
    colors,
    selectedColors,
    onToggleColor,
    priceRange,
    priceBounds,
    onPriceChange,
    inStock,
    onSale,
    isNew,
    immediateDelivery,
    minRating,
    onToggleFlag,
    onClear,
    resultCount = 0
}) {
    const flagState = { inStock, onSale, isNew, immediateDelivery, minRating: minRating >= 4 };
    const activeCount = [
        searchTerm.trim(),
        ...selectedCategories,
        ...selectedColors,
        inStock,
        onSale,
        isNew,
        immediateDelivery,
        minRating >= 4,
        priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]
    ].filter(Boolean).length;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.15, position: 'relative', zIndex: 1 }}>
            <Box>
                <Typography sx={{ color: '#A290B7', fontWeight: 800, fontSize: '0.66rem', letterSpacing: 2 }}>
                    ATÖLYE FİLTRESİ
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mt: 0.35 }}>
                    <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
                        Filtreler
                    </Typography>
                    <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.72rem' }}>
                        {resultCount} parça
                    </Typography>
                </Box>
            </Box>

            <TextField
                fullWidth
                size="small"
                placeholder="Parça, renk veya malzeme"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchOutlinedIcon sx={{ color: '#946D6D', fontSize: '1.05rem' }} />
                        </InputAdornment>
                    ),
                    sx: {
                        borderRadius: '999px',
                        backgroundColor: '#FFFFFF',
                        fontSize: '0.84rem',
                        '& fieldset': { borderColor: 'rgba(148,109,109,0.16)' }
                    }
                }}
            />

            <Box>
                <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.4, mb: 0.7 }}>
                    DURUM
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                    {QUICK_FILTERS.map((item) => {
                        const Icon = item.Icon;
                        const selected = Boolean(flagState[item.key]);
                        return (
                            <FilterRow key={item.key} selected={selected} onClick={() => onToggleFlag(item.key)}>
                                <Icon sx={{ fontSize: 15, color: selected ? '#946D6D' : '#A290B7' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#2E3B55' }}>
                                    {item.label}
                                </Typography>
                            </FilterRow>
                        );
                    })}
                </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.14)' }} />

            <Box>
                <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.4, mb: 0.5 }}>
                    KATEGORİ
                </Typography>
                {categoriesLoading ? (
                    <Stack spacing={0.8}>
                        <Skeleton height={28} />
                        <Skeleton height={28} width="72%" />
                    </Stack>
                ) : categories.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#6E5252' }}>Kategori bulunamadı.</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
                        {categories.map((cat) => (
                            <FilterRow
                                key={cat}
                                selected={selectedCategories.includes(cat)}
                                onClick={() => onToggleCategory(cat)}
                            >
                                <Typography sx={{ fontWeight: selectedCategories.includes(cat) ? 800 : 600, fontSize: '0.82rem' }}>
                                    {categoryLabel(cat)}
                                </Typography>
                            </FilterRow>
                        ))}
                    </Box>
                )}
            </Box>

            {colors.length > 0 && (
                <>
                    <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.14)' }} />
                    <ColorFilter
                        colors={colors}
                        selectedColors={selectedColors}
                        onToggleColor={onToggleColor}
                    />
                </>
            )}

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.14)' }} />

            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.4 }}>
                        FİYAT
                    </Typography>
                    <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: '0.74rem' }}>
                        ₺{formatPrice(priceRange[0])} – ₺{formatPrice(priceRange[1])}
                    </Typography>
                </Box>
                <Slider
                    size="small"
                    value={priceRange}
                    onChange={onPriceChange}
                    valueLabelDisplay="off"
                    min={priceBounds[0]}
                    max={priceBounds[1]}
                    step={10}
                    sx={{
                        mt: 0.6,
                        color: '#946D6D',
                        '& .MuiSlider-thumb': {
                            backgroundColor: '#2E3B55',
                            width: 15,
                            height: 15,
                            border: '2px solid #FFFFFF',
                            boxShadow: '0 2px 8px rgba(46,59,85,0.22)'
                        },
                        '& .MuiSlider-track': { height: 4, border: 'none' },
                        '& .MuiSlider-rail': { height: 4, opacity: 0.22, backgroundColor: '#A290B7' }
                    }}
                />
            </Box>

            {activeCount > 0 && (
                <Button
                    onClick={onClear}
                    size="small"
                    fullWidth
                    sx={{
                        color: '#946D6D',
                        fontWeight: 800,
                        borderRadius: '999px',
                        py: 1,
                        border: '1px solid rgba(148,109,109,0.22)',
                        '&:hover': { backgroundColor: 'rgba(148,109,109,0.08)' }
                    }}
                >
                    {activeCount} filtreyi temizle
                </Button>
            )}
        </Box>
    );
}

function FilterAside({ children }) {
    const slotRef = useRef(null);
    const [left, setLeft] = useState(null);

    useLayoutEffect(() => {
        const slot = slotRef.current;
        if (!slot) return undefined;

        const sync = () => {
            setLeft(Math.round(slot.getBoundingClientRect().left));
        };

        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(slot);
        window.addEventListener('resize', sync);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', sync);
        };
    }, []);

    return (
        <Box ref={slotRef} sx={{ width: 300, flexShrink: 0 }}>
        <Paper
            elevation={0}
            data-lenis-prevent
            sx={{
                position: 'fixed',
                top: 96,
                left: left ?? 0,
                width: 300,
                visibility: left == null ? 'hidden' : 'visible',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehavior: 'contain',
                p: 2.3,
                borderRadius: '28px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,249,236,0.94) 100%)',
                border: '1px solid rgba(148,109,109,0.12)',
                boxShadow: '0 22px 44px -30px rgba(46,59,85,0.5)',
                backdropFilter: 'blur(18px)',
                zIndex: 1,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 22,
                    right: 22,
                    height: 3,
                    borderRadius: '0 0 8px 8px',
                    background: 'linear-gradient(90deg, #B0CDE6, #A290B7 50%, #946D6D)',
                    pointerEvents: 'none'
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    right: -48,
                    top: -56,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(176,205,230,0.35) 0%, transparent 70%)',
                    pointerEvents: 'none'
                },
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(162,144,183,0.45)',
                    borderRadius: 99
                }
            }}
        >
            {children}
        </Paper>
        </Box>
    );
}

export default function ProductsPage() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [searchParams, setSearchParams] = useSearchParams();
    const lastWrittenQuery = useRef(null);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [pagination, setPagination] = useState({ totalProducts: 0, totalPages: 1 });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [priceBounds, setPriceBounds] = useState([0, DEFAULT_MAX_PRICE]);

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedCategories, setSelectedCategories] = useState(() => parseList(searchParams.get('category')));
    const [selectedColors, setSelectedColors] = useState(() => parseList(searchParams.get('color')));
    const [priceRange, setPriceRange] = useState([
        Number(searchParams.get('min')) || 0,
        Number(searchParams.get('max')) || DEFAULT_MAX_PRICE
    ]);
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
    const [inStock, setInStock] = useState(searchParams.get('stock') === '1');
    const [onSale, setOnSale] = useState(searchParams.get('sale') === '1');
    const [isNew, setIsNew] = useState(searchParams.get('new') === '1');
    const [immediateDelivery, setImmediateDelivery] = useState(searchParams.get('ship') === '1');
    const [minRating, setMinRating] = useState(searchParams.get('rating') ? Number(searchParams.get('rating')) : 0);
    const [limit, setLimit] = useState(ITEMS_PER_PAGE);

    const debouncedSearchTerm = useDebounce(searchTerm, 400);
    const debouncedPriceRange = useDebounce(priceRange, 400);

    const committedFilters = useMemo(() => ({
        search: debouncedSearchTerm,
        categories: selectedCategories,
        colors: selectedColors,
        priceRange: debouncedPriceRange,
        priceBounds,
        sortBy,
        inStock,
        onSale,
        isNew,
        immediateDelivery,
        minRating
    }), [
        debouncedSearchTerm,
        selectedCategories,
        selectedColors,
        debouncedPriceRange,
        priceBounds,
        sortBy,
        inStock,
        onSale,
        isNew,
        immediateDelivery,
        minRating
    ]);

    const hydrateFromParams = useCallback((params, bounds = priceBounds) => {
        const nextSearch = params.get('q') || '';
        const nextCategories = parseList(params.get('category'));
        const nextColors = parseList(params.get('color'));
        const nextPrice = [
            params.get('min') ? Number(params.get('min')) : bounds[0],
            params.get('max') ? Number(params.get('max')) : bounds[1]
        ];
        const nextSort = params.get('sort') || 'newest';
        const nextStock = params.get('stock') === '1';
        const nextSale = params.get('sale') === '1';
        const nextNew = params.get('new') === '1';
        const nextShip = params.get('ship') === '1';
        const nextRating = params.get('rating') ? Number(params.get('rating')) : 0;

        setSearchTerm((prev) => (prev === nextSearch ? prev : nextSearch));
        setSelectedCategories((prev) => (prev.join(',') === nextCategories.join(',') ? prev : nextCategories));
        setSelectedColors((prev) => (prev.join(',') === nextColors.join(',') ? prev : nextColors));
        setPriceRange((prev) => (prev[0] === nextPrice[0] && prev[1] === nextPrice[1] ? prev : nextPrice));
        setSortBy((prev) => (prev === nextSort ? prev : nextSort));
        setInStock((prev) => (prev === nextStock ? prev : nextStock));
        setOnSale((prev) => (prev === nextSale ? prev : nextSale));
        setIsNew((prev) => (prev === nextNew ? prev : nextNew));
        setImmediateDelivery((prev) => (prev === nextShip ? prev : nextShip));
        setMinRating((prev) => (prev === nextRating ? prev : nextRating));
    }, [priceBounds]);

    useEffect(() => {
        const incoming = searchParams.toString();
        if (incoming === lastWrittenQuery.current) return;
        hydrateFromParams(searchParams);
    }, [searchParams, hydrateFromParams]);

    useEffect(() => {
        const next = buildQueryParams(committedFilters);
        const serialized = next.toString();
        if (searchParams.toString() === serialized) {
            lastWrittenQuery.current = serialized;
            return;
        }
        lastWrittenQuery.current = serialized;
        setSearchParams(next, { replace: true });
        // searchParams is applied in the hydrate effect above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [committedFilters, setSearchParams]);

    useEffect(() => {
        let cancelled = false;
        const loadOptions = async () => {
            setCategoriesLoading(true);
            try {
                const response = await productService.getFilterOptions();
                if (cancelled) return;
                if (response?.success) {
                    setCategories(mergeCatalogCategories(response.categories || []));
                    setColors(response.colors || []);
                    const min = Number(response.minPrice) || 0;
                    const max = Number(response.maxPrice) || DEFAULT_MAX_PRICE;
                    setPriceBounds([min, max]);
                    setPriceRange((prev) => {
                        const hasCustomMin = searchParams.get('min');
                        const hasCustomMax = searchParams.get('max');
                        return [
                            hasCustomMin ? prev[0] : min,
                            hasCustomMax ? prev[1] : max
                        ];
                    });
                } else {
                    setCategories(mergeCatalogCategories());
                }
            } catch (error) {
                console.error('Filtre seçenekleri alınamadı:', error);
                try {
                    const fallback = await productService.getCategories();
                    if (!cancelled) setCategories(mergeCatalogCategories(fallback?.categories || []));
                } catch {
                    if (!cancelled) setCategories(mergeCatalogCategories());
                }
            } finally {
                if (!cancelled) setCategoriesLoading(false);
            }
        };
        loadOptions();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filterKey = useMemo(() => JSON.stringify({
        search: committedFilters.search,
        categories: committedFilters.categories,
        colors: committedFilters.colors,
        priceRange: committedFilters.priceRange,
        sortBy: committedFilters.sortBy,
        inStock: committedFilters.inStock,
        onSale: committedFilters.onSale,
        isNew: committedFilters.isNew,
        immediateDelivery: committedFilters.immediateDelivery,
        minRating: committedFilters.minRating
    }), [committedFilters]);

    const prevFilterKey = useRef(filterKey);
    const filtersRef = useRef(committedFilters);
    filtersRef.current = committedFilters;

    useEffect(() => {
        if (prevFilterKey.current !== filterKey) {
            prevFilterKey.current = filterKey;
            if (limit !== ITEMS_PER_PAGE) {
                setLimit(ITEMS_PER_PAGE);
                return;
            }
        }

        let cancelled = false;
        const fetchFilteredProducts = async () => {
            setLoading(true);
            try {
                const current = filtersRef.current;
                const params = {
                    search: current.search,
                    category: current.categories.join(','),
                    color: current.colors.join(','),
                    minPrice: current.priceRange[0],
                    maxPrice: current.priceRange[1],
                    sort: current.sortBy,
                    page: 1,
                    limit,
                    inStock: current.inStock || undefined,
                    onSale: current.onSale || undefined,
                    isNew: current.isNew || undefined,
                    immediateDelivery: current.immediateDelivery || undefined,
                    minRating: current.minRating || undefined
                };

                const response = await productService.getFilteredProducts(params);
                if (cancelled) return;
                if (response?.success) {
                    setProducts(response.products || []);
                    setPagination(response.pagination || { totalProducts: response.products?.length || 0 });
                } else {
                    setProducts([]);
                    setPagination({ totalProducts: 0, totalPages: 1 });
                }
            } catch (error) {
                console.error('Filtrelenmiş ürünler çekilemedi:', error);
                if (!cancelled) {
                    setProducts([]);
                    setPagination({ totalProducts: 0, totalPages: 1 });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchFilteredProducts();
        return () => { cancelled = true; };
    }, [filterKey, limit]); // eslint-disable-line react-hooks/exhaustive-deps -- committedFilters is represented by filterKey

    const handleToggle = (list, value, setter) => {
        setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    };

    const handleToggleFlag = (flag) => {
        if (flag === 'inStock') setInStock((v) => !v);
        if (flag === 'onSale') setOnSale((v) => !v);
        if (flag === 'isNew') setIsNew((v) => !v);
        if (flag === 'immediateDelivery') setImmediateDelivery((v) => !v);
        if (flag === 'minRating') setMinRating((v) => (v >= 4 ? 0 : 4));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setSelectedColors([]);
        setPriceRange(priceBounds);
        setSortBy('newest');
        setInStock(false);
        setOnSale(false);
        setIsNew(false);
        setImmediateDelivery(false);
        setMinRating(0);
        setLimit(ITEMS_PER_PAGE);
        setDrawerOpen(false);
    };

    const activeChips = useMemo(() => {
        const chips = [];
        if (debouncedSearchTerm.trim()) chips.push({ key: 'q', label: `Arama: ${debouncedSearchTerm.trim()}` });
        selectedCategories.forEach((cat) => chips.push({ key: `cat-${cat}`, label: categoryLabel(cat), onDelete: () => handleToggle(selectedCategories, cat, setSelectedCategories) }));
        selectedColors.forEach((color) => chips.push({ key: `color-${color}`, label: `Renk: ${color}`, onDelete: () => handleToggle(selectedColors, color, setSelectedColors) }));
        if (inStock) chips.push({ key: 'stock', label: 'Stokta var', onDelete: () => setInStock(false) });
        if (onSale) chips.push({ key: 'sale', label: 'İndirimli', onDelete: () => setOnSale(false) });
        if (isNew) chips.push({ key: 'new', label: 'Yeni', onDelete: () => setIsNew(false) });
        if (immediateDelivery) chips.push({ key: 'ship', label: 'Hemen kargo', onDelete: () => setImmediateDelivery(false) });
        if (minRating >= 4) chips.push({ key: 'rating', label: '4+ puan', onDelete: () => setMinRating(0) });
        if (debouncedPriceRange[0] > priceBounds[0] || debouncedPriceRange[1] < priceBounds[1]) {
            chips.push({
                key: 'price',
                label: `₺${formatPrice(debouncedPriceRange[0])} – ₺${formatPrice(debouncedPriceRange[1])}`,
                onDelete: () => setPriceRange(priceBounds)
            });
        }
        return chips;
    }, [
        debouncedSearchTerm,
        selectedCategories,
        selectedColors,
        inStock,
        onSale,
        isNew,
        immediateDelivery,
        minRating,
        debouncedPriceRange,
        priceBounds
    ]);

    const filterPanelProps = {
        searchTerm,
        onSearchChange: setSearchTerm,
        categories,
        categoriesLoading,
        selectedCategories,
        onToggleCategory: (cat) => handleToggle(selectedCategories, cat, setSelectedCategories),
        colors,
        selectedColors,
        onToggleColor: (color) => handleToggle(selectedColors, color, setSelectedColors),
        priceRange,
        priceBounds,
        onPriceChange: (_, value) => setPriceRange(value),
        inStock,
        onSale,
        isNew,
        immediateDelivery,
        minRating,
        onToggleFlag: handleToggleFlag,
        onClear: clearFilters,
        resultCount: pagination.totalProducts || 0
    };

    const remaining = Math.max(0, (pagination.totalProducts || 0) - products.length);

    useEffect(() => {
        if (isDesktop) setDrawerOpen(false);
    }, [isDesktop]);

    // Filtrelenmiş listeler arama motorlarında kopya içerik sayılmasın diye tek bir kanonik adrese işaret eder
    const activeCategory = selectedCategories.length === 1 ? selectedCategories[0] : null;
    const seoTitle = searchTerm
        ? `"${searchTerm}" arama sonuçları`
        : activeCategory
            ? `${categoryLabel(activeCategory)} Modelleri ve Fiyatları`
            : 'El Yapımı Tasarım Koleksiyonu';
    const seoDescription = activeCategory
        ? `El yapımı ${categoryLabel(activeCategory)} koleksiyonu: güncel modeller, fiyatlar ve stok durumu. Nik Bag atölyesinden sınırlı sayıda üretilen tasarımlar, güvenli ödeme ve hızlı kargo ile.`
        : 'Nik Bag koleksiyonundaki giyim, çanta, mum, takı, seramik, ahşap ve diğer el yapımı tasarımları fiyat, renk ve kategoriye göre filtreleyerek keşfedin.';
    const isFilteredView = Boolean(searchTerm) || selectedCategories.length > 0 || selectedColors.length > 0;

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FDF4D2 0%, #F7EBC0 100%)', pt: { xs: 9, md: 12 }, pb: { xs: 12, md: 10 } }}>
            <Seo
                title={seoTitle}
                description={seoDescription}
                path="/products"
                noindex={Boolean(searchTerm)}
                type="website"
                jsonLd={[
                    breadcrumbSchema([
                        { name: 'Ana Sayfa', path: '/' },
                        { name: 'Ürünler', path: '/products' }
                    ]),
                    products.length > 0 && !isFilteredView ? itemListSchema(products, { path: '/products' }) : null
                ]}
            />
            <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', gap: { md: 3 }, alignItems: 'flex-start' }}>
                    {isDesktop && (
                        <FilterAside>
                            <FilterPanel {...filterPanelProps} />
                        </FilterAside>
                    )}

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Paper
                    elevation={0}
                    sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 3,
                        p: { xs: 2, md: 3 },
                        borderRadius: { xs: '20px', md: '28px' },
                        backgroundColor: 'rgba(255,255,255,0.72)',
                        border: '1px solid rgba(148, 109, 109, 0.12)',
                        backdropFilter: 'blur(12px)'
                    }}
                >
                    <Box
                        component="img"
                        src={imgMood4}
                        alt=""
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            width: { md: 280, lg: 360 },
                            objectFit: 'cover',
                            opacity: 0.55,
                            maskImage: 'linear-gradient(90deg, transparent, #000 40%)',
                            pointerEvents: 'none'
                        }}
                    />
                    <Box
                        sx={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2
                        }}
                    >
                        <Box>
                            <Typography component="h1" variant="h4" fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1.55rem', md: '2rem' } }}>
                                {activeCategory ? `${categoryLabel(activeCategory)} modelleri` : 'Tüm ürünler'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.4 }}>
                                {pagination.totalProducts || 0} üründen {products.length} tanesi gösteriliyor
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            {!isDesktop && (
                                <Button
                                    variant="contained"
                                    startIcon={<FilterListRoundedIcon />}
                                    onClick={() => setDrawerOpen(true)}
                                    sx={{
                                        flex: 1,
                                        backgroundColor: '#2E3B55',
                                        color: '#fff',
                                        borderRadius: '14px',
                                        fontWeight: 700,
                                        '&:hover': { backgroundColor: '#946D6D' }
                                    }}
                                >
                                    Filtrele
                                </Button>
                            )}
                            <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 220 }, flex: 1 }}>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    IconComponent={SortOutlinedIcon}
                                    sx={{
                                        borderRadius: '14px',
                                        backgroundColor: '#FFFFFF',
                                        color: '#2E3B55',
                                        fontWeight: 600,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>

                    {activeChips.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                            {activeChips.map((chip) => (
                                <Chip
                                    key={chip.key}
                                    label={chip.label}
                                    onDelete={chip.onDelete || (chip.key === 'q' ? () => setSearchTerm('') : undefined)}
                                    sx={{ backgroundColor: '#FDF4D2', fontWeight: 700, color: '#2E3B55' }}
                                />
                            ))}
                            <Chip
                                label="Tümünü temizle"
                                onClick={clearFilters}
                                sx={{ backgroundColor: '#2E3B55', color: '#fff', fontWeight: 700 }}
                            />
                        </Box>
                    )}
                </Paper>

                        {loading && products.length === 0 ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: 'repeat(2, minmax(0, 1fr))',
                                        sm: 'repeat(2, minmax(0, 1fr))',
                                        md: 'repeat(3, minmax(0, 1fr))',
                                        lg: 'repeat(4, minmax(0, 1fr))'
                                    },
                                    gap: { xs: 1.25, md: 2.5 }
                                }}
                            >
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: '22px' }} />
                                ))}
                            </Box>
                        ) : products.length === 0 ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    textAlign: 'center',
                                    py: { xs: 6, md: 8 },
                                    px: 3,
                                    borderRadius: '24px',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid rgba(148, 109, 109, 0.1)'
                                }}
                            >
                                <Typography variant="h6" fontWeight={800} sx={{ color: '#2E3B55', mb: 1 }}>
                                    Sonuç bulunamadı
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#6E5252', mb: 2.5 }}>
                                    Seçtiğiniz filtrelere uygun ürün yok. Filtreleri gevşetmeyi deneyin.
                                </Typography>
                                <Button
                                    onClick={clearFilters}
                                    variant="contained"
                                    sx={{ backgroundColor: '#946D6D', color: '#FFF', borderRadius: '12px', px: 3, fontWeight: 700 }}
                                >
                                    Filtreleri temizle
                                </Button>
                            </Paper>
                        ) : (
                            <>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(2, minmax(0, 1fr))',
                                            sm: 'repeat(2, minmax(0, 1fr))',
                                            md: 'repeat(3, minmax(0, 1fr))',
                                            lg: 'repeat(4, minmax(0, 1fr))'
                                        },
                                        gap: { xs: 1.25, md: 2.5 }
                                    }}
                                >
                                    <AnimatePresence>
                                        {products.map((product) => (
                                            <motion.div
                                                key={product._id || product.id}
                                                layout
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ minWidth: 0 }}
                                            >
                                                <ProductCard product={product} fullWidth />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </Box>

                                {remaining > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                                        <Button
                                            variant="contained"
                                            onClick={() => setLimit((prev) => prev + ITEMS_PER_PAGE)}
                                            disabled={loading}
                                            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <KeyboardArrowDownIcon />}
                                            sx={{
                                                backgroundColor: '#2E3B55',
                                                color: '#FFFFFF',
                                                borderRadius: '16px',
                                                px: { xs: 3, md: 4 },
                                                py: 1.4,
                                                fontWeight: 700,
                                                boxShadow: '0 8px 20px rgba(46, 59, 85, 0.16)',
                                                '&:hover': { backgroundColor: '#946D6D' }
                                            }}
                                        >
                                            {loading ? 'Yükleniyor...' : `Daha fazla göster (${remaining} ürün kaldı)`}
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Container>

            <Drawer
                anchor="bottom"
                open={!isDesktop && drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        maxHeight: '88vh',
                        p: 2.5
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>Filtreler</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} aria-label="Kapat">
                        <CloseRoundedIcon />
                    </IconButton>
                </Box>
                <FilterPanel {...filterPanelProps} />
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setDrawerOpen(false)}
                    sx={{ mt: 2, backgroundColor: '#2E3B55', fontWeight: 700, py: 1.2, '&:hover': { backgroundColor: '#946D6D' } }}
                >
                    Sonuçları göster
                </Button>
            </Drawer>
        </Box>
    );
}
