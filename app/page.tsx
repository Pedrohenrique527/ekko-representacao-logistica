import type { Metadata } from "next";
import { LogisticsBIV2 } from "@/components/logistics-bi-v2";

export const metadata: Metadata = {
  title: "Ekko Representação Logística",
  description: "Plataforma corporativa de BI, auditoria e acompanhamento de pedidos de representação.",
};

export default function Home() {
  return <LogisticsBIV2 />;
}
