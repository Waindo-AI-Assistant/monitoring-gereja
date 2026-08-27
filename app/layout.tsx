import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gereja Gerakan Pentakosta",
  description:
    "Platform pemantauan dan analisis data spasial untuk mendukung pemetaan, pemantauan jemaat, dan sebaran lokasi gereja secara terpadu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
