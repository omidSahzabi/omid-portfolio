import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omid Sahzabi — Full-Stack Developer",
  description: "I build web applications that make complex things simple. React, Next.js, TypeScript, Node.js, PostgreSQL, and MongoDB. Explore Omid Sahzabi’s skills and experience.",
  openGraph: {
    title: "Omid Sahzabi — Full-Stack Developer",
    description: "Interfaces, APIs, and databases. I turn real-world processes into practical digital products.",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/images/optimized/icon-48.png", type: "image/png", sizes: "48x48" }],
    shortcut: "/images/optimized/icon-48.png",
    apple: "/images/optimized/icon-180.png",
  },
};

export const viewport: Viewport = { themeColor: "#09070D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
