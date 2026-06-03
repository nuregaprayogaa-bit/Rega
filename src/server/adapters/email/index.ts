import "server-only";

// Adapter email sederhana & pluggable.
// - Jika RESEND_API_KEY diset, kirim via Resend (https://resend.com) lewat fetch.
// - Jika tidak, email hanya dicetak ke log (mode dev/demo) agar app tetap jalan.
// Pengiriman bersifat best-effort: kegagalan email TIDAK boleh menggagalkan alur utama.

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.info(`[email:log] → ${msg.to} | ${msg.subject}`);
      return;
    }
    const from = process.env.EMAIL_FROM || "Worq <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) {
      console.error("[email] gagal kirim:", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[email] error:", e);
  }
}

/** Bungkus konten dalam template HTML sederhana ber-merek Worq. */
export function emailTemplate(opts: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<a href="${appUrl}${opts.ctaUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;margin-top:16px">${opts.ctaLabel}</a>`
      : "";
  return `
  <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <p style="font-size:20px;font-weight:700;color:#0f766e;margin:0 0 16px">Worq</p>
    <h1 style="font-size:18px;margin:0 0 8px">${opts.heading}</h1>
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0">${opts.body}</p>
    ${cta}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="font-size:12px;color:#94a3b8;margin:0">Email ini dikirim otomatis oleh Worq — marketplace jasa freelance Indonesia.</p>
  </div>`;
}
