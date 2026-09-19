
import React, { useEffect, useMemo, useState } from 'react';
// Ürün detay: teslimat / ölçü / iade paneli ProductFulfillment ile gelir.
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Link,
  Rating,
  Snackbar,
  Typography
} from '@mui/material';
import SiteContainer from '../components/SiteContainer';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import IosShareRounded from '@mui/icons-material/IosShareRounded';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

import productService from '../api/productService';
import { cartService } from '../api/cartServices';
import userService from '../api/userService';
import ProductSlider from '../components/ProductSlider';
import { imgBagOrange } from '../assets/media';
import { formatTRY, salePriceOf } from '../utils/price';
import Seo from '../components/Seo';
import { PageSpinner } from '../components/LoadingButton';
import { breadcrumbSchema, faqSchema, productSchema } from '../utils/schema';
import { productDescription } from '../utils/seo';
import { categoryLabel } from '../utils/categories';
import ProductReviews from '../components/ProductReviews';
import ProductQuestions from '../components/ProductQuestions';
import AtelierCard from '../components/AtelierCard';
import ProductFulfillment from '../components/ProductFulfillment';
import ProductMakerNote from '../components/ProductMakerNote';
import ProductClip from '../components/ProductClip';
import ProductImageGallery from '../components/ProductImageGallery';
import { resolveProductVideo } from '../utils/productVideo';
import {
  FAVORITES_UPDATED,
  isProductFavorite,
  setProductFavorite
} from '../utils/favoritesStore';

const asImageSrc = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (typeof img.src === 'string') return img.src;
  return '';
};

const FALLBACK_IMAGE = asImageSrc(imgBagOrange);

const formatPrice = (value) => formatTRY(value);

