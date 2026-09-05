
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   Box, Container, Typography, TextField, Button,
//   Divider, Radio, RadioGroup, FormControlLabel, InputAdornment, Grid, CircularProgress,
//   Snackbar, Alert, IconButton
// } from '@mui/material';
// import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
// import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
// import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
// import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
// import WhatsAppIcon from '@mui/icons-material/WhatsApp';
// import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

// // API Servislerimiz
// import { orderService } from '../api/orderServices';
// import { cartService } from '../api/cartServices';

// export default function Checkout() {
//   const [paymentMethod, setPaymentMethod] = useState('credit_card');
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

//   // Sepet Stateleri
//   const [cartItems, setCartItems] = useState([]);
//   const [cartLoading, setCartLoading] = useState(true);

//   // Form ve Validasyon Stateleri
//   const [errors, setErrors] = useState({});
//   const [formData, setFormData] = useState({
//     firstName: '', lastName: '', email: '', phone: '',
//     address: '', city: '', district: '',
//     cardName: '', cardNumber: '', cardExpiry: '', cardCvc: ''
//   });

//   // 1. API'DEN SEPET VERİSİNİ ÇEKME
//   useEffect(() => {
//     const fetchCartItems = async () => {
//       try {
//         setCartLoading(true);
//         const response = await cartService.getCart();
//         if (response.success) {
//           setCartItems(response.items || []);
//         }
//       } catch (error) {
//         console.error("Sepet bilgileri alınamadı:", error);
//         showToast("Sepet bilgileri yüklenirken bir hata oluştu.", "error");
//       } finally {
//         setCartLoading(false);
//       }
//     };
//     fetchCartItems();
//   }, []);

//   // 2. KASMA SORUNU ÇÖZÜMÜ
//   const { subtotal, shippingCost, total } = useMemo(() => {
//     const sub = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
//     const shipping = sub > 500 ? 0 : 49.90;
//     return { subtotal: sub, shippingCost: shipping, total: sub + shipping };
//   }, [cartItems]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const showToast = (message, severity = 'error') => {
//     setToast({ open: true, message, severity });
//   };

//   const handleCloseToast = (event, reason) => {
//     if (reason === 'clickaway') return;
//     setToast(prev => ({ ...prev, open: false }));
//   };

//   // --- YENİ: SEPETTEN ÜRÜN SİLME FONKSİYONU ---
//   const handleRemoveItem = async (productId) => {
//     try {
//       setCartLoading(true);
//       const response = await cartService.removeFromCart(productId);

//       if (response.success) {
//         // Backend'den dönen GÜNCEL listeyi (adeti azalmış veya tamamen silinmiş) ekrana yansıt
//         setCartItems(response.items || []);

//         // Navbar'daki sepet sayacını anında güncellemesi için sinyal gönder
//         window.dispatchEvent(new Event('cartUpdated'));
//       }
//     } catch (error) {
//       console.error("Silme hatası:", error);
//       showToast(error.message || "İşlem sırasında bir hata oluştu.", "error");
//     } finally {
//       setCartLoading(false);
//     }
//   };

//   // 3. FORM DOĞRULAMA (VALIDASYON)
//   const validateForm = () => {
//     let newErrors = {};
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!formData.firstName.trim()) newErrors.firstName = "Ad alanı zorunludur.";
//     if (!formData.lastName.trim()) newErrors.lastName = "Soyad alanı zorunludur.";
//     if (!formData.email.trim()) {
//       newErrors.email = "E-Posta zorunludur.";
//     } else if (!emailRegex.test(formData.email)) {
//       newErrors.email = "Geçerli bir E-Posta giriniz.";
//     }
//     if (!formData.phone.trim()) newErrors.phone = "Telefon zorunludur.";

//     if (!formData.address.trim()) newErrors.address = "Adres zorunludur.";
//     if (!formData.city.trim()) newErrors.city = "İl zorunludur.";
//     if (!formData.district.trim()) newErrors.district = "İlçe zorunludur.";

//     if (paymentMethod === 'credit_card') {
//       if (!formData.cardName.trim()) newErrors.cardName = "Kart üzerindeki isim zorunludur.";
//       if (!formData.cardNumber.trim()) newErrors.cardNumber = "Kart numarası zorunludur.";
//       if (!formData.cardExpiry.trim()) newErrors.cardExpiry = "Son kullanma tarihi zorunludur.";
//       if (!formData.cardCvc.trim()) newErrors.cardCvc = "CVC zorunludur.";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // 4. SİPARİŞİ ONAYLA VE GÖNDER
//   const handleOrderSubmit = async () => {
//     if (!validateForm()) {
//       showToast("Lütfen formdaki hatalı alanları düzeltin.", "warning");
//       return;
//     }

