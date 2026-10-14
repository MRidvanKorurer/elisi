/**
 * Mevcut içerik için elle hazırlanmış İngilizce metinler (translateContent.js kullanır).
 * Özellik, bakım, ölçü notu ve renkler i18n/contentGlossary.js'ten gelir.
 */

const scrubber = (lead, tones, shape = 'round') =>
  `${lead ? `${lead} ` : ''}A ${shape} bath scrubber hand-knitted at Nik Bag Atelier; its ${tones} tones add color to your bathroom. Ideal for gentle exfoliation and a rich lather.`;

const products = {
  '6aaa96bbe21d18f3ce2e24d0': {
    title: 'Sage Green Knitted Bag with Bamboo Handles',
    description: 'A sage green mesh bag hand-knitted at Nik Bag Atelier. Its natural bamboo ring handles and soft round base bring a fresh touch to summer outfits.'
  },
  '6aaa96c1e21d18f3ce2e24d1': {
    title: 'Brick Red Macramé Bag with Bamboo Handles',
    description: 'A hand-knitted macramé bag in warm brick tones. With double bamboo ring handles and a breathable mesh texture, it suits both everyday and holiday outfits.'
  },
  '6aaa96c6e21d18f3ce2e24d2': {
    title: 'Rust Hand-Knitted Clutch with Frame Clasp',
    description: 'A hand-knitted clutch in a deep rust tone. With a framed top closure and an openwork knit surface, it is a simple yet striking evening accessory.'
  },
  '6aaa96cbe21d18f3ce2e24d3': {
    title: 'Mink Knitted Shoulder Bag — Leather Strap',
    description: 'A hand-knitted shoulder bag in mink. Cream leather straps, silver-tone rings and a tightly knit base make it right for both everyday and city use.'
  },
  '6aaa96d1e21d18f3ce2e24d4': {
    title: 'Tan Mesh Shoulder Bag',
    description: 'A hand-knitted mesh shoulder bag in tan. Roomy and lightweight, it is a practical piece for market runs, the beach and day trips.'
  },
  '6aaa96d7e21d18f3ce2e24d5': {
    title: 'Orange Mesh Handbag — Single Bamboo Handle',
    description: 'A vivid orange mesh-knit handbag. A single arched bamboo handle and brass-tone metal rings give it a modern bohemian silhouette.'
  },
  '6aaa96dde21d18f3ce2e24d6': {
    title: 'Sand Beige Straw-Look Shoulder Bag',
    description: 'A hand-knitted shoulder bag in sand beige with a straw look. Its wide rectangular shape and soft straps make it a staple of summer outfits.'
  },
  '6aaa96e1e21d18f3ce2e24d7': {
    title: 'Colorful Round Bath Scrubber with Bobble Pattern',
    description: scrubber('Colorful round bath scrubber with a bobble pattern.', 'cream, yellow, turquoise, purple and green')
  },
  '6aaa96e4e21d18f3ce2e24d8': {
    title: 'Hand-Knitted Bath Scrubber with Blue Flower Motif',
    description: scrubber('Hand-knitted bath scrubber with a pink flower motif.', 'pink, white and mint')
  },
  '6aaa96e9e21d18f3ce2e24d9': {
    title: 'Red Geometric Pattern Bath Scrubber',
    description: scrubber('Red geometric pattern bath scrubber.', 'navy and ecru')
  },
  '6aaa96ede21d18f3ce2e24da': {
    title: 'Round Bath Scrubber with Orange Sun Motif',
    description: scrubber('Round bath scrubber with an orange sun motif.', 'orange, yellow and cream')
  },
  '6aaa96f1e21d18f3ce2e24db': {
    title: 'Strawberry Pattern Bath Scrubber',
    description: scrubber('Strawberry pattern bath scrubber.', 'purple, lilac and white')
  },
  '6aaa96f5e21d18f3ce2e24dc': {
    title: 'Hand-Knitted Bath Scrubber with Snowflake Motif',
    description: scrubber('Hand-knitted bath scrubber with a snowflake motif.', 'green, olive and cream')
  },
  '6aaa96f9e21d18f3ce2e24dd': {
    title: 'Green and White Flower Bath Scrubber',
    description: scrubber('', 'red and white')
  },
  '6aaa96fde21d18f3ce2e24de': {
    title: 'Green Wave Pattern Bath Scrubber',
    description: scrubber('Blue wave pattern bath scrubber.', 'blue, white and grey')
  },
  '6aaa9701e21d18f3ce2e24df': {
    title: 'Hand-Knitted Bath Scrubber with Modern Motif',
    description: scrubber('Modern hand-knitted bath scrubber.', 'yellow, orange and ecru')
  },
  '6aaa9705e21d18f3ce2e24e0': {
    title: 'Fuchsia Shell-Stitch Round Bath Scrubber',
    description: scrubber('Fuchsia shell-stitch round bath scrubber.', 'fuchsia, pink and cream')
  },
  '6aaa9708e21d18f3ce2e24e1': {
    title: 'Classic Knit Bath Scrubber in Beige',
    description: scrubber('Classic knit bath scrubber in beige.', 'beige and brown')
  },
  '6aaa970ce21d18f3ce2e24e2': {
    title: 'Floral Bath Scrubber',
    description: scrubber('Turquoise dotted bath scrubber.', 'turquoise and navy', 'square')
  },
  '6aaa970fe21d18f3ce2e24e3': {
    title: 'Round Bath Scrubber with Lavender Flowers',
    description: scrubber('Round bath scrubber with lavender flowers.', 'lavender, purple and white')
  },
  '6aaa9713e21d18f3ce2e24e4': {
    title: 'Coral Bobble Bath Scrubber',
    description: scrubber('Coral bobble bath scrubber.', 'coral and cream')
  },
  '6aaa9717e21d18f3ce2e24e5': {
    title: 'Hand-Knitted Bath Scrubber in Emerald Ombré',
    description: scrubber('Hand-knitted bath scrubber in emerald ombré.', 'emerald and cream')
  },
  '6aaa971ae21d18f3ce2e24e6': {
    title: 'Soft Salmon Bath Scrubber',
    description: scrubber('Soft salmon bath scrubber.', 'salmon and white')
  },
  '6aaa971ee21d18f3ce2e24e7': {
    title: 'Classic Bath Scrubber in Pink Tones',
    description: scrubber('Classic bath scrubber in mustard tones.', 'mustard and brown')
  },
  '6aaa9722e21d18f3ce2e24e8': {
    title: 'Round Bath Scrubber with Dusty Rose Flowers',
    description: scrubber('Round bath scrubber with dusty rose flowers.', 'dusty rose and ecru')
  },
  '6aaa9726e21d18f3ce2e24e9': {
    title: 'Petrol Blue Geometric Bath Scrubber',
    description: scrubber('Petrol blue geometric bath scrubber.', 'petrol blue and white')
  },
  '6aaa972ae21d18f3ce2e24ea': {
    title: 'Heart Pattern Bath Scrubber',
    description: scrubber('Lemon yellow dotted bath scrubber.', 'lemon and green')
  },
  '6aaa972de21d18f3ce2e24eb': {
    title: 'Hand-Knitted Bath Scrubber with Burgundy Edging',
    description: scrubber('Hand-knitted bath scrubber with burgundy edging.', 'burgundy and cream')
  },
  '6aaa9731e21d18f3ce2e24ec': {
    title: 'Flower Garden Bobble Bath Scrubber',
    description: scrubber('Sky blue bobble bath scrubber.', 'sky blue and white')
  },
  '6aaa9734e21d18f3ce2e24ed': {
    title: 'Soft Smiley Face Bath Scrubber',
    description: scrubber('Soft peach bath scrubber.', 'peach and pink')
  },
  '6aaa9738e21d18f3ce2e24ee': {
    title: 'Anthracite Bath Scrubber with Modern Pattern',
    description: scrubber('Anthracite bath scrubber with a modern pattern.', 'anthracite and grey')
  },
  '6aaa973de21d18f3ce2e24ef': {
    title: 'Round Bath Scrubber with Pomegranate Red Motif',
    description: scrubber('Round bath scrubber with a pomegranate red motif.', 'pomegranate red and orange')
  },
  '6aaa9743e21d18f3ce2e24f0': {
    title: 'Lilac Daisy Bath Scrubber',
    description: scrubber('Grass green leaf bath scrubber.', 'grass green and cream')
  },
  '6aaa9747e21d18f3ce2e24f1': {
    title: 'Indigo Striped Bath Scrubber',
    description: scrubber('Indigo striped bath scrubber.', 'indigo and white')
  },
  '6aaa974de21d18f3ce2e24f2': {
    title: 'Minimal Bath Scrubber in Mink Tones',
    description: scrubber('Minimal bath scrubber in mink tones.', 'mink and beige')
  },
  '6aaa9752e21d18f3ce2e24f3': {
    title: 'Pastel Tricolor Round Bath Scrubber',
    description: scrubber('Pastel tricolor round bath scrubber.', 'light blue, pink and cream')
  },
  '6aaa9757e21d18f3ce2e24f4': {
    title: 'Rainbow Bobble Pattern Bath Scrubber',
    description: scrubber('Rainbow bobble pattern bath scrubber.', 'multicolor and cream')
  },
  '6aaa975be21d18f3ce2e24f5': {
    title: 'Granny Square Blanket — Peach Edging',
    description: 'A hand-knitted single blanket made of colorful granny squares. Its peach shell-stitch edging and soft texture make it lovely to use every day.'
  },
  '6aaa9760e21d18f3ce2e24f6': {
    title: 'Colorful Granny Square Blanket — Brown Edging',
    description: 'A vividly colored granny square blanket. Brown joining yarn and shell-stitch edging make it a natural fit for modern nursery décor.'
  },
  '6aaa9765e21d18f3ce2e24f7': {
    title: 'Geometric Block Baby Blanket',
    description: 'A modern hand-knitted baby blanket with orange, mustard, green and blue blocks on a cream base, finished with shell-stitch edging.'
  },
  '6aaa976be21d18f3ce2e24f8': {
    title: 'Striped Baby Vest and Booties Set — Pink / Olive',
    description: 'A hand-knitted baby set striped in pink, cream and olive green. It includes a short-sleeved open vest and booties with flower details on the sides; its soft texture is gentle on baby skin.'
  },
  '6aaa976fe21d18f3ce2e24f9': {
    title: 'Pink Vest — Shell Edging and Pom-Pom Tie',
    description: 'A hand-knitted vest in pastel pink. Shell-stitch edging on the collar and armholes and a pom-pom tie at the front make it a chic and practical layering piece.'
  },
  '6aab0ce07d1a12dc96848891': {
    title: 'Test',
    description: 'Test'
  },
  '6abbe7b3dc168860c5b96460': {
    title: 'Nerina Coral Red Knitted Bag',
    description: 'Carefully handcrafted, the Nerina Knitted Bag brings color to your everyday style with its vivid coral red and distinctive knit texture. Roomy and practical, it easily carries your daily essentials, while its simple design pairs effortlessly with different outfits.\r\n\r\nThe handwork on the knitted surface gives the bag a natural, original look, and its long handles let you carry it comfortably on the shoulder. Wear it all summer long, from everyday errands and beach outfits to city strolls and weekend meetups.'
  },
  '6abbe924dc168860c5b96465': {
    title: 'Vera Red Strap Bag',
    description: 'Thanks to its roomy shape, this model easily carries your daily essentials and pairs effortlessly with both city style and summer outfits.\r\n\r\nOne of its most striking details is its long, wide straps that complement the knitted body. The soft, leather-look straps sit comfortably on the shoulder and give the bag a more modern, chic look. Secured with sturdy stitching, the straps make the design both beautiful and functional.\r\n\r\nThe open-textured pattern on the knitted surface gives the bag a natural, airy look and puts the handcraft front and center.'
  },
  '6abbea1edc168860c5b96466': {
    title: 'Mirella Knitted Bag - Leather Handles',
    description: 'Handcrafted Mirella is a special design that pairs a burgundy knit texture with classic, elegant details.\r\n\r\nIts most distinctive detail is its rounded, brown leather-look handles.\r\n\r\nThe characteristic texture and handwork of its knitted body make every Mirella a one-of-a-kind piece.'
  },
  '6abbeb21dc168860c5b96467': {
    title: 'Vera Red Strap Bag - Vera Mini Wallet Set',
    description: 'Handcrafted, the Vera Red Strap Bag and the Vera Mini Wallet share the same coral red color and knit texture, forming a perfectly matched set.\r\n\r\nThe roomy, practical bag rests comfortably on the shoulder thanks to its long straps, while the compact mini wallet keeps your small everyday items organized and close at hand.'
  },
  '6abbec4fdc168860c5b96468': {
    title: 'Mocha Knitted Bag with Leather Handles',
    description: 'With its confident structure, the Mocha Knitted Bag with Leather Handles adds natural elegance to your style. Its carefully knitted texture, warm mocha tone and long leather handles go with both your everyday outfits and your dressier looks.\r\n\r\nIts roomy shape easily carries everything you need through the day, and its original texture, a reflection of true handcraft, gives it a character all its own every time you use it.'
  },
  '6abbed0edc168860c5b96469': {
    title: 'Noir Black Bag with Knitted Handles',
    description: 'The Noir Black Bag with Knitted Handles offers a strong, modern look with its black color and an original knit texture that reflects its handcraft.\r\n\r\nKnitted handles that flow from the body give the design character, while its roomy shape offers the space you need every day. With a minimal look that suits any style, Noir is an essential companion for anyone who loves understated elegance.'
  },
  '6abbed9ddc168860c5b9646a': {
    title: 'Noir Black Bag with Knitted Handles - Noir Mini Set',
    description: 'Hand-knitted, the Noir bag and its companion Noir Mini offer a timeless, chic look in a bold black tone. With its original knit texture, long handles and practical design, the bag fits easily into your everyday style, while Noir Mini keeps your essentials organized as a handy companion.'
  },
  '6abbee38dc168860c5b9646b': {
    title: 'Sand Beige Straw-Look Shoulder Bag - Sand Beige Mini Set',
    description: 'Pairing a soft sand beige tone with a handcrafted knit texture, the Sand Beige Straw-Look Shoulder Bag adds a natural, elegant touch to your everyday style. Its long handles make it comfortable to carry, and it matches perfectly with the Sand Beige Mini wallet of the same design.'
  },
  '6abbef0adc168860c5b9646d': {
    title: 'Mocha Square-Neck Knit Sweater',
    description: 'Pairing a brown tone with a knit texture, the Mocha Square-Neck Knit Sweater offers a simple yet eye-catching look.\r\n\r\nWith its square neckline, vertical knit pattern and relaxed fit, it adds a warm, chic touch to everyday outfits. Thanks to its soft knit texture, it is set to become one of the essentials of your autumn and winter style.'
  },
  '6abe009f8aea97f05eb5e3fd': {
    title: 'Mila & Co Deep Black Handmade Bag',
    description: 'The timeless nobility of black meets the unique grace of handcraft in this special design. Its carefully worked geometric (diamond) pattern gives the bag a modern, sophisticated dimension and takes its sense of luxury to the next level. Enriched with a shimmering gold-tone chain strap and a chic metal clasp, this model is set to become the standout piece of both your evening looks at special events and your everyday outfits. With a firm structure that holds its shape perfectly and details that carry the warmth of handcraft, this bag will become an indispensable classic in your wardrobe.'
  },
  '6abe018e8aea97f05eb5e3fe': {
    title: 'Mila & Mocha Light Brown Handmade Bag',
    description: 'The soothing warmth of earth tones meets the dynamic rhythm of herringbone handcraft in this special design. The mink-toned body, combined with the textured knit pattern on its surface, offers timeless elegance. Given a modern touch by its shimmering silver-tone chain strap and glossy clasp, this model is set to become the key piece of your outfit for daytime chic and evening events alike. Add versatile luxury to your wardrobe with its firm, shape-holding structure and the unmatched quality of handcraft.'
  }
};

