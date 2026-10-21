/**
 * Barbería La Élite - Chatbot IA para Agendamiento de Citas
 * Integración con n8n y Asistente Guiado Inteligente
 */

class EliteAIChat {
  constructor() {
    this.isOpen = false;
    this.config = this.loadConfig();
    this.currentStep = 'idle'; // idle, selecting_barber, selecting_service, selecting_date, selecting_time, selecting_contact, confirmed
    this.bookingData = {
      barber: null,
      service: null,
      price: null,
      date: null,
      time: null,
      clientName: '',
      phone: ''
    };
    
    this.servicesList = [
      { name: 'Corte Clásico / Degradado (Fade)', price: 12 },
      { name: 'Corte + Arreglo de Barba La Élite', price: 18 },
      { name: 'Tinte & Colorimetría', price: 25 },
      { name: 'Mechas Platinum / Reflejos', price: 30 },
      { name: 'Arreglo y Perfilado de Barba', price: 8 },
      { name: 'Lavado, Peinado y Acabado', price: 6 },
      { name: 'Perfilado de Cejas', price: 5 }
    ];

    this.initDOM();
    this.bindEvents();
  }

  loadConfig() {
    // Siempre usamos las URLs oficiales de n8n como base
    const OFFICIAL_CONFIG = {
      n8nWebhookUrl: 'https://joanmazo.app.n8n.cloud/webhook/e7cfd01c-4055-4577-b026-e6861f7ba630/chat',
      n8nPanelBaseUrl: 'https://joanmazo.app.n8n.cloud/webhook/panel-barbero'
    };
    try {
      const raw = localStorage.getItem('elite_barber_config');
      const saved = raw ? JSON.parse(raw) : {};
      // Merge: el usuario puede sobrescribir, pero siempre hay un valor por defecto
      return { ...OFFICIAL_CONFIG, ...saved };
    } catch {
      return OFFICIAL_CONFIG;
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('elite_barber_config', JSON.stringify(this.config));
  }

  initDOM() {
    // Si ya existe el contenedor, no duplicar
    if (document.getElementById('elite-chat-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'elite-chat-widget';
    widget.innerHTML = `
      <!-- Botón Flotante para Abrir Chat (Optimizado para Móvil y Desktop) -->
      <div id="elite-chat-toggle" class="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 cursor-pointer group select-none transition-all duration-300">
        <!-- Badge Flotante visible en móvil y escritorio -->
        <div class="flex items-center gap-1.5 bg-slate-950/95 text-amber-300 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/50 shadow-2xl backdrop-blur-md group-hover:border-amber-400 float-badge transition-all">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Citas IA ✨</span>
        </div>
        
        <!-- Botón Circular con Logo Oficial -->
        <button aria-label="Abrir Asistente IA para Agendar Cita" class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all pulse-gold border-2 border-slate-950 flex-shrink-0">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-black border border-amber-400/60 shadow-inner flex items-center justify-center">
            <img src="logo.png" alt="La Élite Barber Shop" class="w-full h-full object-cover">
          </div>
          <!-- Indicador verde en línea -->
          <span class="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center">
            <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
          </span>
        </button>
      </div>

      <!-- Ventana Principal del Chat (Responsive Mobile-First) -->
      <div id="elite-chat-window" class="fixed inset-x-2 bottom-2 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[420px] max-w-full sm:max-w-[420px] h-[88vh] sm:h-[580px] max-h-[92vh] bg-[#0c121e] border border-amber-500/40 rounded-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-95 opacity-0 pointer-events-none chat-container">
        
        <!-- Header del Chat -->
        <div class="bg-gradient-to-r from-slate-950 via-[#131b2e] to-slate-950 p-4 border-b border-amber-500/20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative w-10 h-10 rounded-full border border-amber-500/60 overflow-hidden shadow-md flex items-center justify-center bg-black">
              <img src="logo.png" alt="La Élite Barber Shop" class="w-full h-full object-cover">
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900"></span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-amber-200 font-heading tracking-wide">La Élite • Asistente IA</h4>
              <p class="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Conectado con Barbería
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-1.5">
            <!-- Botón Configurar Webhook n8n -->
            <button id="elite-chat-config-btn" title="Configurar Webhook n8n" class="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <!-- Botón Cerrar -->
            <button id="elite-chat-close-btn" class="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Banner de estado n8n -->
        <div id="n8n-status-bar" class="px-4 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${this.config.n8nWebhookUrl ? 'bg-amber-400' : 'bg-slate-500'}"></span>
            Modo: <strong class="text-slate-300">${this.config.n8nWebhookUrl ? 'Automatizado con n8n' : 'Asistente Guiado Local'}</strong>
          </span>
          <button id="elite-reset-chat-btn" class="hover:text-amber-300 text-[10px] underline">Reiniciar</button>
        </div>

        <!-- Área de Mensajes -->
        <div id="elite-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          <!-- Mensajes dinámicos aquí -->
        </div>

        <!-- Indicador de Escritura de la IA -->
        <div id="elite-chat-typing" class="hidden px-4 py-2 bg-slate-900/50 flex items-center gap-2 text-xs text-amber-300/80">
          <span>La Élite IA está respondiendo</span>
          <span class="flex gap-1">
            <span class="w-1.5 h-1.5 bg-amber-400 rounded-full typing-dot"></span>
            <span class="w-1.5 h-1.5 bg-amber-400 rounded-full typing-dot"></span>
            <span class="w-1.5 h-1.5 bg-amber-400 rounded-full typing-dot"></span>
          </span>
        </div>

        <!-- Área de Input -->
        <form id="elite-chat-form" class="p-3 bg-slate-950/90 border-t border-amber-500/20 flex gap-2">
          <input 
            type="text" 
            id="elite-chat-input" 
            placeholder="Escribe un mensaje o elige una opción..." 
            class="flex-1 bg-slate-900/90 border border-slate-800 focus:border-amber-500/70 focus:outline-none text-slate-200 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl placeholder:text-slate-500 transition-all"
            autocomplete="off"
          />
          <button 
            type="submit" 
            class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-2.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-md">
            <svg class="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Modal de Configuración n8n -->
      <div id="n8n-config-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
        <div class="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-heading text-lg font-bold text-amber-300">⚙️ Conexión con n8n</h3>
            <button id="n8n-modal-close" class="text-slate-400 hover:text-white text-xl">&times;</button>
          </div>
          <p class="text-xs text-slate-400 mb-4">
            Puedes conectar este chat directamente al Webhook de tu flujo de <strong>n8n</strong>. Si lo dejas vacío, el chat funcionará con su motor inteligente integrado.
          </p>
          <div class="space-y-3 mb-5">
            <label class="block text-xs font-semibold text-slate-300">URL del Webhook de n8n (POST):</label>
            <input 
              type="url" 
              id="n8n-webhook-input" 
              value="${this.config.n8nWebhookUrl || ''}" 
              placeholder="https://tu-n8n.com/webhook/elite-booking" 
              class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400"
            />
            <p class="text-[11px] text-amber-400/80">
              💡 Tip: Incluimos el archivo <code>workflow_reserva_citas.json</code> listo para importar en tu n8n.
            </p>
          </div>
          <div class="flex justify-end gap-2">
            <button id="n8n-save-config-btn" class="btn-gold px-4 py-2 rounded-lg text-xs font-bold">
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
  }

  bindEvents() {
    const toggleBtn = document.getElementById('elite-chat-toggle');
    const closeBtn = document.getElementById('elite-chat-close-btn');
    const form = document.getElementById('elite-chat-form');
    const input = document.getElementById('elite-chat-input');
    const resetBtn = document.getElementById('elite-reset-chat-btn');
    const configBtn = document.getElementById('elite-chat-config-btn');
    const modalClose = document.getElementById('n8n-modal-close');
    const saveConfigBtn = document.getElementById('n8n-save-config-btn');

    toggleBtn?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.toggleChat(false));
    
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.handleUserMessage(text);
    });

    resetBtn?.addEventListener('click', () => {
      this.currentStep = 'idle';
      this.resetBookingData();
      this.clearMessages();
      this.startConversation();
    });

    configBtn?.addEventListener('click', () => {
      document.getElementById('n8n-config-modal').classList.remove('hidden');
      document.getElementById('n8n-config-modal').classList.add('flex');
    });

    modalClose?.addEventListener('click', () => {
      document.getElementById('n8n-config-modal').classList.add('hidden');
      document.getElementById('n8n-config-modal').classList.remove('flex');
    });

    saveConfigBtn?.addEventListener('click', () => {
      const url = document.getElementById('n8n-webhook-input').value.trim();
      this.saveConfig({ n8nWebhookUrl: url });
      document.getElementById('n8n-config-modal').classList.add('hidden');
      document.getElementById('n8n-config-modal').classList.remove('flex');
      
      const statusBar = document.getElementById('n8n-status-bar');
      if (statusBar) {
        statusBar.innerHTML = `
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${url ? 'bg-amber-400' : 'bg-slate-500'}"></span>
            Modo: <strong class="text-slate-300">${url ? 'Automatizado con n8n' : 'Asistente Guiado Local'}</strong>
          </span>
          <button id="elite-reset-chat-btn" class="hover:text-amber-300 text-[10px] underline">Reiniciar</button>
        `;
        document.getElementById('elite-reset-chat-btn')?.addEventListener('click', () => this.startConversation());
      }
      showToast('Configuración de n8n actualizada');
    });

    // Iniciar el saludo
    this.startConversation();
  }

  toggleChat(forceState = null) {
    const win = document.getElementById('elite-chat-window');
    const toggleBtn = document.getElementById('elite-chat-toggle');
    this.isOpen = forceState !== null ? forceState : !this.isOpen;

    if (this.isOpen) {
      win.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
      win.classList.add('scale-100', 'opacity-100');
      toggleBtn?.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
      document.getElementById('elite-chat-input')?.focus();
    } else {
      win.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
      win.classList.remove('scale-100', 'opacity-100');
      toggleBtn?.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
    }
  }

  openWithAction(action, param = null) {
    this.toggleChat(true);
    if (action === 'book_barber') {
      this.bookingData.barber = param; // 'deison' o 'juanpablo'
      const barberName = param === 'deison' ? 'Deison' : 'Juan Pablo';
      this.appendUserMessage(`Quiero reservar con ${barberName}`);
      this.askService();
    } else if (action === 'book_service') {
      const service = this.servicesList.find(s => s.name === param) || { name: param, price: 12 };
      this.bookingData.service = service.name;
      this.bookingData.price = service.price;
      this.appendUserMessage(`Quiero el servicio: ${service.name}`);
      this.askBarber();
    } else {
      this.startConversation();
    }
  }

  clearMessages() {
    const msgBox = document.getElementById('elite-chat-messages');
    if (msgBox) msgBox.innerHTML = '';
  }

  resetBookingData() {
    this.bookingData = {
      barber: null,
      service: null,
      price: null,
      date: null,
      time: null,
      clientName: '',
      phone: ''
    };
  }

  startConversation() {
    this.clearMessages();
    this.appendAiMessage(`
      <p class="font-bold text-amber-300 mb-1">¡Bienvenido a Barbería La Élite! 💈✨</p>
      <p class="text-xs text-slate-300 leading-relaxed mb-3">
        Soy tu asistente virtual con Inteligencia Artificial. Estoy aquí para agendar tu cita en cuestión de segundos o responder cualquier duda.
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button class="chat-quick-btn text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg px-2.5 py-1.5 transition-all" data-action="start_booking">
          📅 Agendar Cita Ahora
        </button>
        <button class="chat-quick-btn text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-all" data-action="show_prices">
          ✂️ Precios & Servicios
        </button>
        <button class="chat-quick-btn text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-all" data-action="show_hours">
          🕒 Horarios y Barberos
        </button>
        <button class="chat-quick-btn text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 transition-all" data-action="show_location">
          📍 Ubicación
        </button>
      </div>
    `);

    this.bindQuickButtons();
  }

  bindQuickButtons() {
    const buttons = document.querySelectorAll('.chat-quick-btn');
    buttons.forEach(btn => {
      btn.onclick = () => {
        const action = btn.getAttribute('data-action');
        const value = btn.getAttribute('data-value');
        const text = btn.innerText;

        this.appendUserMessage(text);

        if (action === 'start_booking') {
          this.askBarber();
        } else if (action === 'select_barber') {
          this.bookingData.barber = value;
          this.askService();
        } else if (action === 'select_service') {
          const s = this.servicesList.find(x => x.name === value) || { name: value, price: 12 };
          this.bookingData.service = s.name;
          this.bookingData.price = s.price;
          this.askDate();
        } else if (action === 'select_date') {
          this.bookingData.date = value;
          this.askTime();
        } else if (action === 'select_time') {
          this.bookingData.time = value;
          this.askContact();
        } else if (action === 'show_prices') {
          this.showPrices();
        } else if (action === 'show_hours') {
          this.showHours();
        } else if (action === 'show_location') {
          this.showLocation();
        }
      };
    });
  }

  showPrices() {
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      this.appendAiMessage(`
        <p class="font-bold text-amber-300 mb-2">💈 Lista de Precios en La Élite:</p>
        <ul class="text-xs space-y-1.5 text-slate-300 mb-3">
          <li class="flex justify-between border-b border-slate-800 pb-1">
            <span>• Corte Clásico / Fade</span> <strong class="text-amber-400">12 €</strong>
          </li>
          <li class="flex justify-between border-b border-slate-800 pb-1">
            <span>• Corte + Barba La Élite</span> <strong class="text-amber-400">18 €</strong>
          </li>
          <li class="flex justify-between border-b border-slate-800 pb-1">
            <span>• Tinte & Colorimetría</span> <strong class="text-amber-400">25 €</strong>
          </li>
          <li class="flex justify-between border-b border-slate-800 pb-1">
            <span>• Mechas Platinum / Reflejos</span> <strong class="text-amber-400">30 €</strong>
          </li>
          <li class="flex justify-between border-b border-slate-800 pb-1">
            <span>• Arreglo & Perfilado de Barba</span> <strong class="text-amber-400">8 €</strong>
          </li>
        </ul>
        <button class="chat-quick-btn text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5" data-action="start_booking">
          📅 Agendar con uno de estos servicios
        </button>
      `);
      this.bindQuickButtons();
    }, 400);
  }

  showHours() {
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      this.appendAiMessage(`
        <p class="font-bold text-amber-300 mb-1">🕒 Horarios & Barberos:</p>
        <p class="text-xs text-slate-300 mb-2">
          Abrimos de <strong>Lunes a Sábado de 09:00 a 22:00</strong> sin interrupción.
        </p>
        <p class="text-xs text-slate-300 mb-3">
          Nuestros barberos titulares:<br>
          • <strong>Deison</strong>: Especialista en degradados milimétricos (fades) y barba.<br>
          • <strong>Juan Pablo</strong>: Experto en tijera, estilo clásico, tinte y mechas.
        </p>
        <button class="chat-quick-btn text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5" data-action="start_booking">
          📅 Reservar Turno
        </button>
      `);
      this.bindQuickButtons();
    }, 400);
  }

  showLocation() {
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      this.appendAiMessage(`
        <p class="font-bold text-amber-300 mb-1">📍 ¿Dónde encontrarnos?</p>
        <p class="text-xs text-slate-300 mb-2">
          Estamos en <strong>Calle Ronda de Santo Domingo 53</strong>, Orihuela, Alicante (03300).
        </p>
        <p class="text-xs text-slate-400 mb-3">
          Cerca de los principales puntos de Orihuela con fácil aparcamiento.
        </p>
        <a href="https://maps.google.com/?q=Calle+Ronda+de+Santo+Domingo+53,+Orihuela,+Alicante" target="_blank" class="inline-block text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5">
          🗺️ Abrir en Google Maps
        </a>
      `);
    }, 400);
  }

  askBarber() {
    this.currentStep = 'selecting_barber';
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      this.appendAiMessage(`
        <p class="text-xs text-slate-200 mb-2">¿Con qué barbero te gustaría atenderte?</p>
        <div class="grid grid-cols-2 gap-2">
          <button class="chat-quick-btn p-2.5 bg-slate-900 border border-amber-500/30 hover:border-amber-400 rounded-xl text-left transition-all" data-action="select_barber" data-value="deison">
            <span class="block text-xs font-bold text-amber-300">💈 Deison</span>
            <span class="block text-[10px] text-slate-400">Fades & Barbas</span>
          </button>
          <button class="chat-quick-btn p-2.5 bg-slate-900 border border-amber-500/30 hover:border-amber-400 rounded-xl text-left transition-all" data-action="select_barber" data-value="juanpablo">
            <span class="block text-xs font-bold text-amber-300">✂️ Juan Pablo</span>
            <span class="block text-[10px] text-slate-400">Tinte & Estilo</span>
          </button>
        </div>
      `);
      this.bindQuickButtons();
    }, 400);
  }

  askService() {
    this.currentStep = 'selecting_service';
    const barberLabel = this.bookingData.barber === 'deison' ? 'Deison' : 'Juan Pablo';
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      let html = `<p class="text-xs text-slate-200 mb-2">Excelente elección con <strong>${barberLabel}</strong>. ¿Qué servicio te vas a realizar?</p><div class="space-y-1.5">`;
      
      this.servicesList.forEach(s => {
        html += `
          <button class="chat-quick-btn w-full p-2 bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left flex justify-between items-center text-xs transition-all" data-action="select_service" data-value="${s.name}">
            <span class="text-slate-300">${s.name}</span>
            <span class="text-amber-400 font-bold">${s.price} €</span>
          </button>
        `;
      });
      html += `</div>`;
      this.appendAiMessage(html);
      this.bindQuickButtons();
    }, 400);
  }

  askDate() {
    this.currentStep = 'selecting_date';
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      
      const today = new Date();
      const options = [];
      for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        // Excluir domingos (day 0) ya que abren de lunes a sábado
        if (d.getDay() !== 0) {
          const dateStr = d.toISOString().split('T')[0];
          const label = i === 0 ? 'Hoy' : (i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }));
          options.push({ dateStr, label });
        }
      }

      let html = `<p class="text-xs text-slate-200 mb-2">¿Para qué día deseas tu cita?</p><div class="grid grid-cols-3 gap-1.5">`;
      options.forEach(opt => {
        html += `
          <button class="chat-quick-btn py-2 px-1 text-center bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-lg text-xs transition-all" data-action="select_date" data-value="${opt.dateStr}">
            <span class="block font-semibold text-amber-300 capitalize">${opt.label}</span>
            <span class="text-[10px] text-slate-400">${opt.dateStr.slice(5)}</span>
          </button>
        `;
      });
      html += `</div>`;
      this.appendAiMessage(html);
      this.bindQuickButtons();
    }, 400);
  }

  askTime() {
    this.currentStep = 'selecting_time';
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      // Horarios de 9 a 22h
      const times = ['09:30', '11:00', '12:30', '16:00', '17:30', '19:00', '20:30'];
      let html = `<p class="text-xs text-slate-200 mb-2">Horarios disponibles para el ${this.bookingData.date}:</p><div class="grid grid-cols-3 gap-1.5">`;
      times.forEach(t => {
        html += `
          <button class="chat-quick-btn py-1.5 bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-lg text-center text-xs text-amber-200 font-mono transition-all" data-action="select_time" data-value="${t}">
            ${t}
          </button>
        `;
      });
      html += `</div>`;
      this.appendAiMessage(html);
      this.bindQuickButtons();
    }, 400);
  }

  askContact() {
    this.currentStep = 'selecting_contact';
    this.showTyping(true);
    setTimeout(() => {
      this.showTyping(false);
      this.appendAiMessage(`
        <p class="text-xs text-slate-200 mb-2">¡Casi listo! Por favor, facilítame tu <strong>Nombre</strong> y <strong>Teléfono</strong> para confirmar la reserva.</p>
        <p class="text-[11px] text-slate-400 mb-2">Escríbelo directamente en el chat. Por ejemplo: <em>"Alejandro 622334455"</em>.</p>
      `);
      document.getElementById('elite-chat-input')?.focus();
    }, 400);
  }

  async handleUserMessage(text) {
    this.appendUserMessage(text);

    // Si estamos en el paso de contacto durante el agendamiento guiado
    if (this.currentStep === 'selecting_contact') {
      const parts = text.split(' ');
      let name = text;
      let phone = '';
      
      const phoneMatch = text.match(/(\+?[0-9]{9,12})/);
      if (phoneMatch) {
        phone = phoneMatch[0];
        name = text.replace(phone, '').trim() || 'Cliente';
      } else {
        phone = '+34 600 000 000';
      }

      this.bookingData.clientName = name;
      this.bookingData.phone = phone;

      await this.finalizeBooking();
      return;
    }

    // Siempre enviamos al webhook n8n (está siempre configurado)
    await this.sendToN8N(text);
  }

  async sendToN8N(message) {
    this.showTyping(true);

    // Generar/recuperar sessionId persistente para mantener contexto en n8n
    let sessionId = localStorage.getItem('elite_session_id');
    if (!sessionId) {
      sessionId = 'elite-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('elite_session_id', sessionId);
    }

    try {
      // Formato estándar del n8n AI Chat Agent webhook
      const payload = {
        chatInput: message,           // campo principal que lee el nodo "Chat Trigger" de n8n
        sessionId: sessionId,         // mantiene el hilo de conversación en n8n
        // Contexto adicional de la barbería
        barberia: 'La Élite',
        currentBookingData: this.bookingData,
        source: 'Barberia La Elite Web Chat',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.config.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      this.showTyping(false);

      if (response.ok) {
        const data = await response.json();

        // n8n AI Agent responde con { output: "..." } — otros formatos como fallback
        const replyText = data.output || data.reply || data.text || data.message
          || (Array.isArray(data) && (data[0]?.output || data[0]?.text))
          || '¡Mensaje recibido! El asistente de La Élite está procesando tu solicitud.';

        this.appendAiMessage(`<p class="text-xs text-slate-200 leading-relaxed">${replyText}</p>`);

        // Si n8n confirma una cita con datos estructurados, la guardamos localmente también
        if (data.confirmedBooking) {
          saveAppointment({
            clientName: data.confirmedBooking.name || 'Cliente n8n',
            phone: data.confirmedBooking.phone || '',
            barber: (data.confirmedBooking.barber || 'deison').toLowerCase().replace(' ', ''),
            service: data.confirmedBooking.service || 'Corte',
            price: data.confirmedBooking.price || 12,
            date: data.confirmedBooking.date || new Date().toISOString().split('T')[0],
            time: data.confirmedBooking.time || '12:00',
            source: 'Chat IA → n8n'
          });
          showToast('¡Cita registrada por el asistente IA!');
        }
      } else {
        const errText = await response.text().catch(() => '');
        throw new Error(`Webhook n8n respondió ${response.status}: ${errText.slice(0, 120)}`);
      }
    } catch (err) {
      console.warn('[EliteChat] Error al conectar con n8n:', err.message);
      this.showTyping(false);
      this.appendAiMessage(`
        <div class="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs mb-2">
          ⚠️ No se pudo conectar con el asistente IA en este momento. Continuando en modo guiado local.
        </div>
      `);
      // Fallback: flujo local guiado
      this.askBarber();
    }
  }

  async finalizeBooking() {
    this.showTyping(true);

    const barberName = this.bookingData.barber === 'deison' ? 'Deison' : 'Juan Pablo';

    // Guardar en almacenamiento de la barbería
    const saved = saveAppointment({
      clientName: this.bookingData.clientName,
      phone: this.bookingData.phone,
      barber: this.bookingData.barber,
      service: this.bookingData.service,
      price: this.bookingData.price || 12,
      date: this.bookingData.date,
      time: this.bookingData.time,
      source: this.config.n8nWebhookUrl ? 'Chat IA (Conectado n8n)' : 'Chat IA (Local)'
    });

    // Si tiene n8n, también le notificamos la cita creada
    if (this.config.n8nWebhookUrl) {
      try {
        await fetch(this.config.n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'appointment_confirmed',
            appointment: saved
          })
        });
      } catch (e) {
        console.log('n8n sync error:', e);
      }
    }

    setTimeout(() => {
      this.showTyping(false);
      this.appendAiMessage(`
        <div class="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-3.5 rounded-xl border border-amber-500/50 text-xs space-y-2">
          <div class="flex items-center gap-2 text-emerald-400 font-bold">
            <span class="text-base">🎉</span> ¡CITA RESERVADA CON ÉXITO!
          </div>
          <div class="text-slate-200 space-y-1">
            <p>👤 <strong>Cliente:</strong> ${this.bookingData.clientName}</p>
            <p>📞 <strong>Teléfono:</strong> ${this.bookingData.phone}</p>
            <p>💈 <strong>Barbero:</strong> ${barberName}</p>
            <p>✂️ <strong>Servicio:</strong> ${this.bookingData.service} (${this.bookingData.price} €)</p>
            <p>📅 <strong>Fecha:</strong> ${this.bookingData.date} a las ${this.bookingData.time} h</p>
            <p>📍 <strong>Lugar:</strong> Calle Ronda de Santo Domingo 53, Orihuela</p>
          </div>
          <div class="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-amber-300">
            <span>Ref: #${saved.id.slice(-6)}</span>
            <span class="bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">Anotada en la agenda</span>
          </div>
        </div>
        <p class="text-xs text-slate-300 mt-2">
          ¡Te esperamos en La Élite! Si necesitas cambiar la hora o avisar de algo, puedes escribirnos por WhatsApp.
        </p>
        <div class="mt-2 flex gap-2">
          <a href="https://wa.me/34600000000?text=Hola,%20tengo%20cita%20agendada%20el%20${this.bookingData.date}%20a%20las%20${this.bookingData.time}%20en%20La%20Elite" target="_blank" class="text-xs bg-emerald-600/30 border border-emerald-500 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            💬 Confirmar por WhatsApp
          </a>
          <button class="chat-quick-btn text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg" data-action="start_booking">
            Otra Cita
          </button>
        </div>
      `);

      this.currentStep = 'idle';
      this.resetBookingData();
      this.bindQuickButtons();
      showToast('¡Cita agendada correctamente!');
    }, 600);
  }

  showTyping(show) {
    const el = document.getElementById('elite-chat-typing');
    if (el) {
      if (show) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  }

  appendUserMessage(text) {
    const box = document.getElementById('elite-chat-messages');
    if (!box) return;
    const msg = document.createElement('div');
    msg.className = 'flex justify-end';
    msg.innerHTML = `
      <div class="chat-bubble-user max-w-[82%] px-3.5 py-2 rounded-2xl rounded-br-none text-xs sm:text-sm shadow-md">
        ${this.escapeHtml(text)}
      </div>
    `;
    box.appendChild(msg);
    this.scrollToBottom();
  }

  appendAiMessage(htmlContent) {
    const box = document.getElementById('elite-chat-messages');
    if (!box) return;
    const msg = document.createElement('div');
    msg.className = 'flex justify-start';
    msg.innerHTML = `
      <div class="chat-bubble-ai max-w-[88%] px-3.5 py-2.5 rounded-2xl rounded-bl-none text-xs sm:text-sm text-slate-200 border border-slate-800 shadow-md">
        ${htmlContent}
      </div>
    `;
    box.appendChild(msg);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const box = document.getElementById('elite-chat-messages');
    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }

  escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

// Inicializar Chat
let eliteChatInstance = null;
document.addEventListener('DOMContentLoaded', () => {
  eliteChatInstance = new EliteAIChat();
  window.eliteChat = eliteChatInstance;
});