//     if (cartItems.length === 0) {
//       showToast("Sepetiniz boş, sipariş oluşturulamaz.", "error");
//       return;
//     }

//     const orderPayload = {
//       customerInfo: { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone },
//       shippingAddress: { address: formData.address, city: formData.city, district: formData.district },
//       orderItems: cartItems.map(item => ({
//         product: item.product?._id || item.product || item.id,
//         name: item.name,
//         quantity: item.quantity,
//         price: item.price,
//         image: item.image
//       })),
//       subtotal: subtotal, shippingCost: shippingCost, totalPrice: total, paymentMethod: paymentMethod
//     };

//     try {
//       setLoading(true);
//       const response = await orderService.createOrder(orderPayload);

//       if (response.success) {
//         if (paymentMethod === 'credit_card' && response.paymentUrl) {
//           window.location.href = response.paymentUrl;
//         } else {
//           showToast(`Siparişiniz başarıyla alındı! Kodunuz: ${response.orderId}`, "success");
//           await cartService.clearCart();
//           window.dispatchEvent(new Event('cartUpdated')); // Sepet boşaldığı için Navbar'ı sıfırla
//           setTimeout(() => {
//             window.location.href = `/siparis-basarili?orderId=${response.orderId}`;
//           }, 1500);
//         }
//       }
//     } catch (error) {
//       console.error("Sipariş hatası:", error);
//       showToast(error.message || "Siparişiniz oluşturulurken bir hata oluştu.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleWhatsAppOrder = () => {
//     const text = `Merhaba, sipariş vermek istiyorum.\nİsim: ${formData.firstName || ''} ${formData.lastName || ''}\nToplam Tutar: ${total.toFixed(2)} TL`;
//     const whatsappUrl = `https://wa.me/905555555555?text=${encodeURIComponent(text)}`;
//     window.open(whatsappUrl, '_blank');
//   };

//   const textFieldSx = {
//     '& .MuiOutlinedInput-root': {
//       borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(4px)', transition: 'all 0.3s ease',
//       '& fieldset': { borderColor: 'var(--glass-border)' }, '&:hover fieldset': { borderColor: 'var(--color-accent-lavender)' },
//       '&.Mui-focused fieldset': { borderColor: 'var(--color-secondary)', borderWidth: '2px' }, '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.7)' }
//     },
//     '& .MuiInputLabel-root': { color: 'var(--color-accent-lavender)' },
//     '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-secondary)', fontWeight: 600 }
//   };

//   const stepBadgeSx = {
//     width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-accent-lavender)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '800', boxShadow: '0 4px 10px rgba(162, 144, 183, 0.3)', flexShrink: 0
//   };

//   return (
//     <Box sx={{ minHeight: '100vh', pt: { xs: 10, md: 12 }, pb: { xs: 6, md: 10 } }}>

//       <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 10 }}>
//         <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.2)', fontWeight: 600 }}>
//           {toast.message}
//         </Alert>
//       </Snackbar>

//       <Container maxWidth="lg">
//         <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
//           <Button startIcon={<ArrowBackIosNewOutlinedIcon sx={{ fontSize: '1rem' }} />} sx={{ color: 'var(--color-accent-lavender)', fontWeight: 700, mr: 2, '&:hover': { backgroundColor: 'transparent', color: 'var(--color-secondary)' } }} onClick={() => window.history.back()}>Geri Dön</Button>
//           <Typography variant="h4" fontWeight="800" className="custom-gradient-text">Güvenli Ödeme</Typography>
//         </Box>

//         <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, lg: 8 }, alignItems: 'flex-start' }}>

//           {/* SOL KOLON - SİPARİŞ ÖZETİ (%50) */}
//           <Box sx={{ width: { xs: '100%', md: '50%' }, position: { md: 'sticky' }, top: { md: 140 } }}>
//             <Box className="glass-card" sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', maxHeight: { md: 'calc(100vh - 160px)' } }}>

//               <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, flexShrink: 0 }}>Sipariş Özeti</Typography>

//               <Box sx={{ overflowY: 'auto', flexGrow: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, pb: 2 }}>

