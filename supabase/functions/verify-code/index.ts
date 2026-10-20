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
  if (!user) return json({ error: 'Not signed in' }, 401)

  const { code } = await req.json().catch(() => ({}))
  if (!/^\d{5}$/.test(String(code || ''))) return json({ error: 'Enter the 5-digit code.' }, 400)

  const { data: row } = await admin.from('email_codes').select('*').eq('user_id', user.id).maybeSingle()
  if (!row) return json({ error: 'No code found. Request a new one.' }, 400)
  if (new Date(row.expires_at) < new Date()) return json({ error: 'Code expired. Request a new one.' }, 400)
  if (row.attempts >= 5) return json({ error: 'Too many attempts. Request a new code.' }, 429)

  if ((await sha256(`${user.id}:${code}`)) !== row.code_hash) {
    await admin.from('email_codes').update({ attempts: row.attempts + 1 }).eq('user_id', user.id)
    return json({ error: 'Incorrect code.' }, 400)
  }

  await admin.from('profiles').update({ email_verified: true }).eq('id', user.id)
  await admin.from('email_codes').delete().eq('user_id', user.id)
  return json({ ok: true })
})
