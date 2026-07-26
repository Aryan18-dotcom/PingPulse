import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SiteAliver — Keep-Alive & Server Monitoring Agent",
  description: "A lightweight, custom keep-alive pinger and monitoring dashboard designed to keep Render services and serverless backends awake 24/7.",
  authors: [{ name: "Aryan Chheda" }],
  creator: "Aryan Chheda",
  keywords: [
    "SiteAliver",
    "Render Keep Alive",
    "Server Monitoring",
    "Pinger Service",
    "Uptime Agent",
    "Next.js Monitor",
    "AeonMatrix",
  ],
  openGraph: {
    title: "SiteAliver — Server Keep-Alive & Health Agent",
    description: "Monitor uptime, measure latency, and keep free-tier hosted apps awake automatically.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SiteAliver — Keep-Alive & Monitoring Agent",
    description: "Automated heartbeat monitoring and instant status alerts for your web applications.",
    creator: "@AryanChheda",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}