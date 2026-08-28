// POST /api/send  ->  dispara uma campanha
// Body: { "campanhaId": "<uuid da campanha>" }
// Header: x-espelunca-key: <SEND_SECRET>   (protege o endpoint)

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { renderEmail } from "../lib/template.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

// Enquanto o domínio não estiver verificado na Resend, deixe FROM como
// "Espelunca <onboarding@resend.dev>" e envie SÓ pro e-mail da sua conta Resend.
// Quando o domínio verificar, troque pelo seu (ex.: eventos@espelunca.com.br).
const FROM = process.env.MAIL_FROM || "Espelunca <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "";

// Vercel: dá mais fôlego pro envio (Hobby até 60s; Pro pode mais).
export const maxDuration = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // auth simples por segredo compartilhado
  if (req.headers["x-espelunca-key"] !== process.env.SEND_SECRET)
    return res.status(401).json({ error: "não autorizado" });

  const { campanhaId } = req.body || {};
  if (!campanhaId) return res.status(400).json({ error: "campanhaId é obrigatório" });

  // 1. carrega a campanha
  const { data: c, error: e1 } = await db
    .from("campanhas").select("*").eq("id", campanhaId).single();
  if (e1 || !c) return res.status(404).json({ error: "campanha não encontrada" });

  // 2. destinatários: únicos, sem descadastrados, dos nichos escolhidos (via função SQL)
  const { data: rows, error: e2 } = await db.rpc("destinatarios_campanha", { p_id: campanhaId });
  if (e2) return res.status(500).json({ error: "erro ao buscar destinatários: " + e2.message });
  if (!rows || rows.length === 0) return res.status(400).json({ error: "nenhum destinatário" });

  // 3. envia em lotes de 100 (limite do batch da Resend), com pausa pra respeitar rate limit
  let enviados = 0;
  for (const lote of chunk(rows, 100)) {
    const payload = lote.map((p) => ({
      from: FROM,
      to: p.email,
      subject: c.assunto || c.nome,
      html: renderEmail(c, `${APP_URL}/api/unsub?t=${p.unsub_token}`),
    }));
    const { error } = await resend.batch.send(payload);
    if (error) return res.status(502).json({ error: error.message || String(error), enviados });
    enviados += lote.length;
    await sleep(500);
  }

  // 4. marca a campanha como enviada
  await db.from("campanhas")
    .update({ status: "enviada", sent_at: new Date().toISOString(), destinatarios: enviados })
    .eq("id", campanhaId);

  return res.status(200).json({ ok: true, enviados });
}
