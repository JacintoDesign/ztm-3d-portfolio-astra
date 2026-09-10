import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { C } from "@/lib/world";
import "./globals.css";
export const metadata: Metadata = {
  title: "Jacinto Design — 終電 / Last Train",
  description:
    "Design-led. Engineering-true. Built for the dark. A walkable portfolio: 3am in Tokyo. You have just missed the last train. Neon reflections on wet pavement.",
  icons: {
    icon: "/android-chrome-192x192.png",
    apple: "/android-chrome-192x192.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: C.void,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const colors = Object.fromEntries(
    Object.entries(C).map(([key, value]) => [`--${key}`, value]),
  ) as CSSProperties;
  return (
    <html lang="en" style={colors}>
      <body>{children}</body>
    </html>
  );
}
