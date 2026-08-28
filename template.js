// Template do e-mail Espelunca — mesmo do protótipo, agora no servidor.
// Recebe a campanha (c) e a URL de descadastro única daquele destinatário.

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
  const nome = c.nome || "Nome do evento";
  const data = fmtData(c.data_evento);
  const texto = esc(c.texto || "").replace(/\n/g, "<br>");
  const link = c.link_shotgun || "#";
  const hasLink = !!c.link_shotgun;

  return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0b0d;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d;padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#141419;border:1px solid #2a2a33;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
    <tr><td style="padding:26px 30px 8px;">
      <span style="display:inline-block;background:#c9ff3d;color:#0b0b0d;font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:18px;padding:7px 14px;border-radius:8px;">Espelunca</span>
    </td></tr>
    <tr><td style="padding:14px 30px 0;">
      <div style="color:#8f8f9c;font-size:11px;letter-spacing:.22em;text-transform:uppercase;">${esc(data)}</div>
      <h1 style="color:#ecebe6;font-size:30px;line-height:1.15;margin:8px 0 0;font-weight:800;">${esc(nome)}</h1>
    </td></tr>
    <tr><td style="padding:18px 30px 6px;color:#c9c9d2;font-size:15px;line-height:1.65;">${texto}</td></tr>
    <tr><td style="padding:22px 30px 8px;">
      <a href="${esc(link)}" style="display:inline-block;background:#ff2d6f;color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:10px;letter-spacing:.02em;">Garantir ingresso &rarr;</a>
      ${hasLink ? `<div style="color:#8f8f9c;font-size:11px;margin-top:10px;">via Shotgun</div>` : ``}
    </td></tr>
    <tr><td style="padding:26px 30px 26px;border-top:1px solid #2a2a33;">
      <div style="color:#6f6f7c;font-size:11px;line-height:1.6;">
        Você recebe este e-mail porque entrou em contato com os eventos da Espelunca.<br>
        <a href="${esc(unsubUrl)}" style="color:#8f8f9c;">Descadastrar</a> &middot; Espelunca &middot; Porto Alegre/BR
      </div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}
