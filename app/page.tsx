import type { Metadata } from "next";
import { LogisticsBIV2 } from "@/components/logistics-bi-v2";
import { redirect } from "next/navigation";
import { getChatGPTUser, isChatGPTUserAllowed } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ekko Representação Logística",
  description: "Plataforma corporativa de BI, auditoria e acompanhamento de pedidos de representação.",
};

export default async function Home() {
  const user = await getChatGPTUser();
  if (!user || !isChatGPTUserAllowed(user)) redirect("/login");
  return <LogisticsBIV2 />;
}
