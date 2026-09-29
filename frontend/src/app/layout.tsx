import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import MigrationRunner from "@/components/ui/MigrationRunner";
import CookieConsent from "@/components/ui/CookieConsent";
import PageResilience from "@/components/ui/PageResilience";
import ScrollToTop from "@/components/ui/ScrollToTop";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#6B1A2A",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Elite Tamil Matrimony — The No.1 Tamil Matrimony Site",
    template: "%s | Elite Tamil Matrimony",
  },
  description:
    "Elite Tamil Matrimony — The most trusted Tamil matrimony platform. Find your perfect Tamil match today. Genuine profiles, trusted matchmaking.",
  keywords: [
    "Tamil matrimony",
    "Tamil marriage",
    "Tamil brides",
    "Tamil grooms",
    "Tamil wedding",
    "Chennai matrimony",
    "Coimbatore matrimony",
    "Tamil Nadu matrimony",
    "NRI Tamil matrimony",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elite Tamil Matrimony",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://elitetamilmatrimony.com",
    siteName: "Elite Tamil Matrimony",
    title: "Elite Tamil Matrimony — The No.1 Tamil Matrimony Site",
    description: "Trusted Tamil matrimony platform. Find your perfect match with genuine, verified profiles.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lato.variable} data-scroll-behavior="smooth">
      <head>
        {/* Favicon — Elite Tamil Matrimony transparent logo */}
        <link rel="icon" type="image/png" href="/logo-transparent.png" />
        <link rel="shortcut icon" href="/logo-transparent.png" />
        {/* PWA + Apple touch icons */}
        <link rel="apple-touch-icon" href="/logo-transparent.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6B1A2A" />
      </head>
      <body
        className="min-h-screen flex flex-col"
        style={{ fontFamily: "var(--font-lato, 'Lato', sans-serif)" }}
      >
        <AuthProvider>
          <ScrollToTop />
          <PageResilience />
          <MigrationRunner />
          {children}
          <CookieConsent />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: "var(--font-lato, 'Lato', sans-serif)",
                borderRadius: "4px",
                border: "1px solid #DDDDDD",
                fontSize: "14px",
                maxWidth: "calc(100vw - 2rem)",

              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
