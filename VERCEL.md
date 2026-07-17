# Hospedagem na Vercel

O projeto utiliza Next.js, PostgreSQL Neon e autenticação própria com sessão protegida. O histórico de importações fica no banco e não é perdido em novos deploys.

## Variáveis obrigatórias

- `DATABASE_URL`: conexão PostgreSQL do Neon.
- `APP_LOGIN_EMAIL`: e-mail autorizado para o login.
- `APP_LOGIN_PASSWORD_HASH`: hash PBKDF2 da senha; nunca grave a senha no GitHub.
- `AUTH_SECRET`: segredo aleatório usado para assinar as sessões.

## Configuração

- Framework: Next.js
- Build: `npm run build:vercel`
- Node.js: 22 ou superior

Todos os segredos devem ser cadastrados nas variáveis protegidas da Vercel, nunca em arquivos enviados ao GitHub.
