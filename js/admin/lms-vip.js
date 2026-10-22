// ============================================================
// LMS & VIP SLOT MANAGER
// Tab: Modul (legacy), Classes & Lessons, VIP, Project Review.
// ============================================================
import { esc, fmtDate, toast } from './context.js';

const $ = (id) => document.getElementById(id);

let ctx = null;
let initialized = false;
let state = {
  tab: 'modul',
  classes: [],
  lessons: [],
  selectedClassId: null,
  vip: null,
  bookings: [],
  projects: [],
  loading: false
};

export function init(context) {
  if (initialized) { ctx = context; return; }
  ctx = context;
  initialized = true;

  document.querySelectorAll('#lmsTabs [data-lmstab]').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.lmstab));
  });

  $('clsAdd').addEventListener('click', addClass);
  $('clsSave').addEventListener('click', saveClass);
  $('clsDelete').addEventListener('click', deleteClass);
  $('lessonAdd').addEventListener('click', addLesson);
  $('lessonSave').addEventListener('click', saveLessons);
  $('vipSave').addEventListener('click', saveVip);
  $('vipSync').addEventListener('click', syncSlots);
  $('prjRefresh').addEventListener('click', () => loadProjects());
}

export function load(tab) {
  if (tab) switchTab(tab);
  else refresh();
}

export async function refresh() {
  if (!ctx || !ctx.client || state.loading) return;
  state.loading = true;
  try {
    switch (state.tab) {
      case 'classes': await loadClasses(); break;
      case 'vip': await loadVip(); break;
      case 'projects': await loadProjects(); break;
      default: break;
    }
  } finally {
    state.loading = false;
  }
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('#lmsTabs [data-lmstab]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.lmstab === tab);
  });
  document.querySelectorAll('[data-lmspane]').forEach((p) => {
    p.style.display = p.dataset.lmspane === tab ? 'block' : 'none';
  });
  if (tab !== 'modul') refresh();
}

// ================= Classes & Lessons =================

async function loadClasses() {
  const [cRes, lRes] = await Promise.all([
    ctx.client.from('classes').select('*').order('sort_order', { ascending: true }),
    ctx.client.from('lessons').select('*').order('sort_order', { ascending: true })
  ]);
  if (cRes.error) {
    $('clsNotice').style.display = 'block';
    $('clsNotice').textContent = '⚠️ Gagal load classes: ' + (cRes.error.message || '') + '. Jalankan schema terbaru.';
    return;
  }
  $('clsNotice').style.display = 'none';
  state.classes = cRes.data || [];
  state.lessons = lRes.error ? [] : (lRes.data || []);

  const keep = state.classes.find((c) => String(c.id) === String(state.selectedClassId));
  state.selectedClassId = keep ? keep.id : (state.classes[0] ? state.classes[0].id : null);
  renderClassList();
  renderClassForm();
  renderLessons();
}

function renderClassList() {
  const el = $('clsList');
  if (!state.classes.length) {
    el.innerHTML = '<p class="a-empty">Belum ada kelas. Klik "+ Kelas Baru".</p>';
    return;
  }
  el.innerHTML = state.classes.map((c) => {
    const n = state.lessons.filter((l) => String(l.class_id) === String(c.id)).length;
    const active = String(c.id) === String(state.selectedClassId);
    return '<button type="button" class="a-funnel-item' + (active ? ' is-active' : '') + '" data-id="' + esc(c.id) + '">' +
      '<span class="a-funnel-item__dot' + (c.is_published ? ' is-on' : '') + '"></span>' +
      '<span class="a-funnel-item__main"><b>' + esc(c.title || c.slug) + '</b>' +
      '<span class="l-meta">' + esc(c.slug) + ' · ' + n + ' lesson</span></span>' +
    '</button>';
  }).join('');

  el.querySelectorAll('.a-funnel-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedClassId = btn.dataset.id;
      renderClassList();
      renderClassForm();
      renderLessons();
    });
  });
}

function renderClassForm() {
  const c = state.classes.find((x) => String(x.id) === String(state.selectedClassId));
  $('clsForm').style.display = c ? 'block' : 'none';
  if (!c) return;
  const val = (id, v) => { const el = $(id); if (el) el.value = v == null ? '' : v; };
  val('cls_title', c.title);
  val('cls_slug', c.slug);
  val('cls_desc', c.description);
  val('cls_cover', c.cover_image);
  val('cls_price', c.price);
  val('cls_mprice', c.member_discount_price);
  val('cls_sort', c.sort_order);
  $('cls_published').checked = c.is_published !== false;
}

