import fs from 'fs'
import { URLSearchParams } from 'url'
const envText = fs.readFileSync('.env', 'utf8')
const url = (envText.match(/VITE_SUPABASE_URL=(.*)/) || [])[1]
const key = (envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || [])[1]
if (!url || !key) {
  console.error('Missing env values')
  process.exit(1)
}

async function signIn(email, password) {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

async function rpc(token) {
  const res = await fetch(`${url}/rest/v1/rpc/get_my_payslips`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'params=single-object',
    },
    body: JSON.stringify({ p_page: 1, p_limit: 100 }),
  })
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch (e) { body = text }
  return { status: res.status, headers: Object.fromEntries(res.headers), body }
}

for (const account of [
  { role: 'employee', email: 'employee@admin.com', password: 'employee123' },
  { role: 'projectManager', email: 'projectm@admin.com', password: 'projectm123' },
]) {
  console.log('---', account.role, account.email)
  const signInResult = await signIn(account.email, account.password)
  console.log('signIn', signInResult.status, signInResult.body)
  if (signInResult.body?.access_token) {
    const rpcResult = await rpc(signInResult.body.access_token)
    console.log('rpc', rpcResult.status, rpcResult.body)
  }
}
