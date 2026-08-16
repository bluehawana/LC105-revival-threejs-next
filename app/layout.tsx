import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LC105 Revival — assemble the Land Cruiser by hand",
  description:
    "An interactive 3D tribute to the Toyota Land Cruiser 100 series (LC105). Explode it, scrub the build, and put the icon back together — solid axles, 3-lock transfer case, 1UZ-FE V8.",
  keywords: ["Land Cruiser", "LC105", "three.js", "3D", "exploded view", "Toyota"],
};

export const viewport: Viewport = {
  themeColor: "#0e0f11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