function renderLessons() {
  const host = $('lessonRows');
  const cid = state.selectedClassId;
  if (!cid) { host.innerHTML = ''; $('lessonsEmpty').style.display = 'block'; return; }
  const list = state.lessons.filter((l) => String(l.class_id) === String(cid));
  $('lessonsEmpty').style.display = list.length ? 'none' : 'block';
  host.innerHTML = list.map((l, i) => lessonRow(l, i)).join('');
  bindLessonDeletes(host);
}

function bindLessonDeletes(host) {
  host.querySelectorAll('.lesson-del').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const wrap = btn.closest('[data-lesson]');
      if (!confirm('Hapus lesson ini?')) return;
      wrap.remove();
    });
  });
}

function lessonRow(l, i) {
  l = l || {};
  return '<div class="a-row a-lesson" data-lesson data-id="' + esc(l.id || '') + '">' +
    '<div class="a-lesson__num">' + (i + 1) + '</div>' +
    '<div class="a-lesson__main">' +
      '<div class="admin-grid3">' +
        '<div class="field"><label>Judul</label><input class="a-input ls-title" value="' + esc(l.title || '') + '"></div>' +
        '<div class="field"><label>Tipe</label><select class="a-input ls-type">' +
          ['video', 'text', 'pdf'].map((t) => '<option value="' + t + '"' + (l.type === t ? ' selected' : '') + '>' + t + '</option>').join('') +
        '</select></div>' +
        '<div class="field"><label>Durasi</label><input class="a-input ls-duration" value="' + esc(l.duration || '') + '" placeholder="12 menit"></div>' +
      '</div>' +
      '<div class="admin-grid3">' +
        '<div class="field"><label>Video ID</label><input class="a-input ls-video" value="' + esc(l.video_id || '') + '"></div>' +
        '<div class="field"><label>Modul (opsional)</label><input class="a-input ls-module" value="' + esc(l.module_id || '') + '"></div>' +
        '<div class="field"><label>Urutan</label><input class="a-input ls-sort" type="number" value="' + esc(l.sort_order == null ? i + 1 : l.sort_order) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Konten (untuk tipe text/pdf)</label><textarea class="a-input ls-content" rows="3">' + esc(l.content || '') + '</textarea></div>' +
      '<label class="a-check"><input type="checkbox" class="ls-required"' + (l.required !== false ? ' checked' : '') + '> Wajib diselesaikan</label>' +
    '</div>' +
    '<button type="button" class="btn btn--ghost btn--sm lesson-del">✕</button>' +
  '</div>';
}

async function addClass() {
  const title = prompt('Judul kelas baru:');
  if (!title) return;
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { data, error } = await ctx.client.from('classes').insert({
    title, slug, description: '', is_published: false, sort_order: state.classes.length + 1
  }).select().single();
  if (error) return toast('Gagal buat kelas: ' + (error.message || error), 'warn');
  state.selectedClassId = data.id;
  toast('Kelas dibuat.', 'ok');
  await loadClasses();
}

async function saveClass() {
  if (!state.selectedClassId) return;
  const payload = {
    id: state.selectedClassId,
    title: $('cls_title').value.trim(),
    slug: $('cls_slug').value.trim(),
    description: $('cls_desc').value.trim(),
    cover_image: $('cls_cover').value.trim(),
    price: Number($('cls_price').value) || 0,
    member_discount_price: Number($('cls_mprice').value) || 0,
    is_published: $('cls_published').checked,
    sort_order: Number($('cls_sort').value) || 0
  };
  if (!payload.title || !payload.slug) return toast('Judul & slug wajib diisi.', 'warn');
  const { error } = await ctx.client.from('classes').upsert(payload);
  if (error) return toast('Gagal simpan kelas: ' + (error.message || error), 'warn');
  toast('Kelas tersimpan.', 'ok');
  await loadClasses();
}

async function deleteClass() {
  if (!state.selectedClassId) return;
  const c = state.classes.find((x) => String(x.id) === String(state.selectedClassId));
  if (!confirm('Hapus kelas "' + (c ? c.title : '') + '" beserta semua lesson-nya?')) return;
  const { error } = await ctx.client.from('classes').delete().eq('id', state.selectedClassId);
  if (error) return toast('Gagal hapus kelas: ' + (error.message || error), 'warn');
  state.selectedClassId = null;
  toast('Kelas dihapus.', 'ok');
  await loadClasses();
}

function addLesson() {
  if (!state.selectedClassId) return toast('Pilih kelas dulu.', 'warn');
  const host = $('lessonRows');
  const n = host.querySelectorAll('[data-lesson]').length;
  host.insertAdjacentHTML('beforeend', lessonRow({ sort_order: n + 1, type: 'video', required: true }, n));
  bindLessonDeletes(host);
  $('lessonsEmpty').style.display = 'none';
}

