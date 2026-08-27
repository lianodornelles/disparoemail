# Espelunca — backend de envio (Fase 2)

Função serverless que dispara uma campanha: busca os destinatários no Supabase
(sem descadastrados, deduplicados), monta o template Espelunca com link de
descadastro por pessoa e envia em lotes pela Resend.

```
api/
  send.js       POST /api/send   -> dispara uma campanha
  unsub.js      GET  /api/unsub  -> descadastra um contato (LGPD)
lib/
  template.js   o e-mail Espelunca (mesmo do protótipo)
sql/
  01_rpc_destinatarios.sql   função que monta a lista de destinatários
  02_seed_teste.sql          dados de teste pra você disparar 1 e-mail
```

## Passo a passo (do zero ao primeiro e-mail)

### 1. Rodar a função SQL no Supabase
No **SQL Editor** da Supabase, rode `sql/01_rpc_destinatarios.sql`. (Uma vez só.)

### 2. Jogar este projeto no seu repositório GitHub (que está vazio)
Na pasta do projeto:

```bash
git init
git add .
git commit -m "backend de envio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
git push -u origin main
```

### 3. Conectar o repo na Vercel
No projeto da Vercel: **Settings → Git** (ou "Import Git Repository") e aponte
pro seu repo. Todo `git push` na `main` faz deploy sozinho. Não precisa de build
nem framework — a Vercel entende a pasta `/api` sozinha.

### 4. Variáveis de ambiente na Vercel
**Settings → Environment Variables** — adicione as 6:

| Nome | Onde pegar |
|---|---|
| `RESEND_API_KEY` | Resend → API Keys (cria uma) |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE` | Supabase → Settings → API → **service_role** (secreta!) |
| `SEND_SECRET` | invente uma senha longa (protege o endpoint) |
| `APP_URL` | a URL do deploy, ex.: `https://seu-app.vercel.app` |
| `MAIL_FROM` | por enquanto: `Espelunca <onboarding@resend.dev>` |

Depois de adicionar, **Redeploy** (a Vercel não aplica env nova sem redeploy).

> **service_role ignora o RLS** — por isso ela fica só aqui no servidor, nunca no front.

### 5. Criar dados de teste
No SQL Editor da Supabase, edite `sql/02_seed_teste.sql` com o **seu** e-mail
(o mesmo da sua conta Resend, enquanto o domínio não verificou) e rode.
Ele devolve um **campanhaId** — copie.

### 6. Disparar o teste
```bash
curl -X POST https://seu-app.vercel.app/api/send \
  -H "Content-Type: application/json" \
  -H "x-espelunca-key: SEU_SEND_SECRET" \
  -d '{"campanhaId":"COLE_O_ID_AQUI"}'
```
Resposta esperada: `{"ok":true,"enviados":1}` e o e-mail Espelunca na sua caixa.
Clique em **Descadastrar** no rodapé pra testar o `/api/unsub` também.

## Quando o domínio verificar
Troque `MAIL_FROM` pra `Espelunca <eventos@espelunca.com.br>` e redeploy.
Aí você pode enviar pra qualquer e-mail, não só o seu.

## Limite pra saber (hardening depois)
Uma função serverless tem tempo máximo (Hobby ~60s). Pra centenas/poucos
milhares por disparo, funciona. Pra listas bem grandes, o próximo passo é
disparar em segundo plano (fila / Vercel Cron) em vez de tudo numa requisição —
a gente encaixa isso quando o volume pedir.
