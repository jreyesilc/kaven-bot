# 📚 Documentación Kaven Sports Bot

**Última actualización:** 30 de junio, 2026  
**Mantenido por:** Juan Reyes (Kaven Sports)  
**Asistido por:** Abacus AI Agent  

---

## 🎯 Índice Rápido

| Categoría | Documentos | Estado |
|-----------|-----------|--------|
| 🐛 **Bugs Resueltos** | 2 documentos | Completo |
| ⚡ **Optimizaciones** | 2 documentos | Completo |
| 🔗 **Integraciones** | 1 documento | Implementado (pend. publicar) |
| ⚙️ **Configuración** | 1 documento | Pendiente |
| 📖 **Guías** | 1 documento | Completo |

---

## 🐛 Bugs Resueltos

### 1. Bot se Congela Después del Formulario de WhatsApp
**Fecha:** 27 de junio, 2026 | **Severidad:** 🔴 CRÍTICO | **Estado:** ✅ RESUELTO

📄 [Ver documentación completa](bugs_resueltos/2026-06-27_bot_freeze_replaceall.md)

**Resumen:**
- **Problema:** Bot se congelaba después de que el usuario completaba el formulario de leads
- **Causa raíz:** Línea inválida en Deluge: `replaceAll("[^0-9]","","ALL")` (3er argumento no existe)
- **Solución:** Context Handler v14 simplificado + backend async
- **Impacto:** 100% de formularios ahora completan exitosamente

**Archivos modificados:**
- `server.js` (commits: `627aa2e`, `d394a9a`)
- `salesiq/context_handler_v14_minimal.deluge` (commit: `520bcfc`)

**Aprendizajes clave:**
- Zoho SalesIQ no muestra errores de runtime, solo congela
- Backend asíncrono mejora UX (respuesta inmediata)
- Caché en memoria necesario por latencia de Zoho CRM

---

### 2. Leads de Meta No Llegaban a Zoho CRM (LeadChain)
**Fecha:** 30 de junio, 2026 | **Severidad:** 🔴 CRÍTICO | **Estado:** ✅ RESUELTO

📄 [Ver documentación completa](bugs_resueltos/2026-06-30_meta_leads_no_llegaban_crm.md)

**Resumen:**
- **Problema:** Leads de formularios de Meta (Facebook/Instagram) NO se registraban en Zoho CRM → **pérdida total de leads**
- **Causa raíz:** Campos obligatorios (**Apellidos** y **Empresa**) sin mapear en LeadChain
- **Solución:** Mapeo correcto de campos + recuperación de 67 leads perdidos
- **Impacto:** 100% de leads de Meta ahora llegan al CRM automáticamente

**Cadenas reparadas:**
- "Kaven - Thinkser - ES" (Draft → Active, 5 leads recuperados)
- "Kings - Thinkers-copy" (Mapeo incompleto → Completo, 63 leads recuperados)

**Mapeo estándar establecido:**

| Campo Zoho | Fuente Meta | Nota |
|------------|-------------|------|
| Apellidos ⚠️ | Full name | Obligatorio |
| Empresa ⚠️ | "Kaven Sports - Meta" (estático) | Obligatorio |
| Correo | Email | - |
| Teléfono | Phone number | - |
| Descripción | tipo + cantidad + fecha (máx. 3) | - |
| Fuente | Meta Ads | Tracking |

**Aprendizajes clave:**
- LeadChain rechaza TODOS los leads si faltan campos obligatorios (sin notificar)
- Cada formulario nuevo de Meta DEBE tener su propia LeadChain configurada
- Mapeo 1-a-1: un campo de FB solo puede ir a UN campo de Zoho
- Leads fallidos son recuperables vía botón "Sync Leads"
- Monitoreo semanal recomendado (contador X/500, warnings)

**Archivos de configuración (NO código):**
- Zoho CRM → Configuración → Marketplace → Facebook → LeadChain
- Sin cambios en `server.js` ni scripts Deluge

---

## ⚡ Optimizaciones

### 1. Prompt Multi-Deporte (No Ofrecer Ciclismo para Fútbol)
**Fecha:** 28 de junio, 2026 | **Tipo:** Optimización de IA | **Estado:** ✅ IMPLEMENTADO

📄 [Ver documentación completa](optimizaciones/2026-06-28_prompt_multi_deporte.md)

