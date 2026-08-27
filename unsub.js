// GET /api/unsub?t=<unsub_token>  ->  marca o contato como descadastrado (LGPD)

import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export default async function handler(req, res) {
  const token = req.query.t;
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!token) return res.status(400).send(page("Link inválido", "O link de descadastro está incompleto."));

  const { error } = await db.from("contatos").update({ unsubscribed: true }).eq("unsub_token", token);
  if (error) return res.status(500).send(page("Ops", "Não deu pra concluir agora. Tente de novo mais tarde."));

  return res.status(200).send(page("Pronto ✓", "Você não vai mais receber e-mails da Espelunca."));
}

function page(titulo, texto) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Espelunca</title></head>
<body style="margin:0;font-family:system-ui,-apple-system,Arial,sans-serif;background:#0b0b0d;color:#ecebe6;display:grid;place-items:center;min-height:100vh;">
<div style="text-align:center;max-width:420px;padding:24px;">
  <div style="display:inline-block;background:#c9ff3d;color:#0b0b0d;font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:16px;padding:6px 12px;border-radius:8px;transform:rotate(-2deg);">Espelunca</div>
  <h1 style="margin:22px 0 8px;color:#c9ff3d;">${titulo}</h1>
  <p style="color:#8f8f9c;line-height:1.6;">${texto}</p>
</div></body></html>`;
}
