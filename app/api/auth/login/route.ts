import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  remember: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Informe o e-mail e a senha corretamente." }, { status: 400 });
    if (!process.env.APP_LOGIN_EMAIL || !process.env.APP_LOGIN_PASSWORD_HASH || !process.env.AUTH_SECRET) {
      return NextResponse.json({ message: "O acesso ainda não foi configurado no servidor." }, { status: 503 });
    }
    const user = await verifyCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ message: "E-mail ou senha incorretos." }, { status: 401 });
    }
    const session = await createSessionToken(parsed.data.email, parsed.data.remember);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.maxAge));
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ message: "Não foi possível entrar. Tente novamente." }, { status: 500 });
  }
}
