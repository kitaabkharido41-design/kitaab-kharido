import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { GlobalModals } from "@/components/providers/global-modals";
import { SiteLayout } from "@/components/layout/site-layout";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} font-sans antialiased`}>
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
