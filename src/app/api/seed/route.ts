import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const demoBooks = [
  {
    title: 'Concepts of Physics Vol. 1',
    author: 'H.C. Verma',
    category: 'Academic',
    sub_category: 'JEE Physics',
    price: 220,
    original_price: 499,
    discount_tag: '60% OFF',
    condition: 'Good',
    stock_quantity: 5,
    image_urls: ['https://m.media-amazon.com/images/I/71c+YFRqIxL._AC_UF1000,1000_QL80_.jpg'],
    isbn: '978-8177091878',
    publisher: 'Bharati Bhawan',
    edition: '2023',
    language: 'English',
    description:
      'The most recommended book for JEE Physics preparation. Covers mechanics, thermodynamics, and optics with detailed theory and solved examples.',
    active: true,
    featured: true,
  },
  {
    title: 'Organic Chemistry',
    author: 'Morrison & Boyd',
    category: 'Academic',
    sub_category: 'JEE Chemistry',
    price: 350,
    original_price: 799,
    discount_tag: '60% OFF',
    condition: 'Like New',
    stock_quantity: 3,
    image_urls: ['https://m.media-amazon.com/images/I/91G7T0DyT9L._AC_UF1000,1000_QL80_.jpg'],
    isbn: '978-0136436690',
    publisher: 'Pearson',
    edition: '7th',
    language: 'English',
    description:
      'The gold standard for organic chemistry. Essential for JEE Advanced and NEET preparation with comprehensive reaction mechanisms.',
    active: true,
    featured: true,
  },
  {
    title: 'Objective Mathematics',
    author: 'R.D. Sharma',
    category: 'Academic',
    sub_category: 'JEE Maths',
    price: 280,
    original_price: 650,
    discount_tag: '60% OFF',
    condition: 'Good',
    stock_quantity: 4,
    image_urls: ['https://m.media-amazon.com/images/I/71+0KS2LhoL._AC_UF1000,1000_QL80_.jpg'],
    isbn: '978-9383182334',
    publisher: 'Dhanpat Rai',
    edition: '2024',
    language: 'English',
    description:
      'Comprehensive mathematics book for JEE Mains & Advanced. Covers algebra, calculus, coordinate geometry with 5000+ practice problems.',
    active: true,
    featured: true,
  },
  {
    title: 'NCERT Physics Class 12',
    author: 'NCERT',
    category: 'Academic',
    sub_category: 'NEET Physics',
    price: 120,
    original_price: 250,
    discount_tag: '50% OFF',
    condition: 'Like New',
    stock_quantity: 8,
    image_urls: ['https://m.media-amazon.com/images/I/51bIqL8j0TL._AC_UF1000,1000_QL80_.jpg'],
    isbn: '978-8174506368',
    publisher: 'NCERT',
    edition: '2024',
    language: 'English',
    description:
      'NCERT Physics textbook for Class 12. Essential for NEET and board exam preparation with clear concepts and solved examples.',
    active: true,
    featured: true,
  },
  {
    title: 'Verbal Ability & Reading Comprehension',
    author: 'Nishit K. Sinha',
    category: 'Academic',
    sub_category: 'CAT',
    price: 280,
    original_price: 599,
    discount_tag: '50% OFF',
    condition: 'Good',
    stock_quantity: 3,
    image_urls: ['https://m.media-amazon.com/images/I/81PmJkmLEfL._AC_UF1000,1000_QL80_.jpg'],
    isbn: '978-9353940142',
    publisher: 'Pearson',
    edition: '2023',
    language: 'English',
    description:
      'Comprehensive guide for CAT verbal ability and reading comprehension. Includes 500+ practice questions across various difficulty levels.',
    active: true,
    featured: false,
  },
  {
    title: 'Indian Polity',
    author: 'M. Laxmikanth',
    category: 'Academic',
    sub_category: 'UPSC',
    price: 250,
    original_price: 550,
    discount_tag: '60% OFF',
    condition: 'Good',
    stock_quantity: 6,
    image_urls: ['https://m.media-amazon.com/images/I/71bqJSDCJPL._AC_UF1000,1000_QL80_.jpg'],
    isbn: '978-9395761911',
    publisher: 'McGraw Hill',
    edition: '7th',
    language: 'English',
    description:
      'The most comprehensive book for UPSC Civil Services Prelims and Mains. Covers Indian Constitution, governance, and political system in detail.',
    active: true,
    featured: false,
  },
]