//                 {cartLoading ? (
//                   <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="inherit" /></Box>
//                 ) : cartItems.length === 0 ? (
//                   <Typography color="var(--color-accent-lavender)" sx={{ textAlign: 'center', py: 3 }}>Sepetinizde ürün bulunmuyor.</Typography>
//                 ) : (
//                   <Box sx={{ mb: 3 }}>
//                     {cartItems.map((item, index) => {
//                       const productId = item.product?._id || item.product || item.id;
//                       return (
//                         <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//                           <Box component="img" src={item.image} sx={{ width: 64, height: 64, borderRadius: '12px', objectFit: 'cover', mr: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
//                           <Box sx={{ flexGrow: 1 }}>
//                             <Typography variant="subtitle2" fontWeight="800" sx={{ color: 'var(--color-secondary)', lineHeight: 1.2, mb: 0.5 }}>{item.name}</Typography>
//                             <Typography variant="body2" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 600 }}>Adet: {item.quantity}</Typography>
//                           </Box>

//                           {/* YENİ: Fiyat ve Silme İkonu Alanı */}
//                           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
//                             <Typography variant="subtitle1" fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>{item.price} ₺</Typography>
//                             <IconButton
//                               size="small"
//                               onClick={() => handleRemoveItem(productId)}
//                               sx={{
//                                 color: 'var(--color-accent-lavender)',
//                                 padding: '4px',
//                                 '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.08)' }
//                               }}
//                             >
//                               <DeleteOutlinedIcon fontSize="small" />
//                             </IconButton>
//                           </Box>
//                         </Box>
//                       );
//                     })}
//                   </Box>
//                 )}

//                 <Divider sx={{ my: 3, borderColor: 'var(--glass-border)' }} />

//                 <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
//                   <TextField fullWidth placeholder="İndirim Kodu" size="small" sx={textFieldSx} />
//                   <Button variant="contained" sx={{ backgroundColor: 'var(--color-accent-lavender)', borderRadius: '12px', px: 3, fontWeight: 700, boxShadow: 'none', '&:hover': { backgroundColor: 'var(--color-secondary)' } }}>Uygula</Button>
//                 </Box>

//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
//                   <Typography variant="body1" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 600 }}>Ara Toplam</Typography>
//                   <Typography variant="body1" fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>{subtotal.toFixed(2)} ₺</Typography>
//                 </Box>
//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
//                   <Typography variant="body1" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 600 }}>Kargo Ücreti</Typography>
//                   <Typography variant="body1" fontWeight="800" sx={{ color: shippingCost === 0 ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
//                     {shippingCost === 0 ? 'Ücretsiz' : `${shippingCost.toFixed(2)} ₺`}
//                   </Typography>
//                 </Box>

//                 <Divider sx={{ my: 2, borderColor: 'var(--glass-border)' }} />

//                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
//                   <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>Toplam</Typography>
//                   <Typography variant="h4" fontWeight="800" className="custom-gradient-text">{total.toFixed(2)} ₺</Typography>
//                 </Box>
//               </Box>

//               <Box sx={{ pt: 2, flexShrink: 0 }}>
//                 <Button
//                   fullWidth variant="contained" size="large" disabled={loading || cartItems.length === 0} onClick={handleOrderSubmit}
//                   startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlinedIcon />}
//                   sx={{ backgroundColor: 'var(--color-secondary)', color: '#FFF', py: 1.8, borderRadius: '16px', fontSize: '1.05rem', fontWeight: 800, boxShadow: 'var(--glass-shadow)', '&:hover': { backgroundColor: 'var(--color-accent-lavender)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}
//                 >
//                   {loading ? 'İşleniyor...' : 'Siparişi Onayla ve Öde'}
//                 </Button>

//                 <Divider sx={{ my: 2.5, borderColor: 'var(--glass-border)', '&::before, &::after': { borderColor: 'var(--glass-border)' } }}>
//                   <Typography variant="caption" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 700 }}>VEYA</Typography>
//                 </Divider>

//                 <Button fullWidth variant="outlined" size="large" disabled={cartItems.length === 0} startIcon={<WhatsAppIcon />} onClick={handleWhatsAppOrder} sx={{ borderColor: '#25D366', color: '#25D366', py: 1.5, borderRadius: '16px', fontSize: '1rem', fontWeight: 800, backgroundColor: 'rgba(37, 211, 102, 0.05)', '&:hover': { backgroundColor: '#25D366', color: '#FFF', borderColor: '#25D366', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.25)' }, transition: 'all 0.3s ease' }}>
//                   WhatsApp Üzerinden Sipariş Ver
//                 </Button>

