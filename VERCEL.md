# Hospedagem na Vercel

O projeto já está preparado para rodar como uma aplicação Next.js na Vercel.

## Caminho mais simples

1. Envie este projeto para um repositório privado no GitHub.
2. Entre em `vercel.com` usando a mesma conta do GitHub.
3. Clique em **Add New > Project** e selecione o repositório.
4. Em **Environment Variables**, cadastre:
   - `DATABASE_URL`: a conexão do banco Neon.
   - `APP_ALLOWED_EMAIL`: `pedromarinho527@gmail.com`.
5. Clique em **Deploy**.
6. Em **Settings > Deployment Protection**, ative a proteção de acesso da Vercel para impedir acesso público.

## Configuração detectada automaticamente

- Framework: Next.js
- Build: `npm run build:vercel`
- Banco: PostgreSQL Neon
- Node.js: 22 ou superior

Nunca coloque a senha do banco em arquivos enviados ao GitHub. Ela deve existir somente nas variáveis protegidas da Vercel.
