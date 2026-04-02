import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const demoBooks = [
      {
        title: "Concepts of Physics Vol. 1",
        author: "H.C. Verma",
        category: "Academic",
        sub_category: "JEE Physics",
        price: 220,
        original_price: 499,
        discount_tag: "55% OFF",
        condition: "Good",
        stock_quantity: 5,
        image_urls: ["https://m.media-amazon.com/images/I/71c+YFRqIxL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-8177091878",
        publisher: "Bharati Bhawan",
        edition: "2023",
        language: "English",
        description: "The most recommended book for JEE Physics preparation. Covers mechanics, thermodynamics, and optics with detailed theory and solved examples.",
        active: true,
        featured: true,
      },
      {
        title: "Organic Chemistry",
        author: "Morrison & Boyd",
        category: "Academic",
        sub_category: "JEE Chemistry",
        price: 350,
        original_price: 799,
        discount_tag: "55% OFF",
        condition: "Like New",
        stock_quantity: 3,
        image_urls: ["https://m.media-amazon.com/images/I/91G7T0DyT9L._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-0136436690",
        publisher: "Pearson",
        edition: "7th",
        language: "English",
        description: "The gold standard for organic chemistry. Essential for JEE Advanced and NEET preparation with comprehensive reaction mechanisms.",
        active: true,
        featured: true,
      },
      {
        title: "Objective Mathematics",
        author: "R.D. Sharma",
        category: "Academic",
        sub_category: "JEE Maths",
        price: 280,
        original_price: 650,
        discount_tag: "55% OFF",
        condition: "Good",
        stock_quantity: 4,
        image_urls: ["https://m.media-amazon.com/images/I/71+0KS2LhoL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-9383182334",
        publisher: "Dhanpat Rai",
        edition: "2024",
        language: "English",
        description: "Comprehensive mathematics book for JEE Mains & Advanced. Covers algebra, calculus, coordinate geometry with 5000+ practice problems.",
        active: true,
        featured: true,
      },
      {
        title: "NCERT Biology Class 11 & 12 Combined",
        author: "NCERT",
        category: "Academic",
        sub_category: "NEET Biology",
        price: 180,
        original_price: 350,
        discount_tag: "50% OFF",
        condition: "Like New",
        stock_quantity: 8,
        image_urls: ["https://m.media-amazon.com/images/I/81VJyXGDwCL._AC_UF1000,1000_QL80_.jpg"],
        isbn: "978-8174505316",
        publisher: "NCERT",
        edition: "2024",
        language: "English",
        description: "The holy grail for NEET Biology. All 32 chapters from Class 11 & 12 NCERT combined. Condition verified, no markings.",
        active: true,
        featured: true,
      },
    ]

    const { data, error } = await supabase
      .from('books')
      .upsert(demoBooks, { onConflict: 'title,author' })
      .select()

    if (error) {
      // Try insert instead if upsert fails
      const { data: insertData, error: insertError } = await supabase
        .from('books')
        .insert(demoBooks)
        .select()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Inserted ${insertData?.length || 0} demo books`,
        count: insertData?.length || 0,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Upserted ${data?.length || 0} demo books`,
      count: data?.length || 0,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