**Resumen:**
- **Problema:** Bot ofrecía tiers de ciclismo (Standard/Elite/Premiere) para todos los deportes
- **Solución:** Sección dedicada en `systemPrompt` diferenciando líneas de producto por deporte
- **Resultado:** Bot ahora menciona "calidad premium única" para fútbol/baseball/etc.

**Testing:**
- ✅ Fútbol: NO menciona tiers ← Correcto
- ✅ Ciclismo: SÍ menciona 3 tiers ← Correcto
- ✅ Baseball (inglés): "premium quality" ← Correcto

**Archivo modificado:**
- `server.js` (commit: `c81e3a5`)

---

### 2. Análisis de Mejores Prácticas para Formularios
**Fecha:** 28 de junio, 2026 | **Tipo:** Investigación + Recomendaciones | **Estado:** 📊 REFERENCIA

📄 [Ver análisis completo](optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md) ⭐ **ALTAMENTE RECOMENDADO**

**Contenido:**
- Investigación de industria (uniformes deportivos, productos B2B, Meta Instant Forms)
- Benchmarks de +10,000 formularios
- Evaluación de formularios actuales de Kaven Sports
- Plan de acción priorizado (alta/media/baja)

**Hallazgos principales:**
- **Número óptimo de campos:** 3-5 (Kaven tiene 7, está en límite aceptable)
- **Velocidad de respuesta crítica:** <1 hora = 7x más conversión
- **Meta Conversion Leads:** Puede reducir CPL en -19%

**Recomendaciones de prioridad alta:**
1. Corregir mensaje "Kings Sportswear" → "Kaven Sports"
2. Cambiar botón CTA: "Enviar" → "Obtener mi cotización gratis"
3. Automatizar notificación de nuevo lead (<1 hora de respuesta)

**Proyección de mejora:**
- **-56% costo por lead calificado**
- **+57% más leads de calidad**

---

## 🔗 Integraciones

### 1. Handoff de Leads de Meta → Zobot (sin preguntas duplicadas)
**Fecha:** 29 de junio, 2026 | **Tipo:** Integración / Conversión | **Estado:** ✅ IMPLEMENTADO · ⏳ Pendiente publicar

📄 [Ver guía completa](integraciones/meta_lead_handoff.md) ⭐ **NUEVO**

**Problema:**
- Los leads que ya respondieron el cuestionario de Meta (deporte, cantidad, fecha, diseño, contacto) llegaban a la landing y **el Zobot les repetía las mismas preguntas** → fricción y pérdida de leads.

**Solución:**
- **`landing/meta-lead-context.js`**: captura los parámetros de la URL (`?source=meta&name=..&phone=..&sport=..&quantity=..&date=..&design=..`), los persiste en local/sessionStorage y los inyecta al visitante de SalesIQ (`$zoho.salesiq.visitor.info` → campo `kvn_meta`). Expone `window.KavenMetaLead`.
- **`salesiq/message_handler_v17_meta_aware.deluge`** (basado en v16): detecta al lead de Meta, **salta el formulario**, lo **saluda por su nombre**, reconoce sus datos, va directo al **catálogo** y crea el lead en CRM. Para visitantes directos: flujo v16 sin cambios.

**Resultado esperado:**
- 0 preguntas duplicadas a leads de Meta → menos fricción, más conversión.
- Lead creado automáticamente en CRM con `Lead Source = Meta`.

**Archivos:**
- `landing/meta-lead-context.js` (nuevo)
- `salesiq/message_handler_v17_meta_aware.deluge` (nuevo)
- `docs/integraciones/meta_lead_handoff.md` (nuevo)

**Pendiente para producción:**
1. Configurar el link con parámetros en el Meta Bot / Instant Form.
2. Desplegar `meta-lead-context.js` en la landing.
3. Publicar el Message Handler v17 en SalesIQ.

---

## ⚙️ Configuración

### 1. Actualizar Formularios de Meta (Kings → Kaven)
**Fecha:** 29 de junio, 2026 | **Prioridad:** 🔴 ALTA (branding) | **Estado:** ⏳ PENDIENTE

📄 [Ver guía completa](configuracion/meta_forms_kings_sportswear.md)

**Problema:**
- Formularios de Meta todavía dicen "KINGS SPORTSWEAR" en mensaje de agradecimiento
- Botón probablemente apunta a landing antiguo

**Solución:**
- Crear nuevo formulario duplicando actual
- Actualizar texto de agradecimiento y URL del botón
- Activar tipo "Higher Intent" para mejor calidad de leads
- Actualizar campañas activas
- Archivar formularios antiguos

