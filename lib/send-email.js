import { Resend } from 'resend'

const FROM     = 'Carlos | FastForward <info@fastfwdus.com>'
const REPLY_TO = 'info@fastfwdus.com'

const LOGO_WHITE_H = 'https://fastfwdus.com/wp-content/uploads/2025/04/logorwhitehorizontal.png'
const LOGO_SQUARE  = 'https://fastfwdus.com/wp-content/uploads/2025/03/fastforward-logo.png.png'

const CTA_LABELS = {
  es: '📅 Agendar Llamada Gratis →',
  en: '📅 Book a Free Call →',
  pt: '📅 Agendar Chamada Grátis →'
}

const FOOTER_UNSUB = {
  es: 'Recibís este email porque completaste un formulario en nuestro sitio.',
  en: 'You received this email because you submitted a form on our website.',
  pt: 'Você recebeu este email porque preencheu um formulário em nosso site.'
}

const UNSUB_TEXT = {
  es: 'Cancelar suscripción',
  en: 'Unsubscribe',
  pt: 'Cancelar inscrição'
}

const ATTACHMENT_LABEL = {
  es: '📎 Adjunto: Presentación FastForward 2026',
  en: '📎 Attached: FastForward 2026 Presentation',
  pt: '📎 Anexo: Apresentação FastForward 2026'
}

export async function sendEmail({ to, subject, body, lang = 'es', attachment = null }) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const htmlBody = body
    .split('\n')
    .map(line => line.trim()
      ? `<p style="margin:0 0 16px 0;line-height:1.75;color:#1e293b;font-size:16px">${line}</p>`
      : '')
    .join('')

  const ctaLabel    = CTA_LABELS[lang]    || CTA_LABELS.es
  const footerMsg   = FOOTER_UNSUB[lang]  || FOOTER_UNSUB.es
  const unsubText   = UNSUB_TEXT[lang]    || UNSUB_TEXT.es
  const attachLabel = ATTACHMENT_LABEL[lang] || ATTACHMENT_LABEL.es

  const attachmentBanner = attachment ? `
    <div style="margin:24px 0;padding:14px 20px;background:#f0f4ff;border-left:4px solid #27295C;border-radius:4px;font-family:Arial,sans-serif;font-size:13px;color:#27295C">
      ${attachLabel}
    </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f8;font-family:'Georgia',serif">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f8;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1c4b 0%,#27295C 60%,#3b3f8c 100%);padding:36px 48px 32px;border-radius:16px 16px 0 0;text-align:center">
              <img src="${LOGO_WHITE_H}" alt="FastForward LLC" width="220" style="display:block;margin:0 auto 20px;max-width:220px;height:auto">
              <p style="margin:0;color:#a5b4e8;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase">U.S. Market Entry Specialists</p>
              <div style="margin:20px auto 0;width:60px;height:2px;background:linear-gradient(90deg,transparent,#6b7fe8,transparent)"></div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:48px;border-left:1px solid #e2e6f0;border-right:1px solid #e2e6f0">
              <div style="font-family:'Georgia',Georgia,serif">
                ${htmlBody}
              </div>
              ${attachmentBanner}
              <div style="margin:32px 0;height:1px;background:linear-gradient(90deg,transparent,#e2e6f0,transparent)"></div>
              <div style="text-align:center;margin:0 0 8px">
                <a href="https://ffus.link/Video" style="display:inline-block;background:linear-gradient(135deg,#27295C,#3b3f8c);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(39,41,92,0.3)">
                  ${ctaLabel}
                </a>
              </div>
              <p style="text-align:center;margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8">
                <a href="https://ffus.link/Video" style="color:#27295C;text-decoration:underline">ffus.link/Video</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#1a1c4b;padding:32px 48px;border-radius:0 0 16px 16px;text-align:center">
              <img src="${LOGO_SQUARE}" alt="FF" width="40" style="display:block;margin:0 auto 16px;height:auto;opacity:0.9">
              <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;color:#6b7fe8;letter-spacing:2px;text-transform:uppercase">
                FDA Compliance &nbsp;·&nbsp; LLC Formation &nbsp;·&nbsp; Trademarks &nbsp;·&nbsp; Amazon
              </p>
              <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:13px;color:#a5b4e8">
                <a href="https://fastfwdus.com" style="color:#ffffff;text-decoration:none;font-weight:600">fastfwdus.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@fastfwdus.com" style="color:#a5b4e8;text-decoration:none">info@fastfwdus.com</a>
                &nbsp;·&nbsp;
                <a href="https://ffus.link/Video" style="color:#a5b4e8;text-decoration:none">Calendly</a>
              </p>
              <div style="margin:0 auto 16px;width:40px;height:1px;background:#2d3070"></div>
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#4a5080;line-height:1.6">
                ${footerMsg}<br>
                <a href="{{unsubscribe_url}}" style="color:#4a5080;text-decoration:underline">${unsubText}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const emailPayload = {
    from: FROM,
    reply_to: REPLY_TO,
    to: [to],
    subject,
    html,
    text: body
  }

  if (attachment) {
    try {
      const res = await fetch(attachment)
      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const filename = lang === 'en' ? 'FastForward-2026-EN.pdf' : 'FastForward-2026-ES.pdf'
      emailPayload.attachments = [{ filename, content: base64 }]
    } catch (e) {
      console.warn('⚠️ No se pudo adjuntar el PDF:', e.message)
    }
  }

  const result = await resend.emails.send(emailPayload)
  if (result.error) throw new Error(`Resend error: ${result.error.message}`)
  return result.data.id
}
