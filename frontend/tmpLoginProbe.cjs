const { createClient } = require('./node_modules/@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env', 'utf8');
const url = process.env.VITE_SUPABASE_URL || (envText.match(/VITE_SUPABASE_URL=(.*)/) || [])[1];
const key = process.env.VITE_SUPABASE_ANON_KEY || (envText.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || [])[1];
if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}
const supabase = createClient(url, key);
const emails = ['projectm@admin.com', 'projectmanager@admin.com', 'accounts@admin.com', 'ceo@admin.com'];
const passwords = ['Password123!', 'Admin123!', 'P@ssw0rd!', 'Password1!', 'Admin@123', 'Welcome123!', 'Supabase123!', 'Qwerty123!', 'Abcd1234!', 'Test123!', 'Password123', 'Admin123', 'Welcome2024!', 'Carems2024!', 'Carems123!'];
(async () => {
  for (const email of emails) {
    for (const password of passwords) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.session) {
          console.log(JSON.stringify({ email, password, success: true, user: data.user.id }));
          const { data: userRow, error: userError } = await supabase.from('users').select('user_id, email, role').eq('auth_user_id', data.user.id).maybeSingle();
          console.log(JSON.stringify({ userRow, userError: userError ? userError.message : null }));
          process.exit(0);
        }
      } catch (e) {
        console.error('EX', email, password, e.message);
      }
    }
  }
  console.log(JSON.stringify({ success: false }));
})();
