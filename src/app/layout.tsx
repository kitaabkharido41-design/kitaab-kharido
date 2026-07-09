import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { GlobalModals } from "@/components/providers/global-modals";
import { SiteLayout } from "@/components/layout/site-layout";
import Script from "next/script";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kitaab Kharido — Premium Second-Hand Books",
  description:
    "Premium second-hand books for JEE, NEET, UPSC, CAT, GATE and beyond. Up to 60% off on academic books. Buy and sell used books at the best prices.",
  keywords: [
    "Kitaab Kharido",
    "second hand books",
    "used books India",
    "JEE books",
    "NEET books",
    "UPSC books",
    "CAT books",
    "GATE books",
    "buy used books",
    "sell old books",
  ],
  icons: {
    icon: "/favicon.png",
  },
  verification: {
    google: "zSxPwFSUyM_S3ax4lMX1hMr1MpH53r8ktkOg6xcbAQk",
  },
  alternates: {
    canonical: "https://kitaab-kharidoo.vercel.app",
  },
  openGraph: {
    title: "Kitaab Kharido — Premium Second-Hand Books",
    description:
      "Premium second-hand books for JEE, NEET, UPSC, CAT, GATE and beyond. Up to 60% off on academic books. Buy and sell used books at the best prices.",
    url: "https://kitaab-kharidoo.vercel.app",
    siteName: "Kitaab Kharido",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} font-sans antialiased`}>
        {/* Google Analytics tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Z371VT292L"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z371VT292L');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Kitaab Kharido",
              "url": "https://kitaabkharido.qd.je",
              "logo": "https://kitaabkharido.qd.je/logo.png",
              "description": "Premium second-hand books for JEE, NEET, UPSC, CAT, GATE and beyond. Up to 60% off on academic books. Buy and sell used books at the best prices.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "West Bengal",
                "addressCountry": "IN"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-93824-70919",
                "contactType": "customer service",
                "email": "kitaabkharido41@gmail.com"
              },
              "sameAs": [
                "https://wa.me/919382470919"
              ]
            })
          }}
        />
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
          <GlobalModals />
        </AuthProvider>
        <Toaster
          position="top-center"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: "#0f1730",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );
}
