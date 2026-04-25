// ============================================================
//  app.js — صندوق البناية الذكي
//  منطق التطبيق الكامل مع Supabase
// ============================================================

// ===== STATE =====
let appState = {
  role: null,       // 'admin' | 'treasurer' | 'resident'
  currentPage: 'dash',
  residents: [],
  transactions: [],
  funds: [],
  settings: { monthlyFee: 300 },
  pendingRole: null,
};

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  showScreen('loginScreen');
});

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// ===== ROLE SELECTION =====
function selectRole(role) {
  if (role === 'resident') {
    appState.role = 'resident';
    enterApp();
  } else {
    appState.pendingRole = role;
    document.getElementById('pinTitle').textContent =
      role === 'admin' ? 'كود المدير السري' : 'كود أمين الصندوق';
    clearPin();
    document.getElementById('pinModal').style.display = 'flex';
    setTimeout(() => document.getElementById('p0').focus(), 100);
  }
}

function pinNext(idx) {
  const val = document.getElementById(`p${idx}`).value;
  if (val && idx < 3) document.getElementById(`p${idx + 1}`).focus();
}

function clearPin() {
  [0,1,2,3].forEach(i => { document.getElementById(`p${i}`).value = ''; });
  document.getElementById('pinError').style.display = 'none';
}

function closePinModal() {
  document.getElementById('pinModal').style.display = 'none';
  clearPin();
}

function checkPin() {
  const pin = [0,1,2,3].map(i => document.getElementById(`p${i}`).value).join('');
  const correct = appState.pendingRole === 'admin' ? ADMIN_PIN : TREASURER_PIN;
  if (pin === correct) {
    appState.role = appState.pendingRole;
    closePinModal();
    enterApp();
  } else {
    document.getElementById('pinError').style.display = 'block';
    clearPin();
    document.getElementById('p0').focus();
  }
}

// ===== ENTER APP =====
async function enterApp() {
  showScreen('mainApp');
  const labels = { admin: 'مدير', treasurer: 'أمين الصندوق', resident: 'ساكن' };
  document.getElementById('roleBadge').textContent = labels[appState.role];
  document.getElementById('pageContent').innerHTML = '<div class="loading"><div class="spinner"></div><div>جاري التحميل...</div></div>';
  await loadAllData();
  renderPage();
}

function logout() {
  appState.role = null;
  appState.residents = [];
  appState.transactions = [];
  appState.funds = [];
  showScreen('loginScreen');
}

// ===== DATA LOADING =====
async function loadAllData() {
  try {
    const [{ data: residents }, { data: transactions }, { data: funds }, { data: settings }] = await Promise.all([
      supabase.from('residents').select('*').order('apt_no'),
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('funds').select('*').order('created_at'),
      supabase.from('settings').select('*').limit(1),
    ]);
    appState.residents = residents || [];
    appState.transactions = transactions || [];
    appState.funds = funds || [];
    if (settings && settings[0]) appState.settings = settings[0];
  } catch (err) {
    showToast('خطأ في تحميل البيانات: ' + err.message, 'error');
    // Use demo data if Supabase not configured
    loadDemoData();
  }
}

