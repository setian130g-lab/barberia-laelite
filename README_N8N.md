# 💈 Guía de Integración de n8n para Barbería La Élite

Esta guía explica paso a paso cómo conectar el chat con Inteligencia Artificial de la web con tu instancia de **n8n** para procesar citas, sincronizarlas con Google Calendar o enviarlas por WhatsApp/Telegram.

---

## 1. ¿Cómo funciona la arquitectura?

```
[ Cliente en la Web / Chat IA ]
               │
               ▼  (POST Webhook con mensaje o cita)
    [ Servidor n8n ] ──▶ [ Nodo OpenAI / Gemini ] (Entiende lenguaje natural)
               │
               ├──▶ [ Guarda en Google Calendar o Base de Datos ]
               │
               ▼  (JSON de Respuesta al Chat)
[ Confirmación instantánea en la Web y en el Panel de Deison / Juan Pablo ]
```

---

## 2. Paso a Paso para Importar el Flujo en n8n

1. Abre tu panel de **n8n** (en local o en tu servidor en la nube).
2. Haz clic en **Workflows** > **Add Workflow** (o el botón `+`).
3. En la esquina superior derecha, haz clic en los tres puntos `...` y selecciona **Import from File**.
4. Selecciona el archivo `workflow_reserva_citas.json` incluido en este proyecto.
5. Verás cargados los siguientes nodos:
   - **Webhook La Elite**: Escucha los mensajes enviados desde la página web.
   - **¿Cita Ya Confirmada?**: Detecta si el cliente acaba de cerrar la cita en el chat.
   - **IA OpenAI / Gemini**: Analiza el mensaje, responde dudas sobre horarios, barberos o precios.
   - **Responder al Chat Web**: Devuelve la contestación al cliente en tiempo real.

---

## 3. Obtener la URL del Webhook y Conectarla a la Web

1. En n8n, haz doble clic sobre el nodo **Webhook La Elite (Chat Web)**.
2. Copia la URL que aparece en **Test URL** o **Production URL** (ejemplo: `https://tu-n8n.com/webhook/elite-booking`).
3. Activa el flujo haciendo clic en el switch superior **Active** de n8n.
4. Para conectar la web con tu n8n tienes **dos opciones súper sencillas**:
   - **Opción A (Desde el propio Chat en la Web)**:
     - Abre la web (`index.html`) en tu navegador.
     - Haz clic en el icono del chat y luego en el botón de engranaje ⚙️ en la esquina superior del chat.
     - Pega la URL del webhook de n8n y pulsa **Guardar Configuración**. ¡Listo!
   - **Opción B (Fija en el código)**:
     - Abre el archivo `app.js` y edita la variable `DEFAULT_CONFIG.n8nWebhookUrl`:
       ```javascript
       const DEFAULT_CONFIG = {
         n8nWebhookUrl: 'https://tu-n8n.com/webhook/elite-booking',
         // ...
       };
       ```

---

## 4. Opcional: Notificar por WhatsApp o Google Calendar en n8n

Puedes añadir nuevos nodos al workflow en n8n:
- **Google Calendar (Create Event)**: Para que a Deison y Juan Pablo les aparezca la cita en su Google Calendar personal.
- **WhatsApp Business Cloud API** o **Telegram**: Para enviar un mensaje automático de confirmación al cliente y avisar al barbero seleccionado.

---

## 5. Modo Offline / Fallback Inteligente

Si no tienes n8n encendido o aún no has configurado tu servidor, **la web nunca se romperá**:
El chat cuenta con un **motor conversacional guiado integrado** que permite al cliente elegir barbero, servicio, día, hora y dejar sus datos, guardando la cita en la memoria local para que **Deison** o **Juan Pablo** la vean inmediatamente en su panel de barberos.
