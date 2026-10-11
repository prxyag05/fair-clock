import { Beef, Coffee, Fish, Pizza, Salad, Soup, Utensils, type LucideIcon } from 'lucide-react'
import type { MenuItem } from '../data/restaurants'

export type Category = 'pizza' | 'burger' | 'indian' | 'chinese' | 'japanese' | 'cafe' | 'healthy' | 'generic'

export const CATEGORY_META: Record<Category, { icon: LucideIcon; hue: number }> = {
  pizza: { icon: Pizza, hue: 18 },
  burger: { icon: Beef, hue: 8 },
  indian: { icon: Utensils, hue: 32 },
  chinese: { icon: Soup, hue: 42 },
  japanese: { icon: Fish, hue: 200 },
  cafe: { icon: Coffee, hue: 25 },
  healthy: { icon: Salad, hue: 140 },
  generic: { icon: Utensils, hue: 260 },
}

type Template = readonly [name: string, description: string, price: number, hold: number, veg: boolean]

const TEMPLATES: Record<Category, Template[]> = {
  pizza: [
    ['Margherita Pizza', 'Tomato, mozzarella, basil', 299, 25, true],
    ['Farmhouse Pizza', 'Capsicum, onion, mushroom, olives', 389, 25, true],
    ['Pepperoni Pizza', 'Spicy pepperoni, mozzarella', 449, 25, false],
    ['BBQ Chicken Pizza', 'Smoky chicken, onion, peppers', 429, 25, false],
    ['Garlic Bread', 'Toasted with herb butter', 149, 12, true],
    ['Chicken Wings', 'Tossed in peri peri glaze', 249, 12, false],
    ['Pasta Alfredo', 'Creamy white sauce, herbs', 289, 20, true],
    ['Chocolate Brownie', 'Warm, with fudge', 129, 40, true],
  ],
  burger: [
    ['Aloo Tikki Burger', 'Spiced potato patty, mint mayo', 129, 15, true],
    ['Paneer Crunch Burger', 'Crumb-fried paneer, slaw', 169, 15, true],
    ['Crispy Chicken Burger', 'Buttermilk fried, slaw', 219, 15, false],
    ['Grilled Chicken Burger', 'Peri peri glaze, lettuce', 209, 15, false],
    ['Peri Peri Fries', 'Crisp and spicy', 119, 10, true],
    ['Chicken Nuggets', 'Six pieces, dip', 169, 12, false],
    ['Veg Wrap', 'Grilled vegetables, hummus', 149, 25, true],
    ['Chocolate Shake', 'Thick and cold', 149, 20, true],
  ],
  indian: [
    ['Paneer Butter Masala', 'Creamy tomato gravy', 299, 40, true],
    ['Butter Chicken', 'Slow-cooked, creamy gravy', 349, 40, false],
    ['Dal Makhani', 'Overnight black lentils', 249, 45, true],
    ['Chicken Biryani', 'Dum cooked, with raita', 329, 40, false],
    ['Veg Biryani', 'Fragrant rice, vegetables, raita', 269, 40, true],
    ['Tandoori Chicken', 'Half portion, mint chutney', 349, 20, false],
    ['Garlic Naan', 'Fresh from the tandoor', 59, 15, true],
    ['Gulab Jamun', 'Two pieces, warm', 99, 60, true],
  ],
  chinese: [
    ['Veg Hakka Noodles', 'Wok tossed with vegetables', 219, 25, true],
    ['Chicken Hakka Noodles', 'Egg, chicken, spring onion', 259, 25, false],
    ['Veg Manchurian', 'Dry or gravy', 229, 20, true],
    ['Chilli Chicken', 'Peppers, soy glaze', 289, 20, false],
    ['Veg Fried Rice', 'Burnt garlic, spring onion', 199, 30, true],
    ['Egg Fried Rice', 'Wok fired, two eggs', 229, 30, false],
    ['Veg Spring Rolls', 'Crisp, sweet chilli dip', 169, 8, true],
    ['Hot and Sour Soup', 'Mushroom, tofu', 149, 15, true],
  ],
  japanese: [
    ['Veg Maki Roll', 'Cucumber, carrot, avocado', 349, 30, true],
    ['Salmon Nigiri Set', 'Eight pieces with ginger', 649, 30, false],
    ['California Roll', 'Crab, avocado, sesame', 449, 30, false],
    ['Avocado Roll', 'Creamy avocado, nori', 379, 30, true],
    ['Chicken Katsu', 'Crumb-fried, curry dip', 449, 15, false],
    ['Veg Tempura', 'Light batter, dipping sauce', 299, 8, true],
    ['Miso Soup', 'Tofu, wakame', 199, 15, true],
    ['Edamame', 'Steamed with sea salt', 249, 30, true],
  ],
  cafe: [
    ['Cappuccino', 'Double shot, steamed milk', 169, 12, true],
    ['Cold Coffee', 'Blended, with ice cream', 189, 20, true],
    ['Veg Club Sandwich', 'Grilled, three layers', 229, 25, true],
    ['Chicken Club Sandwich', 'Chicken, egg, lettuce', 269, 25, false],
    ['Paneer Tikka Sandwich', 'Smoky paneer, mint', 219, 25, true],
    ['Egg Toast', 'Masala omelette on toast', 179, 20, false],
    ['Blueberry Muffin', 'Baked this morning', 129, 60, true],
    ['Chocolate Brownie', 'Warm, with fudge', 149, 40, true],
  ],
  healthy: [
    ['Quinoa Power Bowl', 'Roasted vegetables, chickpeas', 329, 45, true],
    ['Grilled Chicken Salad', 'Greens, cherry tomato, vinaigrette', 349, 35, false],
    ['Falafel Wrap', 'Herb falafel, hummus', 249, 25, true],
    ['Greek Salad', 'Feta, olives, cucumber', 279, 40, true],
    ['Egg White Omelette', 'Spinach, mushroom', 199, 20, false],
    ['Tofu Stir Fry', 'Sesame, seasonal vegetables', 299, 30, true],
    ['Sweet Potato Fries', 'Baked, smoked paprika', 169, 10, true],
    ['Cold Pressed Juice', 'Orange, carrot, ginger', 179, 90, true],
  ],
  generic: [
    ['Veg Thali', 'Dal, sabzi, rice, roti, sweet', 249, 40, true],
    ['Chicken Thali', 'Curry, rice, roti, sweet', 299, 40, false],
    ['Dal Rice', 'Tadka dal, steamed rice', 179, 40, true],
    ['Egg Curry Rice', 'Two eggs, masala gravy', 219, 40, false],
    ['Paneer Wrap', 'Grilled paneer, onion, chutney', 189, 25, true],
    ['Chicken Wrap', 'Grilled chicken, onion, chutney', 219, 25, false],
    ['French Fries', 'Crisp and salted', 119, 10, true],
    ['Soft Drink', 'Chilled can', 60, 90, true],
  ],
}

