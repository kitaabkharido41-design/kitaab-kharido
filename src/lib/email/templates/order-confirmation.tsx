import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Link,
  Tailwind
} from '@react-email/components'

interface OrderConfirmationProps {
  customerName: string
  orderNumber: string
  totalAmount: number
  items: Array<{ title: string; price: number; quantity: number }>
}

export const OrderConfirmationEmail = ({
  customerName = 'Student',
  orderNumber = 'ORD-12345',
  totalAmount = 0,
  items = []
}: OrderConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Kitaab Kharido Order is Confirmed!</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans text-gray-800">
          <Container className="bg-white border border-gray-200 rounded-lg p-8 mx-auto mt-8 max-w-xl shadow-sm">
            <Heading className="text-2xl font-bold text-center text-amber-500 mb-6">
              Kitaab Kharido
            </Heading>
            
            <Text className="text-base text-gray-700 leading-relaxed">
              Hi {customerName},
            </Text>
            <Text className="text-base text-gray-700 leading-relaxed">
              Thank you for choosing Kitaab Kharido! Your order <strong>#{orderNumber}</strong> is confirmed and we are getting it ready for shipment.
            </Text>
            
            <Section className="bg-gray-50 rounded-lg p-6 my-6 border border-gray-100">
              <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Order Summary
              </Text>
              
              {items.map((item, idx) => (
                <Row key={idx} className="mb-2">
                  <Column className="w-3/4">
                    <Text className="m-0 text-sm font-medium text-gray-800">{item.title} <span className="text-gray-500">x{item.quantity}</span></Text>
                  </Column>
                  <Column className="w-1/4 text-right">
                    <Text className="m-0 text-sm text-gray-800">₹{item.price * item.quantity}</Text>
                  </Column>
                </Row>
              ))}
              
              <Hr className="border-gray-200 my-4" />
              
              <Row>
                <Column className="w-3/4">
                  <Text className="m-0 text-base font-bold text-gray-800">Total</Text>
                </Column>
                <Column className="w-1/4 text-right">
                  <Text className="m-0 text-base font-bold text-amber-600">₹{totalAmount}</Text>
                </Column>
              </Row>
            </Section>

            <Text className="text-sm text-gray-600 mt-8 text-center">
              We'll send you another email when your order ships. If you have any questions, reply to this email or reach us on WhatsApp.
            </Text>
            
            <Text className="text-xs text-gray-400 text-center mt-8">
              © {new Date().getFullYear()} Kitaab Kharido. Empowering students across West Bengal.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default OrderConfirmationEmail
