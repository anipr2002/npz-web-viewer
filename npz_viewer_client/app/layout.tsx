import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { roger } from "@/components/fonts/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NPZ Viewer - Interactive Visualization for NumPy Arrays",
  description:
    "A modern web tool for visualizing and exploring .npy and .npz files with 3D plots, machine learning integration, and data analysis features.",
  keywords: [
    "npz viewer",
    "npy viewer",
    "numpy visualization",
    "data visualization",
    "3D plots",
    "machine learning",
    "data analysis",
    "clustering",
    "PCA",
  ],
  authors: [{ name: "NPZ Viewer Team" }],
  creator: "NPZ Viewer Team",
  publisher: "NPZ Viewer",
  metadataBase: new URL("https://npz-web-viewer.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NPZ Viewer - Interactive Visualization for NumPy Arrays",
    description:
      "A modern web tool for visualizing and exploring .npy and .npz files with 3D plots, machine learning integration, and data analysis features.",
    url: "https://npz-web-viewer.vercel.app",
    siteName: "NPZ Viewer",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NPZ Viewer - Interactive Visualization Tool",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NPZ Viewer - Interactive Visualization for NumPy Arrays",
    description:
      "A modern web tool for visualizing and exploring .npy and .npz files with 3D plots, machine learning integration, and data analysis features.",
    images: ["/twitter-image.jpg"],
    creator: "@npzviewer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "53q4ni_eg8DI77dvH1Fyp318meDHWcIMan8lwndx0E4", // Replace with your actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9495607631905932"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roger.variable} antialiased`}
      >
        {children}
        <Analytics />
        <Toaster richColors />
      </body>
    </html>
  );
}
