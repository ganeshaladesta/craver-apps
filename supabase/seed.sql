-- CRAVER Realistic Jakarta Restaurant & Food Discovery Seed Data
-- Run after applying 001_schema.sql, 002_rls_policies.sql, and 003_storage.sql

insert into public.restaurants (
  id, slug, name, tagline, description, primary_cuisine, cuisines, district, city,
  address, latitude, longitude, phone, website, email, opening_hours,
  average_price_idr, price_range, cover_image_url,
  is_verified, is_featured, is_trending, rating_avg, reviews_count, status, approved_at
) values
(
  '11111111-1111-4111-8111-111111111101',
  'sera-nusa-senopati',
  'Sera & Nusa Dining',
  'Contemporary Indonesian hearth kitchen celebrating archipelago spices',
  'Tucked inside a sunlit teak-and-limestone pavilion in Senopati, Sera & Nusa elevates regional Indonesian classics over coconut-shell embers—famous for smoked duck nasi goreng, slow-braised rendang, and seasonal sambal tastings.',
  'Indonesian',
  array['Indonesian', 'Coffee & Tea'],
  'Senopati',
  'Jakarta',
  'Jl. Gunawarman No. 42, Kebayoran Baru, Jakarta Selatan',
  -6.2351, 106.8095,
  '+62 21 5290 4410',
  'https://craver.id/restaurants/sera-nusa-senopati',
  'hello@seranusa.id',
  '{"mon_fri":"11:00 - 22:30","sat_sun":"10:00 - 23:00","notes":"Weekend reservations recommended"}'::jsonb,
  245000, '$$$', '/images/rest-indonesian-senopati.jpg',
  true, true, true, 4.85, 342, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111102',
  'kuroshio-ramen-scbd',
  'Kuroshio Hinoki Counter',
  '48-hour wagyu bone broth ramen & crispy katsu bar',
  'An intimate 22-seat hinoki wood counter in SCBD serving small-batch Tokyo-style beef ramen, crisp panko chicken katsu, and charcoal-kissed skewers late into the evening.',
  'Japanese',
  array['Japanese'],
  'SCBD',
  'Jakarta',
  'SCBD Park Lot 8, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
  -6.2248, 106.8089,
  '+62 21 5140 8821',
  'https://craver.id/restaurants/kuroshio-ramen-scbd',
  'counter@kuroshio.id',
  '{"mon_fri":"11:30 - 22:00","sat_sun":"11:30 - 23:30","notes":"Last ramen order 30 mins before close"}'::jsonb,
  185000, '$$', '/images/rest-japanese-scbd.jpg',
  true, true, true, 4.80, 518, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111103',
  'osteria-sorella-menteng',
  'Osteria Sorella',
  'Hand-rolled Roman pastas & wood-fired Neapolitan pies',
  'Bright heritage townhouse trattoria in Menteng specializing in guanciale pasta carbonara, 72-hour sourdough pizzas, and burrata flights paired with espresso and tiramisu.',
  'Italian',
  array['Italian', 'Western', 'Dessert'],
  'Menteng',
  'Jakarta',
  'Jl. Teuku Umar No. 19, Menteng, Jakarta Pusat',
  -6.1932, 106.8355,
  '+62 21 3192 6712',
  'https://craver.id/restaurants/osteria-sorella-menteng',
  'ciao@sorella.id',
  '{"mon_fri":"11:30 - 22:00","sat_sun":"11:00 - 22:30","notes":"Fresh pasta batch rolled twice daily"}'::jsonb,
  230000, '$$$', '/images/rest-italian-trattoria.jpg',
  true, true, true, 4.75, 289, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111104',
  'seoul-ember-senopati',
  'Hanwoori Charcoal Grill',
  'Tabletop oak-charcoal Korean BBQ & house-aged kimchi',
  'Authentic Korean dining room featuring dry-aged wagyu galbi, twelve daily banchan plates, bubbling doenjang jjigae, and sommelier-curated soju pairings.',
  'Korean',
  array['Korean'],
  'Senopati',
  'Jakarta',
  'Jl. Suryo No. 31, Kebayoran Baru, Jakarta Selatan',
  -6.2389, 106.8141,
  '+62 21 7220 9934',
  'https://craver.id/restaurants/seoul-ember-senopati',
  'grill@hanwoori.id',
  '{"mon_fri":"12:00 - 22:30","sat_sun":"11:30 - 23:00"}'::jsonb,
  295000, '$$$', '/images/rest-korean-bbq.jpg',
  true, false, true, 4.72, 410, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111105',
  'kurasu-kemang-roastery',
  'Kala & Leaf Roastery',
  'Ceremonial Uji matcha, single-origin Indonesian pour-overs & Basque tarts',
  'Sun-drenched minimalist cafe and micro-roastery in Kemang known for emerald iced matcha lattes, Toraja filter coffee, and caramelized molten-center Basque burnt cheesecake.',
  'Coffee & Tea',
  array['Coffee & Tea', 'Dessert'],
  'Kemang',
  'Jakarta',
  'Jl. Kemang Raya No. 78A, Mampang Prapatan, Jakarta Selatan',
  -6.2642, 106.8148,
  '+62 21 7190 3305',
  'https://craver.id/restaurants/kurasu-kemang-roastery',
  'brew@kalaleaf.id',
  '{"mon_fri":"07:30 - 21:00","sat_sun":"07:30 - 22:00","notes":"Morning pastry bake drops at 08:00"}'::jsonb,
  95000, '$', '/images/rest-coffee-roastery.jpg',
  true, true, true, 4.88, 624, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111106',
  'jade-lantern-pik',
  'Jade Lantern Tea House',
  'Hand-pleated Cantonese dim sum & Peking roast duck',
  'Bustling coastal tea house in Pantai Indah Kapuk serving steaming bamboo baskets of crystal har gow, xiao long bao soup dumplings, and roasted duck from morning till supper.',
  'Chinese',
  array['Chinese'],
  'PIK',
  'Jakarta',
  'Golf Island Ruko Beach View Blok B No. 12, PIK, Jakarta Utara',
  -6.0975, 106.7408,
  '+62 21 5088 1230',
  'https://craver.id/restaurants/jade-lantern-pik',
  'reservations@jadelantern.id',
  '{"mon_fri":"08:30 - 22:00","sat_sun":"08:00 - 22:30"}'::jsonb,
  175000, '$$', '/images/rest-chinese-dimsum.jpg',
  true, false, true, 4.65, 376, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111107',
  'bistro-meridian-kuningan',
  'Bistro Meridian',
  'Dry-aged wood-fired steaks & classic European bistro plates',
  'Warm brass-and-oak neighborhood steakhouse in Kuningan focused on 28-day dry-aged ribeye, herb compound butter, pommes puree, and artisanal desserts.',
  'Western',
  array['Western', 'Dessert'],
  'Kuningan',
  'Jakarta',
  'Jl. Prof. Dr. Satrio Kav. 18, Kuningan, Jakarta Selatan',
  -6.2244, 106.8266,
  '+62 21 5790 6118',
  'https://craver.id/restaurants/bistro-meridian-kuningan',
  'tables@meridian.id',
  '{"mon_fri":"11:30 - 22:30","sat_sun":"11:30 - 23:00"}'::jsonb,
  360000, '$$$$', '/images/rest-western-steak.jpg',
  true, false, false, 4.62, 198, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111108',
  'stack-alley-blokm',
  'Stack Alley Smash & Fries',
  'Crisp-edged wagyu smash burgers & hand-cut twice-fried potatoes',
  'Vibrant Blok M burger joint serving caramelized-onion double smash patties on house milk buns, spicy honey chicken sandos, and cold craft sodas.',
  'Fast Food',
  array['Fast Food', 'Western'],
  'Blok M',
  'Jakarta',
  'Jl. Melawai Raya No. 16, Kebayoran Baru, Jakarta Selatan',
  -6.2446, 106.7989,
  '+62 21 7244 5511',
  'https://craver.id/restaurants/stack-alley-blokm',
  'yo@stackalley.id',
  '{"mon_fri":"11:00 - 23:00","sat_sun":"11:00 - 00:00"}'::jsonb,
  85000, '$', '/images/dish-gourmet-burger.jpg',
  true, false, true, 4.70, 445, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111109',
  'warung-rempah-menteng',
  'Dapur Rempah Menteng',
  'Heirloom Nasi Goreng Kampung, satay maranggi & Javanese classics',
  'Beloved Menteng dining veranda celebrating heritage Indonesian comfort dishes cooked to order in seasoned woks with farm eggs, heirloom kecap, and charcoal-grilled skewers.',
  'Indonesian',
  array['Indonesian'],
  'Menteng',
  'Jakarta',
  'Jl. HOS. Cokroaminoto No. 64, Menteng, Jakarta Pusat',
  -6.1970, 106.8288,
  '+62 21 3910 2180',
  'https://craver.id/restaurants/warung-rempah-menteng',
  'kitchen@dapurrempah.id',
  '{"mon_fri":"10:00 - 22:00","sat_sun":"09:30 - 22:30"}'::jsonb,
  110000, '$', '/images/dish-nasi-goreng.jpg',
  true, false, true, 4.78, 502, 'approved', now()
),
(
  '11111111-1111-4111-8111-111111111110',
  'mille-patisserie-pik',
  'Atelier Mille',
  'Burnt Basque cheesecakes, matcha tarts & Kyoto tea flights',
  'Boutique patisserie and dessert salon in PIK crafting small-batch Basque burnt cheesecakes, roasted hojicha mille-crepes, and iced ceremonial matcha.',
  'Dessert',
  array['Dessert', 'Coffee & Tea'],
  'PIK',
  'Jakarta',
  'By The Sea PIK Unit 22, Jl. Pantai Indah Kapuk, Jakarta Utara',
  -6.0921, 106.7419,
  '+62 21 5099 7420',
  'https://craver.id/restaurants/mille-patisserie-pik',
  'bonjour@ateliermille.id',
  '{"mon_fri":"10:00 - 22:00","sat_sun":"10:00 - 22:30"}'::jsonb,
  125000, '$$', '/images/dish-cheesecake.jpg',
  true, false, false, 4.82, 267, 'approved', now()
)
on conflict (id) do nothing;