function loadDemoData() {
  appState.residents = [
    { id: 1, name: 'أحمد الراشد', apt_no: 'شقة 1', balance: 0, role: 'treasurer' },
    { id: 2, name: 'سارة الحربي', apt_no: 'شقة 2', balance: 600, balance_type: 'prepaid' },
    { id: 3, name: 'محمد خالد', apt_no: 'شقة 3', balance: -300, balance_type: 'debt' },
    { id: 4, name: 'فاطمة الزهراء', apt_no: 'شقة 4', balance: 0 },
    { id: 5, name: 'عمر الدوسري', apt_no: 'شقة 5', balance: -600, balance_type: 'debt' },
    { id: 6, name: 'نورة الشهري', apt_no: 'شقة 6', balance: 300, balance_type: 'prepaid' },
  ];
  appState.transactions = [
    { id: 1, date: '2025-04-01', type: 'income', amount: 300, category: 'اشتراك شهري', description: 'أحمد الراشد', performed_by: 'treasurer' },
    { id: 2, date: '2025-04-02', type: 'income', amount: 600, category: 'اشتراك شهري', description: 'سارة الحربي (مسبق)', performed_by: 'treasurer' },
    { id: 3, date: '2025-04-05', type: 'expense', amount: 450, category: 'صيانة', description: 'شركة النور للنظافة', performed_by: 'admin' },
    { id: 4, date: '2025-04-08', type: 'income', amount: 300, category: 'اشتراك شهري', description: 'فاطمة الزهراء', performed_by: 'treasurer' },
    { id: 5, date: '2025-04-10', type: 'expense', amount: 200, category: 'مرافق', description: 'الهيئة السعودية للمياه', performed_by: 'admin' },
    { id: 6, date: '2025-04-12', type: 'income', amount: 300, category: 'اشتراك شهري', description: 'نورة الشهري', performed_by: 'treasurer' },
    { id: 7, date: '2025-04-15', type: 'expense', amount: 150, category: 'أمن', description: 'شركة الأمين للحراسة', performed_by: 'admin' },
    { id: 8, date: '2025-04-18', type: 'income', amount: 1500, category: 'مشروع الواجهة', description: 'دفعة جماعية', performed_by: 'treasurer' },
  ];
  appState.funds = [
    { id: 1, name: 'صندوق الاشتراك الشهري', type: 'monthly', balance: 1850, total_collected: 2100, target: null },
    { id: 2, name: 'مشروع ترميم الواجهة', type: 'project', balance: 3200, total_collected: 4500, target: 12000, per_unit: 2000, units: 6 },
    { id: 3, name: 'صيانة المصعد', type: 'project', balance: 800, total_collected: 800, target: 3600, per_unit: 600, units: 6 },
  ];
  appState.settings = { monthly_fee: 300 };
}

// ===== NAVIGATION =====
function switchPage(page) {
  appState.currentPage = page;
  document.querySelectorAll('.nav button').forEach((b, i) => {
    b.classList.toggle('active', ['dash','residents','transactions','funds'][i] === page);
  });
  renderPage();
}

function renderPage() {
  const pages = { dash: renderDash, residents: renderResidents, transactions: renderTransactions, funds: renderFunds };
  document.getElementById('pageContent').innerHTML = (pages[appState.currentPage] || renderDash)();
}

// ===== HELPERS =====
function canEdit() { return appState.role === 'admin'; }
function canRecord() { return appState.role === 'admin' || appState.role === 'treasurer'; }

function getTotals() {
  const totalBalance = appState.funds.reduce((a, f) => a + (f.balance || 0), 0);
  const totalDebt = appState.residents.filter(r => r.balance < 0).reduce((a, r) => a + Math.abs(r.balance), 0);
  const totalPrepaid = appState.residents.filter(r => r.balance > 0).reduce((a, r) => a + r.balance, 0);
  const totalIncome = appState.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = appState.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  return { totalBalance, totalDebt, totalPrepaid, totalIncome, totalExpense };
}

function fmtMoney(n) { return (n || 0).toLocaleString('ar-SA') + ' ريال'; }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== DASHBOARD =====
function renderDash() {
  const t = getTotals();
  if (appState.role === 'resident') {
    const me = appState.residents[0] || {};
    return `
    <div style="max-width:500px">
      <div class="panel" style="text-align:center;padding:28px">
        <div style="font-size:13px;color:var(--muted);margin-bottom:6px">رصيدك الحالي</div>
        <div style="font-size:36px;font-weight:700;color:${(me.balance||0) >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmtMoney(me.balance)}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:6px">${(me.balance||0) < 0 ? 'رصيد مستحق الدفع' : 'رصيد دائن'}</div>
      </div>
      ${renderRecentTx()}
    </div>`;
  }
  return `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">إجمالي السيولة</div><div class="stat-value gold">${fmtMoney(t.totalBalance)}</div><div class="stat-sub">في جميع الصناديق</div></div>
    <div class="stat-card"><div class="stat-label">إجمالي الديون</div><div class="stat-value red">${fmtMoney(t.totalDebt)}</div><div class="stat-sub">${appState.residents.filter(r => r.balance < 0).length} سكان</div></div>
    <div class="stat-card"><div class="stat-label">الأرصدة المسبقة</div><div class="stat-value green">${fmtMoney(t.totalPrepaid)}</div><div class="stat-sub">${appState.residents.filter(r => r.balance > 0).length} سكان</div></div>
    <div class="stat-card"><div class="stat-label">الاشتراك الشهري</div><div class="stat-value" style="font-size:20px">${fmtMoney(appState.settings.monthly_fee || appState.settings.monthlyFee)}</div><div class="stat-sub">لكل وحدة</div></div>
  </div>
  <div class="grid2">
    <div class="panel">
      <div class="panel-title">
        <span>حالة السكان</span>
        ${canRecord() ? `<button class="btn" style="padding:5px 14px;font-size:12px" onclick="openPaymentModal()">+ تسجيل دفعة</button>` : ''}
      </div>
      ${appState.residents.map(r => `
      <div class="resident-row">
        <div class="stat-value ${r.balance < 0 ? 'red' : r.balance > 0 ? 'green' : ''}" style="font-size:14px">${fmtMoney(r.balance)}</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="text-align:right">
            <div class="res-name">${r.name}</div>
            <div class="res-status ${r.balance < 0 ? 'debt' : r.balance > 0 ? 'pre' : 'ok'}">${r.balance < 0 ? 'مديون' : r.balance > 0 ? 'رصيد مسبق' : 'مسدد'}</div>
          </div>
          <div class="apt">${r.apt_no}</div>
        </div>
      </div>`).join('')}
    </div>
    ${renderRecentTx()}
  </div>
  ${renderLedger()}`;
}

