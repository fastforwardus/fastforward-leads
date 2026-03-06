import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/send-email'

export async function POST(request) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)
    const event = payload.event
    const inviteeEmail = payload.payload?.invitee?.email

    if (event !== 'invitee.created' || !inviteeEmail) {
      return Response.json({ ok: true, ignored: true })
    }

    const calendlyEventId = payload.payload?.event?.uuid

    const { data: lead } = await supabase
      .from('leads')
      .update({
        status: 'booked',
        next_email_at: null,
        booked_at: new Date().toISOString(),
        calendly_event_id: calendlyEventId
      })
      .eq('email', inviteeEmail.toLowerCase())
      .select()
      .single()

    if (lead) {
      console.log(`🎉 Lead agendó: ${inviteeEmail}`)

      const confirmations = {
        es: {
          subject: `¡Confirmado! Nos vemos pronto, ${lead.name}`,
          body: `¡Hola ${lead.name}!\n\nTu llamada con Carlos está confirmada.\n\nSi querés, podés enviarnos documentación de tu empresa antes de la llamada para aprovechar mejor el tiempo.\n\nCualquier pregunta, respondé este email.\n\nCarlos | FastForward LLC`
        },
        en: {
          subject: `Confirmed! Talk soon, ${lead.name}`,
          body: `Hi ${lead.name}!\n\nYour call with Carlos is confirmed.\n\nFeel free to send us any company documents beforehand so we can make the most of our time together.\n\nAny questions, just reply to this email.\n\nCarlos | FastForward LLC`
        },
        pt: {
          subject: `Confirmado! Até breve, ${lead.name}`,
          body: `Olá ${lead.name}!\n\nSua chamada com Carlos está confirmada.\n\nSe quiser, pode nos enviar documentos da empresa com antecedência para aproveitarmos melhor o tempo.\n\nQualquer dúvida, responda este email.\n\nCarlos | FastForward LLC`
        }
      }

      const lang = lead.lang || 'es'
      const conf = confirmations[lang] || confirmations.es

      await sendEmail({ to: inviteeEmail, subject: conf.subject, body: conf.body, lang })
    }

    return Response.json({ ok: true, booked: !!lead })

  } catch (err) {
    console.error('❌ Calendly webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
