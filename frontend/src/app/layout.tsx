// Author: Tristan Bong
// Page name: layout.tsx
// Page purpose: Root layout wrapper for the entire Study App
// Date created: 14/09/2025

// Input: React children (page content)
// Process: Wraps the app with <html> and <body>, applies global font, and includes the Header
// Output: Full HTML structure for every page with consistent font and persistent Header

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

// Inter font with latin subset for all pages
const interFont = Inter({ subsets: ["latin"] });

// Metadata for SEO and browser tab
export const metadata: Metadata = {
  title: "StudyAI",
  description: "Your AI-powered study partner",
};

// Root layout component
// Function: RootLayout
// Purpose: Wraps the entire app content in HTML structure, applies font, and adds Header
// Input: children: React.ReactNode - the page-specific content
// Process: Wraps children with <html lang="en"> and <body> using Inter font
// Output: HTML structure with Header + main content
export default function RootLayout({
  children: reactChildren,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={interFont.className}>
        <Header />
        <main>{reactChildren}</main>
      </body>
    </html>
  );
}
