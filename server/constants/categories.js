const CATEGORIES = [
  {
    categoryId: 'giyim',
    name: 'Giyim',
    description: 'El emeği kıyafet ve tekstil parçaları',
    order: 1,
    iconName: 'CheckroomOutlined',
    color: '#946D6D',
    bgGradient: 'linear-gradient(135deg, #946D6D 0%, #A290B7 100%)',
    bgRGBA: 'rgba(148, 109, 109, 0.12)'
  },
  {
    categoryId: 'canta',
    name: 'Çanta & Cüzdan',
    description: 'El örgüsü çanta, cüzdan ve saplı tasarımlar',
    order: 2,
    iconName: 'ShoppingBagOutlined',
    color: '#946D6D',
    bgGradient: 'linear-gradient(135deg, #946D6D 0%, #A290B7 100%)',
    bgRGBA: 'rgba(148, 109, 109, 0.12)'
  },
  {
    categoryId: 'banyo-tekstili',
    name: 'Banyo Tekstili',
    description: 'Havlu, peştamal ve banyo tekstili',
    order: 3,
    iconName: 'BathroomOutlined',
    color: '#7A9EBD',
    bgGradient: 'linear-gradient(135deg, #7A9EBD 0%, #B0CDE6 100%)',
    bgRGBA: 'rgba(122, 158, 189, 0.15)'
  },
  {
    categoryId: 'mum',
    name: 'Mumlar & Ev Kokuları',
    description: 'Doğal mumlar ve ev kokuları',
    order: 4,
    iconName: 'LocalFireDepartmentOutlined',
    color: '#81B29A',
    bgGradient: 'linear-gradient(135deg, #81B29A 0%, #B0CDE6 100%)',
    bgRGBA: 'rgba(129, 178, 154, 0.15)'
  },
  {
    categoryId: 'taki',
    name: 'Takı & Bijuteri',
    description: 'El yapımı takı ve bijuteri',
    order: 5,
    iconName: 'DiamondOutlined',
    color: '#E29578',
    bgGradient: 'linear-gradient(135deg, #E29578 0%, #A290B7 100%)',
    bgRGBA: 'rgba(226, 149, 120, 0.15)'
  },
  {
    categoryId: 'ev-dekorasyon',
    name: 'Ev Dekorasyon',
    description: 'Atölyeden ev dekorasyonu parçaları',
    order: 6,
    iconName: 'WeekendOutlined',
    color: '#A290B7',
    bgGradient: 'linear-gradient(135deg, #A290B7 0%, #B0CDE6 100%)',
    bgRGBA: 'rgba(162, 144, 183, 0.14)'
  },
  {
    categoryId: 'bebek-cocuk',
    name: 'Bebek & Çocuk',
    description: 'Bebek ve çocuk için el emeği ürünler',
    order: 7,
    iconName: 'ChildFriendlyOutlined',
    color: '#E29578',
    bgGradient: 'linear-gradient(135deg, #E29578 0%, #FDF4D2 100%)',
    bgRGBA: 'rgba(226, 149, 120, 0.14)'
  },
  {
    categoryId: 'mobilya',
    name: 'Mobilya',
    description: 'Küçük mobilya ve atölye üretimi parçalar',
    order: 8,
    iconName: 'ChairOutlined',
    color: '#6E5252',
    bgGradient: 'linear-gradient(135deg, #6E5252 0%, #DDA15E 100%)',
    bgRGBA: 'rgba(110, 82, 82, 0.12)'
  },
  {
    categoryId: 'hediye-kutulari',
    name: 'Hediye Kutuları',
    description: 'Hazır ve özel hediye kutuları',
    order: 9,
    iconName: 'CardGiftcardOutlined',
    color: '#946D6D',
    bgGradient: 'linear-gradient(135deg, #946D6D 0%, #E29578 100%)',
    bgRGBA: 'rgba(148, 109, 109, 0.12)'
  },
  {
    categoryId: 'kisisellestirilebilir',
    name: 'Kişiselleştirilebilir Ürünler',
    description: 'İsme ve notuna özel üretim',
    order: 10,
    iconName: 'AutoAwesomeOutlined',
    color: '#A290B7',
    bgGradient: 'linear-gradient(135deg, #A290B7 0%, #946D6D 100%)',
    bgRGBA: 'rgba(162, 144, 183, 0.15)'
  },
  {
    categoryId: 'kitap-kirtasiye',
    name: 'Kitap & Kırtasiye',
    description: 'Defter, kitap ve kırtasiye',
    order: 11,
    iconName: 'MenuBookOutlined',
    color: '#2E3B55',
    bgGradient: 'linear-gradient(135deg, #2E3B55 0%, #B0CDE6 100%)',
    bgRGBA: 'rgba(46, 59, 85, 0.08)'
  },
  {
    categoryId: 'seramik',
    name: 'Seramik',
    description: 'El şekillendirmesi özgün formlar',
    order: 12,
    iconName: 'ColorLensOutlined',
    color: '#7A9EBD',
    bgGradient: 'linear-gradient(135deg, #7A9EBD 0%, #B0CDE6 100%)',
    bgRGBA: 'rgba(122, 158, 189, 0.15)'
  },
  {
    categoryId: 'evcil-hayvan',
    name: 'Evcil Hayvan Malzemeleri',
    description: 'Evcil hayvanlar için el yapımı parçalar',
    order: 13,
    iconName: 'PetsOutlined',
    color: '#DDA15E',
    bgGradient: 'linear-gradient(135deg, #DDA15E 0%, #81B29A 100%)',
    bgRGBA: 'rgba(221, 161, 94, 0.15)'
  },
  {
    categoryId: 'ahsap',
    name: 'Ahşap Ürünler',
    description: 'Doğal ahşap işçilik',
    order: 14,
    iconName: 'ForestOutlined',
    color: '#DDA15E',
    bgGradient: 'linear-gradient(135deg, #DDA15E 0%, #946D6D 100%)',
    bgRGBA: 'rgba(221, 161, 94, 0.15)'
  },
  {
    categoryId: 'parti-malzemeleri',
    name: 'Parti Malzemeleri',
    description: 'Kutlama ve parti süslemeleri',
    order: 15,
    iconName: 'CelebrationOutlined',
    color: '#E29578',
    bgGradient: 'linear-gradient(135deg, #E29578 0%, #A290B7 100%)',
    bgRGBA: 'rgba(226, 149, 120, 0.15)'
  },
  {
    categoryId: 'kozmetik',
    name: 'Kozmetik',
    description: 'Doğal ve el yapımı bakım ürünleri',
    order: 16,
    iconName: 'SpaOutlined',
    color: '#81B29A',
    bgGradient: 'linear-gradient(135deg, #81B29A 0%, #A290B7 100%)',
    bgRGBA: 'rgba(129, 178, 154, 0.15)'
  },
  {
    categoryId: 'epoksi',
    name: 'Epoksi Ürünler',
    description: 'Epoksi tablo, takı ve objeler',
    order: 17,
    iconName: 'WaterDropOutlined',
    color: '#7A9EBD',
    bgGradient: 'linear-gradient(135deg, #7A9EBD 0%, #2E3B55 100%)',
    bgRGBA: 'rgba(122, 158, 189, 0.15)'
  },
  {
    categoryId: 'hobi-malzemeleri',
    name: 'Hobi Malzemeleri',
    description: 'El işi ve hobi malzemeleri',
    order: 18,
    iconName: 'ExtensionOutlined',
    color: '#A290B7',
    bgGradient: 'linear-gradient(135deg, #A290B7 0%, #B0CDE6 100%)',
    bgRGBA: 'rgba(162, 144, 183, 0.14)'
  },
  {
    categoryId: 'mutfak-esyalari',
    name: 'Mutfak Eşyaları',
    description: 'El yapımı mutfak ve sofra parçaları',
    order: 19,
    iconName: 'KitchenOutlined',
    color: '#946D6D',
    bgGradient: 'linear-gradient(135deg, #946D6D 0%, #DDA15E 100%)',
    bgRGBA: 'rgba(148, 109, 109, 0.12)'
  }
];

const LEGACY_CATEGORY_IDS = ['makrome', 'deri', 'aksesuar', 'diger'];
const CATEGORY_IDS = CATEGORIES.map((item) => item.categoryId);
const ALL_CATEGORY_IDS = [...new Set([...CATEGORY_IDS, ...LEGACY_CATEGORY_IDS])];

const CATEGORY_LABELS = Object.fromEntries([
  ...CATEGORIES.map((item) => [item.categoryId, item.name]),
  ['makrome', 'Makrome'],
  ['deri', 'Deri'],
  ['aksesuar', 'Aksesuar'],
  ['diger', 'Diğer']
]);

module.exports = {
  CATEGORIES,
  CATEGORY_IDS,
  ALL_CATEGORY_IDS,
  LEGACY_CATEGORY_IDS,
  CATEGORY_LABELS
};
