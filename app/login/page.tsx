import { getAuthenticatedUser } from "@/lib/auth";
import { LoginView } from "@/app/login/login-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; loggedOut?: string }>;
}) {
  if (await getAuthenticatedUser()) redirect("/");
  const params = await searchParams;
  const notice =
    params.reason === "expired"
      ? "expired"
      : params.loggedOut === "1"
        ? "logged-out"
        : undefined;
  return (
    <LoginView
      defaultEmail=""
      notice={notice}
    />
  );
}