**Formularios a actualizar:**
- "Kings - Thinkers-copy"
- "Kings - Thinkers"

**Estado:** Requiere acción manual desde navegador local de Juan

---

## 📖 Guías de Implementación

### 1. Cómo Publicar Cambios en el Bot
**Fecha:** 29 de junio, 2026 | **Tipo:** Guía técnica | **Estado:** 📖 REFERENCIA

📄 [Ver guía completa](guias_implementacion/como_publicar_cambios_bot.md)

**Contenido:**
- Arquitectura del sistema (diagrama)
- Flujos de cambios (Backend, Zoho SalesIQ, Meta Forms)
- Testing post-deploy
- Versionado de scripts
- Troubleshooting común
- Rollback de emergencia

**Casos de uso:**
- ✅ Modificar `systemPrompt` del bot
- ✅ Cambiar lógica de creación de leads
- ✅ Actualizar scripts de Zoho SalesIQ
- ✅ Resolver bot congelado
- ✅ Revertir deploy problemático

---

## 📊 Estado Actual del Sistema

### ✅ Producción (Funcionando)

| Componente | Versión | Estado | URL/Ubicación |
|-----------|---------|--------|--------------|
| **Backend** | Última (main) | 🟢 Activo | https://kaven-bot.onrender.com |
| **Message Handler** | v16 (smart signals) | 🟢 Activo | Zoho SalesIQ |
| **Context Handler** | v14 (minimal) | 🟢 Activo | Zoho SalesIQ |
| **Sitio Web** | - | 🟢 Activo | https://kavensports.com |

### ⏳ Pendientes

| Tarea | Prioridad | Estimado | Dueño |
|-------|-----------|----------|-------|
| Actualizar formularios Meta | 🔴 Alta | 1 hora | Juan |
| Notificación automática leads | 🟡 Media | 30 min | Juan + AI Agent |
| Integrar Meta Conversions API | 🟡 Media | 2-3 horas | AI Agent |
| Landing page propia | 🔵 Baja | Proyecto completo | Futuro |

---

## 🗂️ Estructura de Carpetas

```
kaven-bot/
├── docs/                                    ← ESTÁS AQUÍ
│   ├── README_DOCS.md                       ← Este archivo (índice maestro)
│   ├── bugs_resueltos/
│   │   ├── 2026-06-27_bot_freeze_replaceall.md
│   │   └── 2026-06-30_meta_leads_no_llegaban_crm.md
│   ├── optimizaciones/
│   │   ├── 2026-06-28_prompt_multi_deporte.md
│   │   └── 2026-06-28_analisis_mejores_practicas_formularios.md
│   ├── integraciones/
│   │   └── meta_lead_handoff.md             ← Handoff Meta → Zobot
│   ├── configuracion/
│   │   └── meta_forms_kings_sportswear.md
│   └── guias_implementacion/
│       └── como_publicar_cambios_bot.md
├── landing/                                 ← Scripts para la landing
│   ├── cycling-catalog-snippet.html
│   └── meta-lead-context.js                 ← Tracking de leads de Meta
├── salesiq/                                 ← Scripts de Zoho SalesIQ
│   ├── message_handler_v14_native_openai.deluge
│   ├── message_handler_v15_rag.deluge
│   ├── message_handler_v16_smart_signals.deluge ← EN PRODUCCIÓN (actual)
│   ├── message_handler_v17_meta_aware.deluge    ← NUEVO (meta-aware)
│   ├── context_handler_v13_short.deluge
│   ├── context_handler_v14_minimal.deluge   ← EN PRODUCCIÓN
│   └── rag_integration_v15.deluge
├── rag/                                     ← Sistema RAG (auto-aprendizaje)
│   ├── auto_learn_weekly.py
│   ├── db.js
│   └── rag.js
├── server.js                                ← Backend principal (Node.js)
├── package.json
└── README.md                                ← README del proyecto
```

---

## 🔍 Cómo Usar Esta Documentación

### Para Desarrolladores
1. **Antes de hacer cambios:** Lee la [guía de publicación](guias_implementacion/como_publicar_cambios_bot.md)
2. **Si encuentras un bug:** Documéntalo en `bugs_resueltos/`
3. **Si implementas mejora:** Documéntala en `optimizaciones/`
4. **Actualiza este índice:** Al agregar nuevos documentos