export default function ProductDetailPage({ onAddToCart, user }) {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useLocaleNavigate();
  const locale = i18n.language === 'en' ? 'en' : 'tr';

  const [product, setProduct] = useState(null);
  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mediaView, setMediaView] = useState('photo');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMediaView('photo');
  }, [id]);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await productService.getProductById(id);
        const productData = response?.product || response?.data || response;

        if (!productData || (!productData._id && !productData.id)) {
          throw new Error('Ürün bulunamadı');
        }

        setProduct(productData);
        setActiveImage(productData.image || productData.gorsel || '');
        setQuantity(1);
        setFaqItems([]);
        setSelectedColor(Array.isArray(productData.colors) && productData.colors[0] ? productData.colors[0] : '');
        setSelectedSize(Array.isArray(productData.sizes) && productData.sizes[0] ? productData.sizes[0] : '');

        try {
          const categoryParam = productData.category || productData.kategori;
          const similarRes = await productService.getFilteredProducts({
            category: categoryParam,
            limit: 12
          });
          const fetched = similarRes?.products || similarRes?.data || [];
          const currentId = String(productData._id || productData.id);
          setSimilarProducts(
            fetched.filter((item) => String(item._id || item.id) !== currentId).slice(0, 12)
          );
        } catch (simErr) {
          console.warn('Benzer ürünler çekilemedi:', simErr);
          setSimilarProducts([]);
        }
      } catch (err) {
        console.error('Ürün detayı çekilirken hata:', err?.message || err?.response?.data?.message);
        setProduct(null);
        setError(err?.response?.data?.message || err.message || 'Ürün bulunamadı veya bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  useEffect(() => {
    const productId = product?._id || product?.id;
    if (!productId) return undefined;

    const sync = () => setIsFavorite(isProductFavorite(productId));
    sync();

    const onUpdate = () => sync();
    window.addEventListener(FAVORITES_UPDATED, onUpdate);
    return () => window.removeEventListener(FAVORITES_UPDATED, onUpdate);
  }, [product]);

  const allImages = useMemo(() => {
    if (!product) return [];
    const extras = Array.isArray(product.additionalImages) ? product.additionalImages : [];
    return [product.image || product.gorsel, ...extras].map(asImageSrc).filter(Boolean);
  }, [product]);

  const rawPrice = Number(product?.price || product?.fiyat || 0);
  const discountRate = Number(product?.discountPercentage || product?.indirimOrani || 0);
  const discountedPrice = salePriceOf(product);
  const stock = Number(product?.stock ?? 0);
  const outOfStock = stock <= 0;
  const title = product?.title || product?.name || 'Ürün';
  const mainImg = allImages[0] || FALLBACK_IMAGE;
  const displayImage = asImageSrc(activeImage) || mainImg;
  const videoSrc = resolveProductVideo(product?.video);

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddToCart = async () => {
    if (!product || outOfStock || addingToCart) return;
    setAddingToCart(true);

    const payload = {
      productId: product._id || product.id,
      name: title,
      price: discountedPrice,
      image: mainImg,
      quantity,
      color: selectedColor,
      size: selectedSize,
    };

    try {
      const response = await cartService.addToCart(payload);
      if (!response?.success) {
        throw new Error(response?.message || 'Ürün sepete eklenemedi.');
      }

      window.dispatchEvent(new Event('cartUpdated'));
      if (onAddToCart) {
        onAddToCart({ ...product, quantity, finalPrice: discountedPrice, color: selectedColor, size: selectedSize });
      }
      showToast(`${title} sepete eklendi.`);
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Ürün sepete eklenirken bir sorun oluştu.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    const productId = product?._id || product?.id;
    if (!productId || favLoading) return;

    setFavLoading(true);
    try {
      if (isFavorite) {
        await userService.removeFavorite(productId);
        setProductFavorite(productId, false);
        showToast('Ürün favorilerden çıkarıldı.', 'info');
      } else {
        try {
          await userService.addFavorite(productId);
        } catch (addError) {
          if (addError?.response?.status !== 400) throw addError;
        }
        setProductFavorite(productId, true);
        showToast('Ürün favorilere eklendi.');
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || err?.mesaj) {
        showToast('Favorilere eklemek için giriş yapmalısınız.', 'warning');
      } else {
        showToast(err?.response?.data?.message || 'Favori işlemi başarısız.', 'error');
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast('Ürün bağlantısı kopyalandı.', 'info');
    } catch {
      showToast('Paylaşım iptal edildi.', 'info');
    }
  };

  const handleOpenLightbox = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return <PageSpinner minHeight="80vh" />;
  }

  if (error || !product) {
    return (
      <Box sx={{ textAlign: 'center', py: { xs: 12, md: 16 }, px: 3 }}>
        <Seo title={t('product.notFoundTitle', { ns: 'catalog' })} path={`/urun/${id || ''}`} noindex />
        <Typography variant="h5" fontWeight={800} sx={{ color: '#2E3B55' }}>
          {error || t('product.notFound', { ns: 'catalog' })}
        </Typography>
        <Typography sx={{ color: '#6E5252', mt: 1.5, mb: 3 }}>
          {t('product.notFoundText', { ns: 'catalog' })}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/urunler')}
          sx={{ bgcolor: '#946D6D', borderRadius: '14px', px: 3, fontWeight: 800, '&:hover': { bgcolor: '#7c5a5a' } }}
        >
          {t('product.backToProducts', { ns: 'catalog' })}
        </Button>
      </Box>
    );
  }

  const lightboxSlides = allImages.map((img) => ({ src: img }));
  const features = Array.isArray(product.features) ? product.features.filter(Boolean) : [];
  const colors = Array.isArray(product.colors) ? product.colors.filter(Boolean) : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];

  const productPath = `/urun/${product._id || product.id}`;
  const seoDescription = productDescription(product);

  return (
    <Box sx={{ pt: { xs: 11, md: 14 }, pb: { xs: 14, md: 10 }, minHeight: '100vh' }}>
      <Seo
        title={`${title}${product.category ? ` - ${t('product.handmadeCategory', { ns: 'catalog', name: categoryLabel(product.category, t) })}` : ''}`}
        description={seoDescription}
        path={productPath}
        image={mainImg}
        type="product"
        keywords={[title, product.category, t('product.keywordHandmade', { ns: 'catalog' }), 'Nik Bag'].filter(Boolean)}
        jsonLd={[
          productSchema(product, {
            path: productPath,
            price: discountedPrice,
            images: allImages,
            description: seoDescription,
            locale
          }),
          breadcrumbSchema([
            { name: t('product.home', { ns: 'catalog' }), path: '/' },
            { name: t('list.products', { ns: 'catalog' }), path: '/urunler' },
            { name: categoryLabel(product.category, t), path: `/urunler?category=${encodeURIComponent(product.category || '')}` },
            { name: title, path: productPath }
          ], locale),
          ...(faqItems.length ? [faqSchema(faqItems)] : [])
        ]}
      />
      <SiteContainer>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: { xs: 3, md: 4 }, color: '#A290B7', fontWeight: 600, '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}
        >
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            {t('product.home', { ns: 'catalog' })}
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate(`/urunler?category=${encodeURIComponent(product.category || '')}`)}
            sx={{ cursor: 'pointer', textTransform: 'capitalize' }}
          >
            {categoryLabel(product.category, t)}
          </Link>
          <Typography sx={{ color: '#2E3B55', fontWeight: 800 }}>{title}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' },
            gap: { xs: 3, md: 5, lg: 7 },
            alignItems: 'start'
          }}
        >
          <Box sx={{ minWidth: 0, position: { lg: 'sticky' }, top: { lg: 108 }, overflow: 'visible', zIndex: 2 }}>
            {mediaView === 'video' && videoSrc ? (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: { xs: '1 / 1', md: '4 / 5' },
                  borderRadius: { xs: '22px', md: '28px' },
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#fff',
                  border: '1px solid rgba(148,109,109,0.12)',
                  boxShadow: '0 22px 50px -24px rgba(46,59,85,0.35)'
                }}
              >
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: '70%' }}>
                  {product.isNewProduct && <Chip label={t('product.new', { ns: 'catalog' })} sx={badgeSx('#2E3B55')} />}
                  {discountRate > 0 && <Chip label={`%${discountRate} indirim`} sx={badgeSx('#946D6D')} />}
                  {outOfStock && <Chip label={t('product.soldOut', { ns: 'catalog' })} sx={badgeSx('#6E5252')} />}
                </Box>
                <ProductClip key={videoSrc} src={videoSrc} poster={mainImg} title={title} />
              </Box>
            ) : (
              <ProductImageGallery
                images={allImages}
                activeSrc={displayImage}
                onSelect={(src) => {
                  setMediaView('photo');
                  setActiveImage(src);
                }}
                title={title}
                fallback={FALLBACK_IMAGE}
                onOpenLightbox={handleOpenLightbox}
                badges={(
                  <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: '70%' }}>
                    {product.isNewProduct && <Chip label={t('product.new', { ns: 'catalog' })} sx={badgeSx('#2E3B55')} />}
                    {discountRate > 0 && <Chip label={`%${discountRate} indirim`} sx={badgeSx('#946D6D')} />}
                    {outOfStock && <Chip label={t('product.soldOut', { ns: 'catalog' })} sx={badgeSx('#6E5252')} />}
                  </Box>
                )}
              />
            )}
            {videoSrc ? (
              <Box
                component="button"
                type="button"
                onClick={() => setMediaView((view) => (view === 'video' ? 'photo' : 'video'))}
                sx={{
                  mt: 1.2,
                  p: 0,
                  border: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: '#946D6D',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  letterSpacing: 0.2,
                  textDecoration: mediaView === 'video' ? 'underline' : 'none'
                }}
              >
                {mediaView === 'video' ? t('product.backToPhotos', { ns: 'catalog' }) : t('product.watchVideo', { ns: 'catalog' })}
              </Box>
            ) : null}
          </Box>

          <Box sx={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
            <Typography sx={{ color: '#A290B7', fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.75rem', textTransform: 'uppercase', mb: 1 }}>
              {categoryLabel(product.category, t)} {product.productCode ? `• ${product.productCode}` : ''}
            </Typography>
            <Typography
              component="h1"
              fontWeight={800}
              sx={{ color: '#2E3B55', fontSize: { xs: '1.7rem', sm: '2.05rem', md: '2.4rem' }, lineHeight: 1.15, letterSpacing: '-0.03em', mb: 1.5 }}
            >
              {title}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Rating value={Number(product.numReviews ? product.rating : 0)} precision={0.1} readOnly sx={{ color: '#DDA15E' }} />
              <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 700 }}>
                {product.numReviews
                  ? `${Number(product.rating).toFixed(1)} · ${product.numReviews} değerlendirme`
                  : t('product.noReviews', { ns: 'catalog' })}
              </Typography>
              {product.soldCount > 0 && (
                <Typography variant="body2" sx={{ color: '#A290B7', fontWeight: 700 }}>
                  {product.soldCount} satış
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1.5, mb: 3 }}>
              <Typography fontWeight={800} sx={{ color: '#946D6D', fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1 }}>
                {formatPrice(discountedPrice)} ₺
              </Typography>
              {discountRate > 0 && (
                <Typography sx={{ textDecoration: 'line-through', color: '#A290B7', fontWeight: 700, fontSize: '1.15rem' }}>
                  {formatPrice(rawPrice)} ₺
                </Typography>
              )}
            </Box>

            <Typography sx={{ color: '#6E5252', lineHeight: 1.75, mb: 3, maxWidth: 560 }}>
              {product.description || product.aciklama || t('product.noDescription', { ns: 'catalog' })}
            </Typography>

            {colors.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 1, fontSize: '0.92rem' }}>Renk</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {colors.map((color) => (
                    <Chip
                      key={color}
                      label={color}
                      onClick={() => setSelectedColor(color)}
                      sx={choiceChipSx(selectedColor === color)}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {sizes.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 1, fontSize: '0.92rem' }}>Beden / ölçü</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sizes.map((size) => (
                    <Chip
                      key={size}
                      label={size}
                      onClick={() => setSelectedSize(size)}
                      sx={choiceChipSx(selectedSize === size)}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Typography sx={{ color: outOfStock ? '#946D6D' : '#81B29A', fontWeight: 800, mb: 2, fontSize: '0.92rem' }}>
              {outOfStock ? t('product.outOfStock', { ns: 'catalog' }) : t('product.inStock', { ns: 'catalog', count: stock })}
            </Typography>

            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexWrap: 'wrap',
                gap: 1.2,
                mb: 3
              }}
            >
              <Box sx={qtyBoxSx}>
                <IconButton onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} sx={{ color: '#2E3B55' }}>
                  <RemoveIcon />
                </IconButton>
                <Typography fontWeight={800} sx={{ minWidth: 24, textAlign: 'center' }}>{quantity}</Typography>
                <IconButton
                  onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
                  disabled={outOfStock || quantity >= stock}
                  sx={{ color: '#2E3B55' }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              <Button
                variant="contained"
                onClick={handleAddToCart}
                disabled={outOfStock || addingToCart}
                startIcon={addingToCart ? <CircularProgress size={18} color="inherit" /> : <ShoppingBagOutlinedIcon />}
                sx={cartButtonSx}
              >
                {outOfStock ? t('product.soldOut', { ns: 'catalog' }) : addingToCart ? t('product.adding', { ns: 'catalog' }) : t('product.addToCart', { ns: 'catalog' })}
              </Button>

              <IconButton onClick={handleToggleFavorite} disabled={favLoading} sx={iconActionSx}>
                {isFavorite ? <FavoriteIcon sx={{ color: '#946D6D' }} /> : <FavoriteBorderOutlinedIcon sx={{ color: '#946D6D' }} />}
              </IconButton>
              <IconButton onClick={handleShare} sx={iconActionSx}>
                <IosShareRounded sx={{ color: '#946D6D' }} />
              </IconButton>
            </Box>

            <ProductMakerNote product={product} />
            <ProductFulfillment product={product} />

            <AtelierCard
              atelier={product.atelier || {
                magazaAdi: 'Nik Bag Atölyesi',
                slug: null,
                magazaTuruEtiket: 'El yapımı',
                aciklama: 'Geleneksel el işçiliğiyle modern çizgilerin buluştuğu ev atölyesi.',
                sehir: 'Türkiye',
                instagram: 'nikbag',
                isHouse: true
              }}
              compact
            />

            <Divider sx={{ mb: 1, borderColor: 'rgba(148,109,109,0.12)' }} />

            <Accordion elevation={0} defaultExpanded sx={accordionSx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>Ürün özellikleri</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <SpecRow label={t('product.sku', { ns: 'catalog' })} value={product.productCode || product._id} />
                <SpecRow label={t('product.category', { ns: 'catalog' })} value={categoryLabel(product.category, t)} />
                {features.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pt: 1.5 }}>
                    {features.map((feature) => (
                      <Chip key={feature} label={feature} sx={{ bgcolor: '#fff', fontWeight: 700, borderRadius: '10px' }} />
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {product.careInstructions ? (
              <Accordion elevation={0} sx={accordionSx}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>Bakım önerisi</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ color: '#6E5252', lineHeight: 1.7 }}>{product.careInstructions}</Typography>
                </AccordionDetails>
              </Accordion>
            ) : null}
          </Box>
        </Box>

        <ProductQuestions
          productId={product._id || product.id || id}
          productSellerId={product.seller}
          user={user}
          onAnsweredChange={setFaqItems}
        />

        <ProductReviews
          productId={product._id || product.id || id}
          user={user}
          onSummaryChange={({ rating, numReviews }) => {
            setProduct((prev) => (prev ? { ...prev, rating, numReviews } : prev));
          }}
        />

        {similarProducts.length > 0 && (
          <Box sx={{ mt: { xs: 7, md: 10 }, pt: { xs: 4, md: 6 }, borderTop: '1px solid rgba(148,109,109,0.12)' }}>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1.5rem', md: '1.85rem' }, letterSpacing: '-0.03em' }}>
              Bunlar da ilginizi çekebilir
            </Typography>
            <Typography sx={{ color: '#6E5252', mb: 3.5, mt: 0.5 }}>Aynı kategorideki diğer el işi tasarımlar.</Typography>
            <ProductSlider products={similarProducts} ariaLabel={t('product.similar', { ns: 'catalog' })} />
          </Box>
        )}
      </SiteContainer>

      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          gap: 1,
          px: 2,
          py: 1.4,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          background: 'rgba(253,244,210,0.92)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(148,109,109,0.14)'
        }}
      >
        <Box sx={{ ...qtyBoxSx, width: 118, flexShrink: 0 }}>
          <IconButton size="small" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography fontWeight={800}>{quantity}</Typography>
          <IconButton size="small" onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))} disabled={outOfStock || quantity >= stock}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={handleAddToCart}
          disabled={outOfStock || addingToCart}
          sx={{ ...cartButtonSx, height: 52 }}
        >
          {outOfStock ? t('product.soldOut', { ns: 'catalog' }) : `${formatPrice(discountedPrice)} ₺`}
        </Button>
        <IconButton onClick={handleToggleFavorite} sx={{ ...iconActionSx, width: 52, height: 52 }}>
          {isFavorite ? <FavoriteIcon sx={{ color: '#946D6D' }} /> : <FavoriteBorderOutlinedIcon sx={{ color: '#946D6D' }} />}
        </IconButton>
      </Box>

      {allImages.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={lightboxSlides}
          plugins={[Zoom]}
          styles={{ container: { backgroundColor: 'rgba(18, 16, 14, 0.94)' } }}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3200}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 10, md: 2 } }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SpecRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: '1px dashed rgba(162,144,183,0.28)' }}>
      <Typography variant="body2" fontWeight={800} sx={{ color: '#2E3B55' }}>{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ color: '#6E5252', textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

const badgeSx = (bg) => ({
  bgcolor: bg,
  color: '#fff',
  fontWeight: 800,
  borderRadius: '10px',
  height: 28
});

const choiceChipSx = (active) => ({
  borderRadius: '12px',
  fontWeight: 800,
  bgcolor: active ? '#946D6D' : '#fff',
  color: active ? '#fff' : '#2E3B55',
  border: active ? '1px solid #946D6D' : '1px solid rgba(148,109,109,0.2)',
  '&:hover': { bgcolor: active ? '#7c5a5a' : 'rgba(255,255,255,0.9)' }
});

const qtyBoxSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1.5px solid rgba(148,109,109,0.18)',
  borderRadius: '16px',
  px: 0.5,
  height: 56,
  minWidth: 120,
  bgcolor: '#fff'
};

const cartButtonSx = {
  bgcolor: '#946D6D',
  color: '#fff',
  height: 56,
  borderRadius: '16px',
  fontWeight: 800,
  fontSize: '1rem',
  px: 3,
  flexGrow: 1,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#7c5a5a', boxShadow: 'none' },
  '&.Mui-disabled': { bgcolor: '#cbb4b4', color: '#fff' }
};

const iconActionSx = {
  border: '1.5px solid rgba(148,109,109,0.18)',
  borderRadius: '16px',
  width: 56,
  height: 56,
  bgcolor: '#fff',
  '&:hover': { borderColor: '#946D6D', bgcolor: '#fff' }
};

const accordionSx = {
  bgcolor: 'transparent',
  '&:before': { display: 'none' },
  '& .MuiAccordionSummary-root': { px: 0 },
  '& .MuiAccordionDetails-root': { px: 0, pt: 0.5 }
};