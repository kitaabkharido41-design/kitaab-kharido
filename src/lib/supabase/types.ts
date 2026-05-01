export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  pincode: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  title: string
  author: string
  category: string
  sub_category: string | null
  price: number
  original_price: number
  discount_tag: string | null
  condition: string
  stock_quantity: number
  image_urls: string[]
  isbn: string | null
  publisher: string | null
  edition: string | null
  language: string
  description: string | null
  active: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

export type HeroSlide = {
  id: string
  title: string
  subtitle: string | null
  cta_button_text: string | null
  cta_link: string | null
  background_color: string
  image_url: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type CartItem = {
  id: string
  user_id: string
  book_id: string
  quantity: number
  created_at: string
  book?: Book
}

export type WishlistItem = {
  id: string
  user_id: string
  book_id: string
  created_at: string
  book?: Book
}

export type Order = {
  id: string
  user_id: string
  order_number: string
  total_amount: number
  delivery_charge: number
  grand_total: number
  payment_method: string
  payment_status: string
  order_status: string
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_pincode: string
  tracking_url: string | null
  tracking_number: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  book_id: string
  book_title: string
  book_author: string | null
  book_price: number
  book_original_price: number | null
  book_image_url: string | null
  quantity: number
  created_at: string
}

export type BookRequest = {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  user_phone: string | null
  book_title: string
  author: string | null
  category: string | null
  notes: string | null
  status: string
  admin_reply: string | null
  created_at: string
  updated_at: string
}

export type SellRequest = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_phone: string | null
  book_title: string
  author: string | null
  category: string | null
  book_condition: string
  asking_price: number | null
  description: string | null
  status: string
  offer_price: number | null
  admin_reply: string | null
  created_at: string
  updated_at: string
}

export type EbookRequest = {
  id: string
  user_name: string | null
  user_email: string | null
  book_title: string
  author: string | null
  category: string | null
  notes: string | null
  status: string
  admin_reply: string | null
  ebook_url: string | null
  created_at: string
  updated_at: string
}

export type SiteSetting = {
  id: string
  key: string
  value: string | null
  updated_at: string
}

export const CATEGORIES = ['All', 'Academic', 'Fiction', 'Self-Help', 'Others'] as const
export const BOOK_CONDITIONS = ['Like New', 'Good', 'Fair'] as const
export const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] as const
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
export const DISCOUNT_TAGS = ['50% OFF', '60% OFF'] as const
export const DELIVERY_CHARGE = 35
