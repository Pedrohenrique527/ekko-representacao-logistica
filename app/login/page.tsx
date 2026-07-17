import { getAuthenticatedUser } from "@/lib/auth";
import { LoginView } from "@/app/login/login-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAuthenticatedUser()) redirect("/");
  return <LoginView defaultEmail="representacao@ekkorevestimentos.com.br" />;
}