const KEYWORDS: [Category, string[]][] = [
  ['pizza', ['pizza', 'italian']],
  ['burger', ['burger', 'american', 'fast_food', 'sandwich', 'chicken']],
  ['indian', ['indian', 'curry', 'biryani', 'punjabi', 'mughlai']],
  ['chinese', ['chinese', 'asian', 'noodle', 'thai', 'dim_sum']],
  ['japanese', ['japanese', 'sushi', 'ramen']],
  ['cafe', ['cafe', 'coffee', 'bakery', 'dessert', 'ice_cream']],
  ['healthy', ['salad', 'vegetarian', 'vegan', 'healthy']],
]

export const detectCategory = (cuisine: string | undefined, name: string): Category => {
  const haystack = `${cuisine ?? ''} ${name}`.toLowerCase()
  const match = KEYWORDS.find(([, words]) => words.some((word) => haystack.includes(word)))
  return match ? match[0] : 'generic'
}

const seedOf = (value: string): number => Array.from(value).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 7)

export const menuFor = (category: Category, id: string): MenuItem[] => {
  const factor = 0.9 + (seedOf(id) % 26) / 100
  return TEMPLATES[category].map(([name, description, price, hold, veg], index) => ({
    id: `${category}-${index}`,
    name,
    description,
    price: Math.max(5, Math.round((price * factor) / 5) * 5),
    hold,
    veg,
  }))
}