async function saveLessons() {
  const cid = state.selectedClassId;
  if (!cid) return;
  const rows = Array.from(document.querySelectorAll('#lessonRows [data-lesson]'));
  const payloads = rows.map((w, i) => ({
    ...(w.dataset.id ? { id: w.dataset.id } : {}),
    class_id: cid,
    title: w.querySelector('.ls-title').value.trim(),
    type: w.querySelector('.ls-type').value,
    duration: w.querySelector('.ls-duration').value.trim(),
    video_id: w.querySelector('.ls-video').value.trim(),
    module_id: w.querySelector('.ls-module').value.trim(),
    sort_order: Number(w.querySelector('.ls-sort').value) || i + 1,
    content: w.querySelector('.ls-content').value,
    required: w.querySelector('.ls-required').checked
  }));

  for (let i = 0; i < payloads.length; i++) {
    if (!payloads[i].title) return toast('Judul lesson baris ' + (i + 1) + ' wajib diisi.', 'warn');
  }

  try {
    if (payloads.length) {
      const { error } = await ctx.client.from('lessons').upsert(payloads);
      if (error) throw error;
    }
    const keep = payloads.map((p) => p.id).filter(Boolean);
    let del = ctx.client.from('lessons').delete().eq('class_id', cid);
    if (keep.length) del = del.not('id', 'in', '(' + keep.join(',') + ')');
    const { error: dErr } = await del;
    if (dErr) throw dErr;
    toast('Lessons tersimpan.', 'ok');
    await loadClasses();
  } catch (e) {
    toast('Gagal simpan lessons: ' + (e.message || e), 'warn');
  }
}

// ================= VIP =================

async function loadVip() {
  const [vRes, bRes] = await Promise.all([
    ctx.client.from('vip_settings').select('*').limit(1).maybeSingle(),
    ctx.client.from('vip_bookings').select('*').order('created_at', { ascending: false }).limit(300)
  ]);
  if (vRes.error) {
    $('vipNotice').style.display = 'block';
    $('vipNotice').textContent = '⚠️ Gagal load VIP: ' + (vRes.error.message || '') + '. Jalankan schema terbaru.';
    return;
  }
  $('vipNotice').style.display = 'none';
  state.vip = vRes.data || { monthly_max_slots: 5, filled_slots: 0, price: 0, benefits: [], is_active: true };
  state.bookings = bRes.error ? [] : (bRes.data || []);
  renderVipSettings();
  renderBookings();
  renderSlotMeter();
}

function renderVipSettings() {
  const v = state.vip || {};
  $('vip_max').value = v.monthly_max_slots == null ? 5 : v.monthly_max_slots;
  $('vip_price').value = v.price == null ? 0 : v.price;
  $('vip_desc').value = v.description || '';
  $('vip_benefits').value = (Array.isArray(v.benefits) ? v.benefits : []).join('\n');
  $('vip_active').checked = v.is_active !== false;
}

function monthKey(d) {
  const x = d ? new Date(d) : new Date();
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
}

function confirmedThisMonth() {
  const now = monthKey();
  return state.bookings.filter((b) => {
    if (b.status !== 'confirmed' && b.status !== 'done') return false;
    return monthKey(b.preferred_date || b.created_at) === now;
  }).length;
}

function renderSlotMeter() {
  const v = state.vip || {};
  const max = Number(v.monthly_max_slots) || 0;
  const filled = confirmedThisMonth();
  const pct = max ? Math.min(100, Math.round(filled / max * 100)) : 0;
  $('vipMeterText').textContent = filled + ' / ' + max + ' slot terisi bulan ini';
  const bar = $('vipMeterBar');
  bar.style.width = pct + '%';
  bar.className = 'a-slotbar__fill' + (filled >= max ? ' is-full' : '');
  $('vipMeterSub').textContent = filled >= max
    ? 'Slot penuh — booking baru akan masuk daftar tunggu.'
    : (max - filled) + ' slot tersisa.';
}