//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3, gap: 1, color: 'var(--color-accent-lavender)' }}>
//                   <LocalShippingOutlinedIcon fontSize="small" />
//                   <Typography variant="caption" fontWeight="700">256-Bit SSL ile Güvenli Ödeme Altyapısı</Typography>
//                 </Box>
//               </Box>

//             </Box>
//           </Box>

//           {/* SAĞ KOLON - FORMLAR (%50) */}
//           <Box sx={{ width: { xs: '100%', md: '50%' } }}>

//             <Box className="glass-card" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
//               <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}><Box component="span" sx={stepBadgeSx}>1</Box> İletişim Bilgileri</Typography>
//               <Grid container spacing={2.5}>
//                 <Grid item xs={12} sm={6}>
//                   <TextField name="firstName" value={formData.firstName} onChange={handleInputChange} fullWidth label="Adınız" variant="outlined" sx={textFieldSx} error={!!errors.firstName} helperText={errors.firstName} />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField name="lastName" value={formData.lastName} onChange={handleInputChange} fullWidth label="Soyadınız" variant="outlined" sx={textFieldSx} error={!!errors.lastName} helperText={errors.lastName} />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField name="email" value={formData.email} onChange={handleInputChange} fullWidth label="E-Posta Adresi" variant="outlined" sx={textFieldSx} error={!!errors.email} helperText={errors.email} />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField name="phone" value={formData.phone} onChange={handleInputChange} fullWidth label="Telefon Numarası" variant="outlined" sx={textFieldSx} error={!!errors.phone} helperText={errors.phone} />
//                 </Grid>
//               </Grid>
//             </Box>

//             <Box className="glass-card" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
//               <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}><Box component="span" sx={stepBadgeSx}>2</Box> Teslimat Adresi</Typography>
//               <Grid container spacing={2.5}>
//                 <Grid item xs={12}>
//                   <TextField name="address" value={formData.address} onChange={handleInputChange} fullWidth label="Açık Adres (Mahalle, Sokak, vb.)" variant="outlined" multiline rows={3} sx={textFieldSx} error={!!errors.address} helperText={errors.address} />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField name="city" value={formData.city} onChange={handleInputChange} fullWidth label="İl" variant="outlined" sx={textFieldSx} error={!!errors.city} helperText={errors.city} />
//                 </Grid>
//                 <Grid item xs={12} sm={6}>
//                   <TextField name="district" value={formData.district} onChange={handleInputChange} fullWidth label="İlçe" variant="outlined" sx={textFieldSx} error={!!errors.district} helperText={errors.district} />
//                 </Grid>
//               </Grid>
//             </Box>

//             <Box className="glass-card" sx={{ p: { xs: 3, md: 4 } }}>
//               <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}><Box component="span" sx={stepBadgeSx}>3</Box> Ödeme Yöntemi</Typography>

//               <RadioGroup value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setErrors({}); }}>
//                 <Box sx={{ border: paymentMethod === 'credit_card' ? `2px solid var(--color-secondary)` : `1px solid var(--glass-border)`, backgroundColor: paymentMethod === 'credit_card' ? 'rgba(255, 255, 255, 0.4)' : 'transparent', borderRadius: '16px', p: 2, mb: 2, transition: 'all 0.3s ease' }}>
//                   <FormControlLabel value="credit_card" control={<Radio sx={{ color: 'var(--color-accent-lavender)', '&.Mui-checked': { color: 'var(--color-secondary)' } }} />} label={<Typography fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>Kredi / Banka Kartı</Typography>} sx={{ margin: 0, width: '100%' }} />

