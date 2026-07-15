import type { Metadata } from "next";
import { LogisticsBI } from "@/components/logistics-bi";

export const metadata: Metadata = {
  title: "LogiSight | Inteligência de Pedidos",
  description: "Plataforma corporativa de BI, auditoria e acompanhamento de pedidos de representação.",
};

export default function Home() {
  return <LogisticsBI />;
}