const categories = {
  seramik: 'Original hand-shaped forms',
  makrome: 'Warm weaves and bohemian details',
  ahsap: 'Natural woodcraft',
  taki: 'Handmade jewelry and costume jewelry',
  mum: 'Natural candles and home scents',
  canta: 'Hand-knitted bags, wallets and handled designs',
  aksesuar: 'Handcrafted finishing touches',
  deri: 'Craftsmanship with natural leather details',
  diger: 'Special pieces from our ateliers',
  giyim: 'Handcrafted clothing and textile pieces',
  'banyo-tekstili': 'Towels, peshtemals and bath textiles',
  'ev-dekorasyon': 'Home décor pieces from our ateliers',
  'bebek-cocuk': 'Handcrafted pieces for babies and kids',
  mobilya: 'Small furniture and atelier-made pieces',
  'hediye-kutulari': 'Ready-made and custom gift boxes',
  kisisellestirilebilir: 'Made for your name and your note',
  'kitap-kirtasiye': 'Notebooks, books and stationery',
  'evcil-hayvan': 'Handmade pieces for pets',
  'parti-malzemeleri': 'Celebration and party decorations',
  kozmetik: 'Natural and handmade care products',
  epoksi: 'Epoxy art, jewelry and objects',
  'hobi-malzemeleri': 'Handicraft and hobby supplies',
  'mutfak-esyalari': 'Handmade kitchen and tableware'
};

