import type { Metadata } from "next";
import { LogisticsBIV2 } from "@/components/logistics-bi-v2";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ekko Representação Logística",
  description: "Plataforma corporativa de BI, auditoria e acompanhamento de pedidos de representação.",
};

export default async function Home() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return <LogisticsBIV2 user={user} />;
}
