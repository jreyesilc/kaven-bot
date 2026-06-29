# 🤖 Kaven Sports Bot

Bot inteligente de atención al cliente para **Kaven Sports** (uniformes deportivos personalizados), integrando Zoho SalesIQ, OpenAI, y Zoho CRM.

---

## 🎯 Descripción

Sistema de chat bot bilingüe (español/inglés) que:
- ✅ Atiende consultas sobre uniformes deportivos personalizados
- ✅ Cualifica leads automáticamente según señales de compra
- ✅ Crea leads en Zoho CRM con deduplicación inteligente
- ✅ Diferencia entre líneas de producto según el deporte
- ✅ Funciona en web, WhatsApp e Instagram vía Zoho SalesIQ

---

## 🏗️ Arquitectura

```
Usuario (Web/WhatsApp/Instagram)
    ↓
Zoho SalesIQ (Frontend + Deluge Scripts)
    ↓ HTTP POST
Backend (Render: Node.js + Express)
    ↓
OpenAI API + Zoho CRM
```

**Componentes principales:**
- **Backend:** `server.js` (Node.js + Express) desplegado en Render
- **Frontend:** Zoho SalesIQ con scripts Deluge personalizados
- **IA:** OpenAI GPT-4 para conversaciones naturales
- **CRM:** Zoho CRM para gestión de leads

---

## 📚 Documentación Completa

### 👉 [**IR A LA DOCUMENTACIÓN**](docs/README_DOCS.md) ⭐

**Documentación incluye:**
- 🐛 [Bugs resueltos](docs/bugs_resueltos/)
- ⚡ [Optimizaciones implementadas](docs/optimizaciones/)
- ⚙️ [Guías de configuración](docs/configuracion/)
- 📖 [Guías de implementación](docs/guias_implementacion/)

**Documentos destacados:**
- 📄 [Cómo publicar cambios en el bot](docs/guias_implementacion/como_publicar_cambios_bot.md)
- 📊 [Análisis de mejores prácticas para formularios](docs/optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md)
- 🐛 [Resolución del bug crítico de freeze](docs/bugs_resueltos/2026-06-27_bot_freeze_replaceall.md)

---

## 🚀 Deploy en Producción

### Backend (Render)
**URL:** https://kaven-bot.onrender.com

**Auto-deploy activado:**
- Push a `main` → Deploy automático en Render
- Tiempo de deploy: ~2-5 minutos

### Frontend (Zoho SalesIQ)
**Manual deploy:**
- Scripts en `salesiq/` se publican manualmente via Zoho SalesIQ UI
- Ver [guía de publicación](docs/guias_implementacion/como_publicar_cambios_bot.md)

---

## 🛠️ Instalación Local (Desarrollo)

```bash
# 1. Clonar repositorio
git clone https://github.com/jreyesilc/kaven-bot.git
cd kaven-bot

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys

# 4. Ejecutar en desarrollo
PORT=3000 node server.js

# 5. Probar endpoint
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola, hacen uniformes de ciclismo?"}'
```

---

## 🔑 Variables de Entorno

Configurar en Render Dashboard → Environment:

```bash
OPENAI_KEY=sk-...                # API key de OpenAI
ZOHO_REFRESH_TOKEN=1000...       # Token de Zoho OAuth
ZOHO_CLIENT_ID=1000...           # Client ID de Zoho
ZOHO_CLIENT_SECRET=...           # Client Secret de Zoho
PORT=10000                       # Puerto (automático en Render)
```

---

## 📦 Estructura del Proyecto

```
kaven-bot/
├── server.js                    # Backend principal (Node.js)
├── package.json                 # Dependencias npm
├── salesiq/                     # Scripts de Zoho SalesIQ (Deluge)
│   ├── message_handler_v16_smart_signals.deluge
│   ├── context_handler_v14_minimal.deluge    ← EN PRODUCCIÓN
│   └── ...
├── rag/                         # Sistema RAG (auto-aprendizaje)
│   ├── auto_learn_weekly.py
│   ├── db.js
│   └── rag.js
├── docs/                        # 📚 Documentación completa
│   ├── README_DOCS.md           ← ÍNDICE PRINCIPAL
│   ├── bugs_resueltos/
│   ├── optimizaciones/
│   ├── configuracion/
│   └── guias_implementacion/
└── README.md                    # Este archivo
```

---

## 🧪 Testing

### Health Check
```bash
curl https://kaven-bot.onrender.com/health
```

### Chat Endpoint
```bash
curl -X POST https://kaven-bot.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quiero cotizar uniformes de ciclismo"}'
```

### Lead Creation
```bash
curl -X POST https://kaven-bot.onrender.com/lead \
  -d "name=Test&phone=6641234567&product=Jersey"
```

---

## 📊 Estado Actual

| Componente | Versión | Estado |
|-----------|---------|--------|
| Backend | Latest (main) | 🟢 Activo |
| Message Handler | v16 | 🟢 Activo |
| Context Handler | v14 | 🟢 Activo |
| Sitio Web | - | 🟢 Activo |

**Última actualización:** 29 de junio, 2026

---

## 🤝 Contribuir

Este es un proyecto privado de **Kaven Sports**. Para cambios:

1. Crear feature branch
2. Hacer cambios y commit descriptivo
3. Push a GitHub
4. Deploy automático en Render (para backend)
5. Deploy manual en Zoho SalesIQ (para scripts)

Ver [guía de publicación de cambios](docs/guias_implementacion/como_publicar_cambios_bot.md) para detalles.

---

## 📞 Soporte

**Propietario:** Juan Reyes (Kaven Sports)  
**Email:** contacto@kavensports.com  
**Sitio Web:** https://kavensports.com

---

## 📄 Licencia

Privado - © 2026 Kaven Sports

---

**🚀 Para empezar, visita la [documentación completa](docs/README_DOCS.md)**