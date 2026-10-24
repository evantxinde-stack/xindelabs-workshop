// ============================================================
// MEMBER LMS MODULE — member.xindelabs.web.id
// Gabungkan LMS dari workshop style + fitur baru:
// - Katalog Kelas (owned vs locked + member_discount_price)
// - Sequential Module (lock by previous lesson completion)
// - Certificate PDF otomatis saat 100% selesai
// - Bimbingan VIP 1-on-1 (is_vip / offer + slot indicator)
// - Booking Jadwal, Progress Tracker, Submit Project (VIP only)
// Auth: Email+Password + Google OAuth via Supabase
// ============================================================
import { supabase, isSupabaseConfigured } from '../config/supabase-client.js';

const esc = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const formatIDR = (n) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));

let state = {
  user: null,
  member: null,
  classes: [],
  lessons: [],
  progress: [],
  owned: [],
  isVip: false,
  vipSettings: null,
  activeClass: null,
  activeLessonIndex: 0
};

function getEmail() {
  return (state.user?.email || state.member?.email || '').toLowerCase();
}

async function loadData() {
  const email = getEmail();
  if (!email) return;

  // member
  try {
    const { data } = await supabase.from('members').select('*').eq('email', email).maybeSingle();
    if (data) {
      state.member = data;
      state.isVip = !!data.is_vip;
      state.owned = Array.isArray(data.owned_classes) ? data.owned_classes : [];
    }
  } catch(e){}

  // classes
  try {
    const { data } = await supabase.from('classes').select('*').eq('is_published', true).order('sort_order');
    if (data) state.classes = data;
  } catch(e){}

  // lessons
  try {
    const { data } = await supabase.from('lessons').select('*').order('sort_order');
    if (data) state.lessons = data;
  } catch(e){}

  // progress
  try {
    const { data } = await supabase.from('lesson_progress').select('*').eq('email', email);
    if (data) state.progress = data;
  } catch(e){}

  // vip settings
  try {
    const { data } = await supabase.from('vip_settings').select('*').eq('is_active', true).maybeSingle();
    if (data) state.vipSettings = data;
  } catch(e){}
}

function hasAccessToClass(cls) {
  if (state.isVip) return true;
  if (state.owned.includes(cls.id) || state.owned.includes(cls.slug)) return true;
  // fallback: check modules legacy? keep permissive if member paid
  return false;
}

function isLessonDone(lessonId) {
  return state.progress.some(p => p.lesson_id === lessonId && p.completed);
}

function canAccessLesson(lessonsInClass, idx) {
  if (state.isVip) return true;
  if (idx === 0) return true;
  // sequential: all previous must be done
  for (let i=0; i<idx; i++) {
    if (!isLessonDone(lessonsInClass[i].id)) return false;
  }
  return true;
}

function calcClassProgress(cls) {
  const lessons = state.lessons.filter(l => l.class_id === cls.id).sort((a,b)=>(a.sort_order-b.sort_order));
  if (!lessons.length) return 0;
  const done = lessons.filter(l => isLessonDone(l.id)).length;
  return Math.round((done / lessons.length) * 100);
}

async function markLessonComplete(lesson) {
  const email = getEmail();
  if (!email) return;
  try {
    await supabase.from('lesson_progress').upsert({
      email,
      lesson_id: lesson.id,
      class_id: lesson.class_id,
      completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'email,lesson_id' });
    await loadData();
    checkCertificate(lesson.class_id);
    render();
  } catch(e){ console.error(e); }
}

async function checkCertificate(classId) {
  const cls = state.classes.find(c => c.id === classId);
  const pct = calcClassProgress(cls);
  if (pct >= 100 && isSupabaseConfigured()) {
    const email = getEmail();
    try {
      const { data: existing } = await supabase.from('certificates').select('id').eq('email', email).eq('class_id', classId).maybeSingle();
      if (!existing) {
        const num = 'XL-' + Date.now().toString().slice(-8).toUpperCase();
        await supabase.from('certificates').insert({ email, class_id: classId, certificate_number: num });
        alert('Selamat! Kamu menyelesaikan kelas 100%. Sertifikat otomatis tersedia untuk dicetak.');
      }
    } catch(e){}
  }
}

