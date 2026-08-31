// POST /api/webhook?key=<WEBHOOK_SECRET>
// Recebe os eventos da Resend. Em bounce/reclamação, marca o contato pra não
// receber mais e-mails — é o que protege a reputação e evita a conta ser banida.

import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

function extractEmail(s) {
  const m = String(s || "").match(/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  // autorização por segredo na URL
  if (req.query.key !== process.env.WEBHOOK_SECRET) return res.status(401).json({ error: "não autorizado" });

  const evt = req.body || {};
  const type = evt.type;
  const to = evt?.data?.to;
  const emails = (Array.isArray(to) ? to : [to]).map(extractEmail).filter(Boolean);

  if (type === "email.bounced") {
    const suppress = evt?.data?.bounce?.type === "Permanent"; // permanente = bloqueia já; temporário = conta
    for (const e of emails) await db.rpc("registrar_bounce", { p_email: e, p_suppress: suppress });
  } else if (type === "email.complained") {
    for (const e of emails) await db.rpc("registrar_bounce", { p_email: e, p_suppress: true });
  }
  // outros eventos (delivered, opened, etc.) são ignorados

  return res.status(200).json({ ok: true });
}
