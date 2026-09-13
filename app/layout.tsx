import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "JAY POST STUDIO", description: "A focused editorial post editor for JAY." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
