import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ekko Representação Logística", template: "%s | Ekko Representação Logística" },
  description: "Gestão inteligente e Business Intelligence para pedidos de representação da Ekko Revestimentos.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/ekko-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
