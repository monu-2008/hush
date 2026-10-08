import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hush — Private Emoji & Image Messages | AQERIONX",
  description:
    "Encrypt a private note inside an emoji, image, QR code, or audio file. Hush runs in your browser with AES-256-GCM. Installable PWA, works offline.",
  keywords: ["encryption", "privacy", "emoji", "steganography", "AES-256", "PWA", "AQERIONX", "Hush"],
  authors: [{ name: "AQERIONX" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hush",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Hush — Private Emoji & Image Messages",
    description: "Encrypt a private note inside an emoji, image, QR code, or audio file. Your message and password stay on your device.",
    siteName: "Hush",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hush — Private Emoji & Image Messages",
    description: "Encrypt a private note inside an emoji, image, QR code, or audio file.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1825" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  );
}
