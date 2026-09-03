import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { motion } from 'framer-motion';

export default function WhatsAppWidget() {
  const PHONE_NUMBER = "905XXXXXXXXX"; // WhatsApp Numarası (Ülke kodu ile)
  const defaultMessage = encodeURIComponent("Merhaba NKBag! Tasarımlarınız hakkında bilgi almak istiyorum.");

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 1200
      }}
    >
      <Tooltip title="WhatsApp Hızlı Sipariş & Destek" placement="left" arrow>
        <Fab
          component="a"
          href={`https://wa.me/${PHONE_NUMBER}?text=${defaultMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            backgroundColor: '#25D366',
            color: '#FFFFFF',
            width: 60,
            height: 60,
            boxShadow: '0 8px 25px rgba(37, 211, 102, 0.45)',
            '&:hover': {
              backgroundColor: '#1EBE57',
              transform: 'scale(1.08)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <WhatsAppIcon sx={{ fontSize: 34 }} />
        </Fab>
      </Tooltip>
    </motion.div>
  );
}