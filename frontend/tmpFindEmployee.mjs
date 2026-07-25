import fs from 'fs'
import path from 'path'
const envPath = path.resolve('.env')
const envText = fs.readFileSync(envPath, 'utf8')
const url = (envText.match(/VITE_SUPABASE_URL=(.*)/) || [])[1]
const key = (envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || [])[1]
if (!url || !key) {
  console.error('Missing env values')
  process.exit(1)
}
const query = new URLSearchParams({ select: 'user_id,email,role', role: 'eq.Employee' })
const res = await fetch(`${url}/rest/v1/users?${query.toString()}`, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  },
})
console.log('status', res.status)
const text = await res.text()
console.log(text)
