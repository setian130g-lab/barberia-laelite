/**
 * Barbería La Élite - App Core & Gestión de Datos
 * Calle Ronda de Santo Domingo 53, Orihuela, Alicante
 */

const STORAGE_KEYS = {
  APPOINTMENTS: 'elite_barber_appointments',
  CONFIG: 'elite_barber_config',
  ACTIVE_BARBER: 'elite_barber_user'
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  // ─── URLs de n8n (oficiales de Barbería La Élite) ────────────────────────
  n8nWebhookUrl: 'https://joanmazo.app.n8n.cloud/webhook/e7cfd01c-4055-4577-b026-e6861f7ba630/chat',
  n8nPanelBaseUrl: 'https://joanmazo.app.n8n.cloud/webhook/panel-barbero',
  // ─────────────────────────────────────────────────────────────────────────
  phone: '+34 600 000 000',
  whatsapp: '34600000000',
  address: 'Calle Ronda de Santo Domingo 53, Orihuela, Alicante',
  schedule: 'Lunes a Sábado de 9:00 a 22:00',
  instagramUrl: 'https://instagram.com/laelite_barberia',
  facebookUrl: 'https://facebook.com/laelitebarberia'
};

// Citas iniciales de demostración para que Deison y Juan Pablo tengan datos
const INITIAL_DEMO_APPOINTMENTS = [
  {
    id: 'apt-101',
    clientName: 'Carlos Mendoza',
    phone: '+34 612 345 678',
    barber: 'deison',
    service: 'Corte Degradado / Fade',
    price: 12,
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    status: 'confirmada', // 'pendiente', 'confirmada', 'completada', 'cancelada'
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    source: 'Chat IA (n8n)'
  },
  {
    id: 'apt-102',
    clientName: 'Mateo Serrano',
    phone: '+34 654 987 321',
    barber: 'deison',
    service: 'Corte + Barba La Élite',
    price: 18,
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    status: 'pendiente',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    source: 'Chat IA (n8n)'
  },
  {
    id: 'apt-103',
    clientName: 'Alejandro Ruiz',
    phone: '+34 677 889 900',
    barber: 'juanpablo',
    service: 'Mechas Platinum + Corte',
    price: 42,
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    status: 'confirmada',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    source: 'Web Directa'
  },
  {
    id: 'apt-104',
    clientName: 'Javier Navarro',
    phone: '+34 699 112 233',
    barber: 'juanpablo',
    service: 'Tinte & Colorimetría',
    price: 25,
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'pendiente',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    source: 'Chat IA (n8n)'
  },
  {
    id: 'apt-105',
    clientName: 'David Gómez',
    phone: '+34 633 445 566',
    barber: 'deison',
    service: 'Corte Clásico',
    price: 12,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '11:00',
    status: 'confirmada',
    createdAt: new Date().toISOString(),
    source: 'Chat IA (n8n)'
  }
];

// Inicializar almacenamiento
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_DEMO_APPOINTMENTS));
  }
  // Siempre aseguramos que la configuración tiene las URLs de n8n correctas
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{}');
  const mergedConfig = { ...DEFAULT_CONFIG, ...savedConfig,
    // Forzar siempre las URLs oficiales (no se pueden sobreescribir con vacío)
    n8nWebhookUrl:    savedConfig.n8nWebhookUrl    || DEFAULT_CONFIG.n8nWebhookUrl,
    n8nPanelBaseUrl:  savedConfig.n8nPanelBaseUrl  || DEFAULT_CONFIG.n8nPanelBaseUrl
  };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(mergedConfig));
}

// Obtener todas las citas
function getAppointments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error al leer citas:', e);
    return [];
  }
}

// Guardar cita nueva
function saveAppointment(appointment) {
  const appointments = getAppointments();
  const newAppointment = {
    id: 'apt-' + Date.now(),
    status: 'pendiente',
    createdAt: new Date().toISOString(),
    ...appointment
  };
  appointments.unshift(newAppointment);
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  
  // Emitir evento para actualización entre ventanas
  window.dispatchEvent(new CustomEvent('elite:appointment-added', { detail: newAppointment }));
  return newAppointment;
}

// Actualizar estado de una cita
function updateAppointmentStatus(id, newStatus) {
  const appointments = getAppointments();
  const index = appointments.findIndex(a => a.id === id);
  if (index !== -1) {
    appointments[index].status = newStatus;
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    return true;
  }
  return false;
}

// Eliminar cita
function deleteAppointment(id) {
  const appointments = getAppointments().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
}

// Mostrar Toast de Notificación
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' 
    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-200' 
    : (type === 'error' ? 'bg-red-950 border border-red-500/50 text-red-200' : 'bg-slate-900 border border-amber-500/50 text-amber-200');

  toast.className = `${bgClass} p-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300`;
  toast.innerHTML = `
    <span class="text-xl">${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <span class="text-sm font-medium">${message}</span>
  `;

  container.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  // Remover tras 4 segundos
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
});
