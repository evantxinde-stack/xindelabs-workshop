import type { Metadata } from "next";
import { Caveat, Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { PixelScripts } from "@/lib/pixels";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://xindelabs.web.id"),
  title: {
    default: "XindeLabs — Personal Branding, AI Agent, dan Digital Business",
    template: "%s · XindeLabs",
  },
  description:
    "XindeLabs bantu lo bangun personal branding, sistem AI agent, dan digital business yang jalan sendiri — kelas, workshop, dan pendampingan.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pixels = await PixelScripts();
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${jetbrains.variable} ${spaceGrotesk.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {pixels}
        {children}
      </body>
    </html>
  );
}
