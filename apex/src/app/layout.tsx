import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PixelScripts } from "@/lib/pixels";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xindelabs.web.id"),
  title: {
    default: "Xinde Labs — Personal Branding, AI Agent, dan Digital Business",
    template: "%s · Xinde Labs",
  },
  description:
    "Xinde Labs bantu lo bangun personal branding, sistem AI agent, dan digital business yang jalan sendiri — kelas, workshop, dan pendampingan.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pixels = await PixelScripts();
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {pixels}
        {children}
      </body>
    </html>
  );
}