async function generateCertificatePDF() {
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const email = getEmail();
  doc.setFillColor(4, 11, 8);
  doc.rect(0,0,842,595,'F');
  doc.setTextColor(0, 255, 136);
  doc.setFontSize(42);
  doc.text('SERTIFIKAT KELULUSAN', 421, 160, { align: 'center' });
  doc.setTextColor(234, 255, 245);
  doc.setFontSize(18);
  doc.text('Diberikan kepada', 421, 210, { align: 'center' });
  doc.setFontSize(36);
  doc.text(state.member?.email || email, 421, 260, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Telah menyelesaikan seluruh materi di Xinde Labs Learning Platform', 421, 320, { align: 'center' });
  doc.text('Tanggal: ' + new Date().toLocaleDateString('id-ID'), 421, 380, { align: 'center' });
  doc.save('Sertifikat-XindeLabs.pdf');
}

function renderKatalog() {
  const grid = document.getElementById('classGrid');
  if (!grid) return;
  if (!state.classes.length) {
    grid.innerHTML = '<div class="card" style="padding:24px; color:var(--muted);">Belum ada kelas tersedia.</div>';
    return;
  }
  grid.innerHTML = state.classes.map(cls => {
    const owned = hasAccessToClass(cls);
    const pct = calcClassProgress(cls);
    const price = state.isVip ? cls.member_discount_price || cls.price : cls.price;
    return `
      <article class="card" style="overflow:hidden;">
        ${cls.cover_image ? `<img src="${esc(cls.cover_image)}" alt="${esc(cls.title)}" style="width:100%;height:160px;object-fit:cover;">` : ''}
        <div style="padding:22px; display:grid; gap:12px;">
          <h3 style="font-family:var(--font-display); font-weight:700; font-size:19px;">${esc(cls.title)}</h3>
          <p style="color:var(--muted); font-size:14.5px;">${esc(cls.description||'')}</p>
          ${owned ? `<div style="font-family:var(--font-mono); font-size:13px; color:var(--green);">Progress: ${pct}%</div>` : `<div style="font-family:var(--font-mono); font-size:13px; color:var(--gold);">🔒 Belum dimiliki — upgrade kapan aja</div>`}
          ${owned ? `<button class="btn btn--primary btn--sm" onclick="window.__openClass__('${esc(cls.id)}')">Buka Kelas</button>` :
            `<div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <span style="font-family:var(--font-mono); color:var(--cyan);">${formatIDR(price||0)}</span>
              <div style="display:flex; gap:8px; align-items:center;">
                <a href="https://wa.me/62895335137700?text=${encodeURIComponent('Halo XindeLabs, mau beli ' + (cls.title||'kelas'))}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm" title="Tanya dulu via WhatsApp">💬</a>
                <a href="/checkout.html?class=${esc(cls.slug)}" class="btn btn--primary btn--sm">Beli Kelas Ini</a>
              </div>
            </div>`}
        </div>
      </article>
    `;
  }).join('');
}

function renderClassView() {
  const cls = state.activeClass;
  if (!cls) return;
  const lessons = state.lessons.filter(l => l.class_id === cls.id).sort((a,b)=>(a.sort_order-b.sort_order));
  const current = lessons[state.activeLessonIndex];
  if (!current) return;

  document.getElementById('classTitle').textContent = cls.title;
  document.getElementById('lessonTitle').textContent = current.title;

  // player
  const host = document.getElementById('ytHost');
  host.innerHTML = current.video_id ? `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${esc(current.video_id)}" frameborder="0" allowfullscreen></iframe>` : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted);">Konten teks/latihan</div>';

  // sidebar
  const list = document.getElementById('lessonList');
  list.innerHTML = lessons.map((l, idx) => {
    const locked = !canAccessLesson(lessons, idx);
    const done = isLessonDone(l.id);
    return `<button class="lrow ${locked?'locked':''} ${idx===state.activeLessonIndex?'active':''}" onclick="window.__goLesson__(${idx})" ${locked?'disabled':''}>
      <span>${locked?'🔒':'📺'}</span>
      <span style="flex:1;">${idx+1}. ${esc(l.title)}</span>
      <span>${done?'✓':''}</span>
    </button>`;
  }).join('');

  // nav
  document.getElementById('prevLesson').disabled = state.activeLessonIndex === 0;
  document.getElementById('nextLesson').disabled = !canAccessLesson(lessons, state.activeLessonIndex+1) || state.activeLessonIndex >= lessons.length-1;
  document.getElementById('markDone').onclick = () => markLessonComplete(current);

  const pct = calcClassProgress(cls);
  document.getElementById('classPct').textContent = pct + '%';
  document.getElementById('classBar').style.width = pct + '%';

  if (pct >= 100) {
    document.getElementById('certBtn').style.display = 'inline-flex';
  }
}

