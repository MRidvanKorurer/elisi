/** Ana sayfa başlıkları tek tip: Plus Jakarta, lacivert başlık, lavanta üst yazı. */
export const homeFont = '"Plus Jakarta Sans", sans-serif';

/** Ana sayfa bölümleri arası tek boşluk: her bölüm yalnızca alt boşluk taşır. */
export const homeSectionGap = { xs: 6, md: 8 };
export const homeSectionSx = { mt: 0, mb: homeSectionGap, px: { xs: 2, sm: 3 } };

export const homeEyebrowSx = {
  fontFamily: homeFont,
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.14em',
  lineHeight: 1.4,
  textTransform: 'uppercase',
  color: '#A290B7',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.6
};

export const homeTitleSx = {
  fontFamily: homeFont,
  color: '#2E3B55',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  lineHeight: 1.15,
  mt: 0.6,
  fontSize: { xs: '1.45rem', sm: '1.7rem', md: '1.9rem' }
};

export const homeSubtitleSx = {
  fontFamily: homeFont,
  color: '#6E5252',
  fontWeight: 600,
  fontSize: '0.95rem',
  lineHeight: 1.6,
  mt: 0.8
};