//                   {paymentMethod === 'credit_card' && (
//                     <Box sx={{ mt: 3, animation: 'fadeIn 0.5s' }}>
//                       <Grid container spacing={2.5}>
//                         <Grid item xs={12}>
//                           <TextField name="cardName" value={formData.cardName} onChange={handleInputChange} fullWidth label="Kart Üzerindeki İsim" variant="outlined" sx={textFieldSx} error={!!errors.cardName} helperText={errors.cardName} />
//                         </Grid>
//                         <Grid item xs={12}>
//                           <TextField name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} fullWidth label="Kart Numarası" variant="outlined" sx={textFieldSx} InputProps={{ endAdornment: <InputAdornment position="end"><CreditCardOutlinedIcon sx={{ color: 'var(--color-accent-lavender)' }} /></InputAdornment> }} error={!!errors.cardNumber} helperText={errors.cardNumber} />
//                         </Grid>
//                         <Grid item xs={12} sm={6}>
//                           <TextField name="cardExpiry" value={formData.cardExpiry} onChange={handleInputChange} fullWidth label="Son Kullanma (AA/YY)" variant="outlined" sx={textFieldSx} error={!!errors.cardExpiry} helperText={errors.cardExpiry} />
//                         </Grid>
//                         <Grid item xs={12} sm={6}>
//                           <TextField name="cardCvc" value={formData.cardCvc} onChange={handleInputChange} fullWidth label="CVC" variant="outlined" sx={textFieldSx} error={!!errors.cardCvc} helperText={errors.cardCvc} />
//                         </Grid>
//                       </Grid>
//                     </Box>
//                   )}
//                 </Box>

//                 <Box sx={{ border: paymentMethod === 'transfer' ? `2px solid var(--color-secondary)` : `1px solid var(--glass-border)`, backgroundColor: paymentMethod === 'transfer' ? 'rgba(255, 255, 255, 0.4)' : 'transparent', borderRadius: '16px', p: 2, transition: 'all 0.3s ease' }}>
//                   <FormControlLabel value="transfer" control={<Radio sx={{ color: 'var(--color-accent-lavender)', '&.Mui-checked': { color: 'var(--color-secondary)' } }} />} label={<Typography fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>Havale / EFT</Typography>} sx={{ margin: 0, width: '100%' }} />
//                   {paymentMethod === 'transfer' && (
//                     <Typography variant="body2" sx={{ mt: 1, ml: 4, color: 'var(--color-secondary)', fontWeight: 500, lineHeight: 1.6 }}>Siparişi tamamladıktan sonra banka hesap bilgilerimiz ekranda gösterilecektir. Ödemenizi tamamladığınızda siparişiniz onaylanıp üretime alınır.</Typography>
//                   )}
//                 </Box>
//               </RadioGroup>
//             </Box>

//           </Box>
//         </Box>
//       </Container>
//     </Box>
//   );
// }


import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button,
  Divider, Radio, RadioGroup, FormControlLabel, InputAdornment, Grid, CircularProgress,
  Snackbar, Alert, IconButton
} from '@mui/material';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

