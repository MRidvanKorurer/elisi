import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';
import userService from '../api/userService';
import { persistSession } from '../utils/session';
import { isSuperAdmin, isSellerRole } from '../utils/roles';
import { isValidPhone } from '../utils/sellerValidation';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    backgroundColor: '#fff'
  }
};

export default function PhoneRequiredGate({ user, onSaved }) {
  const [telefon, setTelefon] = useState(user?.telefon || user?.phone || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const rol = user?.rol;
  if (!user || isSuperAdmin(rol) || isSellerRole(rol) || isValidPhone(user.telefon || user.phone)) return null;

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isValidPhone(telefon)) {
      setError('Geçerli bir cep telefonu girin (05xx xxx xx xx).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await userService.updateProfile({
        adSoyad: user.adSoyad || user.name,
        telefon: telefon.trim()
      });
      const nextUser = data.user || data.kullanici || { ...user, telefon: telefon.trim() };
      persistSession(nextUser);
      onSaved?.(nextUser);
    } catch (err) {
      setError(err.response?.data?.mesaj || err.response?.data?.message || 'Telefon kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="xs" disableEscapeKeyDown>
      <DialogTitle sx={{ fontWeight: 800, color: '#2E3B55', pb: 0.5 }}>
        Telefon numarası zorunlu
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 2, mt: 1 }}>
          Google veya e-posta ile kayıtta telefon gereklidir. Devam etmek için numaranı yaz.
        </Typography>
        {error ? <Alert severity="error" sx={{ mb: 1.5, borderRadius: '12px' }}>{error}</Alert> : null}
        <form onSubmit={handleSave}>
          <TextField
            autoFocus
            fullWidth
            required
            label="Telefon"
            placeholder="05xx xxx xx xx"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            sx={fieldSx}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 2, py: 1.3, borderRadius: '14px', fontWeight: 800, bgcolor: '#2E3B55' }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Kaydet ve devam et'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
