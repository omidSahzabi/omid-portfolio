import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
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
    icon: [{ url: "/images/favicon.png", type: "image/png", sizes: "1254x1254" }],
    shortcut: "/images/favicon.png",
    apple: "/images/favicon.png",
  },
};

export const viewport: Viewport = { themeColor: "#09070D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