-- ============================================================================
-- MENU CATEGORIES
-- ============================================================================
insert into public.menu_categories (id, restaurant_id, name, description, sort_order, status) values
-- Sera & Nusa
('22222222-2222-4222-8222-222222222101', '11111111-1111-4111-8111-111111111101', 'Best Sellers', 'Signature archipelago dishes most loved by guests', 1, 'approved'),
('22222222-2222-4222-8222-222222222102', '11111111-1111-4111-8111-111111111101', 'Main Course', 'Hearth-cooked heritage mains and rice platters', 2, 'approved'),
('22222222-2222-4222-8222-222222222103', '11111111-1111-4111-8111-111111111101', 'Appetizers', 'Small plates and sambal starters', 3, 'approved'),
('22222222-2222-4222-8222-222222222104', '11111111-1111-4111-8111-111111111101', 'Beverages', 'Artisanal infusions and single-origin coffee', 4, 'approved'),
('22222222-2222-4222-8222-222222222105', '11111111-1111-4111-8111-111111111101', 'Desserts', 'Indonesian sweets plated modern', 5, 'approved'),

-- Kuroshio Hinoki Counter
('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111102', 'Best Sellers', 'House specialty ramen bowls & katsu plates', 1, 'approved'),
('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102', 'Main Course', 'Signature noodle bowls and donburi', 2, 'approved'),
('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111102', 'Snacks', 'Crispy izakaya small bites', 3, 'approved'),
('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111102', 'Beverages', 'Matcha, hojicha, and yuzu refreshers', 4, 'approved'),

