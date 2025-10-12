import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const interFont = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study App",
  description: "Your AI-powered study partner",
};

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
