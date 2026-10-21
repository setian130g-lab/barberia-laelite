/**
 * Barbería La Élite - Panel de Gestión para Barberos (Deison y Juan Pablo)
 * Integración con n8n para sincronización de citas en tiempo real
 */

// ─── URLs de n8n ─────────────────────────────────────────────────────────────
const N8N_PANEL_BASE_URL = 'https://joanmazo.app.n8n.cloud/webhook/panel-barbero';
// ─────────────────────────────────────────────────────────────────────────────

let activeFilter = 'all'; // 'all', 'today', 'pending', 'confirmed', 'completed'
let _currentUser = null;
let _n8nAppointments = []; // citas que vienen de n8n
let _n8nSyncInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = checkAuthProtection();
  if (!currentUser) return;
  _currentUser = currentUser;

  renderBarberHeader(currentUser);
  bindPanelEvents(currentUser);

  // 1. Carga inicial: local primero (rápido), luego n8n
  loadDashboardData(currentUser);
  syncFromN8N(currentUser, true); // true = mostrar spinner

  // 2. Auto-refresh desde n8n cada 30 segundos
  _n8nSyncInterval = setInterval(() => syncFromN8N(currentUser, false), 30000);

  // 3. Escuchar citas creadas en otra pestaña (chat local)
  window.addEventListener('storage', (e) => {
    if (e.key === 'elite_barber_appointments') {
      loadDashboardData(currentUser);
      showToast('¡Nuevas citas desde el chat de la web!', 'info');
    }
  });

  window.addEventListener('elite:appointment-added', () => {
    loadDashboardData(currentUser);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SINCRONIZACIÓN CON N8N
   ═══════════════════════════════════════════════════════════════════════════ */

async function syncFromN8N(user, showSpinner = false) {
  const syncBtn = document.getElementById('n8n-sync-btn');
  const syncStatus = document.getElementById('n8n-sync-status');
  const barberParam = user.name; // "Deison" o "Juan Pablo"
  const url = `${N8N_PANEL_BASE_URL}?barber=${encodeURIComponent(barberParam)}`;

  if (showSpinner && syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `
      <svg class="w-4 h-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <span class="text-xs">Sincronizando...</span>
    `;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`n8n respondió ${response.status}`);
    const data = await response.json();

    // n8n puede devolver un array directo o { appointments: [...] } o { data: [...] }
    let rawList = Array.isArray(data) ? data
      : (data.appointments || data.citas || data.data || data.items || []);

    // Normalizar cada cita al formato interno de la app
    _n8nAppointments = rawList.map(normalizeN8NAppointment);

    // Fusionar con citas locales (sin duplicar por id)
    mergeN8NAppointmentsToLocal(_n8nAppointments);

    // Actualizar UI
    loadDashboardData(user);

    // Actualizar badge de estado
    if (syncStatus) {
      const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      syncStatus.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-emerald-400">n8n · ${_n8nAppointments.length} cita(s) · ${now}</span>
      `;
    }
    if (showSpinner) showToast(`✅ ${_n8nAppointments.length} cita(s) sincronizada(s) desde n8n`);

  } catch (err) {
    console.warn('[Panel] Error al sincronizar con n8n:', err.message);
    if (syncStatus) {
      syncStatus.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-red-400"></span>
        <span class="text-red-400 text-xs">Sin conexión a n8n</span>
      `;
    }
    if (showSpinner) showToast('⚠️ No se pudo conectar con n8n. Mostrando citas locales.', 'error');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span class="text-xs">Sincronizar n8n</span>
      `;
    }
  }
}

/**
 * Convierte un objeto de cita proveniente de n8n al formato interno de la app.
 * Ajusta los nombres de campo que use tu workflow de n8n.
 */
function normalizeN8NAppointment(raw) {
  return {
    id: raw.id || raw._id || raw.appointmentId || ('n8n-' + JSON.stringify(raw).length + '-' + Math.random().toString(36).slice(2, 6)),
    clientName: raw.clientName || raw.cliente || raw.name || raw.nombre || 'Cliente',
    phone: raw.phone || raw.telefono || raw.tel || '',
    barber: (raw.barber || raw.barbero || 'deison').toLowerCase().replace(/\s+/g, ''),
    service: raw.service || raw.servicio || 'Corte',
    price: Number(raw.price || raw.precio || 12),
    date: raw.date || raw.fecha || new Date().toISOString().split('T')[0],
    time: raw.time || raw.hora || '10:00',
    status: raw.status || raw.estado || 'pendiente',
    source: raw.source || 'n8n IA',
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString()
  };
}

/**
 * Fusiona citas de n8n con las almacenadas localmente.
 * Las citas de n8n prevalecen si tienen el mismo id.
 */
function mergeN8NAppointmentsToLocal(n8nList) {
  const local = getAppointments();
  const localIds = new Set(local.map(a => a.id));

  let changed = false;
  n8nList.forEach(apt => {
    if (!localIds.has(apt.id)) {
      local.unshift(apt);
      changed = true;
    } else {
      // Actualizar estado si n8n tiene datos más nuevos
      const idx = local.findIndex(a => a.id === apt.id);
      if (idx !== -1 && local[idx].status !== apt.status) {
        local[idx].status = apt.status;
        changed = true;
      }
    }
  });

  if (changed) {
    localStorage.setItem('elite_barber_appointments', JSON.stringify(local));
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARGA DEL DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */

function renderBarberHeader(user) {
  const nameEl = document.getElementById('barber-name-display');
  const roleEl = document.getElementById('barber-role-display');
  const avatarEl = document.getElementById('barber-avatar-display');

  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;
  if (avatarEl) avatarEl.src = user.avatar;

  document.title = `Panel de ${user.name} — Barbería La Élite`;
}

function loadDashboardData(user) {
  const allAppointments = getAppointments();
  // Filtrar solo las citas del barbero logueado
  const myAppointments = allAppointments.filter(apt =>
    !apt.barber || apt.barber.toLowerCase().replace(/\s+/g, '') === user.username.toLowerCase()
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const todayApts     = myAppointments.filter(a => a.date === todayStr && a.status !== 'cancelada');
  const pendingApts   = myAppointments.filter(a => a.status === 'pendiente');
  const completedApts = myAppointments.filter(a => a.status === 'completada');

  const todayRevenue = todayApts
    .filter(a => a.status === 'completada' || a.status === 'confirmada')
    .reduce((acc, curr) => acc + (Number(curr.price) || 12), 0);

  const el = id => document.getElementById(id);
  if (el('stat-today-count'))     el('stat-today-count').textContent     = todayApts.length;
  if (el('stat-pending-count'))   el('stat-pending-count').textContent   = pendingApts.length;
  if (el('stat-completed-count')) el('stat-completed-count').textContent = completedApts.length;
  if (el('stat-today-revenue'))   el('stat-today-revenue').textContent   = `${todayRevenue} €`;

  renderAppointmentsList(myAppointments, user);
}

function renderAppointmentsList(appointments, user) {
  const container = document.getElementById('appointments-container');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  let filtered = [...appointments];

  if (activeFilter === 'today')     filtered = filtered.filter(a => a.date === todayStr);
  else if (activeFilter === 'pending')   filtered = filtered.filter(a => a.status === 'pendiente');
  else if (activeFilter === 'confirmed') filtered = filtered.filter(a => a.status === 'confirmada');
  else if (activeFilter === 'completed') filtered = filtered.filter(a => a.status === 'completada');

  filtered.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
        <span class="text-4xl block mb-2">✂️</span>
        <h4 class="text-base font-semibold text-slate-400 mb-1">No hay citas en este filtro</h4>
        <p class="text-xs text-slate-500">Las nuevas reservas del chat IA aparecerán aquí automáticamente.<br>Pulsa <strong class="text-amber-400">Sincronizar n8n</strong> para actualizar.</p>
      </div>
    `;
    return;
  }

  const badgeColors = {
    pendiente:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    confirmada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    completada: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    cancelada:  'bg-red-500/20 text-red-300 border-red-500/30'
  };

  let html = '';
  filtered.forEach(apt => {
    const isToday = apt.date === todayStr;
    const badgeColor = badgeColors[apt.status] || 'bg-slate-700 text-slate-300';
    const cleanPhone = (apt.phone || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      `Hola ${apt.clientName}, te saluda ${user.name} de Barbería La Élite sobre tu cita para ${apt.service} el ${apt.date} a las ${apt.time} h.`
    );
    const isN8N = (apt.source || '').toLowerCase().includes('n8n') || (apt.id || '').startsWith('n8n-');

    html += `
      <div class="bg-slate-900/90 border ${isToday ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-slate-800'} rounded-2xl p-4 sm:p-5 transition-all hover:border-amber-500/60">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center border border-slate-700 text-sm">
              ${apt.clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-bold text-slate-100 text-base">${apt.clientName}</h4>
                ${isToday ? '<span class="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Hoy</span>' : ''}
                ${isN8N ? '<span class="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">n8n IA</span>' : ''}
              </div>
              <p class="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>📞 ${apt.phone || 'Sin teléfono'}</span>
                <span class="text-slate-600">•</span>
                <span class="text-slate-500 text-[11px]">${apt.source || 'Reserva Web'}</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-center">
            <span class="text-xs px-2.5 py-1 rounded-full border ${badgeColor} font-semibold uppercase text-[10px] tracking-wider">
              ${apt.status}
            </span>
            <span class="text-base font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
              ${apt.price || 12} €
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs text-slate-300">
          <div class="flex items-center gap-2">
            <span class="text-amber-400">✂️ Servicio:</span>
            <span class="font-medium text-slate-200">${apt.service}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-amber-400">🕒 Fecha &amp; Hora:</span>
            <span class="font-mono text-slate-200 font-bold">${apt.date} a las ${apt.time} h</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          ${cleanPhone ? `
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank"
               class="text-xs bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              💬 Enviar WhatsApp
            </a>
          ` : '<span></span>'}

          <div class="flex items-center gap-2">
            ${apt.status === 'pendiente' ? `
              <button onclick="changeStatus('${apt.id}', 'confirmada')"
                class="text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/40 px-3 py-1.5 rounded-lg font-medium transition-all">
                ✓ Confirmar
              </button>
            ` : ''}
            ${apt.status !== 'completada' ? `
              <button onclick="changeStatus('${apt.id}', 'completada')"
                class="text-xs bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 px-3 py-1.5 rounded-lg font-medium transition-all">
                ★ Completada
              </button>
            ` : ''}
            ${apt.status !== 'cancelada' ? `
              <button onclick="changeStatus('${apt.id}', 'cancelada')"
                class="text-xs bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-all"
                title="Cancelar Cita">✕</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.changeStatus = function(aptId, newStatus) {
  if (updateAppointmentStatus(aptId, newStatus)) {
    showToast(`Cita marcada como "${newStatus}"`);
    loadDashboardData(_currentUser);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   EVENTOS DEL PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function bindPanelEvents(user) {
  // Botones de filtro
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-amber-500', 'text-slate-950', 'font-bold');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      btn.classList.add('bg-amber-500', 'text-slate-950', 'font-bold');
      btn.classList.remove('bg-slate-800', 'text-slate-300');
      activeFilter = btn.getAttribute('data-filter');
      loadDashboardData(user);
    });
  });

  // Botón sincronizar n8n manual
  const syncBtn = document.getElementById('n8n-sync-btn');
  syncBtn?.addEventListener('click', () => syncFromN8N(user, true));

  // Modal Nueva Cita Manual
  const openModalBtn  = document.getElementById('open-manual-apt-btn');
  const modal         = document.getElementById('manual-apt-modal');
  const closeModalBtn = document.getElementById('close-manual-apt-btn');
  const form          = document.getElementById('manual-apt-form');

  openModalBtn?.addEventListener('click', () => {
    document.getElementById('manual-date').value = new Date().toISOString().split('T')[0];
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  });

  closeModalBtn?.addEventListener('click', () => {
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveAppointment({
      clientName: document.getElementById('manual-name').value.trim(),
      phone:      document.getElementById('manual-phone').value.trim(),
      barber:     user.username,
      service:    document.getElementById('manual-service').value,
      price:      Number(document.getElementById('manual-price').value) || 12,
      date:       document.getElementById('manual-date').value,
      time:       document.getElementById('manual-time').value,
      status:     'confirmada',
      source:     `Apuntada en persona por ${user.name}`
    });
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    form.reset();
    showToast('Cita agregada con éxito a tu agenda');
    loadDashboardData(user);
  });
}
