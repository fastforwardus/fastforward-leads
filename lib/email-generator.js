import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const SEQUENCE_DELAYS = [0, 2, 1, 2, 3, 4]

function detectLanguage(message = '') {
  const text = message.toLowerCase()
  const ptWords = ['quero','preciso','obrigado','produto','brasil','minha','nosso','como posso','gostaria']
  const enWords = ['company','food','register','need','help','product','export','import','how','want','looking','hello','hi']
  const esWords = ['necesito','quiero','producto','exportar','nuestra','ayuda','hola','buenos','quisiera','tengo']
  const score = (words) => words.filter(w => text.includes(w)).length
  const scores = { es: score(esWords), en: score(enWords), pt: score(ptWords) }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return top[1] > 0 ? top[0] : 'es'
}

// Detecta si el mensaje es de una persona particular (no empresa exportadora)
function isPersonalInquiry(message = '') {
  const text = message.toLowerCase()
  const personalKeywords = [
    // español
    'familiar','familia','amigo','amiga','hermano','hermana','mamá','mama','papá','papa',
    'enviar a','mandar a','regalo','regalito','dulces','medicamento','medicina','pastillas',
    'paquete personal','mi hijo','mi hija','mis hijos',
    // english
    'friend','family','relative','mother','father','brother','sister','personal','gift',
    'candy','candies','medicine','medication','send to my','package to',
    // portugues
    'amigo','familiar','presente','remédio','medicamento','minha família','meu filho'
  ]
  return personalKeywords.some(w => text.includes(w))
}

const PERSONAL_REPLY = {
  es: {
    subject: 'Re: Tu consulta a FastForward',
    body: 'Hola,\n\nLo siento, parece que ha llegado por error. Somos una empresa que ayuda a compañías a exportar sus productos en grandes cantidades a Estados Unidos.\n\nDe todos modos, gracias por contactarnos. Puede encontrar más información en la página oficial de la FDA (www.fda.gov).\n\nSaludos,\nCarlos | FastForward LLC',
    lang: 'es'
  },
  en: {
    subject: 'Re: Your FastForward inquiry',
    body: 'Hello,\n\nIt seems your message may have arrived by mistake. We are a company that helps businesses export their products in large quantities to the United States.\n\nEither way, thank you for reaching out. You can find more information on the official FDA website (www.fda.gov).\n\nBest regards,\nCarlos | FastForward LLC',
    lang: 'en'
  },
  pt: {
    subject: 'Re: Sua consulta à FastForward',
    body: 'Olá,\n\nParece que sua mensagem chegou por engano. Somos uma empresa que ajuda companhias a exportar seus produtos em grandes quantidades para os Estados Unidos.\n\nDe qualquer forma, obrigado pelo contato. Você pode encontrar mais informações no site oficial da FDA (www.fda.gov).\n\nAtenciosamente,\nCarlos | FastForward LLC',
    lang: 'pt'
  }
}

const LANG_INSTRUCTIONS = {
  es: 'Escribir en español. Tuteo. Tono profesional pero cercano.',
  en: 'Write in English. Use "you". Professional but warm tone.',
  pt: 'Escrever em português brasileiro. Usar "você". Tom profissional e próximo.'
}

