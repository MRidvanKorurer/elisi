import React from 'react';
import { Box, Typography } from '@mui/material';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import StraightenOutlined from '@mui/icons-material/StraightenOutlined';
import { buildFulfillment } from '../utils/shipping';

const ICONS = {
  delivery: LocalShippingOutlinedIcon,
  custom: HandymanOutlinedIcon,
  shipping: LocalShippingOutlinedIcon,
  returns: ReplayRounded,
  measures: StraightenOutlined
};

function Cell({ icon: Icon, title, detail, items }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.3,
        p: { xs: 1.5, md: 1.7 },
        borderRadius: '18px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(148,109,109,0.14)',
        minHeight: { md: 108 }
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '12px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#F3E8D8',
          color: '#946D6D'
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.92rem', lineHeight: 1.25 }}>
          {title}
        </Typography>
        {detail ? (
          <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.5, mt: 0.45 }}>
            {detail}
          </Typography>
        ) : null}
        {Array.isArray(items) && items.length > 0 ? (
          <Box sx={{ mt: 0.7, display: 'flex', flexDirection: 'column', gap: 0.35 }}>
            {items.map((item) => {
              const label = item?.label == null ? '' : String(item.label);
              const value = item?.value == null || typeof item.value === 'object' ? '' : String(item.value);
              if (!label && !value) return null;
              return (
                <Typography key={`${label}-${value}`} sx={{ color: '#2E3B55', fontWeight: 700, fontSize: '0.8rem' }}>
                  {label}{value ? `: ${value}` : ''}
                </Typography>
              );
            })}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export default function ProductFulfillment({ product }) {
  const data = buildFulfillment(product);
  if (!data?.delivery || !data?.shipping || !data?.returns) return null;

  const measures = Array.isArray(data.measures) ? data.measures : [];
  const DeliveryIcon = data.delivery.kind === 'custom' ? ICONS.custom : ICONS.delivery;

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.1
        }}
      >
        <Cell icon={DeliveryIcon} title={data.delivery.title} detail={data.delivery.detail} />
        <Cell icon={ICONS.shipping} title={data.shipping.title} detail={data.shipping.detail} />
        <Cell
          icon={ICONS.measures}
          title={measures.length ? 'Ölçü ve kullanım' : 'El işçiliği, sınırlı üretim'}
          detail={measures.length ? '' : 'Her parça atölyede, sınırlı adetle hazırlanır.'}
          items={measures.slice(0, 4)}
        />
        <Cell icon={ICONS.returns} title={data.returns.title} detail={data.returns.detail} />
      </Box>
    </Box>
  );
}
