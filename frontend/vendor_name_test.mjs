import ws from 'ws'
import { createClient } from '@supabase/supabase-js'
const url = 'https://erinyjxrfectuepshstg.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInJlZiI6ImFyaW55anhyZmVjdHVlcHNoc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Mzg5MzYsImV4cCI6MjEwMDAxNDkzNn0.sg4HbUxK_ac9BM5K_yh7bgy6W25f7W8e4CVa1MjIVKc'
const supabase = createClient(url, key, { realtime: { transport: ws } })

const accountsRes = await supabase.rpc('get_records', { p_resource: 'accounts', p_page: 1, p_limit: 1000 })
console.log('accountsRes error', accountsRes.error)
const rows = Array.isArray(accountsRes.data) ? accountsRes.data : (accountsRes.data?.rows ?? [])
console.log('accounts count', rows.length)
const expenseAccounts = rows.filter((a) => ['Expense', 'Asset'].includes(a.type) && a.is_postable === true)
console.log('expenseAccounts count', expenseAccounts.length)
if (expenseAccounts.length === 0) process.exit(1)
const account = expenseAccounts[0]
console.log('chosen account', account.account_id ?? account.id, account.code, account.name)
const payload = {
  vendor_name: 'Test vendor '+Date.now(),
  amount: 123.45,
  coa_account: account.account_id ?? account.id,
  expense_date: new Date().toISOString().slice(0,10),
}
const createRes = await supabase.rpc('expense_create', { p_payload: payload })
console.log('createRes', JSON.stringify(createRes, null, 2))
if (createRes.error) process.exit(1)
const expensesRes = await supabase.rpc('get_records', { p_resource: 'expenses', p_page: 1, p_limit: 20 })
console.log('expensesRes error', expensesRes.error)
console.log('recent expenses', JSON.stringify(expensesRes.data, null, 2))
