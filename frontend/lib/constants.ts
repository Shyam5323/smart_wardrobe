const FALLBACK_LOCAL_API = 'http://localhost:4000';
const FALLBACK_PROD_API = 'https://smart-wardrobe-ub5x.onrender.com';

export const API_BASE_URL = FALLBACK_PROD_API;
export const TOKEN_STORAGE_KEY = 'wardrobeToken';

export const CATEGORY_OPTIONS: string[] = [
	'Top',
	'Bottom',
	'Outerwear',
	'Dress',
	'Footwear',
	'Accessory',
	'Athleisure',
	'Swimwear',
	'Occasionwear',
	'Loungewear',
];

export const COLOR_OPTIONS: string[] = [
	'Black',
	'White',
	'Gray',
	'Light Gray',
	'Dark Gray',
	'Brown',
	'Beige',
	'Red',
	'Orange',
	'Yellow',
	'Green',
	'Blue',
	'Purple',
	'Pink',
	'Cyan',
];