-- Osteria Sorella
('22222222-2222-4222-8222-222222222301', '11111111-1111-4111-8111-111111111103', 'Best Sellers', 'Most requested Roman pastas and wood-fired pies', 1, 'approved'),
('22222222-2222-4222-8222-222222222302', '11111111-1111-4111-8111-111111111103', 'Main Course', 'Handmade pasta & wood-fired pizza', 2, 'approved'),
('22222222-2222-4222-8222-222222222303', '11111111-1111-4111-8111-111111111103', 'Desserts', 'House dolci & cheesecakes', 3, 'approved'),

-- Kala & Leaf Roastery
('22222222-2222-4222-8222-222222222401', '11111111-1111-4111-8111-111111111105', 'Beverages', 'Matcha bar and single-origin espresso', 1, 'approved'),
('22222222-2222-4222-8222-222222222402', '11111111-1111-4111-8111-111111111105', 'Desserts', 'Daily baked tarts and Basque cheesecake', 2, 'approved'),

-- Dapur Rempah Menteng
('22222222-2222-4222-8222-222222222501', '11111111-1111-4111-8111-111111111109', 'Best Sellers', 'Iconic Menteng wok classics', 1, 'approved'),

-- Stack Alley
('22222222-2222-4222-8222-222222222601', '11111111-1111-4111-8111-111111111108', 'Best Sellers', 'House smash burgers and loaded fries', 1, 'approved'),

