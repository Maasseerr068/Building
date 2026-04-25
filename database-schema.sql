-- ============================================================
--  صندوق البناية الذكي — Database Schema
--  افتح Supabase > SQL Editor > الصق هذا الكود > Run
-- ============================================================

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  monthly_fee INTEGER NOT NULL DEFAULT 300,
  last_update TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO settings (monthly_fee) VALUES (300) ON CONFLICT DO NOTHING;

-- جدول السكان
CREATE TABLE IF NOT EXISTS residents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  apt_no TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  balance_type TEXT, -- 'prepaid' | 'debt' | 'loan' | null
  role TEXT NOT NULL DEFAULT 'resident', -- 'admin' | 'treasurer' | 'resident'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الصناديق
CREATE TABLE IF NOT EXISTS funds (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'project'
  balance INTEGER NOT NULL DEFAULT 0,
  total_collected INTEGER NOT NULL DEFAULT 0,
  target INTEGER, -- فقط للمشاريع
  per_unit INTEGER,
  units INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- أضف الصندوق الشهري الافتراضي
INSERT INTO funds (name, type, balance, total_collected)
VALUES ('صندوق الاشتراك الشهري', 'monthly', 0, 0)
ON CONFLICT DO NOTHING;

-- جدول العمليات
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL, -- 'income' | 'expense'
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  resident_id INTEGER REFERENCES residents(id) ON DELETE SET NULL,
  fund_id INTEGER REFERENCES funds(id) ON DELETE SET NULL,
  performed_by TEXT NOT NULL, -- 'admin' | 'treasurer'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل Row Level Security (RLS) — اقرأ فقط للجميع
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة والكتابة (Anon Key يمكنه القراءة والكتابة)
CREATE POLICY "allow_all" ON residents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON funds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON settings FOR ALL USING (true) WITH CHECK (true);
