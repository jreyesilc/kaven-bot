# 📖 Guía: Cómo Publicar Cambios en el Bot de Kaven Sports

**Última actualización:** 29 de junio, 2026  
**Audiencia:** Desarrolladores y administradores del sistema  

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                      USUARIO                            │
│              (WhatsApp, Web, Instagram)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ZOHO SALESIQ (Frontend)                    │
│  - Message Handler (Deluge)                             │
│  - Context Handler (Deluge)                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ HTTP POST
┌─────────────────────────────────────────────────────────┐
│         BACKEND (Render: kaven-bot.onrender.com)        │
│  - server.js (Node.js + Express)                        │
│  - OpenAI API integration                               │
│  - Zoho CRM integration                                 │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    ┌─────────┐           ┌──────────┐
    │ OpenAI  │           │ Zoho CRM │
    │   API   │           │  (Leads) │
    └─────────┘           └──────────┘
```

---

## 🔄 Flujos de Cambios

### Tipo 1: Cambios en el Backend (server.js)

**Ejemplos:**
- Modificar el `systemPrompt` del bot
- Cambiar lógica de creación de leads
- Actualizar endpoints API

**Proceso:**

```bash
# 1. Editar código local
vim server.js  # o tu editor favorito

# 2. Verificar sintaxis
node --check server.js

# 3. Probar localmente (opcional)
npm install
PORT=3000 node server.js
curl -X POST http://localhost:3000/chat -d '{"message":"test"}'

# 4. Commit y push
git add server.js
git commit -m "Descripción del cambio"
git push origin main

# 5. Deploy automático en Render
# Render detecta el push y redeploya automáticamente
# Monitorear en: https://dashboard.render.com
```

**Tiempo total:** 2-5 minutos  
**Verificación:** https://kaven-bot.onrender.com/health

---

### Tipo 2: Cambios en Zoho SalesIQ (Deluge Scripts)

**Ejemplos:**
- Modificar lógica del Message Handler
- Actualizar Context Handler para formularios
- Cambiar flujo de conversación

#### Método A: Via Browser GUI (Más lento, más seguro)

```
1. Ir a: https://salesiq.zoho.com
2. Configuración → Bots → "Kaven Sports Bot"
3. Pestaña "Flows"
4. Editar script correspondiente:
   - Message Handler: zobot_message_handler_*.deluge
   - Context Handler: zobot_context_handler_*.deluge
5. Copiar código actualizado desde tu archivo local
6. Hacer clic en "Validate"
7. Si válido → "Publish"
8. Esperar confirmación
```

**Tiempo total:** 5-10 minutos  
**Riesgo:** Paste puede corromper código en CodeMirror

#### Método B: Via Browser Console (Más rápido, técnico)

```javascript
// 1. Abrir Zoho SalesIQ editor en browser
// 2. Abrir DevTools Console (F12)
// 3. Ejecutar:

const code = `
tu código Deluge aquí
sin modificar
`;

const editor = document.querySelector('.CodeMirror').CodeMirror;
editor.setValue(code);
editor.save();

// 4. Hacer clic manualmente en "Publish" en la UI
```

**Tiempo total:** 2-3 minutos  
**Ventaja:** No hay corrupción por paste  
**Ver:** [Bug del bot freeze](../bugs_resueltos/2026-06-27_bot_freeze_replaceall.md) para contexto

---

### Tipo 3: Cambios en Formularios de Meta

**Ver guía dedicada:** [Actualizar formularios Meta](../configuracion/meta_forms_kings_sportswear.md)

**Resumen:**
1. Los formularios activos NO se pueden editar
2. Debes crear nuevo formulario duplicando el actual
3. Actualizar campañas para usar nuevo formulario
4. Archivar formulario antiguo

---

## 🧪 Testing Post-Deploy

### Backend (server.js)

#### Test 1: Health Check
```bash
curl https://kaven-bot.onrender.com/health
# Esperado: {"status":"ok","timestamp":"..."}
```

#### Test 2: Chat Endpoint
```bash
curl -X POST https://kaven-bot.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola, hacen uniformes de ciclismo?"}'
  
# Verificar:
# - response contiene texto coherente
# - collect_contact es false (para mensaje general)
```

#### Test 3: Lead Creation
```bash
curl -X POST https://kaven-bot.onrender.com/lead \
  -d "name=Test&phone=6641234567&product=Jersey"
  
