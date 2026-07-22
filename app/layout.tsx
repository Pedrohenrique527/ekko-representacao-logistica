import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ekko-representacao-logistica.vercel.app"),
  title: { default: "Ekko Representação Logística", template: "%s | Ekko Representação Logística" },
  description: "Gestão inteligente e Business Intelligence para pedidos de representação da Ekko Revestimentos.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/ekko-logo.png" },
  openGraph: {
    title: "Ekko Representação Logística",
    description: "Business Intelligence para Gestão de Pedidos",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/og.png", width: 1680, height: 941, alt: "Ekko Representação Logística" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ekko Representação Logística",
    description: "Business Intelligence para Gestão de Pedidos",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
