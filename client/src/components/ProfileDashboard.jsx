

import React, { useState, useEffect } from 'react';
import {
    Box, Container, Paper, List, ListItem, ListItemIcon,
    ListItemText, Typography, Avatar, Button, TextField, Divider, IconButton,
    Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import userService from '../api/userService';

// İkonlar
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

const TABS = [
    { id: 'profile', label: 'Kişisel Bilgilerim', icon: <PersonOutlineOutlinedIcon /> },
    { id: 'addresses', label: 'Adreslerim', icon: <LocationOnOutlinedIcon /> },
    { id: 'cards', label: 'Kayıtlı Kartlarım', icon: <PaymentOutlinedIcon /> },
    { id: 'orders', label: 'Siparişlerim', icon: <LocalMallOutlinedIcon /> },
    { id: 'favorites', label: 'Favorilerim', icon: <FavoriteBorderOutlinedIcon /> }
];

export default function ProfileDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);

    const [alertConfig, setAlertConfig] = useState({ open: false, message: '', severity: 'success' });

    // --- TEMEL STATE'LER (TAMAMEN BOŞ, API'DEN DOLAR) ---
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', currentPassword: '', newPassword: '' });
    const [addresses, setAddresses] = useState([]);
    const [savedCards, setSavedCards] = useState([]);
    const [orders, setOrders] = useState([]);
    const [favorites, setFavorites] = useState([]); 

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({ baslik: '', adSoyad: '', telefon: '', il: '', ilce: '', adres: '' });

    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [cardForm, setCardForm] = useState({ kartSahibi: '', kartNumarasi: '', skt: '' });

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderLoading, setIsOrderLoading] = useState(false);

    const [deleteModal, setDeleteModal] = useState({
        isOpen: false, type: null, id: null, title: '', message: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 1. Profil, Adres ve Kartları Çek
                const data = await userService.getProfile();
                const user = data.user || data;
                if (user) {
                    setFormData({
                        name: user.adSoyad || user.name || '', 
                        email: user.email || '', 
                        phone: user.telefon || user.phone || '', 
                        currentPassword: '', 
                        newPassword: ''
                    });
                    setAddresses(user.adresler || user.addresses || []);
                    setSavedCards(user.kayitliKartlar || user.savedCards || []);
                }

                // 2. Siparişleri Çek
                if (userService.getOrders) {
                    const ordersData = await userService.getOrders();
                    if (ordersData.success) {
                        setOrders(ordersData.orders || []);
                    }
                }

                // 3. Favorileri Çek
                if (userService.getFavorites) {
                    const favData = await userService.getFavorites();
                    if (favData.success) {
                        setFavorites(favData.favorites || []);
                    }
                }

            } catch (error) {
                showAlert('Veriler alınırken hata oluştu.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleRemoveFavorite = async (productId) => {
        try {
            await userService.removeFavorite(productId);
            setFavorites(favorites.filter(fav => (fav._id || fav.id) !== productId));
            showAlert('Ürün favorilerden çıkarıldı.', 'success');
        } catch (error) {
            showAlert('Favorilerden çıkarılırken hata oluştu.', 'error');
        }
    };

    // --- FORM İŞLEYİCİLER ---
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleAddressInputChange = (e) => setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
    const handleCardInputChange = (e) => setCardForm({ ...cardForm, [e.target.name]: e.target.value });

    // Dinamik Sipariş Durum İkonu ve Rengi
    const getStatusConfig = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('teslim') || s.includes('completed') || s.includes('başarılı')) return { color: '#81B29A', icon: <CheckCircleOutlineOutlinedIcon sx={{ color: '#81B29A' }} /> };
        if (s.includes('kargo')) return { color: '#DDA15E', icon: <LocalShippingOutlinedIcon sx={{ color: '#DDA15E' }} /> };
        return { color: '#A290B7', icon: <Inventory2OutlinedIcon sx={{ color: '#A290B7' }} /> };
    };

    const showAlert = (message, severity = 'success') => setAlertConfig({ open: true, message, severity });

    // --- API İŞLEMLERİ ---
    const handleSaveProfile = async () => {
        try {
            await userService.updateProfile({ adSoyad: formData.name, telefon: formData.phone });
            if (formData.currentPassword && formData.newPassword) {
                await userService.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
                setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            }
            showAlert('Profiliniz başarıyla güncellendi.', 'success');
        } catch (error) {
            showAlert(error.response?.data?.message || 'Güncelleme başarısız oldu.', 'error');
        }
    };

    const handleAddAddress = async () => {
        if (!addressForm.baslik || !addressForm.adSoyad || !addressForm.telefon || !addressForm.il || !addressForm.ilce || !addressForm.adres) {
            return showAlert('Lütfen tüm adres alanlarını doldurun.', 'error');
        }
        try {
            const response = await userService.addAddress(addressForm);
            setAddresses(response.addresses || response.adresler || []);
            setIsAddressModalOpen(false);
            setAddressForm({ baslik: '', adSoyad: '', telefon: '', il: '', ilce: '', adres: '' });
            showAlert('Adres başarıyla eklendi.', 'success');
        } catch (error) {
            showAlert(error.response?.data?.message || 'Adres eklenirken bir hata oluştu.', 'error');
        }
    };

    const handleAddCard = async () => {
        if (!cardForm.kartSahibi || !cardForm.kartNumarasi || !cardForm.skt) {
            return showAlert('Lütfen tüm kart alanlarını doldurun.', 'error');
        }
        if (cardForm.kartNumarasi.length < 16) {
            return showAlert('Geçerli bir kart numarası giriniz (16 hane).', 'error');
        }
        try {
            const response = await userService.addCard(cardForm);
            setSavedCards(response.savedCards || response.kayitliKartlar || []);
            setIsCardModalOpen(false);
            setCardForm({ kartSahibi: '', kartNumarasi: '', skt: '' });
            showAlert('Kart başarıyla eklendi.', 'success');
        } catch (error) {
            showAlert(error.response?.data?.message || 'Kart eklenirken bir hata oluştu.', 'error');
        }
    };

    // --- SİLME İŞLEMLERİ VE ONAY MODALI FONKSİYONLARI ---
    const openDeleteModal = (type, id) => {
        if (type === 'address') {
            setDeleteModal({
                isOpen: true, type: 'address', id: id,
                title: 'Adresi Sil', message: 'Bu adresi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
            });
        } else if (type === 'card') {
            setDeleteModal({
                isOpen: true, type: 'card', id: id,
                title: 'Kartı Sil', message: 'Bu kayıtlı kartı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
            });
        }
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });
    };

    const confirmDelete = async () => {
        const { type, id } = deleteModal;
        if (!id) return;

        try {
            if (type === 'address') {
                await userService.deleteAddress(id);
                setAddresses(addresses.filter(addr => addr._id !== id));
                showAlert('Adres başarıyla silindi.', 'success');
            } else if (type === 'card') {
                await userService.deleteCard(id);
                setSavedCards(savedCards.filter(card => card._id !== id));
                showAlert('Kart başarıyla silindi.', 'success');
            }
        } catch (error) {
            showAlert(`${type === 'address' ? 'Adres' : 'Kart'} silinirken bir hata oluştu.`, 'error');
        } finally {
            closeDeleteModal();
        }
    };

    // --- SİPARİŞ DETAY MODALINI API İLE AÇMA ---
    const openOrderDetails = async (orderId) => {
        setIsOrderModalOpen(true);
        setIsOrderLoading(true);
        setSelectedOrder(null);

        try {
            const data = await userService.getOrderById(orderId);
            if (data.success) {
                setSelectedOrder(data.order);
            }
        } catch (error) {
            showAlert('Sipariş detayları alınırken bir hata oluştu.', 'error');
            setIsOrderModalOpen(false);
        } finally {
            setIsOrderLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#FDF4D2' }}>
                <CircularProgress sx={{ color: '#2E3B55' }} />
            </Box>
        );
    }

    // --- SEKME İÇERİKLERİ ---
    const renderProfileTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 110, height: 110, bgcolor: '#B0CDE6', color: '#1E2738', fontSize: '3rem', fontWeight: 600, border: '4px solid #FDF4D2' }}>
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                    <Typography variant="h5" fontWeight="700" sx={{ color: '#2E3B55', mb: 0.5 }}>Profil Fotoğrafı</Typography>
                    <Typography variant="body2" sx={{ color: '#6E5252' }}>PNG, JPG veya JPEG (Maks. 2MB)</Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <TextField fullWidth label="Ad Soyad" name="name" value={formData.name} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                <TextField fullWidth label="E-Posta Adresi" name="email" type="email" value={formData.email} disabled sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#f9f9f9' } }} />
                <TextField fullWidth label="Telefon Numarası" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0555 555 55 55" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>

            <Box sx={{ width: '100%', my: 3 }}>
                <Divider><Typography variant="body2" sx={{ color: '#A290B7', fontWeight: 600, textTransform: 'uppercase' }}>Şifre Değiştir (Opsiyonel)</Typography></Divider>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <TextField fullWidth label="Mevcut Şifre" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                <TextField fullWidth label="Yeni Şifre" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Button onClick={handleSaveProfile} variant="contained" size="large" sx={{ bgcolor: '#2E3B55', color: '#FFF', borderRadius: '12px', px: 5, py: 1.5, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#946D6D' } }}>
                    Değişiklikleri Kaydet
                </Button>
            </Box>
        </motion.div>
    );

    const renderAddressesTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#2E3B55' }}>Adreslerim</Typography>
                <Button onClick={() => setIsAddressModalOpen(true)} variant="contained" startIcon={<AddLocationAltOutlinedIcon />} sx={{ bgcolor: '#946D6D', color: '#FFF', borderRadius: '12px', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#A290B7' } }}>
                    Yeni Adres Ekle
                </Button>
            </Box>

            {addresses.length === 0 ? (
                <Typography variant="body1" sx={{ color: '#6E5252' }}>Henüz kayıtlı bir adresiniz bulunmamaktadır.</Typography>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    {addresses.map((addr) => (
                        <Paper key={addr._id} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(162, 144, 183, 0.3)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#2E3B55', mb: 1 }}>{addr.baslik}</Typography>
                            <Typography variant="body2" sx={{ color: '#6E5252', mb: 0.5 }}><strong>{addr.adSoyad}</strong> - {addr.telefon}</Typography>
                            <Typography variant="body2" sx={{ color: '#6E5252', mb: 2 }}>{addr.adres} <br /> {addr.ilce} / {addr.il}</Typography>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button onClick={() => openDeleteModal('address', addr._id)} size="small" startIcon={<DeleteOutlinedIcon />} sx={{ color: '#946D6D', bgcolor: 'rgba(148, 109, 109, 0.1)', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(148, 109, 109, 0.2)' } }}>Sil</Button>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}
        </motion.div>
    );

    const renderCardsTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#2E3B55' }}>Kayıtlı Kartlarım</Typography>
                <Button onClick={() => setIsCardModalOpen(true)} variant="contained" startIcon={<AddCardOutlinedIcon />} sx={{ bgcolor: '#946D6D', color: '#FFF', borderRadius: '12px', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#A290B7' } }}>
                    Yeni Kart Ekle
                </Button>
            </Box>

            {savedCards.length === 0 ? (
                <Typography variant="body1" sx={{ color: '#6E5252' }}>Kayıtlı kredi/banka kartınız bulunmamaktadır.</Typography>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    {savedCards.map((card) => (
                        <Paper key={card._id} sx={{ position: 'relative', p: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #1E2738 0%, #2E3B55 100%)', color: '#FFF', overflow: 'hidden' }}>
                            <CreditCardOutlinedIcon sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: '120px', opacity: 0.1 }} />
                            <Typography variant="h6" sx={{ letterSpacing: '2px', mb: 3, fontFamily: 'monospace' }}>**** **** **** {card.son4Hane}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#B0CDE6', opacity: 0.8 }}>Kart Sahibi</Typography>
                                    <Typography variant="body2" fontWeight="700">{card.kartSahibi}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#B0CDE6', opacity: 0.8 }}>SKT</Typography>
                                    <Typography variant="body2" fontWeight="700">{card.skt}</Typography>
                                </Box>
                            </Box>
                            <IconButton onClick={() => openDeleteModal('card', card._id)} size="small" sx={{ position: 'absolute', top: 10, right: 10, color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#FFF', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    ))}
                </Box>
            )}
        </motion.div>
    );

    const renderOrdersTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Typography variant="h5" fontWeight="700" sx={{ color: '#2E3B55', mb: 3 }}>Siparişlerim</Typography>

            {orders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <LocalMallOutlinedIcon sx={{ fontSize: 60, color: 'rgba(162, 144, 183, 0.5)', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#2E3B55', fontWeight: 700 }}>Henüz Siparişiniz Bulunmuyor</Typography>
                    <Typography variant="body2" sx={{ color: '#6E5252', mt: 1 }}>Mağazamızdaki harika ürünleri keşfetmek için alışverişe başlayabilirsiniz.</Typography>
                    <Button variant="contained" onClick={() => navigate('/products')} sx={{ mt: 3, bgcolor: '#946D6D', color: '#FFF', borderRadius: '12px', '&:hover': { bgcolor: '#825c5c' } }}>
                        Alışverişe Başla
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {orders.map((order) => {
                        const orderId = order._id;
                        const status = order.paymentStatus === 'completed' ? 'Teslim Edildi' : (order.paymentStatus || order.durum || 'Hazırlanıyor');
                        const statusConfig = getStatusConfig(status);
                        const total = order.totalPrice || order.toplamTutar || 0;
                        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '';
                        const itemsCount = order.orderItems?.length || order.urunler?.length || 0;

                        return (
                            <Paper key={orderId} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid rgba(162, 144, 183, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: '#A290B7', fontWeight: 700 }}>Sipariş No: #{orderId.slice(-6).toUpperCase()}</Typography>
                                    <Typography variant="body2" sx={{ color: '#6E5252' }}>{date} • {itemsCount} Ürün</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {statusConfig.icon}
                                    <Typography variant="body2" fontWeight="700" sx={{ color: statusConfig.color }}>{status}</Typography>
                                </Box>
                                <Typography variant="h6" fontWeight="800" sx={{ color: '#2E3B55' }}>{total} TL</Typography>
                                <Button
                                    onClick={() => openOrderDetails(orderId)}
                                    variant="outlined"
                                    endIcon={<VisibilityOutlinedIcon />}
                                    sx={{ borderRadius: '10px', color: '#2E3B55', borderColor: '#2E3B55' }}
                                >
                                    Detaylar
                                </Button>
                            </Paper>
                        )
                    })}
                </Box>
            )}
        </motion.div>
    );

    const renderFavoritesTab = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Typography variant="h5" fontWeight="700" sx={{ color: '#2E3B55', mb: 3 }}>Favorilerim</Typography>

            {favorites.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                    <FavoriteBorderOutlinedIcon sx={{ fontSize: 60, color: 'rgba(162, 144, 183, 0.5)', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#2E3B55', fontWeight: 700 }}>Favorileriniz Boş</Typography>
                    <Typography variant="body2" sx={{ color: '#6E5252', mt: 1 }}>Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.</Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    {favorites.map((fav) => (
                        <Paper key={fav._id || fav.id} sx={{ display: 'flex', p: 2, borderRadius: '16px', border: '1px solid rgba(162, 144, 183, 0.2)', gap: 2, alignItems: 'center' }}>
                            <Box component="img" src={fav.image || fav.gorsel || (fav.images && fav.images[0]) || '/placeholder.png'} sx={{ width: 80, height: 80, borderRadius: '12px', objectFit: 'cover' }} />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#2E3B55', mb: 0.5 }}>{fav.name || fav.isim || fav.title}</Typography>
                                <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D' }}>{fav.price || fav.fiyat} TL</Typography>
                            </Box>
                            <IconButton onClick={() => handleRemoveFavorite(fav._id || fav.id)} size="small" sx={{ bgcolor: 'rgba(148, 109, 109, 0.1)', color: '#946D6D' }}>
                                <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Paper>
                    ))}
                </Box>
            )}
        </motion.div>
    );

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#FDF4D2', pt: { xs: 8, md: 12 }, pb: 8 }}>

            <Snackbar open={alertConfig.open} autoHideDuration={4000} onClose={() => setAlertConfig({ ...alertConfig, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setAlertConfig({ ...alertConfig, open: false })} severity={alertConfig.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
                    {alertConfig.message}
                </Alert>
            </Snackbar>

            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 3, md: 5 }, pl: { xs: 1, md: 2 } }}>
                    <IconButton onClick={() => navigate('/')} sx={{ backgroundColor: '#FFFFFF', color: '#946D6D', border: '1px solid rgba(148, 109, 109, 0.3)' }}>
                        <HomeOutlinedIcon />
                    </IconButton>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55', margin: 0 }}>Hesabım</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'row', gap: { xs: 2, md: 4 }, flexWrap: 'nowrap', alignItems: 'flex-start' }}>

                    {/* SOL NAVBAR */}
                    <Box sx={{ width: { xs: '200px', md: '280px' }, flexShrink: 0, position: 'sticky', top: '100px' }}>
                        <Paper elevation={0} sx={{ borderRadius: '24px', backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', p: 2 }}>
                            <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {TABS.map((tab) => (
                                    <ListItem
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        sx={{
                                            cursor: 'pointer',
                                            borderRadius: '16px',
                                            backgroundColor: activeTab === tab.id ? '#B0CDE6' : 'transparent',
                                            color: activeTab === tab.id ? '#1E2738' : '#6E5252',
                                            px: { xs: 1.5, md: 2.5 },
                                            py: 1.5,
                                            transition: 'all 0.3s ease',
                                            '&:hover': { backgroundColor: activeTab === tab.id ? '#B0CDE6' : 'rgba(176, 205, 230, 0.3)' }
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: 'inherit', minWidth: { xs: '30px', md: '40px' } }}>{tab.icon}</ListItemIcon>
                                        <ListItemText primary={tab.label} primaryTypographyProps={{ fontWeight: activeTab === tab.id ? 800 : 500 }} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Box>

                    {/* İÇERİK ALANI */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Paper elevation={0} sx={{ borderRadius: '24px', backgroundColor: '#FFFFFF', p: { xs: 3, sm: 5, md: 6 }, overflowX: 'auto' }}>
                            <AnimatePresence mode="wait">
                                {activeTab === 'profile' && renderProfileTab()}
                                {activeTab === 'addresses' && renderAddressesTab()}
                                {activeTab === 'cards' && renderCardsTab()}
                                {activeTab === 'orders' && renderOrdersTab()}
                                {activeTab === 'favorites' && renderFavoritesTab()}
                            </AnimatePresence>
                        </Paper>
                    </Box>
                </Box>
            </Container>

            {/* ADRES EKLEME MODALI */}
            <Dialog open={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ color: '#2E3B55', fontWeight: 800, pb: 1 }}>Yeni Adres Ekle</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
                        <TextField fullWidth label="Adres Başlığı (Ev, İş vb.)" name="baslik" value={addressForm.baslik} onChange={handleAddressInputChange} sx={{ gridColumn: 'span 2' }} />
                        <TextField fullWidth label="Alıcı Ad Soyad" name="adSoyad" value={addressForm.adSoyad} onChange={handleAddressInputChange} />
                        <TextField fullWidth label="Telefon Numarası" name="telefon" value={addressForm.telefon} onChange={handleAddressInputChange} />
                        <TextField fullWidth label="İl" name="il" value={addressForm.il} onChange={handleAddressInputChange} />
                        <TextField fullWidth label="İlçe" name="ilce" value={addressForm.ilce} onChange={handleAddressInputChange} />
                        <TextField fullWidth multiline rows={3} label="Açık Adres" name="adres" value={addressForm.adres} onChange={handleAddressInputChange} sx={{ gridColumn: 'span 2' }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setIsAddressModalOpen(false)} sx={{ color: '#6E5252', fontWeight: 700 }}>İptal</Button>
                    <Button onClick={handleAddAddress} variant="contained" sx={{ bgcolor: '#2E3B55', color: '#FFF', borderRadius: '12px', fontWeight: 700, px: 4 }}>Kaydet</Button>
                </DialogActions>
            </Dialog>

            {/* KART EKLEME MODALI */}
            <Dialog open={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ color: '#2E3B55', fontWeight: 800, pb: 1 }}>Yeni Kart Ekle</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField fullWidth label="Kart Üzerindeki İsim" name="kartSahibi" value={cardForm.kartSahibi} onChange={handleCardInputChange} />
                        <TextField fullWidth label="Kart Numarası (16 Hane)" name="kartNumarasi" value={cardForm.kartNumarasi} onChange={handleCardInputChange} inputProps={{ maxLength: 16 }} />
                        <TextField fullWidth label="Son Kullanma Tarihi (AA/YY)" name="skt" value={cardForm.skt} onChange={handleCardInputChange} placeholder="12/25" />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setIsCardModalOpen(false)} sx={{ color: '#6E5252', fontWeight: 700 }}>İptal</Button>
                    <Button onClick={handleAddCard} variant="contained" sx={{ bgcolor: '#2E3B55', color: '#FFF', borderRadius: '12px', fontWeight: 700, px: 4 }}>Kaydet</Button>
                </DialogActions>
            </Dialog>

            {/* SİLME ONAY MODALI */}
            <Dialog open={deleteModal.isOpen} onClose={closeDeleteModal} PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#946D6D', fontWeight: 800, pb: 1 }}>
                    <WarningAmberRoundedIcon /> {deleteModal.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#2E3B55', fontWeight: 500 }}>
                        {deleteModal.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={closeDeleteModal} sx={{ color: '#6E5252', fontWeight: 700 }}>İptal</Button>
                    <Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: '#946D6D', color: '#FFF', borderRadius: '12px', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#825c5c' } }}>
                        Evet, Sil
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SİPARİŞ DETAY MODALI (API Entegreli) */}
            <Dialog open={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1, minHeight: '300px' } }}>
                {isOrderLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                        <CircularProgress sx={{ color: '#946D6D', mb: 2 }} />
                        <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>Sipariş detayları getiriliyor...</Typography>
                    </Box>
                ) : selectedOrder ? (
                    <>
                        <DialogTitle sx={{ color: '#2E3B55', fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                Sipariş Detayı
                                <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 500 }}>#{selectedOrder._id?.slice(-6).toUpperCase()}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.03)', px: 2, py: 1, borderRadius: '8px' }}>
                                {getStatusConfig(selectedOrder.paymentStatus === 'completed' ? 'Teslim Edildi' : (selectedOrder.paymentStatus || selectedOrder.durum)).icon}
                                <Typography variant="subtitle2" fontWeight="700" sx={{ color: getStatusConfig(selectedOrder.paymentStatus === 'completed' ? 'Teslim Edildi' : (selectedOrder.paymentStatus || selectedOrder.durum)).color }}>
                                    {selectedOrder.paymentStatus === 'completed' ? 'Teslim Edildi' : (selectedOrder.paymentStatus || selectedOrder.durum || 'Hazırlanıyor')}
                                </Typography>
                            </Box>
                        </DialogTitle>

                        <DialogContent dividers sx={{ borderColor: 'rgba(162, 144, 183, 0.2)' }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#A290B7', mb: 1, textTransform: 'uppercase' }}>Teslimat Adresi</Typography>
                                <Typography variant="body2" sx={{ color: '#2E3B55', fontWeight: 500 }}>
                                    {selectedOrder.shippingAddress?.address || selectedOrder.teslimatAdresi?.adres || "Adres bilgisi bulunamadı."}
                                </Typography>
                            </Box>

                            <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#A290B7', mb: 2, textTransform: 'uppercase' }}>Satın Alınan Ürünler</Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {(selectedOrder.orderItems || selectedOrder.urunler || []).map((product, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid rgba(162, 144, 183, 0.2)', borderRadius: '12px' }}>
                                        <Box component="img" src={product.image || product.gorsel || (product.images && product.images[0]) || '/placeholder.png'} sx={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover' }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#2E3B55' }}>{product.name || product.isim}</Typography>
                                            <Typography variant="body2" sx={{ color: '#6E5252' }}>Adet: {product.quantity || product.adet}</Typography>
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#946D6D' }}>{product.price || product.fiyat} TL</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="800" sx={{ color: '#2E3B55' }}>Toplam: {selectedOrder.totalPrice || selectedOrder.toplamTutar || 0} TL</Typography>
                            <Button onClick={() => setIsOrderModalOpen(false)} variant="contained" sx={{ bgcolor: '#2E3B55', color: '#FFF', borderRadius: '12px', fontWeight: 700, px: 4, '&:hover': { bgcolor: '#1E2738' } }}>
                                Kapat
                            </Button>
                        </DialogActions>
                    </>
                ) : null}
            </Dialog>

        </Box>
    );
}