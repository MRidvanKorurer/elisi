import React, { useState, useEffect } from 'react';
import {
    Box, Container, Grid, Paper, Typography, Slider, Checkbox,
    FormControlLabel, FormGroup, TextField, InputAdornment,
    Button, Select, MenuItem, FormControl, Divider,
    CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '../hooks/useDebounce';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import ProductCard from '../components/ProductCard';
import productServiceDefault, { productService as productServiceNamed } from '../api/productService';

// İçe aktarma güvenliği (default veya named export ikisini de destekler)
const productService = productServiceNamed || productServiceDefault;

const ITEMS_PER_PAGE = 12;

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); // EKSİK OLAN STATE EKLENDİ
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ totalProducts: 0, totalPages: 1 });
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Filtre State'leri
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [sortBy, setSortBy] = useState('newest');
    const [limit, setLimit] = useState(ITEMS_PER_PAGE);

    // --- BACKEND AGGREGATION API ENTEGRASYONU ---
    useEffect(() => {
        const fetchFilteredProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    search: debouncedSearchTerm,
                    category: selectedCategories.join(','),
                    minPrice: priceRange[0],
                    maxPrice: priceRange[1],
                    sort: sortBy,
                    page: 1,
                    limit: limit
                };

                const response = await productService.getFilteredProducts(params);

                if (response && response.success) {
                    setProducts(response.products || []);
                    setPagination(response.pagination || { totalProducts: response.products?.length || 0 });
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error("Filtrelenmiş ürünler çekilemedi:", error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFilteredProducts();
    }, [debouncedSearchTerm, selectedCategories, priceRange, sortBy, limit]);

    // --- DINAMIK KATEGORILERI BACKEND'DEN ÇEKME ---
    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true);
            try {
                const response = await productService.getCategories();
                if (response && response.success) {
                    setCategories(response.categories || []);
                } else if (Array.isArray(response)) {
                    setCategories(response);
                }
            } catch (error) {
                console.error("Kategoriler alınamadı:", error);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Filtreler değiştiğinde limit sayısını tekrar varsayılana sıfırla
    useEffect(() => {
        setLimit(ITEMS_PER_PAGE);
    }, [debouncedSearchTerm, selectedCategories, priceRange, sortBy]);

    // "Daha Fazla Göster" Butonu
    const handleLoadMore = () => {
        setLimit(prev => prev + ITEMS_PER_PAGE);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

    const handlePriceChange = (event, newValue) => {
        setPriceRange(newValue);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategories([]);
        setPriceRange([0, 10000]);
        setSortBy('newest');
        setLimit(ITEMS_PER_PAGE);
    };

    const FilterSidebar = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2E3B55', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Ürün Ara
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Vazo, mum..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ color: '#946D6D', fontSize: '1.1rem' }} /></InputAdornment>,
                        sx: { borderRadius: '12px', backgroundColor: '#FDF4D2', fontSize: '0.85rem' }
                    }}
                />
            </Box>

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.2)' }} />

            <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2E3B55', mb: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Kategoriler
                </Typography>
                {categoriesLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                        <CircularProgress size={16} sx={{ color: '#946D6D' }} />
                        <Typography variant="caption" sx={{ color: '#6E5252' }}>Yükleniyor...</Typography>
                    </Box>
                ) : categories.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#6E5252' }}>Kategori bulunamadı.</Typography>
                ) : (
                    <FormGroup>
                        {categories.map((cat) => (
                            <FormControlLabel
                                key={cat}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => handleCategoryChange(cat)}
                                        sx={{ color: '#A290B7', p: 0.3, '&.Mui-checked': { color: '#946D6D' } }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ color: '#6E5252', fontSize: '0.8rem', fontWeight: selectedCategories.includes(cat) ? 700 : 500 }}>{cat}</Typography>}
                                sx={{ mb: 0.1, ml: 0 }}
                            />
                        ))}
                    </FormGroup>
                )}
            </Box>

            <Divider sx={{ borderColor: 'rgba(162, 144, 183, 0.2)' }} />

            <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2E3B55', mb: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Fiyat Aralığı
                </Typography>
                <Slider
                    size="small"
                    value={priceRange}
                    onChange={handlePriceChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10000}
                    step={100}
                    sx={{
                        color: '#946D6D',
                        '& .MuiSlider-thumb': { backgroundColor: '#2E3B55' }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" fontWeight="700" sx={{ color: '#6E5252' }}>₺{priceRange[0]}</Typography>
                    <Typography variant="caption" fontWeight="700" sx={{ color: '#6E5252' }}>₺{priceRange[1]}</Typography>
                </Box>
            </Box>

            <Button
                onClick={clearFilters}
                variant="text"
                size="small"
                fullWidth
                sx={{ color: '#A290B7', fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}
            >
                Filtreleri Temizle
            </Button>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#FDF4D2', pt: { xs: 8, md: 12 }, pb: 10 }}>
            <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55' }}>Tüm Ürünler</Typography>
                        <Typography variant="body2" sx={{ color: '#6E5252' }}>
                            Toplam {pagination.totalProducts || products.length} üründen {products.length} tanesi gösteriliyor.
                        </Typography>
                    </Box>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            displayEmpty
                            IconComponent={SortOutlinedIcon}
                            sx={{ borderRadius: '12px', backgroundColor: '#FFFFFF', color: '#2E3B55', fontWeight: 600, fontSize: '0.85rem' }}
                        >
                            <MenuItem value="newest">En Yeniler</MenuItem>
                            <MenuItem value="priceAsc">Artan Fiyat</MenuItem>
                            <MenuItem value="priceDesc">Azalan Fiyat</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, alignItems: 'flex-start' }}>

                    {/* SOL FİLTRE PANELİ */}
                    <Paper
                        elevation={0}
                        sx={{
                            width: { xs: '200px', sm: '220px', md: '250px' },
                            flexShrink: 0,
                            p: 2.5,
                            borderRadius: '20px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid rgba(148, 109, 109, 0.1)',
                            position: 'sticky',
                            top: '90px'
                        }}
                    >
                        <FilterSidebar />
                    </Paper>

                    {/* SAĞ ÜRÜN LİSTESİ */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        {loading && products.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
                                <CircularProgress sx={{ color: '#946D6D' }} />
                            </Box>
                        ) : products.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography variant="h6" fontWeight="700" sx={{ color: '#2E3B55', mb: 1 }}>Sonuç Bulunamadı</Typography>
                                <Typography variant="body2" sx={{ color: '#6E5252', mb: 2 }}>Seçtiğiniz filtre kriterlerine uygun ürün bulunmamaktadır.</Typography>
                                <Button onClick={clearFilters} variant="contained" size="small" sx={{ backgroundColor: '#946D6D', color: '#FFF', borderRadius: '12px', px: 3 }}>
                                    Filtreleri Temizle
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Grid container spacing={2}>
                                    <AnimatePresence>
                                        {products.map((product) => (
                                            <Grid item xs={6} sm={6} md={4} lg={3} key={product._id || product.id}>
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.3 }}
                                                    style={{ width: '100%' }}
                                                >
                                                    <ProductCard product={product} />
                                                </motion.div>
                                            </Grid>
                                        ))}
                                    </AnimatePresence>
                                </Grid>

                                {products.length < (pagination.totalProducts || 0) && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleLoadMore}
                                            disabled={loading}
                                            endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <KeyboardArrowDownIcon />}
                                            sx={{
                                                backgroundColor: '#2E3B55',
                                                color: '#FFFFFF',
                                                borderRadius: '16px',
                                                px: 4,
                                                py: 1.5,
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                textTransform: 'none',
                                                boxShadow: '0 4px 12px rgba(46, 59, 85, 0.15)',
                                                '&:hover': { backgroundColor: '#946D6D' }
                                            }}
                                        >
                                            {loading ? 'Yükleniyor...' : `Daha Fazla Göster (${pagination.totalProducts - products.length} ürün kaldı)`}
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>

                </Box>
            </Container>
        </Box>
    );
}