-- Hanwoori, Jade Lantern, Bistro Meridian, Atelier Mille
('22222222-2222-4222-8222-222222222701', '11111111-1111-4111-8111-111111111104', 'Main Course', 'Oak-charcoal grill cuts', 1, 'approved'),
('22222222-2222-4222-8222-222222222801', '11111111-1111-4111-8111-111111111106', 'Appetizers', 'Steamed bamboo dim sum', 1, 'approved'),
('22222222-2222-4222-8222-222222222901', '11111111-1111-4111-8111-111111111107', 'Main Course', 'Dry-aged grill selections', 1, 'approved'),
('22222222-2222-4222-8222-222222222951', '11111111-1111-4111-8111-111111111110', 'Desserts', 'Signature cakes & pastries', 1, 'approved')
on conflict (id) do nothing;

-- ============================================================================
-- MENU ITEMS (powers What Are You Craving? & Restaurant Detail Menus)
-- ============================================================================
insert into public.menu_items (
  id, restaurant_id, category_id, name, description, price_idr, photo_url,
  is_available, is_popular, is_featured_dish, dietary_tags, sort_order, status
) values
(
  '33333333-3333-4333-8333-333333333101',
  '11111111-1111-4111-8111-111111111109',
  '22222222-2222-4222-8222-222222222501',
  'Nasi Goreng Kampung Heritage',
  'Wok-charred spiced rice with free-range sunny egg, beef satay skewers, pickled acar, and crispy melinjo crackers.',
  78000, '/images/dish-nasi-goreng.jpg', true, true, true, array['Halal'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333102',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222201',
  'Beef Ramen',
  '48-hour simmered beef bone broth, torched Australian wagyu slices, soft-boiled ajitama egg, and springy rye noodles.',
  148000, '/images/dish-beef-ramen.jpg', true, true, true, array['No Pork'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333103',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222202',
  'Chicken Katsu',
  'Crisp panko-breaded free-range chicken thigh with shredded kyabetsu cabbage, toasted sesame tonkatsu glaze, and steamed Koshihikari rice.',
  115000, '/images/dish-chicken-katsu.jpg', true, true, true, array['No Pork'], 2, 'approved'
),
(
  '33333333-3333-4333-8333-333333333104',
  '11111111-1111-4111-8111-111111111105',
  '22222222-2222-4222-8222-222222222401',
  'Matcha Latte',
  'Stone-milled first-harvest Uji ceremonial matcha hand-whisked over silky oat or fresh jersey milk.',
  62000, '/images/dish-matcha-latte.jpg', true, true, true, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333105',
  '11111111-1111-4111-8111-111111111110',
  '22222222-2222-4222-8222-222222222951',
  'Cheesecake',
  'Blistered caramelized Basque burnt cheesecake with a custard-soft vanilla bean center.',
  74000, '/images/dish-cheesecake.jpg', true, true, true, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333106',
  '11111111-1111-4111-8111-111111111103',
  '22222222-2222-4222-8222-222222222301',
  'Pasta Carbonara',
  'Al-dente rigatoni emulsified with aged Pecorino Romano, organic farm egg yolk, crispy cured beef, and cracked Tellicherry pepper.',
  165000, '/images/dish-pasta-carbonara.jpg', true, true, true, array['No Pork'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333107',
  '11111111-1111-4111-8111-111111111101',
  '22222222-2222-4222-8222-222222222101',
  'Smoked Duck Nasi Goreng',
  'Fragrant kecombrang fried rice crowned with slow-smoked Bali duck breast and sambal matah.',
  155000, '/images/dish-nasi-goreng.jpg', true, true, false, array['Halal'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333108',
  '11111111-1111-4111-8111-111111111101',
  '22222222-2222-4222-8222-222222222102',
  'Caramelized Beef Rendang Short Rib',
  '8-hour spiced coconut reduction with cassava leaf crisp and steamed pandan rice.',
  225000, '/images/hero-jakarta-dining.jpg', true, true, false, array['Halal', 'Spicy'], 2, 'approved'
),
(
  '33333333-3333-4333-8333-333333333109',
  '11111111-1111-4111-8111-111111111101',
  '22222222-2222-4222-8222-222222222103',
  'Tuna Gohu Tartare & Kemangi',
  'Line-caught Maluku yellowfin dressed in calamansi, roasted peanut crumble, and crispy shallots.',
  118000, '/images/rest-indonesian-senopati.jpg', true, false, false, array['Gluten Free'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333110',
  '11111111-1111-4111-8111-111111111101',
  '22222222-2222-4222-8222-222222222104',
  'Gula Aren Cold Brew Tonic',
  'Slow-steeped Gayo Arabica layered with smoked palm sugar syrup and sparkling kaffir lime.',
  58000, '/images/rest-coffee-roastery.jpg', true, false, false, array['Vegan'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333111',
  '11111111-1111-4111-8111-111111111101',
  '22222222-2222-4222-8222-222222222105',
  'Kue Lumpur & Burnt Vanilla Tart',
  'Warm pandan custard tartlet with sea-salt coconut gelato.',
  75000, '/images/dish-cheesecake.jpg', true, false, false, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333112',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222203',
  'Crispy Chicken Karaage & Yuzu Kosho',
  'Ginger-soy marinated thigh bites served crisp with yuzu pepper mayo.',
  79000, '/images/dish-chicken-katsu.jpg', true, false, false, array['No Pork'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333113',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222204',
  'Iced Ceremonial Matcha',
  'Whisked Kyoto matcha poured cleanly over hand-carved ice.',
  65000, '/images/dish-matcha-latte.jpg', true, false, false, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333114',
  '11111111-1111-4111-8111-111111111103',
  '22222222-2222-4222-8222-222222222302',
  'Truffle Burrata Margherita',
  'San Marzano tomato passata, fresh Pugliese burrata, black truffle crema, and sweet basil.',
  195000, '/images/rest-italian-trattoria.jpg', true, true, false, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333115',
  '11111111-1111-4111-8111-111111111103',
  '22222222-2222-4222-8222-222222222303',
  'Basque Burnt Ricotta Cheesecake',
  'Caramelized ricotta-mascarpone cheesecake with orange zest.',
  82000, '/images/dish-cheesecake.jpg', true, false, false, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333116',
  '11111111-1111-4111-8111-111111111105',
  '22222222-2222-4222-8222-222222222402',
  'Classic Basque Cheesecake',
  'Rich cream cheese cake baked hot for a smoky caramel crust.',
  68000, '/images/dish-cheesecake.jpg', true, true, false, array['Vegetarian'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333117',
  '11111111-1111-4111-8111-111111111108',
  '22222222-2222-4222-8222-222222222601',
  'Double Wagyu Smash Burger',
  'Lacy-edged Australian wagyu patties, aged cheddar, house pickles, and brioche bun with skin-on fries.',
  92000, '/images/dish-gourmet-burger.jpg', true, true, false, array['No Pork'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333118',
  '11111111-1111-4111-8111-111111111104',
  '22222222-2222-4222-8222-222222222701',
  'Oak-Grilled Marbled Galbi',
  'USDA Prime short rib marinated in Asian pear and soy, grilled tableside over white oak charcoal.',
  320000, '/images/rest-korean-bbq.jpg', true, true, false, array['No Pork'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333119',
  '11111111-1111-4111-8111-111111111106',
  '22222222-2222-4222-8222-222222222801',
  'Xiao Long Bao & Prawn Har Gow Basket',
  'Steaming handmade soup dumplings and crystal prawn dumplings served with ginger black vinegar.',
  69000, '/images/rest-chinese-dimsum.jpg', true, true, false, array['No Pork'], 1, 'approved'
),
(
  '33333333-3333-4333-8333-333333333120',
  '11111111-1111-4111-8111-111111111107',
  '22222222-2222-4222-8222-222222222901',
  '28-Day Dry-Aged Ribeye',
  '300g Australian grain-fed ribeye seared over rambutan wood with rosemary garlic jus.',
  420000, '/images/rest-western-steak.jpg', true, true, false, array['Gluten Free'], 1, 'approved'
)
on conflict (id) do nothing;

-- ============================================================================
-- GALLERY PHOTOS
-- ============================================================================
insert into public.photos (id, restaurant_id, url, caption, photo_type, status) values
('44444444-4444-4444-8444-444444444101', '11111111-1111-4111-8111-111111111101', '/images/rest-indonesian-senopati.jpg', 'Sunlit teak main dining pavilion in Senopati', 'cover', 'approved'),
('44444444-4444-4444-8444-444444444102', '11111111-1111-4111-8111-111111111101', '/images/hero-jakarta-dining.jpg', 'Signature Nusantara sharing table', 'food', 'approved'),
('44444444-4444-4444-8444-444444444103', '11111111-1111-4111-8111-111111111101', '/images/dish-nasi-goreng.jpg', 'Smoked Duck Nasi Goreng plated with satay', 'food', 'approved'),
('44444444-4444-4444-8444-444444444201', '11111111-1111-4111-8111-111111111102', '/images/rest-japanese-scbd.jpg', 'Hinoki chef counter at SCBD Park', 'cover', 'approved'),
('44444444-4444-4444-8444-444444444202', '11111111-1111-4111-8111-111111111102', '/images/dish-beef-ramen.jpg', '48-hour torched wagyu beef ramen', 'food', 'approved'),
('44444444-4444-4444-8444-444444444203', '11111111-1111-4111-8111-111111111102', '/images/dish-chicken-katsu.jpg', 'Golden panko chicken katsu platter', 'food', 'approved'),
('44444444-4444-4444-8444-444444444301', '11111111-1111-4111-8111-111111111103', '/images/rest-italian-trattoria.jpg', 'Wood-fired burrata & Margherita pies', 'cover', 'approved'),
('44444444-4444-4444-8444-444444444302', '11111111-1111-4111-8111-111111111103', '/images/dish-pasta-carbonara.jpg', 'Classic Roman Pasta Carbonara', 'food', 'approved')
on conflict (id) do nothing;

-- ============================================================================
-- CURATED PUBLIC COLLECTIONS
-- ============================================================================
insert into public.collections (id, user_id, title, slug, description, cover_image_url, is_public, is_curated) values
(
  '55555555-5555-4555-8555-555555555101',
  null,
  'Senopati & SCBD Icons',
  'senopati-scbd-icons',
  'Architectural dining rooms, hearth kitchens, and counter-seat standouts across South Jakarta.',
  '/images/rest-indonesian-senopati.jpg',
  true, true
),
(
  '55555555-5555-4555-8555-555555555102',
  null,
  'Late-Night Ramen & Charcoal Grills',
  'late-night-ramen-grills',
  'Broth counters, wagyu smash burgers, and oak-ember Korean BBQ open past 10 PM.',
  '/images/dish-beef-ramen.jpg',
  true, true
),
(
  '55555555-5555-4555-8555-555555555103',
  null,
  'Matcha, Pour-Overs & Basque Cakes',
  'jakarta-coffee-dessert-trail',
  'Our community favorite specialty coffee bars, Uji matcha counters, and patisseries.',
  '/images/dish-cheesecake.jpg',
  true, true
)
on conflict (id) do nothing;

insert into public.collection_items (id, collection_id, restaurant_id, note, sort_order) values
('66666666-6666-4666-8666-666666666101', '55555555-5555-4555-8555-555555555101', '11111111-1111-4111-8111-111111111101', 'Book the courtyard table for golden hour.', 1),
('66666666-6666-4666-8666-666666666102', '55555555-5555-4555-8555-555555555101', '11111111-1111-4111-8111-111111111102', 'Sit right at the hinoki counter.', 2),
('66666666-6666-4666-8666-666666666103', '55555555-5555-4555-8555-555555555101', '11111111-1111-4111-8111-111111111104', 'Try the oak-grilled galbi.', 3),
('66666666-6666-4666-8666-666666666201', '55555555-5555-4555-8555-555555555102', '11111111-1111-4111-8111-111111111102', '48-hour beef broth hits best after 9 PM.', 1),
('66666666-6666-4666-8666-666666666202', '55555555-5555-4555-8555-555555555102', '11111111-1111-4111-8111-111111111108', 'Open until midnight on weekends.', 2),
('66666666-6666-4666-8666-666666666301', '55555555-5555-4555-8555-555555555103', '11111111-1111-4111-8111-111111111105', 'Emerald iced ceremonial matcha & Basque slice.', 1),
('66666666-6666-4666-8666-666666666302', '55555555-5555-4555-8555-555555555103', '11111111-1111-4111-8111-111111111110', 'Fresh hojicha tarts daily.', 2)
on conflict (id) do nothing;

-- ============================================================================
-- APPROVED RESTAURANT UPDATES / ANNOUNCEMENTS
-- ============================================================================
insert into public.restaurant_updates (id, restaurant_id, update_type, title, notes, status, reviewed_at) values
(
  '77777777-7777-4777-8777-777777777101',
  '11111111-1111-4111-8111-111111111101',
  'announcement',
  'Seasonal Sambal Nusantara Tasting Menu Added',
  'Featuring 5 regional sambals from Bali, Manado, and Padang paired with hearth-grilled meats every Friday-Sunday.',
  'approved', now()
),
(
  '77777777-7777-4777-8777-777777777102',
  '11111111-1111-4111-8111-111111111102',
  'hours',
  'Extended Weekend Counter Hours Until 23:30',
  'SCBD Park counter now serves late-night ramen batches on Fridays and Saturdays until 23:30 WIB.',
  'approved', now()
)
on conflict (id) do nothing;