# Esperado: {"ok":true,"queued":true,"duplicate":false}
```

### Frontend (Zoho SalesIQ)

#### Test Live en Sitio
1. Ir a https://kavensports.com
2. Abrir el chat bot
3. Probar flujo completo:
   - Mensaje inicial: "Quiero cotizar uniformes"
   - Completar formulario
   - Verificar mensaje de confirmación
   - **NO debe congelarse**
4. Verificar en Zoho CRM que se creó el lead

---

## 📦 Versionado de Scripts de Zoho

**Convención de nombres:**

```
salesiq/message_handler_v{VERSION}_{FEATURE}.deluge
salesiq/context_handler_v{VERSION}_{FEATURE}.deluge
```

**Ejemplos:**
- `message_handler_v14_native_openai.deluge` (versión 14, usa OpenAI nativo)
- `context_handler_v14_minimal.deluge` (versión 14, simplificado)
- `message_handler_v15_rag.deluge` (versión 15, con RAG)

**Versión actual en producción:**
- Message Handler: **v16** (smart signals)
- Context Handler: **v14** (minimal)

---

## 🚨 Troubleshooting

### Problema: Backend no responde después de deploy

**Síntomas:**
- `/health` devuelve 502 o timeout
- Logs de Render muestran error de inicio

**Solución:**
```bash
# 1. Ver logs en Render Dashboard
# 2. Verificar variables de entorno están configuradas:
#    - OPENAI_KEY
#    - ZOHO_REFRESH_TOKEN
#    - ZOHO_CLIENT_ID
#    - ZOHO_CLIENT_SECRET

# 3. Si falta alguna, agregarla en:
# Render Dashboard → kaven-bot → Environment → Add
```

### Problema: Bot de Zoho se congela

**Síntomas:**
- Usuario completa acción pero bot no responde
- No hay mensaje de error visible

**Causa común:**
- Error de sintaxis en Deluge
- Llamada HTTP que falla sin try-catch

**Solución:**
```deluge
// Siempre envolver llamadas HTTP en try-catch:
try {
  response = invokeUrl(url: backendUrl, type: POST, parameters: payload);
} catch (e) {
  info "Error calling backend: " + e;
  sendMessage("Lo siento, hubo un error. Por favor intenta de nuevo.");
}
```

### Problema: Leads no se crean en Zoho CRM

**Diagnóstico:**
```bash
# 1. Verificar que backend recibe la llamada:
curl -X POST https://kaven-bot.onrender.com/lead \
  -d "name=Test&phone=6641234567&product=Test"

# 2. Ver logs de Render para errores de Zoho API

# 3. Verificar token de Zoho no expiró:
# Render logs mostrará "Token refresh successful" cada hora
```

**Solución:**
- Si token expiró: Regenerar en Zoho Developer Console
- Actualizar `ZOHO_REFRESH_TOKEN` en Render environment vars

---

## 📋 Checklist Pre-Deploy

Antes de hacer cambios en producción:

### Backend
- [ ] Código pasa `node --check server.js`
- [ ] Tests locales funcionan
- [ ] Commit message es descriptivo
- [ ] Variables de entorno NO están hardcodeadas

### Zoho SalesIQ
- [ ] Script pasa validación de Deluge
- [ ] Guardado backup del script anterior
- [ ] Versionado correcto (v14, v15, etc.)
- [ ] Try-catch en llamadas HTTP

### General
- [ ] Documentación actualizada
- [ ] Testing manual planificado post-deploy
- [ ] Rollback plan si algo falla

---

## 🔄 Rollback de Emergencia

### Si backend tiene problema crítico:

```bash
# 1. Identificar último commit bueno
git log --oneline

# 2. Revertir
git revert <hash-del-commit-malo>
git push origin main

# 3. Render re-deploya automáticamente la versión anterior
```

### Si Zoho SalesIQ tiene problema:

```
1. Ir a Zoho SalesIQ → Bots → Kaven Sports Bot
2. Click en "Version History"
3. Seleccionar versión anterior que funcionaba
4. Click "Restore"
5. Click "Publish"
```

**Nota:** Por eso es importante versionado (v13, v14, v15)

---

## 📚 Archivos de Referencia

### Backend
- **Producción:** https://kaven-bot.onrender.com
- **Código:** `/home/ubuntu/github_repos/kaven-bot/server.js`
- **GitHub:** https://github.com/jreyesilc/kaven-bot

### Zoho Scripts
- **Message Handlers:** `/home/ubuntu/github_repos/kaven-bot/salesiq/message_handler_*.deluge`
- **Context Handlers:** `/home/ubuntu/github_repos/kaven-bot/salesiq/context_handler_*.deluge`

---

## 🔗 Enlaces Útiles

- **Render Dashboard:** https://dashboard.render.com
- **Zoho SalesIQ:** https://salesiq.zoho.com
- **Zoho CRM:** https://crm.zoho.com
- **GitHub Repo:** https://github.com/jreyesilc/kaven-bot
- **Sitio de producción:** https://kavensports.com

---

**Documentado por:** Abacus AI Agent  
**Mantenido por:** Juan Reyes (Kaven Sports)
