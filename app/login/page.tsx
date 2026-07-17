import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser, isChatGPTUserAllowed } from "@/app/chatgpt-auth";
import { LoginView } from "@/app/login/login-view";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getChatGPTUser();
  const allowed = user ? isChatGPTUserAllowed(user) : false;
  return (
    <LoginView
      signInHref={chatGPTSignInPath("/")}
      signOutHref={chatGPTSignOutPath("/login")}
      signedInEmail={user?.email ?? null}
      allowed={allowed}
    />
  );
}
