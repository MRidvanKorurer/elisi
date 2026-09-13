import { Box, Button, TextField, Typography } from '@mui/material';
import { fieldSx, primaryButton } from './PanelShell';
import { T, money } from '../utils/panel';
import { quoteMargin } from '../utils/marginQuote';

function Row({ label, value, strong, warn, hint }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.55, alignItems: 'baseline' }}>
      <Typography sx={{ color: warn ? T.rose : T.muted, fontWeight: strong ? 900 : 700, fontSize: strong ? '0.95rem' : '0.84rem' }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ color: warn ? T.rose : T.navy, fontWeight: 900 }}>{value}</Typography>
        {hint ? <Typography sx={{ color: T.muted, fontSize: 11 }}>{hint}</Typography> : null}
      </Box>
    </Box>
  );
}

export default function ProductMarginCalculator({
  commissionPercent = 10,
  costPrice,
  shippingCost,
  extraCost,
  price,
  onChange,
  showPriceField = true
}) {
  const shipping = shippingCost === '' || shippingCost == null ? 0 : shippingCost;
  const quote = quoteMargin({
    cost: costPrice,
    shipping,
    extra: extraCost,
    price,
    commissionPercent
  });

  const set = (patch) => onChange?.((prev) => ({ ...prev, ...patch }));

  return (
    <Box>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Kar marjı</Typography>
      <Typography sx={{ color: T.muted, fontSize: '0.82rem', mb: 2 }}>
        Maliyeti yaz. Site payı (kart ücreti dahil, %{quote.commissionPercent}) satış fiyatından düşülür. Kargo payını yalnızca senin gerçek gönderim maliyetinse yaz.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
        <TextField
          label="Ürün maliyeti (₺)"
          type="number"
          value={costPrice}
          onChange={(e) => set({ costPrice: e.target.value })}
          placeholder="Örn. 320"
          sx={fieldSx}
        />
        <TextField
          label="Kargo payı (₺)"
          type="number"
          value={shippingCost}
          onChange={(e) => set({ shippingCost: e.target.value })}
          placeholder="0"
          helperText="Müşteri 500 ₺ altında kargo öder; 500 ₺ üstü bedava kargo site kampanyasıdır, senin komisyonuna girmez."
          sx={fieldSx}
        />
        <TextField
          label="Diğer masraf (₺)"
          type="number"
          value={extraCost}
          onChange={(e) => set({ extraCost: e.target.value })}
          placeholder="Ambalaj, kutu…"
          sx={fieldSx}
        />
        {showPriceField ? (
          <TextField
            label="Satış fiyatın (₺)"
            type="number"
            value={price}
            onChange={(e) => set({ price: e.target.value })}
            required
            helperText="Önerileni değiştirebilirsin"
            sx={fieldSx}
          />
        ) : null}
      </Box>

      {quote.base > 0 ? (
        <Box sx={{ p: 1.8, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px solid ${T.line}` }}>
          <Row label="Ürün + kargo + diğer" value={money(quote.base)} />
          <Row
            label={`Site komisyonu (%${quote.commissionPercent})`}
            value={quote.sale ? money(quote.commission) : 'fiyata göre'}
            hint={quote.sale ? 'Satış fiyatı üzerinden' : 'Başabaş fiyatta hesaplanır'}
          />
          <Row label="Gerçek maliyet / başabaş" value={money(quote.breakEven)} strong />
          <Row label="Nik Bag önerisi" value={money(quote.suggested)} hint="%25 net kâr payı, yuvarlanmış" />
          {quote.sale > 0 ? (
            <>
              <Row label="Sana kalan" value={money(quote.net)} />
              <Row
                label={quote.belowCost ? 'Zarar' : 'Net kâr'}
                value={money(quote.profit)}
                warn={quote.belowCost}
                hint={`Satışın %${Math.abs(quote.profitRate)}’i`}
                strong
              />
            </>
          ) : null}
          <Button
            onClick={() => set({ price: quote.suggested })}
            disabled={!quote.suggested}
            sx={{ ...primaryButton, mt: 1.6, width: { xs: '100%', sm: 'auto' } }}
          >
            Önerilen fiyatı kullan · {money(quote.suggested)}
          </Button>
        </Box>
      ) : (
        <Typography sx={{ color: T.muted, fontWeight: 700 }}>Önce ürün maliyetini yaz, hesap dolsun.</Typography>
      )}
    </Box>
  );
}
