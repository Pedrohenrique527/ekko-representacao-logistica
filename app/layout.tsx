import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Ekko Representação Logística", template: "%s | Ekko Representação Logística" },
  description: "Gestão inteligente e Business Intelligence para pedidos de representação da Ekko Revestimentos.",
  icons: { icon: "/ekko-logo.png", shortcut: "/ekko-logo.png", apple: "/ekko-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
