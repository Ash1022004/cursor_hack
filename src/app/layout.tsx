import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Sehat-Saathi - Digital Psychological Intervention Platform",
    template: "%s | Sehat-Saathi",
  },
  description:
    "A comprehensive digital platform providing psychological interventions and mental health support for college students.",
  keywords: [
    "mental health",
    "psychological intervention",
    "college students",
    "therapy",
    "counseling",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
