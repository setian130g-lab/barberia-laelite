# 💈 Barbería La Élite - Web Oficial & Sistema de Citas IA

Sitio web profesional, moderno y responsivo para **Barbería La Élite**, situada en **Calle Ronda de Santo Domingo 53, Orihuela (Alicante)**. Cuenta con integración para automatización con **n8n**, asistente virtual inteligente con IA para reservas 24/7 y panel de control privado para los barberos **Deison** y **Juan Pablo**.

---

## 🚀 Características Principales

1. **Diseño Web Premium (Dark Luxury)**:
   - Estética barbería moderna en tonos negro carbón y toques dorados (`#D4AF37`).
   - Secciones completas: Inicio (Hero), Servicios & Tarifas, Nuestros Barberos, Galería de Estilos, Ubicación con Google Maps, Horarios y Redes Sociales.
   - Totalmente responsivo para móviles, tablets y ordenadores.

2. **Precios y Servicios Claros**:
   - Corte clásico y Degradado (Fade): **12 €**
   - Pack Corte + Barba La Élite: **18 €**
   - Tinte & Colorimetría: **25 €**
   - Mechas Platinum / Reflejos: **30 €**
   - Arreglo de Barba con navaja: **8 €**
   - Lavado, peinado y styling: **6 €**
   - Perfilado de cejas: **5 €**

3. **Perfiles de Barberos**:
   - **Deison**: Master Barber, especialista en degradados milimétricos (fades) y barba.
   - **Juan Pablo**: Senior Stylist, experto en corte a tijera, tinte, mechas y colorimetría.
   - Botón directo para reservar específicamente con cualquiera de ellos.

4. **Horarios & Contacto**:
   - **Horario**: Lunes a Sábado de 09:00 a 22:00 h.
   - **Dirección**: Calle Ronda de Santo Domingo 53, Orihuela, Alicante.
   - Mapa interactivo de Google Maps embebido.
   - Botones directos a Instagram, Facebook y WhatsApp.

5. **Chatbot Asistente con IA (Listo para n8n)**:
   - Widget de chat flotante intuitivo y conversacional.
   - Flujo de reserva interactivo guiado: Selección de barbero, servicio, fecha, hora y datos de contacto.
   - **Conexión con n8n**: Configurable directamente desde el modal del chat (ícono de engranaje ⚙️) o en `js/app.js`.
   - **Modo offline/fallback**: Si n8n no está conectado todavía, el asistente funciona de forma local autónoma sin perder ninguna cita.

6. **Portal de Barberos (Login & Dashboard)**:
   - Acceso con usuario y contraseña sencilla para **Deison** y **Juan Pablo**.
   - **Credenciales por defecto**:
     - Deison: Usuario `deison` | Contraseña: `123`
     - Juan Pablo: Usuario `juanpablo` | Contraseña: `123`
     - Botón de 1 clic para acceso demo instantáneo.
   - Panel exclusivo donde cada barbero ve:
     - Sus citas de hoy y próximas fechas.
     - Estimación de ingresos en euros.
     - Cambiar estados: *Confirmada*, *Completada*, *Cancelar*.
     - Enlace directo de WhatsApp con mensaje pre-redactado para contactar al cliente con 1 toque.
     - Botón para **añadir citas manuales** (para clientes que llamen o entren al local).

---

## 📁 Estructura del Proyecto (Todo Unificado en una Sola Carpeta)

```
barberia-la-elite/
├── index.html                  # Inicio con video de fondo y accesos rápidos
├── servicios.html              # Página dedicada a Servicios y Tarifas
├── barberos.html               # Página dedicada a Deison y Juan Pablo
├── galeria.html                # Galería de estilos con filtros interactivos
├── contacto.html               # Página de Ubicación (Calle Ronda Santo Domingo 53), Horario y Mapa
├── login.html                  # Acceso privado para barberos
├── panel-barbero.html          # Panel de gestión de citas para Deison y Juan Pablo
├── hero-video.mp4              # Video de portada cinematográfica
├── logo.png                    # Logo oficial circular de la barbería
├── logo.jpg                    # Copia de respaldo del logo oficial
├── logo.svg                    # Vector alternativo del logo
├── styles.css                  # Estilos personalizados, efectos dorados y animaciones
├── app.js                      # Gestión central de citas, estado y localStorage
├── chat-ia.js                  # Asistente IA interactivo y flotante para agendar citas
├── auth.js                     # Autenticación y control de sesión de barberos
├── barber-panel.js             # Lógica y métricas del panel de barberos
├── workflow_reserva_citas.json # Flujo listo para importar en n8n
├── README_N8N.md               # Guía paso a paso para conectar n8n
└── README.md                   # Documentación general del proyecto
```

---

## 💻 Cómo Probar la Aplicación

No requiere instalar servidores pesados ni dependencias complicadas. Puedes abrirlo directamente:

1. **Doble clic en `index.html`** para abrir la web en tu navegador favorito (Chrome, Edge, Firefox, Safari).
2. O bien, iniciar un servidor web local sencillo (por ejemplo con Python o extensión Live Server):
   ```bash
   # En la carpeta barberia-la-elite
   python -m http.server 8080
   # Abrir en navegador: http://localhost:8080
   ```
3. Para entrar al panel de los barberos:
   - Haz clic en **"Área Barberos"** en la barra superior o en el pie de página de la web.
   - O abre directamente `login.html`.
