CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  source TEXT,
  lang TEXT DEFAULT 'es',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'booked', 'unsubscribed', 'bounced')),
  email_step INTEGER DEFAULT 0,
  next_email_at TIMESTAMPTZ,
  last_email_sent_at TIMESTAMPTZ,
  calendly_event_id TEXT,
  booked_at TIMESTAMPTZ,
  UNIQUE(email)
);

CREATE INDEX idx_leads_cron ON leads (status, next_email_at)
WHERE status = 'active';

CREATE TABLE email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id),
  step INTEGER,
  subject TEXT,
  resend_id TEXT,
  status TEXT DEFAULT 'sent'
);