const heroSlides = [
  {
    title: 'Up to 60% OFF',
    subtitle: 'Premium second-hand books for JEE, NEET, UPSC & more',
    cta_button_text: 'Browse Collection',
    cta_link: '/books',
    background_color: '#92400e',
    image_url: null,
    sort_order: 1,
    active: true,
  },
  {
    title: 'Sell Your Old Books',
    subtitle:
      'Get the best price for your pre-owned books. Quick pickup & instant payment.',
    cta_button_text: 'Start Selling',
    cta_link: '#sell',
    background_color: '#1e3a5f',
    image_url: null,
    sort_order: 2,
    active: true,
  },
  {
    title: 'Free Delivery',
    subtitle: 'Free delivery on orders above ₹499 across India',
    cta_button_text: null,
    cta_link: null,
    background_color: '#064e3b',
    image_url: null,
    sort_order: 3,
    active: true,
  },
]

const siteSettings = [
  { key: 'whatsapp_number', value: '919382470919' },
  { key: 'delivery_charge', value: '35' },
  { key: 'free_delivery_above', value: '499' },
  {
    key: 'banner_text',
    value: '📚 Up to 60% OFF on all books! Free delivery above ₹499',
  },
  { key: 'maintenance_mode', value: 'false' },
]

export async function POST() {
  try {
    const supabase = await createAdminClient()
    const results: Record<string, string> = {}

    // --- Seed Books (idempotent via upsert on title) ---
    const { error: booksError } = await supabase
      .from('books')
      .upsert(demoBooks, { onConflict: 'title' })
      .select()

    if (booksError) {
      // Fallback: try insert if upsert conflict resolution doesn't work
      const { error: insertError } = await supabase
        .from('books')
        .insert(demoBooks)

      if (insertError) {
        return NextResponse.json(
          { success: false, error: `Books: ${insertError.message}` },
          { status: 500 }
        )
      }
      results.books = `Inserted ${demoBooks.length} books`
    } else {
      results.books = `Upserted ${demoBooks.length} books`
    }

    // --- Seed Hero Slides (idempotent via upsert on title) ---
    const { error: slidesError } = await supabase
      .from('hero_slides')
      .upsert(heroSlides, { onConflict: 'title' })
      .select()

    if (slidesError) {
      // Fallback: try insert
      const { error: insertError } = await supabase
        .from('hero_slides')
        .insert(heroSlides)

      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: `Hero slides: ${insertError.message}`,
            partial: results,
          },
          { status: 500 }
        )
      }
      results.hero_slides = `Inserted ${heroSlides.length} slides`
    } else {
      results.hero_slides = `Upserted ${heroSlides.length} slides`
    }

    // --- Seed Site Settings (idempotent via upsert on key) ---
    const { error: settingsError } = await supabase
      .from('site_settings')
      .upsert(siteSettings, { onConflict: 'key' })
      .select()

    if (settingsError) {
      // Fallback: try insert
      const { error: insertError } = await supabase
        .from('site_settings')
        .insert(siteSettings)

      if (insertError) {
        return NextResponse.json(
          {
            success: false,
            error: `Site settings: ${insertError.message}`,
            partial: results,
          },
          { status: 500 }
        )
      }
      results.site_settings = `Inserted ${siteSettings.length} settings`
    } else {
      results.site_settings = `Upserted ${siteSettings.length} settings`
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}
