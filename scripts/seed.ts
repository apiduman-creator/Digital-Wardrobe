/**
 * Demo seed script.
 *
 * Runs against:
 *   POST http://localhost:3000/api/closet/items
 *
 * Creates at least 10 items for every closet category.
 */

type Category =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "accessories"
  | "bags"
  | "activewear"
  | "sleepwear"
  | "other";

type Season = "spring" | "summer" | "fall" | "winter" | "all";
type Occasion = "casual" | "work" | "formal" | "sport" | "lounge" | "special";

type CreateClosetItemRequest = {
  name: string;
  category: Category;
  color: string;
  season: Season;
  occasion: Occasion;
  favorite?: boolean;
  brand?: string;
  imageUri?: string;
  notes?: string;
};

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL}/api/closet/items`;

const CATEGORIES: Category[] = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
  "bags",
  "activewear",
  "sleepwear",
  "other",
];

const OCCASIONS: Occasion[] = ["casual", "work", "formal", "sport", "lounge", "special"];
const SEASONS: Season[] = ["spring", "summer", "fall", "winter", "all"];

const BRANDS = ["Zara", "H&M", "Uniqlo", "Mango", "Nike", "Adidas", "COS", "Levi's", "Puma", "H&M Studio"];

const SINGLE_COLORS = [
  "Black",
  "White",
  "Grey",
  "Navy",
  "Blue",
  "Teal",
  "Green",
  "Olive",
  "Yellow",
  "Orange",
  "Red",
  "Pink",
  "Purple",
  "Brown",
  "Beige",
];

const COLOR_PAIRS: Array<[string, string]> = [
  ["Black", "Beige"],
  ["Black", "Red"],
  ["Navy", "White"],
  ["Blue", "Grey"],
  ["Green", "Olive"],
  ["White", "Cream"],
  ["Brown", "Beige"],
  ["Red", "Black"],
  ["Purple", "Grey"],
  ["Teal", "Black"],
  ["Orange", "Brown"],
  ["Pink", "Grey"],
];

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length]!;
}

function twoToneColor(i: number): string {
  const pair = COLOR_PAIRS[i % COLOR_PAIRS.length]!;
  const [a, b] = pair;
  return `${a} + ${b}`;
}

function singleColor(i: number): string {
  return pick(SINGLE_COLORS, i);
}

function maybeTwoTone(i: number): string {
  // Deterministic: every category gets a mix.
  // About 1/3 of items become 2-tone.
  return i % 3 === 0 ? twoToneColor(i) : singleColor(i);
}

const NAME_TEMPLATES: Record<Category, string[]> = {
  tops: [
    "Basic T-Shirt",
    "Oxford Shirt",
    "Graphic Tee",
    "Ribbed Tank",
    "Button-Down Shirt",
    "Long Sleeve Top",
    "Henley Tee",
    "Knit Sweater",
    "Polo Tee",
    "Oversized Tee",
  ],
  bottoms: [
    "Straight Jeans",
    "Chino Pants",
    "Pleated Trousers",
    "Linen Shorts",
    "Pleather Pants",
    "Culottes",
    "Slim Jeans",
    "Cargo Pants",
    "Track Pants",
    "Skirt (A-line)",
  ],
  dresses: [
    "Midi Dress",
    "Wrap Dress",
    "Sundress",
    "Shift Dress",
    "Fit & Flare Dress",
    "Maxi Dress",
    "Sweater Dress",
    "Wrap Shirt Dress",
    "Evening Dress",
    "Linen Dress",
  ],
  outerwear: [
    "Light Jacket",
    "Denim Jacket",
    "Wool Coat",
    "Puffer Jacket",
    "Bomber Jacket",
    "Trench Coat",
    "Windbreaker",
    "Fleece Hoodie",
    "Leather Jacket",
    "Parkа Coat",
  ],
  shoes: [
    "Casual Sneakers",
    "Leather Loafers",
    "Chelsea Boots",
    "Running Shoes",
    "Canvas Trainers",
    "Oxford Shoes",
    "Ankle Boots",
    "Sport Sandals",
    "High-Top Sneakers",
    "Ballet Flats",
  ],
  accessories: [
    "Classic Watch",
    "Leather Belt",
    "Sunglasses",
    "Scarf",
    "Neck Tie",
    "Cap",
    "Pendant Necklace",
    "Earrings",
    "Beanie",
    "Keychain",
  ],
  bags: [
    "Everyday Tote",
    "Crossbody Bag",
    "Backpack",
    "Clutch Bag",
    "Duffel Bag",
    "Shoulder Bag",
    "Mini Bag",
    "Messenger Bag",
    "Weekender Bag",
    "Travel Pouch",
  ],
  activewear: [
    "Training T-Shirt",
    "Workout Shorts",
    "Sports Bra",
    "Cycling Jersey",
    "Gym Leggings",
    "Track Jacket",
    "Training Hoodie",
    "Compression Top",
    "Sweatpants",
    "Athletic Windbreaker",
  ],
  sleepwear: [
    "Cotton Pajama Set",
    "Lounge Shorts",
    "Nightshirt",
    "Sleep Tee",
    "Thermal Sleepwear",
    "Robe",
    "Button Pajamas",
    "Soft Onesie",
    "Warm Pajama Pants",
    "Sleep Lounge Hoodie",
  ],
  other: [
    "Utility Vest",
    "Statement Outer Piece",
    "Festival Wear Top",
    "Layering Cardigan",
    "Art-Themed Tee",
    "Seasonal Special Piece",
    "Weekend Overshirt",
    "Comfort Hoodie",
    "Experimental Outfit Piece",
    "Lifestyle Accessory",
  ],
};

function makeItem(category: Category, index: number): CreateClosetItemRequest {
  const nameBase = pick(NAME_TEMPLATES[category], index);
  const color = maybeTwoTone(index + category.length);
  const season = pick(SEASONS, index + category.length * 2);
  const occasion = pick(OCCASIONS, index + category.length * 3);

  const brand = index % 4 === 0 ? pick(BRANDS, index) : undefined;
  const notes =
    color.includes("+")
      ? "Demo item with two-tone color label (for rainbow/double ring UI)."
      : "Demo item.";

  return {
    name: `${color} ${nameBase}`,
    category,
    color,
    season,
    occasion,
    favorite: false,
    brand,
    notes,
  };
}

async function createClosetItem(req: CreateClosetItemRequest): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`POST ${ENDPOINT} failed (${res.status}). ${body}`.trim());
  }
}

async function main() {
  console.log(`Seeding demo closet items via: ${ENDPOINT}`);

  const perCategory = 10;
  const items: CreateClosetItemRequest[] = [];
  for (const category of CATEGORIES) {
    for (let i = 0; i < perCategory; i++) {
      items.push(makeItem(category, i));
    }
  }

  console.log(`Total items to create: ${items.length}`);

  // Sequential to keep logs readable and avoid overwhelming the dev DB.
  let created = 0;
  for (const req of items) {
    await createClosetItem(req);
    created += 1;
    if (created % 10 === 0) console.log(`Created ${created}/${items.length}...`);
  }

  console.log(`Done. Created ${created} items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

