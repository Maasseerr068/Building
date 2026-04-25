# 🏢 صندوق البناية الذكي

## خطوات الإعداد والرفع

---

## الخطوة 1 — إعداد قاعدة البيانات في Supabase

1. افتح **https://supabase.com** وسجّل دخولك
2. افتح مشروعك
3. من القائمة الجانبية اختر **SQL Editor**
4. الصق كامل محتوى ملف `database-schema.sql` واضغط **Run**
5. ستُنشأ جميع الجداول تلقائياً ✓

---

## الخطوة 2 — تغيير الأكواد السرية (اختياري)

افتح ملف `supabase-config.js` وغيّر:
```js
const ADMIN_PIN = '1234';      // كود المدير
const TREASURER_PIN = '5678';  // كود أمين الصندوق
```

---

## الخطوة 3 — إنشاء أيقونات التطبيق

أضف مجلد `icons/` يحتوي على:
- `icon-192.png` (192×192 بكسل)
- `icon-512.png` (512×512 بكسل)

يمكنك استخدام أي موقع مجاني مثل https://realfavicongenerator.net

---

## الخطوة 4 — الرفع على Vercel

### الطريقة السهلة (سحب وإفلات):
1. افتح **https://vercel.com** وسجّل دخولك
2. من الصفحة الرئيسية اضغط **Add New → Project**
3. اختر **"Deploy from existing files"** أو ارفع مجلد المشروع مباشرة
4. اضغط **Deploy** ✓

### عبر GitHub (موصى به):
1. ارفع المجلد على GitHub repository
2. في Vercel اختر **Import Git Repository**
3. اختر الـ repository واضغط Deploy ✓

---

## هيكل الملفات

```
sandooq-albinaya/
├── index.html          # الصفحة الرئيسية
├── style.css           # التصميم
├── app.js              # منطق التطبيق
├── supabase-config.js  # إعدادات قاعدة البيانات
├── sw.js               # Service Worker (PWA)
├── manifest.json       # إعدادات تثبيت التطبيق
├── vercel.json         # إعدادات Vercel
├── database-schema.sql # SQL لإنشاء الجداول
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## الصلاحيات

| الدور | الكود | الصلاحيات |
|-------|-------|-----------|
| مدير | 1234 | تعديل كامل + حفظ + حذف |
| أمين الصندوق | 5678 | تسجيل دفعات + مصاريف |
| ساكن | — | عرض فقط |
