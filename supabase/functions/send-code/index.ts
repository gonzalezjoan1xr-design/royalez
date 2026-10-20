import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') || ''
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user?.email) return json({ error: 'Not signed in' }, 401)

  const { data: prof } = await admin.from('profiles').select('email_verified').eq('id', user.id).maybeSingle()
  if (prof?.email_verified) return json({ ok: true, already: true })

  const { data: existing } = await admin.from('email_codes').select('sent_at').eq('user_id', user.id).maybeSingle()
  if (existing && Date.now() - new Date(existing.sent_at).getTime() < 60_000) {
    return json({ error: 'Please wait a minute before requesting another code.' }, 429)
  }

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 100000).padStart(5, '0')
  const { error: dbErr } = await admin.from('email_codes').upsert({
    user_id: user.id,
    code_hash: await sha256(`${user.id}:${code}`),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    attempts: 0,
    sent_at: new Date().toISOString(),
  })
  if (dbErr) return json({ error: 'Could not create code' }, 500)

  const html = `
  <div style="background:#000;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:440px;margin:auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;padding:32px;text-align:center;color:#fff">
      <div style="font-size:20px;font-weight:700;color:#22c55e;letter-spacing:.5px">Royal Markets</div>
      <h2 style="margin:22px 0 8px;font-size:20px">Confirm your email</h2>
      <p style="margin:0 0 20px;color:#b3b3b3;font-size:14px">Enter this code to finish creating your Royal Markets account.</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:12px;padding:16px 0 16px 12px;background:#1a1a1a;border-radius:8px;color:#fff">${code}</div>
      <p style="margin:20px 0 0;color:#8c8c8c;font-size:12px">This code expires in 10 minutes. If you didn't sign up for Royal Markets, you can ignore this email.</p>
    </div>
  </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('MAIL_FROM'),
      to: user.email,
      subject: `${code} is your Royal Markets verification code`,
      html,
      text: `Your Royal Markets verification code is ${code}. It expires in 10 minutes.`,
    }),
  })
  if (!res.ok) return json({ error: 'Could not send email' }, 502)

  return json({ ok: true })
})
