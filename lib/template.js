// Template do e-mail Espelunca — versão HTML + texto puro (melhor entregabilidade).
// Recebe a campanha (c) e a URL de descadastro única daquele destinatário.

// ── LOGO ──────────────────────────────────────────────────────────────
// Quando você hospedar a logo (ex.: subir logo.png na pasta /public do repo,
// ela fica em https://disparoemail.vercel.app/logo.png), cole a URL aqui.
// Deixando vazio, usa o texto "ESPELUNCA" como logo.
const LOGO_URL = "https://disparoemail.vercel.app/logo.png";

// ── CORES DA MARCA (Espelunca: rosa #E9195B + azul-noite #010417) ─────
// Ajuste aqui pra reskin rápido do e-mail inteiro.
const BRAND = {
  bg: "#010417",       // azul-noite (fundo externo)
  card: "#0a0e26",     // card (leve lift do azul-noite)
  border: "#24284c",
  accent: "#E9195B",   // rosa Espelunca
  cta: "#E9195B",      // botão
  ctaText: "#ffffff",
  title: "#f6eef2",
  text: "#cbc9da",
  muted: "#8b8fac",
  footer: "#5a5f82",
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])
  );
}

function fmtData(iso) {
  if (!iso) return "data a definir";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  return isNaN(d) ? iso : d.toLocaleDateString("pt-BR");
}

export function renderEmail(c, unsubUrl) {
  const B = BRAND;
  const nome = c.nome || "Nome do evento";
  const data = fmtData(c.data_evento);
  const texto = esc(c.texto || "").replace(/\n/g, "<br>");
  const link = c.link_shotgun || "#";
  const hasLink = !!c.link_shotgun;
  const flyer = c.flyer_url
    ? `<tr><td align="center" style="padding:14px 30px 2px;"><img src="${esc(c.flyer_url)}" alt="${esc(nome)}" style="display:block;width:100%;max-width:540px;height:auto;border-radius:12px;border:1px solid ${B.border};margin:0 auto;"></td></tr>`
    : "";

  const logo = LOGO_URL
    ? `<img src="${esc(LOGO_URL)}" alt="Espelunca" width="240" style="display:block;width:240px;max-width:72%;height:auto;border:0;margin:0 auto;">`
    : `<span style="display:inline-block;background:${B.accent};color:${B.bg};font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:18px;padding:7px 14px;border-radius:8px;">Espelunca</span>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:${B.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${B.bg};padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${B.card};border:1px solid ${B.border};border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center" style="padding:30px 30px 6px;">${logo}</td></tr>
    <tr><td align="center" style="padding:10px 30px 0;">
      <div style="color:${B.muted};font-size:11px;letter-spacing:.22em;text-transform:uppercase;">${esc(data)}</div>
      <h1 style="color:${B.title};font-size:30px;line-height:1.15;margin:8px 0 0;font-weight:800;">${esc(nome)}</h1>
    </td></tr>
    <tr><td style="padding:18px 30px 6px;color:${B.text};font-size:15px;line-height:1.65;">${texto}</td></tr>
    ${flyer}
    <tr><td align="center" style="padding:22px 30px 8px;">
      <a href="${esc(link)}" style="display:inline-block;background:${B.cta};color:${B.ctaText};text-decoration:none;font-weight:800;font-size:15px;padding:14px 30px;border-radius:10px;letter-spacing:.02em;">Garantir ingresso &rarr;</a>
      ${hasLink ? `<div style="color:${B.muted};font-size:11px;margin-top:10px;">via Shotgun</div>` : ``}
    </td></tr>
    <tr><td style="padding:26px 30px 26px;border-top:1px solid ${B.border};">
      <div style="color:${B.footer};font-size:11px;line-height:1.6;">
        Você recebe este e-mail porque entrou em contato com os eventos da Espelunca.<br>
        <a href="${esc(unsubUrl)}" style="color:${B.muted};">Descadastrar</a> &middot; Espelunca &middot; Porto Alegre/BR
      </div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

// Versão em texto puro — enviada junto do HTML. Ajuda a cair menos em "promoções"/spam.
export function renderText(c, unsubUrl) {
  const nome = c.nome || "Evento";
  const data = fmtData(c.data_evento);
  const linkLine = c.link_shotgun ? `Ingressos: ${c.link_shotgun}\n\n` : "";
  return `ESPELUNCA

${nome} — ${data}

${(c.texto || "").trim()}

${linkLine}—
Você recebe este e-mail porque entrou em contato com os eventos da Espelunca.
Descadastrar: ${unsubUrl}`;
}