function renderVIP() {
  const root = document.getElementById('vipPanel');
  const settings = state.vipSettings || { monthly_max_slots: 5, filled_slots: 0, price: 2999000, benefits: [] };
  const sisa = Math.max(0, (settings.monthly_max_slots||0) - (settings.filled_slots||0));
  const penuh = sisa <= 0;

  if (state.isVip) {
    root.innerHTML = `
      <div class="card" style="padding:28px; display:grid; gap:18px;">
        <h2 style="font-family:var(--font-display); font-weight:700; font-size:26px;">Bimbingan VIP 1-on-1</h2>
        <p style="color:var(--green); font-family:var(--font-mono);">Status: VIP AKTIF</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px;">
          <div class="card" style="padding:18px;">
            <h3 style="margin-bottom:10px;">Booking Jadwal</h3>
            <form id="vipBooking" style="display:grid; gap:10px;">
              <input name="preferred_date" type="date" style="padding:10px 12px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text);">
              <input name="preferred_time" placeholder="Waktu (contoh: 19:00 WIB)" style="padding:10px 12px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text);">
              <input name="topic" placeholder="Topik bimbingan" style="padding:10px 12px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text);">
              <button class="btn btn--primary btn--sm">Ajukan Jadwal</button>
            </form>
          </div>
          <div class="card" style="padding:18px;">
            <h3 style="margin-bottom:10px;">Progress Tracker</h3>
            <textarea id="vipTracker" placeholder="Catatan progress kamu..." style="width:100%; height:90px; padding:10px 12px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text);"></textarea>
            <button class="btn btn--ghost btn--sm" style="margin-top:10px;" onclick="window.__saveTracker__()">Simpan</button>
          </div>
          <div class="card" style="padding:18px;">
            <h3 style="margin-bottom:10px;">Submit Project</h3>
            <input id="projTitle" placeholder="Judul Project" style="width:100%; padding:10px 12px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text); margin-bottom:8px;">
            <textarea id="projDesc" placeholder="Deskripsi hasil project..." style="width:100%; height:70px; padding:10px 12px; background:var(--bg-3); border:1px solid var(--line); border-radius:10px; color:var(--text);"></textarea>
            <button class="btn btn--ghost btn--sm" style="margin-top:10px;" onclick="window.__submitProject__()">Submit Project</button>
          </div>
        </div>
      </div>
    `;
    bindVIPForms();
    return;
  }

  // Non-VIP offer
  root.innerHTML = `
    <div class="card" style="padding:clamp(24px,4vw,38px); display:grid; gap:18px; max-width:820px; margin:0 auto;">
      <div>
        <span class="eyebrow"><span class="dot dot--pulse"></span> bimbingan vip 1-on-1</span>
        <h2 style="font-family:var(--font-display); font-weight:700; font-size:clamp(28px,4vw,42px); margin:10px 0;">Percepat Hasil dengan Pendampingan Langsung</h2>
        <p style="color:var(--muted);">Dibimbing step by step sampai bisa apply & dapat hasil.</p>
      </div>
      <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
        <div style="font-family:var(--font-mono); font-size:20px; color:var(--green);">${formatIDR(settings.price||2999000)}</div>
        <div class="card" style="padding:10px 16px; font-family:var(--font-mono); font-size:13px;">
          Sisa Slot Bulan Ini: <b style="color:${penuh?'var(--danger)':'var(--green)'}">${sisa} / ${settings.monthly_max_slots||0}</b>
        </div>
      </div>
      <ul style="display:grid; gap:10px; list-style:none; color:var(--muted);">
        ${(settings.benefits||[]).map(b=>`<li>✓ ${esc(b)}</li>`).join('')}
      </ul>
      ${penuh ? `<button class="btn btn--ghost" disabled style="justify-self:start;">Slot Penuh — Tunggu Periode Berikutnya</button>`
              : `<div style="display:flex; gap:12px; flex-wrap:wrap; justify-self:start;">
                  <a href="https://wa.me/62895335137700?text=${encodeURIComponent('Halo XindeLabs, mau tanya soal Bimbingan VIP 1-on-1')}" target="_blank" rel="noopener" class="btn btn--ghost">💬 Tanya Dulu via WhatsApp</a>
                  <a href="/checkout.html?product=vip-1on1" class="btn btn--primary">Daftar &amp; Bayar VIP 1-on-1</a>
                </div>`}
    </div>
  `;
}

