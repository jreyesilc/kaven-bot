# 📘 Cómo publicar el Message Handler v15 (RAG) en Zoho SalesIQ

## ✅ Pre-requisitos (ya están listos)
- [x] Render está encendido (https://kaven-bot.onrender.com activo)
- [x] Endpoint `/rag/context` probado y funcional (devuelve ejemplos)
- [x] Base de conocimiento con 12 ejemplos (es/en) ya indexada

---

## 📋 Pasos para publicar v15 en SalesIQ

### 1. Entrar al editor de bots de Zoho SalesIQ
1. Ir a https://salesiq.zoho.com
2. Iniciar sesión con tu cuenta
3. En el menú lateral: **Settings → Bots**
4. Seleccionar el bot **Kaven** (o el que esté activo en jreyesilcmx)

### 2. Copiar el código v15
1. Abrir el archivo `salesiq/message_handler_v15_rag.deluge` desde GitHub:  
   https://github.com/jreyesilc/kaven-bot/blob/main/salesiq/message_handler_v15_rag.deluge
2. Copiar **todo el contenido** (Ctrl+A, Ctrl+C)

### 3. Pegar en el Message Handler de SalesIQ
1. En el editor de Zoho SalesIQ, buscar el **Message Handler** actual
2. Hacer clic en **Edit** (ícono de lápiz)
3. **Seleccionar todo** el código actual (Ctrl+A)
4. **Pegar** el código v15 (Ctrl+V, reemplaza el v14 completo)

### 4. Guardar el cambio
1. Hacer clic en **Save** (icono de diskette o botón guardar)
2. **Revisar** que no haya errores de sintaxis (Zoho marca errores en rojo)
3. Si hay error de sintaxis:
   - Es probable que Zoho esté reformateando algo automáticamente
   - Copiar nuevamente el contenido del archivo v15 directo desde el repositorio
   - NO editar manualmente en el editor web de Zoho

### 5. Publicar el bot
1. Una vez guardado sin errores, hacer clic en **Publish** (botón verde)
2. Confirmar la publicación
3. ✅ El bot v15 con RAG está en vivo

---

## 🧪 Cómo probar que el RAG está funcionando

### Prueba 1: Pregunta sobre catálogo (español)
1. Abrir el chat del sitio web (https://kavensports.com)
2. Escribir: `tienen catalogo o todo es personalizado?`
3. **Resultado esperado:** El bot responde explicando que todo es 100% custom y menciona el catálogo de ciclismo como referencia (siguiendo el ejemplo kb-001 del RAG)

### Prueba 2: Pregunta sobre pieza única (inglés)
1. Escribir: `can I order just one jersey or is there a minimum?`
2. **Resultado esperado:** El bot responde positivamente que sí se puede, no hay mínimo, es buena forma de probar calidad (siguiendo kb-004)

### Prueba 3: Ubicación (español)
1. Escribir: `donde estan ubicados?`
2. **Resultado esperado:** Menciona Baja California y Ciudad de México, SIN dar dirección exacta (kb-009)

---

## ⚙️ Qué hace el v15 vs v14

| Aspecto | v14 (anterior) | v15 RAG (nuevo) |
|---------|----------------|-----------------|
| **Llamada a OpenAI** | Directa desde Deluge (Connection) | Idéntica (Connection) |
| **System prompt** | Fijo (manual) | Fijo + ejemplos dinámicos del RAG |
| **Aprendizaje** | NO — siempre igual | SÍ — recupera ejemplos reales |
| **Detección de leads** | Idéntica (nativa en Deluge) | Idéntica |
| **Formulario** | Corto v13 | Corto v13 (sin cambios) |
| **Dependencia Render** | NO (puede estar apagado) | SÍ (necesita /rag/context activo) |

---

## 🔧 Si algo falla

### El bot no responde / error general
- **Causa probable:** Render se durmió (free tier se apaga tras inactividad)
- **Solución:** Abrir https://kaven-bot.onrender.com/rag/stats en el navegador para "despertar" Render. Esperar 30-60 segundos y probar nuevamente.

### El bot responde pero sin RAG (genérico)
- **Verificar:**
  1. ¿El endpoint funciona? → Abrir https://kaven-bot.onrender.com/rag/stats
     - Debe devolver `{"ok":true,"stats":{"ready":true,"total":12,...}}`
  2. ¿La llamada RAG se hace? → En el código v15, línea ~290-310, asegurar que el bloque `try { ragResp = invokeurl... }` esté presente

### Error de sintaxis al publicar en SalesIQ
- **Causa:** El editor web de Zoho a veces reformatea automáticamente
- **Solución:**
  1. Descargar el archivo .deluge directo de GitHub (botón Download/Raw)
  2. Copiar desde un editor local (VSCode/Notepad++) al portapapeles
  3. Pegar en Zoho SalesIQ sin editar nada manualmente
  4. Guardar y publicar

---

## 📊 Monitoreo post-publicación

Después de publicar v15, monitorear durante 1-2 días:
- ¿El bot responde más preciso en preguntas frecuentes (catálogo, mínimo, diseño)?
- ¿Hay conversaciones donde claramente usó los ejemplos del RAG?

Si todo funciona bien: pasar a **Opción B** (auto-aprendizaje semanal) y **Opción C** (cargar más ejemplos reales).

---

## 🎯 Próximos pasos (opcionales — mejoras continuas)

1. **Cargar más ejemplos** (Opción C): cada conversación exitosa nueva que tengas, agregarla con `/rag/learn`
2. **Auto-aprendizaje** (Opción B): tarea programada que cada semana lee conversaciones de SalesIQ/Meta y las agrega automáticamente
3. **Monitoreo de calidad**: revisar si los ejemplos inyectados están mejorando las conversiones

---

**¿Dudas o bloqueos?** Revisa primero el archivo `rag/README_RAG.md` en el repositorio, o escríbeme.
