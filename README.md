# Calculo

Aplicação Next.js (App Router) pronta para Vercel, usando Supabase (Postgres + Storage) como banco e armazenamento de PDFs. Lógica de cálculo idêntica à versão PHP anterior: INPC automático (com fallback), juros mensais (1% a.m. default), geração de PDF e histórico por usuário.

## Stack
- Next.js 14 (App Router, Server Components)
- Supabase (Postgres + Storage)
- pdfkit (geração de PDF no server)
- Tailwind CSS
- Vitest (testes unitários de lógica)

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:
- `SESSION_SECRET` – segredo para assinar cookie de sessão
- `SUPABASE_URL` – URL do seu projeto
- `SUPABASE_SERVICE_ROLE_KEY` – chave Service Role (usada apenas no servidor)
- `SUPABASE_ANON_KEY` – opcional (não é usada no cliente aqui)
- `SUPABASE_PDF_BUCKET` – nome do bucket (default: `pdfs`)

No Vercel, adicione as mesmas variáveis na aba de Environment Variables.

## Banco de dados (Supabase)
Execute o SQL em `supabase/schema.sql` no SQL Editor do Supabase (ou via CLI) para criar as tabelas `users` e `calculos`.

Observação: usamos a Service Role Key no servidor (rotas API) e não ativamos RLS no exemplo. Se desejar ativar RLS, crie policies adequadas e troque o uso de Service Role por ANON + policies.

## Scripts
- `npm run dev` – desenvolvimento
- `npm run build` – build de produção
- `npm start` – start em produção
- `npm test` – testes unitários (Vitest)

## Fluxo principal
1. Cadastro e login simples (senha com scrypt + cookie de sessão assinado)
2. Formulário de cálculo com:
   - valor base, período (início, citação, final)
   - juros mensal (%), início dos juros (opcional)
   - fallback do INPC (%) caso a API esteja indisponível
3. A rota `/api/calculos` processa o cálculo, busca INPC via IBGE (com fallback SIDRA), monta a tabela mês a mês, gera PDF em memória e envia ao Supabase Storage. Em seguida grava o registro em `calculos`.
4. Listagem em `/meus-calculos` e download via `/api/calculos/[id]/download` (redireciona para a URL pública do arquivo no Storage).

## Deploy na Vercel
- Importar o repositório
- Definir as variáveis de ambiente
- Build: `next build`
- Output: padrão do Next.js