function bindVIPForms() {
  const f = document.getElementById('vipBooking');
  if (f) f.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    if (!isSupabaseConfigured()) return alert('Demo mode');
    await supabase.from('vip_bookings').insert({ email: getEmail(), ...data });
    alert('Pengajuan jadwal terkirim!');
    f.reset();
  };
}

window.__saveTracker__ = async () => {
  if (!isSupabaseConfigured()) return alert('Demo mode');
  const notes = document.getElementById('vipTracker').value;
  await supabase.from('vip_progress_tracker').upsert({ email: getEmail(), notes, updated_at: new Date().toISOString() }, { onConflict: 'email' });
  alert('Progress tracker tersimpan');
};

window.__submitProject__ = async () => {
  if (!isSupabaseConfigured()) return alert('Demo mode');
  const title = document.getElementById('projTitle').value;
  const description = document.getElementById('projDesc').value;
  await supabase.from('vip_projects').insert({ email: getEmail(), title, description });
  alert('Project berhasil disubmit untuk review');
};

window.__openClass__ = (id) => {
  state.activeClass = state.classes.find(c => c.id === id);
  state.activeLessonIndex = 0;
  document.getElementById('viewKatalog').style.display = 'none';
  document.getElementById('viewClass').style.display = 'grid';
  renderClassView();
};

window.__goLesson__ = (idx) => {
  state.activeLessonIndex = idx;
  renderClassView();
};

document.getElementById('backToKatalog')?.addEventListener('click', () => {
  document.getElementById('viewClass').style.display = 'none';
  document.getElementById('viewKatalog').style.display = 'block';
  renderKatalog();
});

document.getElementById('nextLesson')?.addEventListener('click', () => {
  const cls = state.activeClass;
  const lessons = state.lessons.filter(l => l.class_id === cls.id).sort((a,b)=>(a.sort_order-b.sort_order));
  if (canAccessLesson(lessons, state.activeLessonIndex+1)) {
    state.activeLessonIndex++;
    renderClassView();
  }
});

document.getElementById('prevLesson')?.addEventListener('click', () => {
  if (state.activeLessonIndex > 0) {
    state.activeLessonIndex--;
    renderClassView();
  }
});

document.getElementById('certBtn')?.addEventListener('click', generateCertificatePDF);

// Tab nav
document.querySelectorAll('.mnav').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mnav').forEach(b => b.classList.toggle('active', b===btn));
    document.querySelectorAll('.mpanel').forEach(p => p.style.display = 'none');
    document.getElementById('panel-'+btn.dataset.panel).style.display = 'block';
    if (btn.dataset.panel === 'vip') renderVIP();
  });
});

export async function render(containerId='memberApp') {
  if (!isSupabaseConfigured()) {
    document.getElementById(containerId).innerHTML = '<div style="padding:40px;color:var(--muted);">Supabase belum dikonfigurasi.</div>';
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login.html';
    return;
  }
  state.user = session.user;
  await loadData();
  renderKatalog();
}

export default { render };