const sellers = {
  '6aaa96b5e21d18f3ce2e24cf': 'A home atelier where traditional handcraft meets modern lines. Bags, bath scrubbers, baby knits and blankets are made in limited numbers.',
  '6ab2948258630bea7d874563': 'All about concrete :))))',
  '6ab97662281860744a8c21c4': 'Everything for the Bride Atelier\n\nFounded to end the chaos and lost time brides face while getting ready, our atelier brings wedding dresses, veils, bridal bouquets, hair accessories and custom design details together under one roof.\n\nOur goal is to offer all the elegance you need as you prepare for your most special day, with high quality and warm, sincere service, turning the process into an effortless and unforgettable experience.',
  '6abd47f1f2543f94435a1410': 'From the Soil to the Counter: Gaziantep\'s Handcraft on Nikbag\n\nIn the ancient streets of Gaziantep, in this special atelier where needle meets thread with patience and love, every bag tells a story of its own. Blending a centuries-old craft heritage with modern design, these master hands make bags far from mass production: entirely by hand, with painstaking care.\n\nNow the unique texture and artisan spirit of Gaziantep reach those who carry their own style and story, through the Nikbag platform. Because some bags are not just carried; they whisper to their owner the warmth of a culture and the purest form of craftsmanship.',
  '6ac290a214783165bc0a2acf': 'Ali started making handmade products in Istanbul in 2016...'
};

module.exports = { products, categories, sellers };
