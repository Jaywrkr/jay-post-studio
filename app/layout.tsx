import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./library-overrides.css";

const geistMono = localFont({
  src: [
    { path: "./fonts/GeistMono-Thin.ttf", weight: "100", style: "normal" },
    { path: "./fonts/GeistMono-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "./fonts/GeistMono-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/GeistMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/GeistMono-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/GeistMono-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/GeistMono-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/GeistMono-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./fonts/GeistMono-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = { title: "JAY POST STUDIO", description: "Un editor editorial para las ideas de JAY." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={geistMono.variable}>
      <body>{children}</body>
    </html>
  );
}
