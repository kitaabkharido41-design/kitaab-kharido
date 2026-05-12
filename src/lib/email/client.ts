import { Resend } from 'resend'

// Initialize Resend with API key from environment variables
// Note: If the key is missing, we create a dummy client to prevent build errors,
// but emails will obviously fail to send.
const apiKey = process.env.RESEND_API_KEY
export const resend = apiKey ? new Resend(apiKey) : null

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
      from: 'Kitaab Kharido <hello@kitaabkharido.com>', // Replace with your verified domain
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
