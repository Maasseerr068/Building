// ============================================================
//  supabase-config.js
//  ضع هنا مفاتيح Supabase الخاصة بك
// ============================================================

const SUPABASE_URL = 'https://wiekrapbativgdsjtfua.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fEZyPsZV-0SCisSOQZjVWg_NijWBOJF';

// الأكواد السرية للدخول (غيّرها بما تشاء)
const ADMIN_PIN = '1234';
const TREASURER_PIN = '5678';

// تهيئة Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