### Para Referencia Futura
- **¿Qué causó el freeze del bot?** → [Bug: replaceAll](bugs_resueltos/2026-06-27_bot_freeze_replaceall.md)
- **¿Cómo optimizar formularios?** → [Análisis de mejores prácticas](optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md)
- **¿Cómo publicar cambios?** → [Guía de publicación](guias_implementacion/como_publicar_cambios_bot.md)
- **¿Qué falta hacer con Meta?** → [Config: Meta Forms](configuracion/meta_forms_kings_sportswear.md)

### Para Nuevos Desarrolladores
**Orden de lectura recomendado:**
1. [Guía: Cómo publicar cambios](guias_implementacion/como_publicar_cambios_bot.md) ← Entender arquitectura
2. [Bug: Bot freeze](bugs_resueltos/2026-06-27_bot_freeze_replaceall.md) ← Contexto de problemas pasados
3. [Optimización: Prompt multi-deporte](optimizaciones/2026-06-28_prompt_multi_deporte.md) ← Ejemplo de mejora
4. [Análisis: Formularios](optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md) ← Roadmap futuro

---

## 📅 Historial de Sesiones

### Sesión 1: 27-29 de junio, 2026
**Temas cubiertos:**
1. ✅ Diagnóstico y resolución de bug crítico (bot freeze)
2. ✅ Optimización de prompt para multi-deporte
3. ✅ Análisis de mejores prácticas para formularios
4. ⏳ Identificación de problema en Meta Forms (pendiente)

**Commits principales:**
- `627aa2e`: Backend async para /lead
- `520bcfc`: Context Handler v14 minimal (sin replaceAll)
- `d394a9a`: Deduplicación con caché en memoria
- `c81e3a5`: Prompt optimizado multi-deporte
- `2251944`: Análisis de mejores prácticas

**Resultado:** Sistema estable en producción, roadmap de optimizaciones definido

---

### Sesión 2: 30 de junio, 2026
**Temas cubiertos:**
1. ✅ Diagnóstico de leads de Meta que no llegaban a CRM
2. ✅ Identificación de causa raíz: LeadChain con campos obligatorios sin mapear
3. ✅ Reparación de 2 cadenas activas con mapeo completo
4. ✅ Recuperación de 67 leads perdidos (4 + 63)
5. ✅ Establecimiento de estándar de mapeo para futuros formularios

**Cambios realizados:**
- Configuración en Zoho CRM → LeadChain (sin commits de código)
- Documentación: `bugs_resueltos/2026-06-30_meta_leads_no_llegaban_crm.md`
- Actualización de `docs/README_DOCS.md`

**Resultado:** Integración Meta → CRM 100% funcional, 67 leads recuperados, proceso documentado

---

## 🆘 Soporte y Contacto

**Propietario del Proyecto:**
- Juan Reyes (Kaven Sports)
- Email: [contacto@kavensports.com]

**Asistencia Técnica:**
- Abacus AI Agent (sesiones de desarrollo)

**Repositorio:**
- GitHub: https://github.com/jreyesilc/kaven-bot

---

## 📝 Convenciones de Documentación

### Nomenclatura de Archivos
```
YYYY-MM-DD_tema_especifico.md
```

### Convenciones de Estado
- ✅ **RESUELTO / IMPLEMENTADO:** Completado y en producción
- ⏳ **PENDIENTE:** Identificado pero no implementado
- 📊 **REFERENCIA:** Documento informativo/analítico
- 📖 **GUÍA:** Documento de procedimientos

### Convenciones de Prioridad
- 🔴 **ALTA:** Impacto crítico en negocio/UX
- 🟡 **MEDIA:** Mejora significativa
- 🔵 **BAJA:** Nice-to-have, largo plazo

---

## 🚀 Próximos Pasos Recomendados

### Esta Semana
1. 🔴 Actualizar formularios de Meta (Kings → Kaven)
2. 🔴 Configurar notificación automática de leads
3. 🟡 A/B test: reordenar campos del formulario

### Este Mes
4. 🟡 Implementar Meta Conversions API
5. 🟡 Evaluar resultados de optimizaciones
6. 🔵 Considerar landing page propia

---

**¿Necesitas agregar nueva documentación?**

Crea un archivo en la carpeta correspondiente y actualiza este índice:
```bash
cd /home/ubuntu/github_repos/kaven-bot/docs
vim categoria/YYYY-MM-DD_tema.md
# Agregar link a este README_DOCS.md
```

---

**Versión de este documento:** 1.0  
**Última revisión:** 29 de junio, 2026