function renderBookings() {
  const body = $('vipBookingsBody');
  const list = state.bookings;
  body.innerHTML = list.map((b) => {
    const status = b.status || 'pending';
    return '<tr data-id="' + esc(b.id) + '">' +
      '<td><div class="d-name">' + esc(b.member_name || b.email) + '</div><div class="d-sub">' + esc(b.email) + '</div></td>' +
      '<td>' + (b.preferred_date ? fmtDate(b.preferred_date) : '—') + (b.preferred_time ? ' · ' + esc(b.preferred_time) : '') + '</td>' +
      '<td>' + esc(b.topic || '—') + '</td>' +
      '<td><select class="a-input bk-status">' +
        ['pending', 'confirmed', 'done', 'cancelled'].map((s) =>
          '<option value="' + s + '"' + (status === s ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></td>' +
      '<td>' + esc(fmtDate(b.created_at)) + '</td>' +
      '<td><button type="button" class="btn btn--ghost btn--sm bk-save">Simpan</button></td>' +
    '</tr>';
  }).join('');
  $('vipBookingsEmpty').style.display = list.length ? 'none' : 'block';

  body.querySelectorAll('.bk-save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const id = tr.dataset.id;
      const status = tr.querySelector('.bk-status').value;
      const { error } = await ctx.client.from('vip_bookings').update({ status }).eq('id', id);
      if (error) return toast('Gagal update booking: ' + (error.message || error), 'warn');
      const b = state.bookings.find((x) => String(x.id) === String(id));
      if (b) b.status = status;
      renderSlotMeter();
      toast('Booking diperbarui.', 'ok');
    });
  });
}

async function saveVip() {
  const payload = {
    monthly_max_slots: Number($('vip_max').value) || 0,
    price: Number($('vip_price').value) || 0,
    description: $('vip_desc').value.trim(),
    benefits: $('vip_benefits').value.split('\n').map((x) => x.trim()).filter(Boolean),
    is_active: $('vip_active').checked
  };
  try {
    if (state.vip && state.vip.id) {
      const { error } = await ctx.client.from('vip_settings').update(payload).eq('id', state.vip.id);
      if (error) throw error;
    } else {
      const { data, error } = await ctx.client.from('vip_settings').insert(payload).select().single();
      if (error) throw error;
      state.vip = data;
    }
    toast('Pengaturan VIP tersimpan.', 'ok');
    await loadVip();
  } catch (e) {
    toast('Gagal simpan VIP: ' + (e.message || e), 'warn');
  }
}

async function syncSlots() {
  if (!state.vip || !state.vip.id) return;
  const filled = confirmedThisMonth();
  const { error } = await ctx.client.from('vip_settings').update({ filled_slots: filled }).eq('id', state.vip.id);
  if (error) return toast('Gagal sync slot: ' + (error.message || error), 'warn');
  state.vip.filled_slots = filled;
  renderSlotMeter();
  toast('Slot disinkronkan: ' + filled + ' terisi.', 'ok');
}

// ================= Projects =================

async function loadProjects() {
  const { data, error } = await ctx.client.from('vip_projects').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) {
    $('prjNotice').style.display = 'block';
    $('prjNotice').textContent = '⚠️ Gagal load project: ' + (error.message || '') + '.';
    return;
  }
  $('prjNotice').style.display = 'none';
  state.projects = data || [];
  renderProjects();
}

function renderProjects() {
  const body = $('prjBody');
  body.innerHTML = state.projects.map((p) => {
    const status = p.status || 'submitted';
    return '<tr data-id="' + esc(p.id) + '">' +
      '<td><div class="d-name">' + esc(p.title || 'Untitled') + '</div><div class="d-sub">' + esc(p.email) + '</div></td>' +
      '<td><div class="d-sub">' + esc((p.description || '').slice(0, 120)) + '</div>' +
        (p.file_url ? '<a href="' + esc(p.file_url) + '" target="_blank" rel="noopener" class="l-link">Lihat file ↗</a>' : '') + '</td>' +
      '<td><select class="a-input prj-status">' +
        ['submitted', 'reviewing', 'feedback', 'approved'].map((s) =>
          '<option value="' + s + '"' + (status === s ? ' selected' : '') + '>' + s + '</option>').join('') +
      '</select></td>' +
      '<td><textarea class="a-input prj-feedback" rows="2">' + esc(p.feedback || '') + '</textarea></td>' +
      '<td><button type="button" class="btn btn--ghost btn--sm prj-save">Simpan</button></td>' +
    '</tr>';
  }).join('');
  $('prjEmpty').style.display = state.projects.length ? 'none' : 'block';

  body.querySelectorAll('.prj-save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tr = btn.closest('tr');
      const id = tr.dataset.id;
      const status = tr.querySelector('.prj-status').value;
      const feedback = tr.querySelector('.prj-feedback').value;
      const { error } = await ctx.client.from('vip_projects').update({
        status, feedback, reviewed_at: new Date().toISOString()
      }).eq('id', id);
      if (error) return toast('Gagal simpan review: ' + (error.message || error), 'warn');
      toast('Review tersimpan.', 'ok');
    });
  });
}
