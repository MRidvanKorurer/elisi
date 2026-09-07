export const CATEGORY_LABELS = {
  giyim: 'Giyim',
  canta: 'Çanta & Cüzdan',
  'banyo-tekstili': 'Banyo Tekstili',
  mum: 'Mumlar & Ev Kokuları',
  taki: 'Takı & Bijuteri',
  'ev-dekorasyon': 'Ev Dekorasyon',
  'bebek-cocuk': 'Bebek & Çocuk',
  mobilya: 'Mobilya',
  'hediye-kutulari': 'Hediye Kutuları',
  kisisellestirilebilir: 'Kişiselleştirilebilir Ürünler',
  'kitap-kirtasiye': 'Kitap & Kırtasiye',
  seramik: 'Seramik',
  'evcil-hayvan': 'Evcil Hayvan Malzemeleri',
  ahsap: 'Ahşap Ürünler',
  'parti-malzemeleri': 'Parti Malzemeleri',
  kozmetik: 'Kozmetik',
  epoksi: 'Epoksi Ürünler',
  'hobi-malzemeleri': 'Hobi Malzemeleri',
  'mutfak-esyalari': 'Mutfak Eşyaları',
  makrome: 'Makrome',
  deri: 'Deri',
  aksesuar: 'Aksesuar',
  diger: 'Diğer'
};

export const CATEGORY_ORDER = [
  'giyim',
  'canta',
  'banyo-tekstili',
  'mum',
  'taki',
  'ev-dekorasyon',
  'bebek-cocuk',
  'mobilya',
  'hediye-kutulari',
  'kisisellestirilebilir',
  'kitap-kirtasiye',
  'seramik',
  'evcil-hayvan',
  'ahsap',
  'parti-malzemeleri',
  'kozmetik',
  'epoksi',
  'hobi-malzemeleri',
  'mutfak-esyalari'
];

export const CATEGORY_OPTIONS = CATEGORY_ORDER.map((value) => ({
  value,
  label: CATEGORY_LABELS[value]
}));

export const CATEGORY_ICON_NAMES = {
  giyim: 'CheckroomOutlined',
  canta: 'ShoppingBagOutlined',
  'banyo-tekstili': 'BathroomOutlined',
  mum: 'LocalFireDepartmentOutlined',
  taki: 'DiamondOutlined',
  'ev-dekorasyon': 'WeekendOutlined',
  'bebek-cocuk': 'ChildFriendlyOutlined',
  mobilya: 'ChairOutlined',
  'hediye-kutulari': 'CardGiftcardOutlined',
  kisisellestirilebilir: 'AutoAwesomeOutlined',
  'kitap-kirtasiye': 'MenuBookOutlined',
  seramik: 'ColorLensOutlined',
  'evcil-hayvan': 'PetsOutlined',
  ahsap: 'ForestOutlined',
  'parti-malzemeleri': 'CelebrationOutlined',
  kozmetik: 'SpaOutlined',
  epoksi: 'WaterDropOutlined',
  'hobi-malzemeleri': 'ExtensionOutlined',
  'mutfak-esyalari': 'KitchenOutlined',
  makrome: 'FilterVintageOutlined',
  deri: 'WorkOutlineOutlined',
  aksesuar: 'AutoAwesomeOutlined',
  diger: 'CategoryOutlined'
};

export const categoryLabel = (value) =>
  CATEGORY_LABELS[String(value || '').toLowerCase()] || value || 'Diğer';

export const mergeCatalogCategories = (values = []) => {
  const extras = values
    .map((value) => String(value || '').toLowerCase())
    .filter((value) => value && !CATEGORY_ORDER.includes(value));
  return [...CATEGORY_ORDER, ...extras];
};

export const sortCategories = (values = []) =>
  [...values].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(String(a).toLowerCase());
    const bi = CATEGORY_ORDER.indexOf(String(b).toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

export const normalize = (value = '') =>
  String(value)
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .trim();
