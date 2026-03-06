import { getSupabase } from '@/lib/supabase'
import { generateEmail, getNextEmailDate } from '@/lib/email-generator'
import { sendEmail } from '@/lib/send-email'

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let raw

    if (contentType.includes('application/json')) {
      raw = await request.json()
    } else {
      const text = await request.text()
      raw = Object.fromEntries(new URLSearchParams(text))
    }

    const name    = raw.name    || raw.your_name    || raw.field_name    || 'Sin nombre'
    const email   = raw.email   || raw.your_email   || raw.field_email   || ''
    const phone   = raw.phone   || raw.your_phone   || raw.field_phone   || ''
    const company = raw.company || raw.empresa       || raw.field_company || ''
    const message = raw.message || raw.your_message  || raw.consulta      || ''
    const source  = raw.utm_source || raw.source     || 'website'

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Email inválido' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: lead, error: dbError } = await supabase
      .from('leads')
      .upsert(
        { name, email, phone, company, message, source },
        { onConflict: 'email', ignoreDuplicates: true }
      )
      .select()
      .single()

    if (dbError && dbError.code !== 'PGRST116') throw dbError
    if (!lead) return Response.json({ ok: true, note: 'lead duplicado ignorado' })

    const { subject, body, lang } = await generateEmail(lead, 0)
    const resendId = await sendEmail({ to: email, subject, body, lang })

    await supabase
      .from('leads')
      .update({
        email_step: 1,
        next_email_at: getNextEmailDate(0),
        last_email_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id)

    await supabase.from('email_log').insert({
      lead_id: lead.id, step: 0, subject, resend_id: resendId
    })

    console.log(`✅ Lead creado y email #0 enviado → ${email}`)
    return Response.json({ ok: true, lead_id: lead.id })

  } catch (err) {
    console.error('❌ Error en /api/webhook/lead:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