// API Servislerimiz
import { orderService } from '../api/orderServices';
import { cartService } from '../api/cartServices';

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  // Sepet Stateleri
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  // Form ve Validasyon Stateleri
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', district: '',
    cardName: '', cardNumber: '', cardExpiry: '', cardCvc: ''
  });

  // 1. API'DEN SEPET VERİSİNİ ÇEKME
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setCartLoading(true);
        const response = await cartService.getCart();
        if (response.success) {
          setCartItems(response.items || []);
        }
      } catch (error) {
        console.error("Sepet bilgileri alınamadı:", error);
        showToast("Sepet bilgileri yüklenirken bir hata oluştu.", "error");
      } finally {
        setCartLoading(false);
      }
    };
    fetchCartItems();
  }, []);

  // 2. KASMA SORUNU ÇÖZÜMÜ
  const { subtotal, shippingCost, total } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = sub > 500 ? 0 : 49.90;
    return { subtotal: sub, shippingCost: shipping, total: sub + shipping };
  }, [cartItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const showToast = (message, severity = 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setToast(prev => ({ ...prev, open: false }));
  };

  // --- YENİ: SEPETTEN ÜRÜN SİLME FONKSİYONU ---
  const handleRemoveItem = async (productId) => {
    try {
      setCartLoading(true);
      const response = await cartService.removeFromCart(productId);

      if (response.success) {
        // Backend'den dönen GÜNCEL listeyi ekrana yansıt
        setCartItems(response.items || []);

        // Navbar'daki sepet sayacını anında güncellemesi için sinyal gönder
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error("Silme hatası:", error);
      showToast(error.message || "İşlem sırasında bir hata oluştu.", "error");
    } finally {
      setCartLoading(false);
    }
  };

  // 3. FORM DOĞRULAMA (VALIDASYON)
  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.firstName.trim()) newErrors.firstName = "Ad alanı zorunludur.";
    if (!formData.lastName.trim()) newErrors.lastName = "Soyad alanı zorunludur.";
    if (!formData.email.trim()) {
      newErrors.email = "E-Posta zorunludur.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Geçerli bir E-Posta giriniz.";
    }
    if (!formData.phone.trim()) newErrors.phone = "Telefon zorunludur.";

    if (!formData.address.trim()) newErrors.address = "Adres zorunludur.";
    if (!formData.city.trim()) newErrors.city = "İl zorunludur.";
    if (!formData.district.trim()) newErrors.district = "İlçe zorunludur.";

    if (paymentMethod === 'credit_card') {
      if (!formData.cardName.trim()) newErrors.cardName = "Kart üzerindeki isim zorunludur.";
      if (!formData.cardNumber.trim()) newErrors.cardNumber = "Kart numarası zorunludur.";
      if (!formData.cardExpiry.trim()) newErrors.cardExpiry = "Son kullanma tarihi zorunludur.";
      if (!formData.cardCvc.trim()) newErrors.cardCvc = "CVC zorunludur.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. SİPARİŞİ ONAYLA VE GÖNDER
  const handleOrderSubmit = async () => {
    if (!validateForm()) {
      showToast("Lütfen formdaki hatalı alanları düzeltin.", "warning");
      return;
    }

    if (cartItems.length === 0) {
      showToast("Sepetiniz boş, sipariş oluşturulamaz.", "error");
      return;
    }

    const orderPayload = {
      customerInfo: { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone },
      shippingAddress: { address: formData.address, city: formData.city, district: formData.district },
      orderItems: cartItems.map(item => ({
        product: item.product?._id || item.product || item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      subtotal: subtotal, shippingCost: shippingCost, totalPrice: total, paymentMethod: paymentMethod
    };

    try {
      setLoading(true);
      const response = await orderService.createOrder(orderPayload);

      if (response.success) {
        if (paymentMethod === 'credit_card' && response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          showToast(`Siparişiniz başarıyla alındı! Kodunuz: ${response.orderId}`, "success");
          await cartService.clearCart();
          window.dispatchEvent(new Event('cartUpdated')); // Sepet boşaldığı için Navbar'ı sıfırla
          setTimeout(() => {
            window.location.href = `/siparis-basarili?orderId=${response.orderId}`;
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Sipariş hatası:", error);
      showToast(error.message || "Siparişiniz oluşturulurken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const text = `Merhaba, sipariş vermek istiyorum.\nİsim: ${formData.firstName || ''} ${formData.lastName || ''}\nToplam Tutar: ${total.toFixed(2)} TL`;
    const whatsappUrl = `https://wa.me/905555555555?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(4px)', transition: 'all 0.3s ease',
      '& fieldset': { borderColor: 'var(--glass-border)' }, '&:hover fieldset': { borderColor: 'var(--color-accent-lavender)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--color-secondary)', borderWidth: '2px' }, '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.7)' }
    },
    '& .MuiInputLabel-root': { color: 'var(--color-accent-lavender)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-secondary)', fontWeight: 600 }
  };

  const stepBadgeSx = {
    width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-accent-lavender)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '800', boxShadow: '0 4px 10px rgba(162, 144, 183, 0.3)', flexShrink: 0
  };

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 10, md: 12 }, pb: { xs: 6, md: 10 } }}>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 10 }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.2)', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
          <Button startIcon={<ArrowBackIosNewOutlinedIcon sx={{ fontSize: '1rem' }} />} sx={{ color: 'var(--color-accent-lavender)', fontWeight: 700, mr: 2, '&:hover': { backgroundColor: 'transparent', color: 'var(--color-secondary)' } }} onClick={() => window.history.back()}>Geri Dön</Button>
          <Typography variant="h4" fontWeight="800" className="custom-gradient-text">Güvenli Ödeme</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, lg: 8 }, alignItems: 'flex-start' }}>

          {/* SOL KOLON - SİPARİŞ ÖZETİ (%50) */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, position: { md: 'sticky' }, top: { md: 140 } }}>
            {/* BURADAKİ maxHeight KALDIRILDI */}
            <Box className="glass-card" sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column' }}>

              <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3 }}>Sipariş Özeti</Typography>

              {/* BURADAKİ overflowY: 'auto' VE KAYDIRMA KISITLAMALARI KALDIRILDI */}
              <Box sx={{ pb: 2 }}>

                {cartLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="inherit" /></Box>
                ) : cartItems.length === 0 ? (
                  <Typography color="var(--color-accent-lavender)" sx={{ textAlign: 'center', py: 3 }}>Sepetinizde ürün bulunmuyor.</Typography>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    {cartItems.map((item, index) => {
                      const productId = item.product?._id || item.product || item.id;
                      return (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box component="img" src={item.image} sx={{ width: 64, height: 64, borderRadius: '12px', objectFit: 'cover', mr: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="800" sx={{ color: 'var(--color-secondary)', lineHeight: 1.2, mb: 0.5 }}>{item.name}</Typography>
                            <Typography variant="body2" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 600 }}>Adet: {item.quantity}</Typography>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>{item.price} ₺</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(productId)}
                              sx={{
                                color: 'var(--color-accent-lavender)',
                                padding: '4px',
                                '&:hover': { color: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.08)' }
                              }}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Divider sx={{ my: 3, borderColor: 'var(--glass-border)' }} />

                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <TextField fullWidth placeholder="İndirim Kodu" size="small" sx={textFieldSx} />
                  <Button variant="contained" sx={{ backgroundColor: 'var(--color-accent-lavender)', borderRadius: '12px', px: 3, fontWeight: 700, boxShadow: 'none', '&:hover': { backgroundColor: 'var(--color-secondary)' } }}>Uygula</Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body1" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 600 }}>Ara Toplam</Typography>
                  <Typography variant="body1" fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>{subtotal.toFixed(2)} ₺</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body1" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 600 }}>Kargo Ücreti</Typography>
                  <Typography variant="body1" fontWeight="800" sx={{ color: shippingCost === 0 ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                    {shippingCost === 0 ? 'Ücretsiz' : `${shippingCost.toFixed(2)} ₺`}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'var(--glass-border)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>Toplam</Typography>
                  <Typography variant="h4" fontWeight="800" className="custom-gradient-text">{total.toFixed(2)} ₺</Typography>
                </Box>
              </Box>

              <Box sx={{ pt: 2, flexShrink: 0 }}>
                <Button
                  fullWidth variant="contained" size="large" disabled={loading || cartItems.length === 0} onClick={handleOrderSubmit}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlinedIcon />}
                  sx={{ backgroundColor: 'var(--color-secondary)', color: '#FFF', py: 1.8, borderRadius: '16px', fontSize: '1.05rem', fontWeight: 800, boxShadow: 'var(--glass-shadow)', '&:hover': { backgroundColor: 'var(--color-accent-lavender)', transform: 'translateY(-2px)' }, transition: 'all 0.3s ease' }}
                >
                  {loading ? 'İşleniyor...' : 'Siparişi Onayla ve Öde'}
                </Button>

                <Divider sx={{ my: 2.5, borderColor: 'var(--glass-border)', '&::before, &::after': { borderColor: 'var(--glass-border)' } }}>
                  <Typography variant="caption" sx={{ color: 'var(--color-accent-lavender)', fontWeight: 700 }}>VEYA</Typography>
                </Divider>

                <Button fullWidth variant="outlined" size="large" disabled={cartItems.length === 0} startIcon={<WhatsAppIcon />} onClick={handleWhatsAppOrder} sx={{ borderColor: '#25D366', color: '#25D366', py: 1.5, borderRadius: '16px', fontSize: '1rem', fontWeight: 800, backgroundColor: 'rgba(37, 211, 102, 0.05)', '&:hover': { backgroundColor: '#25D366', color: '#FFF', borderColor: '#25D366', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.25)' }, transition: 'all 0.3s ease' }}>
                  WhatsApp Üzerinden Sipariş Ver
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3, gap: 1, color: 'var(--color-accent-lavender)' }}>
                  <LocalShippingOutlinedIcon fontSize="small" />
                  <Typography variant="caption" fontWeight="700">256-Bit SSL ile Güvenli Ödeme Altyapısı</Typography>
                </Box>
              </Box>

            </Box>
          </Box>

          {/* SAĞ KOLON - FORMLAR (%50) */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>

            <Box className="glass-card" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}><Box component="span" sx={stepBadgeSx}>1</Box> İletişim Bilgileri</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField name="firstName" value={formData.firstName} onChange={handleInputChange} fullWidth label="Adınız" variant="outlined" sx={textFieldSx} error={!!errors.firstName} helperText={errors.firstName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="lastName" value={formData.lastName} onChange={handleInputChange} fullWidth label="Soyadınız" variant="outlined" sx={textFieldSx} error={!!errors.lastName} helperText={errors.lastName} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="email" value={formData.email} onChange={handleInputChange} fullWidth label="E-Posta Adresi" variant="outlined" sx={textFieldSx} error={!!errors.email} helperText={errors.email} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="phone" value={formData.phone} onChange={handleInputChange} fullWidth label="Telefon Numarası" variant="outlined" sx={textFieldSx} error={!!errors.phone} helperText={errors.phone} />
                </Grid>
              </Grid>
            </Box>

            <Box className="glass-card" sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}><Box component="span" sx={stepBadgeSx}>2</Box> Teslimat Adresi</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField name="address" value={formData.address} onChange={handleInputChange} fullWidth label="Açık Adres (Mahalle, Sokak, vb.)" variant="outlined" multiline rows={3} sx={textFieldSx} error={!!errors.address} helperText={errors.address} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="city" value={formData.city} onChange={handleInputChange} fullWidth label="İl" variant="outlined" sx={textFieldSx} error={!!errors.city} helperText={errors.city} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="district" value={formData.district} onChange={handleInputChange} fullWidth label="İlçe" variant="outlined" sx={textFieldSx} error={!!errors.district} helperText={errors.district} />
                </Grid>
              </Grid>
            </Box>

            <Box className="glass-card" sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight="800" sx={{ color: 'var(--color-secondary)', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}><Box component="span" sx={stepBadgeSx}>3</Box> Ödeme Yöntemi</Typography>

              <RadioGroup value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setErrors({}); }}>
                <Box sx={{ border: paymentMethod === 'credit_card' ? `2px solid var(--color-secondary)` : `1px solid var(--glass-border)`, backgroundColor: paymentMethod === 'credit_card' ? 'rgba(255, 255, 255, 0.4)' : 'transparent', borderRadius: '16px', p: 2, mb: 2, transition: 'all 0.3s ease' }}>
                  <FormControlLabel value="credit_card" control={<Radio sx={{ color: 'var(--color-accent-lavender)', '&.Mui-checked': { color: 'var(--color-secondary)' } }} />} label={<Typography fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>Kredi / Banka Kartı</Typography>} sx={{ margin: 0, width: '100%' }} />

                  {paymentMethod === 'credit_card' && (
                    <Box sx={{ mt: 3, animation: 'fadeIn 0.5s' }}>
                      <Grid container spacing={2.5}>
                        <Grid item xs={12}>
                          <TextField name="cardName" value={formData.cardName} onChange={handleInputChange} fullWidth label="Kart Üzerindeki İsim" variant="outlined" sx={textFieldSx} error={!!errors.cardName} helperText={errors.cardName} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} fullWidth label="Kart Numarası" variant="outlined" sx={textFieldSx} InputProps={{ endAdornment: <InputAdornment position="end"><CreditCardOutlinedIcon sx={{ color: 'var(--color-accent-lavender)' }} /></InputAdornment> }} error={!!errors.cardNumber} helperText={errors.cardNumber} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField name="cardExpiry" value={formData.cardExpiry} onChange={handleInputChange} fullWidth label="Son Kullanma (AA/YY)" variant="outlined" sx={textFieldSx} error={!!errors.cardExpiry} helperText={errors.cardExpiry} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField name="cardCvc" value={formData.cardCvc} onChange={handleInputChange} fullWidth label="CVC" variant="outlined" sx={textFieldSx} error={!!errors.cardCvc} helperText={errors.cardCvc} />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>

                <Box sx={{ border: paymentMethod === 'transfer' ? `2px solid var(--color-secondary)` : `1px solid var(--glass-border)`, backgroundColor: paymentMethod === 'transfer' ? 'rgba(255, 255, 255, 0.4)' : 'transparent', borderRadius: '16px', p: 2, transition: 'all 0.3s ease' }}>
                  <FormControlLabel value="transfer" control={<Radio sx={{ color: 'var(--color-accent-lavender)', '&.Mui-checked': { color: 'var(--color-secondary)' } }} />} label={<Typography fontWeight="800" sx={{ color: 'var(--color-secondary)' }}>Havale / EFT</Typography>} sx={{ margin: 0, width: '100%' }} />
                  {paymentMethod === 'transfer' && (
                    <Typography variant="body2" sx={{ mt: 1, ml: 4, color: 'var(--color-secondary)', fontWeight: 500, lineHeight: 1.6 }}>Siparişi tamamladıktan sonra banka hesap bilgilerimiz ekranda gösterilecektir. Ödemenizi tamamladığınızda siparişiniz onaylanıp üretime alınır.</Typography>
                  )}
                </Box>
              </RadioGroup>
            </Box>

          </Box>
        </Box>
      </Container>
    </Box>
  );
}