export async function generateEmail(lead, step) {
  const lang = detectLanguage(lead.message)

  // Si es consulta particular, devolver respuesta estándar sin llamar a la IA
  if (step === 0 && isPersonalInquiry(lead.message)) {
    return PERSONAL_REPLY[lang] || PERSONAL_REPLY.es
  }

  const config = getStepConfig(step, lang)

  const prompt = `You are the assistant of Carlos, CEO of FastForward LLC, a Miami consultancy helping Latin American businesses enter the U.S. market: FDA compliance, LLC formation, trademark registration. 1,000+ food companies helped.

LEAD DATA:
- Name: ${lead.name}
- Company: ${lead.company || 'not specified'}
- Their original form message: "${lead.message || ''}"
- Email step: ${step + 1} of the sequence

EMAIL OBJECTIVE (step ${step}):
${config.objective}

CRITICAL RULES:
- ${LANG_INSTRUCTIONS[lang]}
- Body: MAX 110 words
- Personalize using what they wrote — reference something specific from their message
- CTA link: https://ffus.link/Video (this is a booking link to schedule a free call — do NOT describe it as a video)
- NO spam words: free, offer, urgent, guaranteed
- NO bullet points — flowing prose only
- NO mention of Amazon
- Signature line: Carlos | FastForward LLC
- Reply with ONLY raw JSON, no markdown, no explanation

JSON format:
{
  "subject": "email subject (max 55 chars, personalized)",
  "body": "full email body with \\n for line breaks",
  "lang": "${lang}"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20251001',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].text.trim()
  try {
    return JSON.parse(text)
  } catch {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  }
}

function getStepConfig(step, lang) {
  const objectives = {
    es: [
      `Email de bienvenida inmediato. Agradecer brevemente, demostrar que leíste su consulta, invitar a agendar una llamada gratis usando el link. Sos exactamente el experto que necesitan.`,
      `Follow-up #1. No agendaron. Conectar su consulta con un resultado que logramos para empresa similar. Genérico pero creíble. CTA: agendar.`,
      `Follow-up #2. Dar UN insight técnico relevante a su consulta (FDA, LLC, registros). Hacer pregunta puntual para provocar respuesta. CTA: agendar.`,
      `Follow-up #3. Social proof: +1,000 empresas ayudadas. Urgencia suave: procesos FDA toman tiempo, empezar antes = ventaja. CTA: agendar.`,
      `Email de ruptura amable. Preguntar si siguen interesados o si cambió algo. Sin presión. CTA: agendar o responder.`,
      `Último email. Corto, sin presión. Avisar que es el último contacto. Dejar el link por si lo necesitan después.`
    ],
    en: [
      `Welcome email, sent immediately. Thank them briefly, show you read their inquiry, invite them to book a free call using the link. Convey you're exactly the expert they need.`,
      `Follow-up #1. They haven't booked. Connect their inquiry to a result we achieved for a similar company. General but credible. CTA: book the call.`,
      `Follow-up #2. Share ONE technical insight relevant to their inquiry (FDA, LLC, registrations). Ask a pointed question to prompt a reply. CTA: book to discuss.`,
      `Follow-up #3. Social proof: 1,000+ companies helped. Soft urgency: FDA processes take time, starting earlier = advantage. CTA: book.`,
      `Break-up email. Ask directly if they're still interested or if something changed. No pressure. CTA: book or reply.`,
      `Final email. Short, no pressure. Last message. Leave the link for when they're ready.`
    ],
    pt: [
      `Email de boas-vindas imediato. Agradecer brevemente, mostrar que leu a consulta, convidar para agendar uma chamada grátis pelo link.`,
      `Follow-up #1. Não agendaram. Conectar a consulta a resultado de empresa similar. Genérico mas crível. CTA: agendar.`,
      `Follow-up #2. Dar UM insight técnico relevante (FDA, LLC, registros). Fazer pergunta pontual para gerar resposta. CTA: agendar.`,
      `Follow-up #3. Prova social: +1.000 empresas ajudadas. Urgência suave: FDA leva tempo, começar antes = vantagem. CTA: agendar.`,
      `Email de ruptura amigável. Perguntar se ainda há interesse ou se algo mudou. Sem pressão. CTA: agendar ou responder.`,
      `Último email. Curto, sem pressão. Deixar o link para quando estiverem prontos.`
    ]
  }
  const langObjectives = objectives[lang] || objectives.es
  return { objective: langObjectives[step] || langObjectives[langObjectives.length - 1] }
}

export function getNextEmailDate(step) {
  const delay = SEQUENCE_DELAYS[step + 1]
  if (delay === undefined) return null
  const next = new Date()
  next.setDate(next.getDate() + delay)
  next.setHours(14, 0, 0, 0)
  return next
}