function renderRecentTx() {
  return `
  <div class="panel">
    <div class="panel-title"><span>آخر العمليات</span></div>
    ${appState.transactions.slice(0, 8).map(tx => `
    <div class="tx-row">
      <div style="text-align:left">
        <div class="tx-amt ${tx.type === 'income' ? 'in' : 'out'}">${tx.type === 'income' ? '+' : '-'}${fmtMoney(tx.amount)}</div>
        <div class="tx-date">${tx.date}</div>
      </div>
      <div class="tx-info" style="text-align:right">
        <div class="tx-name">${tx.description}</div>
        <div class="tx-cat">${tx.category} · بواسطة: ${tx.performed_by === 'admin' ? 'مدير' : 'أمين الصندوق'}</div>
      </div>
      <div class="tx-dot ${tx.type === 'income' ? 'in' : 'out'}"></div>
    </div>`).join('')}
  </div>`;
}

// ===== LEDGER TABLE =====
function renderLedger() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const year = new Date().getFullYear();
  const projects = appState.funds.filter(f => f.type === 'project');

  return `
  <div class="panel">
    <div class="panel-title"><span>الجدول الرئيسي — ${year}</span></div>
    <div class="ledger-wrap">
      <table class="ledger-table">
        <thead>
          <tr>
            <th class="resident-col">الساكن / الشقة</th>
            ${months.map(m => `<th>${m}</th>`).join('')}
            ${projects.map(p => `<th style="color:#7eb8ff">${p.name.replace('مشروع ','').substring(0,10)}</th>`).join('')}
            <th>الرصيد</th>
          </tr>
        </thead>
        <tbody>
          ${appState.residents.map(r => {
            const resPayments = appState.transactions.filter(t => t.type === 'income' && t.resident_id === r.id);
            return `
            <tr>
              <td class="resident-info">
                <div class="res-name">${r.name}</div>
                <div class="apt" style="display:inline-block;margin-top:3px">${r.apt_no}</div>
              </td>
              ${months.map((m, mi) => {
                const paid = resPayments.some(t => {
                  const d = new Date(t.date);
                  return d.getMonth() === mi && d.getFullYear() === year && t.category === 'اشتراك شهري';
                });
                const isPast = mi < new Date().getMonth();
                if (paid) return `<td><span class="cell-paid">✓</span></td>`;
                if (isPast) return `<td><span class="cell-debt">✗</span></td>`;
                return `<td><span class="cell-empty">—</span></td>`;
              }).join('')}
              ${projects.map(p => {
                const paid = resPayments.some(t => t.fund_id === p.id);
                return `<td>${paid ? '<span class="cell-paid">✓</span>' : '<span class="cell-empty">—</span>'}</td>`;
              }).join('')}
              <td class="${r.balance < 0 ? 'tx-amt out' : r.balance > 0 ? 'tx-amt in' : ''}">${fmtMoney(r.balance)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

// ===== RESIDENTS PAGE =====
function renderResidents() {
  if (!canEdit()) return `<div style="text-align:center;padding:60px;color:var(--muted)">صلاحية عرض فقط. تواصل مع المدير لإجراء تغييرات.</div>`;
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <button class="btn" onclick="openAddResident()">+ إضافة ساكن</button>
    <div style="display:flex;gap:10px;align-items:center">
      <button class="btn-outline" onclick="openFeeModal()">تعديل الاشتراك (${fmtMoney(appState.settings.monthly_fee || appState.settings.monthlyFee)})</button>
      <div style="font-size:16px;font-weight:700">إدارة السكان</div>
    </div>
  </div>
  <div class="panel">
    ${appState.residents.map(r => `
    <div class="resident-row">
      <div style="display:flex;gap:8px">
        <button class="btn-danger" onclick="confirmDelete(${r.id})">حذف</button>
        <button class="btn-edit" onclick="editResident(${r.id})">تعديل</button>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="text-align:right">
          <div class="res-name">${r.name}</div>
          <div style="font-size:12px;color:var(--muted)">${r.role === 'treasurer' ? 'أمين الصندوق' : r.role === 'admin' ? 'مدير' : 'ساكن'}</div>
          <div class="res-status ${r.balance < 0 ? 'debt' : r.balance > 0 ? 'pre' : 'ok'}">${r.balance < 0 ? `مديون ${fmtMoney(Math.abs(r.balance))}` : r.balance > 0 ? `${fmtMoney(r.balance)} رصيد مسبق` : 'مسدد'}</div>
        </div>
        <div class="apt">${r.apt_no}</div>
      </div>
    </div>`).join('')}
  </div>`;
}

// ===== TRANSACTIONS PAGE =====
function renderTransactions() {
  const t = getTotals();
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    ${canRecord() ? `
    <div style="display:flex;gap:10px">
      <button class="btn-outline" onclick="openExpenseModal()">+ تسجيل مصروف</button>
      <button class="btn" onclick="openPaymentModal()">+ تسجيل دفعة</button>
    </div>` : '<div></div>'}
    <div style="font-size:16px;font-weight:700">سجل العمليات</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
    <div class="stat-card"><div class="stat-label">إجمالي الوارد</div><div class="stat-value green" style="font-size:18px">+${fmtMoney(t.totalIncome)}</div></div>
    <div class="stat-card"><div class="stat-label">إجمالي الصادر</div><div class="stat-value red" style="font-size:18px">-${fmtMoney(t.totalExpense)}</div></div>
    <div class="stat-card"><div class="stat-label">الصافي</div><div class="stat-value gold" style="font-size:18px">${fmtMoney(t.totalIncome - t.totalExpense)}</div></div>
  </div>
  <div class="panel" style="padding:0;overflow:hidden">
    <table style="width:100%;border-collapse:collapse;direction:rtl">
      <thead style="background:var(--c2)">
        <tr>
          <th style="padding:10px 16px;font-size:11px;color:var(--muted);font-weight:600;text-align:right">التاريخ</th>
          <th style="padding:10px 16px;font-size:11px;color:var(--muted);font-weight:600;text-align:right">البيان</th>
          <th style="padding:10px 16px;font-size:11px;color:var(--muted);font-weight:600;text-align:right">الفئة</th>
          <th style="padding:10px 16px;font-size:11px;color:var(--muted);font-weight:600;text-align:right">المسجّل</th>
          <th style="padding:10px 16px;font-size:11px;color:var(--muted);font-weight:600;text-align:left">المبلغ</th>
        </tr>
      </thead>
      <tbody>
        ${appState.transactions.map(tx => `
        <tr style="border-top:1px solid var(--border)">
          <td style="padding:10px 16px;font-size:12px;color:var(--muted)">${tx.date}</td>
          <td style="padding:10px 16px;font-size:13px">${tx.description}</td>
          <td style="padding:10px 16px"><span class="tag ${tx.type === 'income' ? 'monthly' : 'project'}">${tx.category}</span></td>
          <td style="padding:10px 16px;font-size:12px;color:var(--muted)">${tx.performed_by === 'admin' ? 'مدير' : 'أمين الصندوق'} · ${tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString('ar-SA') : ''}</td>
          <td style="padding:10px 16px;text-align:left" class="tx-amt ${tx.type === 'income' ? 'in' : 'out'}">${tx.type === 'income' ? '+' : '-'}${fmtMoney(tx.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ===== FUNDS PAGE =====
function renderFunds() {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    ${canEdit() ? `<button class="btn" onclick="openNewFund()">+ صندوق مشروع جديد</button>` : '<div></div>'}
    <div style="font-size:16px;font-weight:700">إدارة الصناديق</div>
  </div>
  ${appState.funds.map((f, fi) => `
  <div class="panel">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;gap:8px">
        ${canRecord() ? `<button class="btn" style="font-size:12px;padding:6px 14px" onclick="openWithdrawModal(${fi})">صرف</button>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:15px;font-weight:700;margin-bottom:4px">${f.name}</div>
        <span class="tag ${f.type === 'monthly' ? 'monthly' : 'project'}">${f.type === 'monthly' ? 'اشتراك دوري' : 'مشروع'}</span>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:12px;color:var(--muted)">رصيد متاح</div>
      <div style="font-size:24px;font-weight:700;color:var(--gold)">${fmtMoney(f.balance)}</div>
    </div>
    ${f.target ? `
    <div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px">
        <span>الهدف: ${fmtMoney(f.target)}</span>
        <span>محصّل: ${fmtMoney(f.total_collected)}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, ((f.total_collected||0)/(f.target||1)*100)).toFixed(0)}%"></div></div>
      <div style="font-size:12px;color:var(--muted);margin-top:5px">${((f.total_collected||0)/(f.target||1)*100).toFixed(1)}% مكتمل — ${fmtMoney(f.per_unit)}/وحدة × ${f.units} وحدات</div>
    </div>` :
    `<div style="font-size:13px;color:var(--muted)">إجمالي المحصّل: ${fmtMoney(f.total_collected)}</div>`}
  </div>`).join('')}`;
}

// ===== MODALS =====
function showModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalOverlay').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
}

// --- PAYMENT MODAL ---
function openPaymentModal() {
  showModal(`
  <div class="modal-title">تسجيل دفعة</div>
  <div class="form-group"><label class="form-label">الساكن</label>
    <select class="form-select" id="payRes" onchange="checkExcess()">
      ${appState.residents.map(r => `<option value="${r.id}">${r.name} (${r.apt_no}) — الرصيد: ${fmtMoney(r.balance)}</option>`).join('')}
    </select>
  </div>
  <div class="form-group"><label class="form-label">المبلغ (ريال)</label>
    <input type="number" class="form-input" id="payAmt" min="1"
      value="${appState.settings.monthly_fee || appState.settings.monthlyFee}" oninput="checkExcess()" />
  </div>
  <div class="form-group"><label class="form-label">الصندوق</label>
    <select class="form-select" id="payFund">
      ${appState.funds.map((f,i) => `<option value="${i}">${f.name}</option>`).join('')}
    </select>
  </div>
  <div class="form-group"><label class="form-label">التاريخ</label>
    <input type="date" class="form-input" id="payDate" value="${new Date().toISOString().split('T')[0]}" />
  </div>
  <div id="excessSection" style="display:none">
    <div class="warn-box">الدفعة تتجاوز المستحقات — اختر طريقة معالجة الفائض:</div>
    <div class="excess-choice">
      <button class="excess-opt sel" id="opt1" onclick="selectExcess('prepaid')">
        <div style="font-size:20px;margin-bottom:6px">📅</div>رصيد مسبق
        <div style="font-size:10px;color:var(--muted);margin-top:3px">يخصم من الأشهر القادمة</div>
      </button>
      <button class="excess-opt" id="opt2" onclick="selectExcess('loan')">
        <div style="font-size:20px;margin-bottom:6px">💰</div>سلفة مستردة
        <div style="font-size:10px;color:var(--muted);margin-top:3px">الصندوق مدين للساكن</div>
      </button>
    </div>
  </div>
  <div class="modal-actions">
    <button class="btn" onclick="processPayment()">تسجيل الدفعة</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
  window._excessType = 'prepaid';
}

function checkExcess() {
  const resId = parseInt(document.getElementById('payRes').value);
  const amt = parseFloat(document.getElementById('payAmt').value) || 0;
  const res = appState.residents.find(r => r.id === resId);
  const due = (res.balance < 0 ? Math.abs(res.balance) : (appState.settings.monthly_fee || appState.settings.monthlyFee));
  document.getElementById('excessSection').style.display = amt > due ? 'block' : 'none';
}

function selectExcess(type) {
  window._excessType = type;
  document.getElementById('opt1').classList.toggle('sel', type === 'prepaid');
  document.getElementById('opt2').classList.toggle('sel', type === 'loan');
}

async function processPayment() {
  const resId = parseInt(document.getElementById('payRes').value);
  const amt = parseFloat(document.getElementById('payAmt').value) || 0;
  const fundIdx = parseInt(document.getElementById('payFund').value);
  const date = document.getElementById('payDate').value;
  if (!amt || !date) { showToast('يرجى تعبئة جميع الحقول', 'error'); return; }

  const res = appState.residents.find(r => r.id === resId);
  const due = res.balance < 0 ? Math.abs(res.balance) : (appState.settings.monthly_fee || appState.settings.monthlyFee);
  const excess = amt - due;
  const newBalance = (res.balance || 0) + amt;
  const balanceType = excess > 0 ? window._excessType : (newBalance === 0 ? null : res.balance_type);

  const txData = {
    date, type: 'income', amount: amt,
    category: 'اشتراك شهري',
    description: res.name + (excess > 0 ? ` (فائض: ${window._excessType === 'prepaid' ? 'مسبق' : 'سلفة'})` : ''),
    resident_id: resId,
    fund_id: appState.funds[fundIdx]?.id,
    performed_by: appState.role,
    timestamp: new Date().toISOString(),
  };

  try {
    await supabase.from('transactions').insert(txData);
    await supabase.from('residents').update({ balance: newBalance, balance_type: balanceType }).eq('id', resId);
    await supabase.from('funds').update({
      total_collected: (appState.funds[fundIdx].total_collected || 0) + amt,
      balance: (appState.funds[fundIdx].balance || 0) + amt
    }).eq('id', appState.funds[fundIdx].id);
    showToast('تم تسجيل الدفعة بنجاح ✓');
  } catch {
    // Demo mode
    res.balance = newBalance;
    res.balance_type = balanceType;
    appState.transactions.unshift({ ...txData, id: Date.now() });
    appState.funds[fundIdx].balance += amt;
    appState.funds[fundIdx].total_collected += amt;
    showToast('تم التسجيل (وضع تجريبي) ✓');
  }
  closeModal();
  renderPage();
}

// --- EXPENSE / WITHDRAW MODAL ---
function openExpenseModal() { openWithdrawModal(0); }

function openWithdrawModal(fi) {
  const f = appState.funds[fi];
  showModal(`
  <div class="modal-title">صرف من: ${f.name}</div>
  <div style="text-align:center;margin-bottom:18px;padding:12px;background:var(--card);border-radius:10px">
    <div style="font-size:12px;color:var(--muted)">الرصيد المتاح</div>
    <div style="font-size:26px;font-weight:700;color:var(--gold)">${fmtMoney(f.balance)}</div>
  </div>
  <div class="form-group"><label class="form-label">اسم المورد / الجهة</label>
    <input type="text" class="form-input" id="wSupplier" placeholder="مثال: شركة الصيانة الوطنية" />
  </div>
  <div class="form-group"><label class="form-label">نوع الخدمة</label>
    <select class="form-select" id="wCat">
      <option>صيانة</option><option>مرافق</option><option>أمن</option>
      <option>نظافة</option><option>إصلاحات</option><option>مواد بناء</option><option>أخرى</option>
    </select>
  </div>
  <div class="form-group"><label class="form-label">المبلغ (ريال)</label>
    <input type="number" class="form-input" id="wAmt" min="1" max="${f.balance}"
      placeholder="0" oninput="checkWithdraw(${f.balance})" />
  </div>
  <div class="form-group"><label class="form-label">التاريخ</label>
    <input type="date" class="form-input" id="wDate" value="${new Date().toISOString().split('T')[0]}" />
  </div>
  <div id="wAlert" style="display:none" class="danger-box"></div>
  <div class="modal-actions">
    <button class="btn" onclick="processWithdraw(${fi})">تأكيد الصرف</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
}

function checkWithdraw(max) {
  const amt = parseFloat(document.getElementById('wAmt').value) || 0;
  const al = document.getElementById('wAlert');
  if (amt > max) { al.style.display = 'block'; al.textContent = 'المبلغ يتجاوز الرصيد المتاح!'; }
  else al.style.display = 'none';
}

async function processWithdraw(fi) {
  const supplier = document.getElementById('wSupplier').value.trim();
  const cat = document.getElementById('wCat').value;
  const amt = parseFloat(document.getElementById('wAmt').value) || 0;
  const date = document.getElementById('wDate').value;
  const f = appState.funds[fi];

  if (!supplier) { showAlert('wAlert', 'يرجى إدخال اسم المورد'); return; }
  if (!amt || amt <= 0) { showAlert('wAlert', 'يرجى إدخال مبلغ صحيح'); return; }
  if (amt > f.balance) { showAlert('wAlert', 'المبلغ يتجاوز الرصيد المتاح!'); return; }

  const txData = {
    date, type: 'expense', amount: amt, category: cat, description: supplier,
    fund_id: f.id, performed_by: appState.role, timestamp: new Date().toISOString(),
  };

  try {
    await supabase.from('transactions').insert(txData);
    await supabase.from('funds').update({ balance: f.balance - amt }).eq('id', f.id);
    showToast('تم تسجيل المصروف بنجاح ✓');
  } catch {
    appState.transactions.unshift({ ...txData, id: Date.now() });
    appState.funds[fi].balance -= amt;
    showToast('تم التسجيل (وضع تجريبي) ✓');
  }
  closeModal();
  renderPage();
}

function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.textContent = msg; }
}

// --- RESIDENT MODALS ---
function openAddResident() {
  showModal(`
  <div class="modal-title">إضافة ساكن جديد</div>
  <div class="form-group"><label class="form-label">الاسم الكامل</label>
    <input type="text" class="form-input" id="aName" placeholder="اسم الساكن" />
  </div>
  <div class="form-group"><label class="form-label">رقم الشقة</label>
    <input type="text" class="form-input" id="aApt" placeholder="مثال: شقة 7" />
  </div>
  <div class="form-group"><label class="form-label">الدور</label>
    <select class="form-select" id="aRole">
      <option value="resident">ساكن</option>
      <option value="treasurer">أمين الصندوق</option>
      <option value="admin">مدير</option>
    </select>
  </div>
  <div class="modal-actions">
    <button class="btn" onclick="addResident()">إضافة</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
}

async function addResident() {
  const name = document.getElementById('aName').value.trim();
  const apt = document.getElementById('aApt').value.trim();
  const role = document.getElementById('aRole').value;
  if (!name || !apt) { showToast('يرجى تعبئة جميع الحقول', 'error'); return; }

  const data = { name, apt_no: apt, balance: 0, role };
  try {
    const { data: res } = await supabase.from('residents').insert(data).select().single();
    appState.residents.push(res);
    showToast('تم إضافة الساكن بنجاح ✓');
  } catch {
    appState.residents.push({ ...data, id: Date.now() });
    showToast('تم الإضافة (وضع تجريبي) ✓');
  }
  closeModal();
  renderPage();
}

function editResident(id) {
  const r = appState.residents.find(x => x.id === id);
  showModal(`
  <div class="modal-title">تعديل بيانات الساكن</div>
  <div class="form-group"><label class="form-label">الاسم</label>
    <input type="text" class="form-input" id="eName" value="${r.name}" />
  </div>
  <div class="form-group"><label class="form-label">رقم الشقة</label>
    <input type="text" class="form-input" id="eApt" value="${r.apt_no}" />
  </div>
  <div class="form-group"><label class="form-label">الدور</label>
    <select class="form-select" id="eRole">
      <option ${r.role === 'resident' ? 'selected' : ''} value="resident">ساكن</option>
      <option ${r.role === 'treasurer' ? 'selected' : ''} value="treasurer">أمين الصندوق</option>
      <option ${r.role === 'admin' ? 'selected' : ''} value="admin">مدير</option>
    </select>
  </div>
  <div class="modal-actions">
    <button class="btn" onclick="saveResident(${id})">حفظ التعديلات</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
}

async function saveResident(id) {
  const name = document.getElementById('eName').value.trim();
  const apt = document.getElementById('eApt').value.trim();
  const role = document.getElementById('eRole').value;
  const r = appState.residents.find(x => x.id === id);

  try {
    await supabase.from('residents').update({ name, apt_no: apt, role }).eq('id', id);
    showToast('تم حفظ التعديلات ✓');
  } catch {
    showToast('تم الحفظ (وضع تجريبي) ✓');
  }
  r.name = name; r.apt_no = apt; r.role = role;
  closeModal();
  renderPage();
}

function confirmDelete(id) {
  const r = appState.residents.find(x => x.id === id);
  showModal(`
  <div class="modal-title">تأكيد الحذف</div>
  <div class="danger-box">
    هل أنت متأكد من حذف الساكن؟<br>
    <strong>${r.name} — ${r.apt_no}</strong><br><br>
    ${r.balance !== 0
      ? `<strong>تحذير:</strong> لديه رصيد ${r.balance > 0 ? 'دائن' : 'مدين'}: ${fmtMoney(Math.abs(r.balance))}. تأكد من تسوية الرصيد قبل الحذف.`
      : 'رصيده صفر — يمكن الحذف بأمان.'}
  </div>
  <div class="modal-actions">
    <button class="btn-danger" style="padding:9px 20px;font-size:13px" onclick="deleteResident(${id})">نعم، احذف</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
}

async function deleteResident(id) {
  try {
    await supabase.from('residents').delete().eq('id', id);
    showToast('تم حذف الساكن ✓');
  } catch {
    showToast('تم الحذف (وضع تجريبي) ✓');
  }
  appState.residents = appState.residents.filter(r => r.id !== id);
  closeModal();
  renderPage();
}

// --- FEE MODAL ---
function openFeeModal() {
  const fee = appState.settings.monthly_fee || appState.settings.monthlyFee;
  showModal(`
  <div class="modal-title">تعديل الاشتراك الشهري</div>
  <div class="warn-box">تنبيه: الديون القديمة لن تتأثر — السعر الجديد يُطبق على الأشهر القادمة فقط.</div>
  <div class="form-group"><label class="form-label">السعر الحالي</label>
    <input type="text" class="form-input" value="${fmtMoney(fee)}" disabled />
  </div>
  <div class="form-group"><label class="form-label">السعر الجديد (ريال)</label>
    <input type="number" class="form-input" id="newFee" value="${fee}" />
  </div>
  <div class="modal-actions">
    <button class="btn" onclick="updateFee()">حفظ التعديل</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
}

async function updateFee() {
  const v = parseInt(document.getElementById('newFee').value) || 0;
  if (!v) return;
  try {
    await supabase.from('settings').update({ monthly_fee: v, last_update: new Date().toISOString() }).eq('id', appState.settings.id);
    showToast('تم تحديث الاشتراك ✓');
  } catch { showToast('تم التحديث (وضع تجريبي) ✓'); }
  appState.settings.monthly_fee = v;
  appState.settings.monthlyFee = v;
  closeModal();
  renderPage();
}

// --- NEW FUND MODAL ---
function openNewFund() {
  showModal(`
  <div class="modal-title">إنشاء صندوق مشروع جديد</div>
  <div class="form-group"><label class="form-label">اسم المشروع</label>
    <input type="text" class="form-input" id="fName" placeholder="مثال: تجديد المدخل" />
  </div>
  <div class="form-group"><label class="form-label">التكلفة الإجمالية (ريال)</label>
    <input type="number" class="form-input" id="fTotal" oninput="calcPerUnit()" placeholder="0" />
  </div>
  <div style="padding:12px;background:var(--card);border-radius:var(--radius-sm);margin-bottom:14px;font-size:14px;text-align:right">
    حصة كل وحدة: <strong id="perUnitCalc" style="color:var(--gold)">—</strong>
    <span style="font-size:12px;color:var(--muted)"> (${appState.residents.length} وحدات)</span>
  </div>
  <div class="modal-actions">
    <button class="btn" onclick="createFund()">إنشاء الصندوق</button>
    <button class="btn-outline" onclick="closeModal()">إلغاء</button>
  </div>`);
}

function calcPerUnit() {
  const t = parseFloat(document.getElementById('fTotal').value) || 0;
  document.getElementById('perUnitCalc').textContent = t ? fmtMoney(t / appState.residents.length) : '—';
}

async function createFund() {
  const name = document.getElementById('fName').value.trim();
  const total = parseFloat(document.getElementById('fTotal').value) || 0;
  if (!name || !total) { showToast('يرجى تعبئة جميع الحقول', 'error'); return; }

  const data = {
    name: `مشروع ${name}`, type: 'project', balance: 0, total_collected: 0,
    target: total, per_unit: +(total / appState.residents.length).toFixed(0), units: appState.residents.length,
  };
  try {
    const { data: fund } = await supabase.from('funds').insert(data).select().single();
    appState.funds.push(fund);
    showToast('تم إنشاء الصندوق بنجاح ✓');
  } catch {
    appState.funds.push({ ...data, id: Date.now() });
    showToast('تم الإنشاء (وضع تجريبي) ✓');
  }
  closeModal();
  renderPage();
}

// ===== PWA SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.log('SW failed:', err));
  });
}
