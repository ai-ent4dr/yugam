import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "YUGMA AI — Where Two Journeys Meet",
  description:
    "Explore relationship compatibility, traditional Jataka-style insights, numerology archetypes, and AI-generated relationship guidance for two people.",
  keywords: [
    "Yugma AI",
    "relationship compatibility",
    "Jataka reading",
    "Kundli analysis",
    "numerology compatibility",
    "traditional palmistry",
  ],
  authors: [{ name: "Yugma AI Team" }],
  openGraph: {
    title: "YUGMA AI — Where Two Journeys Meet",
    description:
      "Explore relationship compatibility, traditional Jataka-style insights, and AI-assisted couple guidance.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#070b16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
