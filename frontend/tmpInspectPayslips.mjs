import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const envText = fs.readFileSync('.env', 'utf8')
const url = (envText.match(/VITE_SUPABASE_URL=(.*)/) || [])[1]
const key = (envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || [])[1]
if (!url || !key) {
  console.error('Missing env values')
  process.exit(1)
}
const supabase = createClient(url, key)
const email = 'employee@admin.com'
const password = 'employee123'
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
console.log('signin', { email, ok: !!data?.session, error: error?.message })
if (!data?.session) process.exit(1)
const { data: payload, error: rpcError } = await supabase.schema('api').rpc('get_my_payslips', { p_page: 1, p_limit: 100 })
console.log('rpcError', rpcError?.message)
console.log('payloadType', Array.isArray(payload) ? 'array' : typeof payload)
console.log(JSON.stringify(payload, null, 2))
