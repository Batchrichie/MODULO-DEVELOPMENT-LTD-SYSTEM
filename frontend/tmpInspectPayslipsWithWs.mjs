import fs from 'fs'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'
const envText = fs.readFileSync('.env', 'utf8')
const url = (envText.match(/VITE_SUPABASE_URL=(.*)/) || [])[1]
const key = (envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || [])[1]
if (!url || !key) {
  console.error('Missing env values')
  process.exit(1)
}
const supabase = createClient(url, key, {
  realtime: { transport: ws },
})

async function check(email, password) {
  console.log('---', email)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('signin', { ok: !!data?.session, error: error?.message })
  if (!data?.session) return
  const { data: payload, error: rpcError } = await supabase.schema('api').rpc('get_my_payslips', { p_page: 1, p_limit: 100 })
  console.log('rpcError', rpcError?.message)
  console.log('payloadType', Array.isArray(payload) ? 'array' : typeof payload)
  console.log('payloadLength', Array.isArray(payload) ? payload.length : null)
  console.log(JSON.stringify(payload, null, 2))
}

await check('employee@admin.com', 'employee123')
await check('projectm@admin.com', 'projectm123')
