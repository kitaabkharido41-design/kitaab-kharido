import * as React from 'react'
import { Resend } from 'resend'
import { OrderConfirmationEmail } from './templates/order-confirmation'

// Initialize Resend with API key from environment variables
const apiKey = process.env.RESEND_API_KEY
export const resend = apiKey ? new Resend(apiKey) : null

// The sender email address. 
// Note: If you do not have a verified domain, Resend requires you to send from "onboarding@resend.dev"
// and the recipient must be your own account email.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kitaabkharido41@gmail.com'

interface EmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactElement
}

export async function sendEmail({ to, subject, react }: EmailOptions) {
  if (!resend) {
    console.warn('RESEND_API_KEY is missing. Email not sent.', { to, subject })
    return { error: 'RESEND_API_KEY missing' }
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react,
    })
    
    return { data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { error }
  }
}

/**
 * Sends a confirmation email to the buyer with order details.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  customerName: string,
  orderNumber: string,
  totalAmount: number,
  items: Array<{ title: string; price: number; quantity: number }>
) {
  return sendEmail({
    to,
    subject: `Order Confirmation #${orderNumber} — Kitaab Kharido`,
    react: React.createElement(OrderConfirmationEmail, {
      customerName,
      orderNumber,
      totalAmount,
      items,
    })
  })
}

/**
 * Sends an alert email to the admin/store owner with the new order details.
 */
export async function sendAdminOrderAlertEmail(
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  items: Array<{ title: string; price: number; quantity: number }>,
  shippingDetails: { phone: string; address: string; city: string; pincode: string; method: string }
) {
  // Simple react-email-style layout for the admin notification
  const adminAlertElement = React.createElement('div', { style: { fontFamily: 'sans-serif', padding: '20px', color: '#1e293b' } }, [
    React.createElement('h2', { style: { color: '#f59e0b' } }, '🔔 New Order Received!'),
    React.createElement('p', null, `Order Number: `, React.createElement('strong', null, `#${orderNumber}`)),
    React.createElement('p', null, `Customer: `, React.createElement('strong', null, customerName)),
    React.createElement('p', null, `Total Amount: `, React.createElement('strong', null, `₹${totalAmount}`)),
    React.createElement('p', null, `Payment Method: `, React.createElement('strong', null, shippingDetails.method.toUpperCase())),
    
    React.createElement('h3', null, 'Shipping Information:'),
    React.createElement('p', { style: { margin: '5px 0' } }, `Phone: ${shippingDetails.phone}`),
    React.createElement('p', { style: { margin: '5px 0' } }, `Address: ${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.pincode}`),
    
    React.createElement('h3', null, 'Items Ordered:'),
    React.createElement('ul', null, items.map((item, idx) => 
      React.createElement('li', { key: idx }, `${item.title} (x${item.quantity}) — ₹${item.price * item.quantity}`)
    ))
  ])

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ALERT] New Order #${orderNumber} received`,
    react: adminAlertElement
  })
}

/**
 * Sends a notification to the admin about a new book sell request.
 */
export async function sendAdminSellRequestAlertEmail(details: {
  user_name: string
  user_email: string
  user_phone?: string | null
  book_title: string
  author?: string | null
  category?: string | null
  book_condition?: string | null
  asking_price?: number | null
  description?: string | null
  image_urls?: string[] | null
}) {
  const imageElements = (details.image_urls || []).map((url, idx) => 
    React.createElement('div', { key: idx, style: { display: 'inline-block', margin: '5px', border: '1px solid #ddd', padding: '2px', borderRadius: '4px' } }, [
      React.createElement('img', { src: url, alt: `Book image ${idx + 1}`, style: { width: '100px', height: '130px', objectFit: 'cover' } })
    ])
  )

  const alertElement = React.createElement('div', { style: { fontFamily: 'sans-serif', padding: '20px', color: '#1e293b' } }, [
    React.createElement('h2', { style: { color: '#f59e0b' } }, '📖 New Book Sell Request!'),
    React.createElement('p', null, `Book Title: `, React.createElement('strong', null, details.book_title)),
    React.createElement('p', null, `Author: ${details.author || 'N/A'}`),
    React.createElement('p', null, `Category: ${details.category || 'N/A'}`),
    React.createElement('p', null, `Condition: ${details.book_condition || 'N/A'}`),
    React.createElement('p', null, `Asking Price: `, React.createElement('strong', null, `₹${details.asking_price || 0}`)),
    React.createElement('p', null, `Description: ${details.description || 'No description provided'}`),
    
    React.createElement('h3', null, 'Seller Contact Details:'),
    React.createElement('p', { style: { margin: '5px 0' } }, `Name: ${details.user_name}`),
    React.createElement('p', { style: { margin: '5px 0' } }, `Email: ${details.user_email}`),
    React.createElement('p', { style: { margin: '5px 0' } }, `Phone: ${details.user_phone || 'N/A'}`),
    
    details.image_urls && details.image_urls.length > 0 ? React.createElement('h3', null, 'Uploaded Book Cover/Images:') : null,
    details.image_urls && details.image_urls.length > 0 ? React.createElement('div', null, imageElements) : null
  ])

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[ALERT] New Sell Request: ${details.book_title}`,
    react: alertElement
  })
}

/**
 * Sends an email to the seller when their sell request is accepted and listed.
 */
export async function sendSellerAcceptanceEmail(
  to: string,
  userName: string,
  bookTitle: string,
  askingPrice: number,
  listedPrice: number
) {
  const isLowerPrice = listedPrice < askingPrice

  const messageText = isLowerPrice 
    ? `We have reviewed your request to sell your book "${bookTitle}". Your asking price of ₹${askingPrice} was a bit high, so we have accepted and listed your book at a revised price of ₹${listedPrice} on our store.`
    : `Great news! We have accepted your request to sell your book "${bookTitle}" at your asking price of ₹${askingPrice} and it is now live on our store!`

  const element = React.createElement('div', { style: { fontFamily: 'sans-serif', padding: '20px', color: '#1e293b', lineHeight: '1.6' } }, [
    React.createElement('h2', { style: { color: '#10b981' } }, '🎉 Your Book Sell Request is Accepted!'),
    React.createElement('p', null, `Dear ${userName || 'Seller'},`),
    React.createElement('p', null, messageText),
    React.createElement('p', null, `You can view your book listing live on our website. Once a buyer purchases your book, we will contact you immediately via email or phone to coordinate the pickup and your payout.`),
    React.createElement('p', { style: { marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '12px', color: '#64748b' } }, `Thank you for selling with Kitaab Kharido!`)
  ])

  return sendEmail({
    to,
    subject: `[Kitaab Kharido] Sell Request Accepted: ${bookTitle}`,
    react: element
  })
}
