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
  discountPercentage,
  onChange,
  showPriceField = true
}) {
  const sellerShip = shippingCost === '' || shippingCost == null ? 0 : shippingCost;
  const quote = quoteMargin({
    cost: costPrice,
    shipping: sellerShip,
    extra: extraCost,
    price,
    discountPercentage,
    commissionPercent
  });

  const set = (patch) => onChange?.((prev) => ({ ...prev, ...patch }));
  const showQuote = quote.sale > 0 || quote.base > 0;

  return (
    <Box>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Kar marjı</Typography>
      <Typography sx={{ color: T.muted, fontSize: '0.82rem', mb: 2 }}>
        Site payı, alıcının ödediği son tutardandır. 1000 ₺ altı siparişte kargo 100 ₺’dir; 300 + 100 = 400 üzerinden %10 = 40 ₺ siteye kalır. 1000 ₺ ve üzeri kargo bedava, pay yalnızca üründendir.
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
          label="Senin kargo masrafın (₺)"
          type="number"
          value={shippingCost}
          onChange={(e) => set({ shippingCost: e.target.value })}
          placeholder="0"
          helperText="Kendi gönderim maliyetin. Alıcı kargosu otomatik 100 ₺ / ücretsiz kuralıdır."
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
            helperText="Müşterinin ürüne ödeyeceği tutar"
            sx={fieldSx}
          />
        ) : null}
      </Box>

      {showQuote ? (
        <Box sx={{ p: 1.8, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px solid ${T.line}` }}>
          {quote.sale > 0 ? (
            <>
              <Row label="Ürün (alıcı)" value={money(quote.sale)} />
              <Row
                label="Alıcı kargosu"
                value={quote.buyerShipping > 0 ? money(quote.buyerShipping) : 'Ücretsiz'}
                hint={quote.buyerShipping > 0 ? `${money(quote.freeShippingLimit)} altı sipariş` : `${money(quote.freeShippingLimit)} ve üzeri`}
              />
              <Row label="Alıcının ödeyeceği" value={money(quote.charged)} strong />
            </>
          ) : null}
          <Row
            label={`Site komisyonu (%${quote.commissionPercent})`}
            value={quote.sale ? money(quote.commission) : 'fiyata göre'}
            hint={
              quote.sale
                ? (quote.buyerShipping > 0
                  ? `${money(quote.charged)} üzerinden (ürün + kargo)`
                  : `${money(quote.sale)} üzerinden, kargo yok`)
                : 'Satış fiyatı yazınca hesaplanır'
            }
          />
          {quote.base > 0 ? <Row label="Senin maliyetin" value={money(quote.base)} /> : null}
          {quote.breakEven > 0 ? <Row label="Başabaş satış" value={money(quote.breakEven)} strong /> : null}
          {quote.suggested > 0 ? <Row label="Nik Bag önerisi" value={money(quote.suggested)} hint="%25 net kâr payı, yuvarlanmış" /> : null}
          {quote.sale > 0 ? (
            <>
              <Row label="Sana kalan (brüt)" value={money(quote.net)} />
              {quote.base > 0 ? (
                <Row
                  label={quote.belowCost ? 'Zarar' : 'Net kâr'}
                  value={money(quote.profit)}
                  warn={quote.belowCost}
                  hint={`Alıcının ödeyeceğinin %${Math.abs(quote.profitRate)}’i`}
                  strong
                />
              ) : null}
            </>
          ) : null}
          {quote.suggested > 0 ? (
            <Button
              onClick={() => set({ price: quote.suggested })}
              sx={{ ...primaryButton, mt: 1.6, width: { xs: '100%', sm: 'auto' } }}
            >
              Önerilen fiyatı kullan · {money(quote.suggested)}
            </Button>
          ) : null}
        </Box>
      ) : (
        <Typography sx={{ color: T.muted, fontWeight: 700 }}>Satış fiyatı veya maliyeti yaz, hesap dolsun.</Typography>
      )}
    </Box>
  );
}
