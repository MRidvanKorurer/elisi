import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Drawer,
    FormControl,
    FormControlLabel,
    FormGroup,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Slider,
    Stack,
    Switch,
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

import ProductCard from '../components/ProductCard';
import productService from '../api/productService';
import useDebounce from '../hooks/useDebounce';
import { imgMood4 } from '../assets/media';
import Seo from '../components/Seo';
import { breadcrumbSchema, itemListSchema } from '../utils/schema';

const CATEGORY_LABELS = {
    seramik: 'Seramik',
    makrome: 'Makrome',
    ahsap: 'Ahşap',
    taki: 'Takı',
    mum: 'Mum',
    canta: 'Çanta',
    deri: 'Deri',
    aksesuar: 'Aksesuar',
    diger: 'Diğer'
};

const categoryLabel = (value) => CATEGORY_LABELS[String(value || '').toLowerCase()] || value || 'Diğer';
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
    onClear
}) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.75 }}>
            <Box>
                <Typography variant="overline" sx={{ color: '#2E3B55', fontWeight: 800, letterSpacing: 1.2 }}>
                    Ürün ara
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Vazo, mum, makrome..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlinedIcon sx={{ color: '#946D6D', fontSize: '1.1rem' }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: '14px',
                            backgroundColor: '#FDF4D2',
                            fontSize: '0.9rem'
                        }
                    }}
                />
            </Box>

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.18)' }} />

            <Box>
                <Typography variant="overline" sx={{ color: '#2E3B55', fontWeight: 800, letterSpacing: 1.2 }}>
                    Hızlı filtreler
                </Typography>
                <FormGroup sx={{ mt: 0.5 }}>
                    <FormControlLabel
                        control={<Switch size="small" checked={inStock} onChange={() => onToggleFlag('inStock')} />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#6E5252' }}>Stokta var</Typography>}
                    />
                    <FormControlLabel
                        control={<Switch size="small" checked={onSale} onChange={() => onToggleFlag('onSale')} />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#6E5252' }}>İndirimli ürünler</Typography>}
                    />
                    <FormControlLabel
                        control={<Switch size="small" checked={isNew} onChange={() => onToggleFlag('isNew')} />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#6E5252' }}>Yeni ürünler</Typography>}
                    />
                    <FormControlLabel
                        control={<Switch size="small" checked={immediateDelivery} onChange={() => onToggleFlag('immediateDelivery')} />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#6E5252' }}>Hemen kargoda</Typography>}
                    />
                    <FormControlLabel
                        control={<Switch size="small" checked={minRating >= 4} onChange={() => onToggleFlag('minRating')} />}
                        label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#6E5252' }}>4+ puan</Typography>}
                    />
                </FormGroup>
            </Box>

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.18)' }} />

            <Box>
                <Typography variant="overline" sx={{ color: '#2E3B55', fontWeight: 800, letterSpacing: 1.2 }}>
                    Kategoriler
                </Typography>
                {categoriesLoading ? (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                        <Skeleton height={22} />
                        <Skeleton height={22} width="70%" />
                        <Skeleton height={22} width="55%" />
                    </Stack>
                ) : categories.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#6E5252' }}>Kategori bulunamadı.</Typography>
                ) : (
                    <FormGroup sx={{ mt: 0.5, maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
                        {categories.map((cat) => (
                            <FormControlLabel
                                key={cat}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => onToggleCategory(cat)}
                                        sx={{ color: '#A290B7', py: 0.35, '&.Mui-checked': { color: '#946D6D' } }}
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#6E5252',
                                            fontSize: '0.85rem',
                                            fontWeight: selectedCategories.includes(cat) ? 700 : 500
                                        }}
                                    >
                                        {categoryLabel(cat)}
                                    </Typography>
                                }
                                sx={{ ml: 0, mr: 0 }}
                            />
                        ))}
                    </FormGroup>
                )}
            </Box>

            {colors.length > 0 && (
                <>
                    <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.18)' }} />
                    <Box>
                        <Typography variant="overline" sx={{ color: '#2E3B55', fontWeight: 800, letterSpacing: 1.2 }}>
                            Renk
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.85, mt: 1 }}>
                            {colors.map((color) => {
                                const selected = selectedColors.includes(color);
                                return (
                                    <Chip
                                        key={color}
                                        clickable
                                        onClick={() => onToggleColor(color)}
                                        label={isHexColor(color) ? '' : color}
                                        sx={{
                                            height: isHexColor(color) ? 32 : 30,
                                            minWidth: isHexColor(color) ? 32 : 'auto',
                                            borderRadius: isHexColor(color) ? '50%' : '999px',
                                            backgroundColor: isHexColor(color) ? color : selected ? '#2E3B55' : '#FDF4D2',
                                            color: selected && !isHexColor(color) ? '#fff' : '#2E3B55',
                                            border: selected ? '2px solid #946D6D' : '1px solid rgba(148, 109, 109, 0.2)',
                                            fontWeight: 700,
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                </>
            )}

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.18)' }} />

            <Box>
                <Typography variant="overline" sx={{ color: '#2E3B55', fontWeight: 800, letterSpacing: 1.2 }}>
                    Fiyat aralığı
                </Typography>
                <Slider
                    size="small"
                    value={priceRange}
                    onChange={onPriceChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `₺${formatPrice(value)}`}
                    min={priceBounds[0]}
                    max={priceBounds[1]}
                    step={10}
                    sx={{
                        mt: 1.5,
                        color: '#946D6D',
                        '& .MuiSlider-thumb': { backgroundColor: '#2E3B55' }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#6E5252' }}>
                        ₺{formatPrice(priceRange[0])}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#6E5252' }}>
                        ₺{formatPrice(priceRange[1])}
                    </Typography>
                </Box>
            </Box>

            <Button
                onClick={onClear}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                    color: '#946D6D',
                    borderColor: 'rgba(148, 109, 109, 0.35)',
                    fontWeight: 700,
                    borderRadius: '12px',
                    py: 1
                }}
            >
                Filtreleri temizle
            </Button>
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
                    setCategories(response.categories || []);
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
                }
            } catch (error) {
                console.error('Filtre seçenekleri alınamadı:', error);
                try {
                    const fallback = await productService.getCategories();
                    if (!cancelled && fallback?.success) setCategories(fallback.categories || []);
                } catch {
                    /* ignore */
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
        onClear: clearFilters
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
            ? `${activeCategory} Modelleri ve Fiyatları`
            : 'El Yapımı Çanta ve Tasarım Koleksiyonu';
    const seoDescription = activeCategory
        ? `El yapımı ${activeCategory} koleksiyonu: güncel modeller, fiyatlar ve stok durumu. Nik Bag atölyesinden sınırlı sayıda üretilen tasarımlar, güvenli ödeme ve hızlı kargo ile.`
        : 'Nik Bag koleksiyonundaki tüm el yapımı çanta, makrome, seramik, ahşap ve takı tasarımlarını fiyat, renk ve kategoriye göre filtreleyerek keşfedin.';
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
                                {activeCategory ? `${activeCategory} modelleri` : 'Tüm ürünler'}
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

                <Box sx={{ display: 'flex', gap: { md: 3 }, alignItems: 'flex-start' }}>
                    {isDesktop && (
                        <Paper
                            elevation={0}
                            sx={{
                                width: 280,
                                flexShrink: 0,
                                p: 2.5,
                                borderRadius: '24px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid rgba(148, 109, 109, 0.1)',
                                position: 'sticky',
                                top: 96,
                                maxHeight: 'calc(100vh - 120px)',
                                overflowY: 'auto'
                            }}
                        >
                            <FilterPanel {...filterPanelProps} />
                        </Paper>
                    )}

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
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
