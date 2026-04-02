# Kitaab Kharido — Deployment Guide

## Complete Setup Instructions

---

## 1. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hqwmobnsxsefkcbsvzon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_U4XVwmmLAO_hPbmzLhn6tg_a6GlyNa5
```

For production deployment (Vercel/Netlify), add these in your deployment dashboard's Environment Variables section.

---

## 2. Database Setup

### Step 1: Run the SQL Schema

Go to **Supabase Dashboard → SQL Editor** and run the complete SQL in `supabase-schema.sql`.

This will:
- Create all 10 tables (profiles, books, hero_slides, cart, wishlist, orders, order_items, book_requests, sell_requests, site_settings)
- Set up RLS (Row Level Security) policies on all tables
- Create triggers for `updated_at` auto-update
- Create the auto-profile trigger on `auth.users`
- Insert seed data (8 books, 3 hero slides, 8 site settings)
- Create performance indexes

### Step 2: Make a User Admin

After creating your account on the site, go to **Supabase Dashboard → Authentication → Users**, copy your user's UUID, then run:

```sql
UPDATE profiles SET is_admin = true WHERE id = 'YOUR_USER_UUID_HERE';
```

### Step 3: Create Storage Bucket

1. Go to **Supabase Dashboard → Storage**
2. Click **"New Bucket"**
3. Name it `book-images`
4. Toggle **"Public bucket"** ON
5. Click **Create Bucket**

Then add a storage policy for public read:

1. Click on the `book-images` bucket
2. Go to **Policies** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Policy name: `Public Read Access`
6. Allowed operation: `SELECT`
7. Policy definition: `true`
8. Target roles: `anon`, `authenticated`
9. Click **Save**

---

## 3. Google OAuth Setup

1. Go to **Supabase Dashboard → Authentication → Providers**
2. Find **Google** and enable it
3. Get your **Client ID** and **Client Secret** from Google Cloud Console
4. In Google Cloud Console, add these redirect URLs:
   - `https://hqwmobnsxsefkcbsvzon.supabase.co/auth/v1/callback`
5. Save the Google provider settings in Supabase

---

## 4. Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

## 5. Deploying to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
3. Build command: `npm run build` (or `bun run build`)
4. Publish directory: `.next`
5. Add environment variables in **Site Settings → Environment Variables**

---

## Database Tables Summary

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles extending auth.users | Owner + Admin |
| `books` | Book inventory | Public read, Admin write |
| `hero_slides` | Homepage carousel slides | Public read, Admin write |
| `cart` | User shopping carts | Owner only |
| `wishlist` | User wishlists | Owner only |
| `orders` | Customer orders | Owner read, Admin full |
| `order_items` | Order line items | Owner read, Admin full |
| `book_requests` | Book request submissions | Owner read/write, Admin full |
| `sell_requests` | Sell request submissions | Owner read/write, Admin full |
| `site_settings` | Site configuration (key-value) | Public read, Admin write |

---

## Features Checklist

- ✅ Homepage with hero carousel, category tabs, book grid, CTA cards
- ✅ Book catalog with search, filters, sorting
- ✅ Book cards with Add to Cart, Buy Now, Wishlist
- ✅ Auth modal (Login/Signup with email + Google OAuth)
- ✅ Password show/hide toggle
- ✅ Cart drawer with quantity controls
- ✅ Checkout with saved address auto-fill
- ✅ WhatsApp Pay integration
- ✅ PhonePe "Coming Soon" button
- ✅ User Dashboard (Orders, Wishlist, Profile)
- ✅ Request a Book modal
- ✅ Sell a Book modal
- ✅ Admin Panel (Dashboard, Books, Orders, Slides, Requests, Settings)
- ✅ Delivery always ₹35
- ✅ Discount tags only 50% OFF or 60% OFF
- ✅ Dark editorial design (#060d1f + #f59e0b)
- ✅ Sora font
- ✅ Mobile-first responsive
- ✅ RLS policies on all tables
- ✅ Auto-profile creation on signup
