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
