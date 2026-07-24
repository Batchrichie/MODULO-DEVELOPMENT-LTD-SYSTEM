import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function loadEnvFile(cwd = process.cwd()) {
  const envPath = path.join(cwd, '.env')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const k = m[1]
    let v = m[2]
    if (v.startsWith("\"") && v.endsWith('\"')) v = v.slice(1, -1)
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1)
    process.env[k] = v
  }
}

// Try load .env in frontend and repo root
loadEnvFile(path.resolve(process.cwd()))
loadEnvFile(path.resolve(process.cwd(), '..'))

import ws from 'ws'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase env variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in environment or .env file.')
  process.exit(2)
}

const supabase = createClient(url, key, { realtime: { transport: ws } })

async function main() {
  const { data, error } = await supabase.schema('api').rpc('tax_rates_get')
  if (error) {
    console.error('RPC error:', error)
    process.exit(1)
  }

  console.log('tax_rates_get result:')
  console.log(JSON.stringify(data, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
