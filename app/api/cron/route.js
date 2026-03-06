import { supabase } from '@/lib/supabase'
import { generateEmail, getNextEmailDate, SEQUENCE_DELAYS } from '@/lib/email-generator'
import { sendEmail } from '@/lib/send-email'

const PRESENTATIONS = {
  es: 'https://fastfwdus.com/wp-content/uploads/2026/03/2026es.pdf',
  en: 'https://fastfwdus.com/wp-content/uploads/2026/03/2026en.pdf',
  pt: 'https://fastfwdus.com/wp-content/uploads/2026/03/2026es.pdf'
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  console.log(`🕐 Cron ejecutado: ${now.toISOString()}`)

  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'active')
      .lte('next_email_at', now.toISOString())
      .not('next_email_at', 'is', null)
      .order('next_email_at', { ascending: true })
      .limit(50)

    if (error) throw error

    console.log(`📬 Leads a procesar: ${leads.length}`)
    const results = []

    for (const lead of leads) {
      try {
        const currentStep = lead.email_step
        const maxSteps = SEQUENCE_DELAYS.length

        if (currentStep >= maxSteps) {
          await supabase
            .from('leads')
            .update({ status: 'unsubscribed', next_email_at: null })
            .eq('id', lead.id)
          continue
        }

        const { subject, body, lang } = await generateEmail(lead, currentStep)

        // Email #1 (día 2) → adjuntar presentación en su idioma
        const attachment = currentStep === 1
          ? PRESENTATIONS[lang] || PRESENTATIONS.es
          : null

        const resendId = await sendEmail({ to: lead.email, subject, body, lang, attachment })

        const nextStep = currentStep + 1
        const nextEmailAt = getNextEmailDate(currentStep)

        await supabase
          .from('leads')
          .update({
            email_step: nextStep,
            next_email_at: nextEmailAt,
            last_email_sent_at: new Date().toISOString()
          })
          .eq('id', lead.id)

        await supabase.from('email_log').insert({
          lead_id: lead.id, step: currentStep, subject, resend_id: resendId
        })

        results.push({ email: lead.email, step: currentStep, status: 'sent' })
        console.log(`✅ Email step ${currentStep} → ${lead.email}`)

        await new Promise(r => setTimeout(r, 500))

      } catch (leadErr) {
        console.error(`❌ Error procesando ${lead.email}:`, leadErr)
        results.push({ email: lead.email, status: 'error', error: leadErr.message })
      }
    }

    return Response.json({ ok: true, processed: results.length, results })

  } catch (err) {
    console.error('❌ Cron error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
