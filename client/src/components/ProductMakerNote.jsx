// import { Box, Typography } from '@mui/material';
// import StraightenOutlined from '@mui/icons-material/StraightenOutlined';
// import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
// import { useTranslation } from 'react-i18next';
// import { buildFulfillment } from '../utils/shipping';

// export default function ProductMakerNote({ product }) {
//   const { t } = useTranslation('catalog');
//   const fulfillment = buildFulfillment(product);
//   const isCustom = fulfillment?.delivery?.kind === 'custom';
//   const hasMeasure = Boolean(product?.measureNote) || (Array.isArray(fulfillment?.measures) && fulfillment.measures.length > 0);

//   if (!isCustom && !hasMeasure) {
//     return (
//       <Box
//         sx={{
//           mb: 2.5,
//           p: 1.8,
//           borderRadius: '16px',
//           bgcolor: 'rgba(243,232,216,0.55)',
//           border: '1px solid rgba(148,109,109,0.14)',
//           display: 'flex',
//           gap: 1.3,
//           alignItems: 'flex-start'
//         }}
//       >
//         <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#fff', color: '#946D6D', flexShrink: 0 }}>
//           <CardGiftcardOutlined sx={{ fontSize: 22 }} />
//         </Box>
//         <Box>
//           <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>
//             {t('product.giftNoteTitle')}
//           </Typography>
//           <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.4, lineHeight: 1.55 }}>
//             {t('product.giftNoteText')}
//           </Typography>
//         </Box>
//       </Box>
//     );
//   }

//   return (
//     <Box
//       sx={{
//         mb: 2.5,
//         p: 1.8,
//         borderRadius: '16px',
//         bgcolor: isCustom ? 'rgba(232,238,245,0.75)' : 'rgba(243,232,216,0.55)',
//         border: '1px solid rgba(148,109,109,0.14)',
//         display: 'flex',
//         gap: 1.3,
//         alignItems: 'flex-start'
//       }}
//     >
//       <Box
//         sx={{
//           width: 40,
//           height: 40,
//           borderRadius: '12px',
//           display: 'grid',
//           placeItems: 'center',
//           bgcolor: '#fff',
//           color: isCustom ? '#2E3B55' : '#946D6D',
//           flexShrink: 0
//         }}
//       >
//         {isCustom ? <StraightenOutlined sx={{ fontSize: 22 }} /> : <CardGiftcardOutlined sx={{ fontSize: 22 }} />}
//       </Box>
//       <Box>
//         <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>
//           {isCustom ? t('product.customNoteTitle') : t('product.measureNoteTitle')}
//         </Typography>
//         <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.4, lineHeight: 1.55 }}>
//           {isCustom
//             ? t('product.customNoteText', { time: fulfillment?.delivery?.time || product?.customProductionTime || '1-3 iş günü' })
//             : t('product.measureNoteText')}
//         </Typography>
//         {product?.measureNote ? (
//           <Typography sx={{ color: '#2E3B55', fontWeight: 700, fontSize: '0.8rem', mt: 0.8 }}>
//             {product.measureNote}
//           </Typography>
//         ) : null}
//       </Box>
//     </Box>
//   );
// }




import { Box, Typography } from '@mui/material';
import StraightenOutlined from '@mui/icons-material/StraightenOutlined';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { useTranslation } from 'react-i18next';
import { buildFulfillment } from '../utils/shipping';

export default function ProductMakerNote({ product }) {
  const { t } = useTranslation('catalog');
  const fulfillment = buildFulfillment(product);
  const isCustom = fulfillment?.delivery?.kind === 'custom';
  const hasMeasure = Boolean(product?.measureNote) || (Array.isArray(fulfillment?.measures) && fulfillment.measures.length > 0);

  // Mevcut Hediye veya Özel Ölçü notunu render eden orijinal yapı
  const renderNote = () => {
    if (!isCustom && !hasMeasure) {
      return (
        <Box
          sx={{
            mb: 2.5,
            p: 1.8,
            borderRadius: '16px',
            bgcolor: 'rgba(243,232,216,0.55)',
            border: '1px solid rgba(148,109,109,0.14)',
            display: 'flex',
            gap: 1.3,
            alignItems: 'flex-start'
          }}
        >
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#fff', color: '#946D6D', flexShrink: 0 }}>
            <CardGiftcardOutlined sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>
              {t('product.giftNoteTitle')}
            </Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.4, lineHeight: 1.55 }}>
              {t('product.giftNoteText')}
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          mb: 2.5,
          p: 1.8,
          borderRadius: '16px',
          bgcolor: isCustom ? 'rgba(232,238,245,0.75)' : 'rgba(243,232,216,0.55)',
          border: '1px solid rgba(148,109,109,0.14)',
          display: 'flex',
          gap: 1.3,
          alignItems: 'flex-start'
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#fff',
            color: isCustom ? '#2E3B55' : '#946D6D',
            flexShrink: 0
          }}
        >
          {isCustom ? <StraightenOutlined sx={{ fontSize: 22 }} /> : <CardGiftcardOutlined sx={{ fontSize: 22 }} />}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>
            {isCustom ? t('product.customNoteTitle') : t('product.measureNoteTitle')}
          </Typography>
          <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.4, lineHeight: 1.55 }}>
            {isCustom
              ? t('product.customNoteText', { time: fulfillment?.delivery?.time || product?.customProductionTime || '1-3 iş günü' })
              : t('product.measureNoteText')}
          </Typography>
          {product?.measureNote ? (
            <Typography sx={{ color: '#2E3B55', fontWeight: 700, fontSize: '0.8rem', mt: 0.8 }}>
              {product.measureNote}
            </Typography>
          ) : null}
        </Box>
      </Box>
    );
  };

  return (
    <>
      {/* ---> YENİ EKLENEN KARGO & ÜRETİM SÜRESİ BİLGİ ALANI <--- */}
      <Box sx={{ bgcolor: 'rgba(176, 205, 230, 0.15)', border: '1px solid rgba(46,59,85,0.1)', borderRadius: '16px', p: 2, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          {product?.immediateDelivery ? (
            <LocalShippingOutlinedIcon sx={{ color: '#2E3B55', fontSize: 22 }} />
          ) : (
            <Inventory2OutlinedIcon sx={{ color: '#946D6D', fontSize: 22 }} />
          )}
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: product?.immediateDelivery ? '#2E3B55' : '#946D6D' }}>
            {product?.immediateDelivery 
              ? 'Stoklu Ürün: 1-3 iş gününde kargoya verilir.' 
              : `Özel Üretim: ${product?.customProductionTime || '10-15 iş gününde'} üretilir ve kargolanır.`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 22, display: 'flex', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '16px' }}>📦</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#6E5252' }}>
            1000 ₺ üzeri kargo ücretsiz! (Diğer siparişlerde 99 ₺)
          </Typography>
        </Box>
      </Box>

      {/* Orijinal Hediye veya Ölçü Notu Alanı */}
      {renderNote()}
    </>
  );
}