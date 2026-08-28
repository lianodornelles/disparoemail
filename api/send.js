// POST /api/send  ->  dispara uma campanha
// Body: { "campanhaId": "<uuid>" }
// Autorização: ou um usuário logado (header Authorization: Bearer <token do Supabase>,
// que o app manda sozinho), ou o SEND_SECRET (header x-espelunca-key) pra testes manuais.

import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { renderEmail, renderText } from "../lib/template.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const FROM = process.env.MAIL_FROM || "Espelunca <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "";

export const maxDuration = 60;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

async function autorizado(req) {
  // 1) senha de admin (testes via console/curl)
  if (req.headers["x-espelunca-key"] && req.headers["x-espelunca-key"] === process.env.SEND_SECRET) return true;
  // 2) usuário logado no app (JWT do Supabase)
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (token) {
    const { data, error } = await db.auth.getUser(token);
    if (data?.user && !error) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!(await autorizado(req))) return res.status(401).json({ error: "não autorizado" });

  const { campanhaId } = req.body || {};
  if (!campanhaId) return res.status(400).json({ error: "campanhaId é obrigatório" });

  const { data: c, error: e1 } = await db
    .from("campanhas").select("*").eq("id", campanhaId).single();
  if (e1 || !c) return res.status(404).json({ error: "campanha não encontrada" });

  const { data: rows, error: e2 } = await db.rpc("destinatarios_campanha", { p_id: campanhaId });
  if (e2) return res.status(500).json({ error: "erro ao buscar destinatários: " + e2.message });
  if (!rows || rows.length === 0) return res.status(400).json({ error: "nenhum destinatário" });

  let enviados = 0;
  for (const lote of chunk(rows, 100)) {
    const payload = lote.map((p) => {
      const unsub = `${APP_URL}/api/unsub?t=${p.unsub_token}`;
      return {
        from: FROM,
        to: p.email,
        subject: c.assunto || c.nome,
        html: renderEmail(c, unsub),
        text: renderText(c, unsub),
      };
    });
    const { error } = await resend.batch.send(payload);
    if (error) return res.status(502).json({ error: error.message || String(error), enviados });
    enviados += lote.length;
    await sleep(500);
  }

  await db.from("campanhas")
    .update({ status: "enviada", sent_at: new Date().toISOString(), destinatarios: enviados })
    .eq("id", campanhaId);

  return res.status(200).json({ ok: true, enviados });
}
