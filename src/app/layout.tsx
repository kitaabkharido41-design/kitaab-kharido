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
  title: "Second Hand Books — Kitaab Kharido",
  description:
    "Affordable second-hand books for JEE, NEET, UPSC, CAT, GATE and beyond. Up to 60% off on academic books. Buy and sell used books at the best prices.",
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
    google: "vKVE4nfzVCQjZfPUIzqPxwg9UyKe1gJxKOgCdEo9Mh0",
  },
  alternates: {
    canonical: "https://kitaab-kharidoo.vercel.app",
  },
  openGraph: {
    title: "Second Hand Books — Kitaab Kharido",
    description:
      "Affordable second-hand books for JEE, NEET, UPSC, CAT, GATE and beyond. Up to 60% off on academic books. Buy and sell used books at the best prices.",
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
              "description": "Affordable second-hand books for JEE, NEET, UPSC, CAT, GATE and beyond. Up to 60% off on academic books. Buy and sell used books at the best prices.",
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
          {/* Floating WhatsApp Support Button */}
          <a
            href="https://wa.me/919382470919"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center size-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20ba5a] hover:scale-110 active:scale-95 transition-all duration-300 group"
            aria-label="Contact support on WhatsApp"
          >
            <svg
              className="size-7 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.161.001 6.132 1.233 8.368 3.472 2.235 2.24 3.461 5.21 3.46 8.372-.003 6.536-5.328 11.86-11.859 11.86-2.007-.001-3.98-.513-5.736-1.489L0 24zm6.49-3.414c1.657.982 3.197 1.485 4.903 1.487 5.394 0 9.782-4.385 9.785-9.78.001-2.612-1.015-5.07-2.862-6.918C16.475 3.527 14.017 2.51 11.4 2.512c-5.394 0-9.78 4.384-9.782 9.78-.001 1.838.503 3.379 1.492 4.981L2.12 21.874l4.427-1.288zm12.193-5.282c-.328-.164-1.939-.956-2.267-1.076-.328-.12-.569-.18-.809.18-.24.359-.93 1.176-1.139 1.416-.21.24-.419.27-.747.104-.328-.164-1.385-.511-2.64-1.63-1.002-.895-1.678-2.002-1.875-2.33-.197-.328-.021-.505.143-.668.147-.147.328-.383.492-.574.164-.191.219-.328.328-.546.11-.218.055-.41-.027-.574-.082-.164-.809-1.94-.107-2.65-.296-.296-.582-.256-.801-.256-.208-.005-.449-.007-.69-.007-.843 0-1.492.316-1.875.698-.383.383-1.488 1.455-1.488 3.548 0 2.093 1.523 4.113 1.732 4.39.21.277 3.003 4.585 7.273 6.427 1.016.438 1.808.699 2.425.895 1.022.324 1.951.278 2.685.169.818-.12 1.939-.792 2.213-1.52.274-.728.274-1.352.191-1.485-.082-.132-.301-.213-.629-.377z" />
            </svg>
            <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#0f1730] border border-white/10 text-white text-xs font-semibold py-1.5 px-3 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100">
              Support
            </span>
          </a>
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
