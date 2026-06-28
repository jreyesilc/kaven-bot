# Guía de Publicación: Handler v16 (Smart Signals)

## ¿Qué es nuevo en v16?

**v16** refina la lógica de detección de señales de compra para crear una experiencia más natural:

### Comportamiento anterior (v15)
Cualquier palabra clave de señal de compra (precio, personalizado, cantidad, etc.) → **formulario inmediato**

### Comportamiento nuevo (v16) — DOS NIVELES
- **PREGUNTAS informativas** (ej. "¿tienen catálogo?", "¿qué materiales usan?") → **RESPONDE primero con RAG**, luego incluye CTA suave
- **SOLICITUDES directas** (ej. "quiero cotizar", "me interesa", click en botón) → **formulario inmediato** (igual que antes)

### Ventajas
✅ El RAG "brilla" en preguntas comunes (catálogo, materiales, calidad, tiempos)  
✅ El bot se siente más conversacional y menos agresivo  
✅ No se pierde la captura rápida de leads calientes (solicitudes directas siguen disparando el formulario)

---

## Pasos para publicar v16 en SalesIQ

### 1. Abrir el editor del bot
1. Ir a **Zoho SalesIQ** → https://salesiq.zoho.com
2. Click en **Marcas** → seleccionar **Kaven Sports**
3. Click en el ícono de engranaje (⚙️) → **Configuración**
4. En el menú lateral, sección **BOT**, click en **Zobot**
5. Click en el bot **"Kaven Sports"**
6. Click en la pestaña **"Controlador de mensajes"** (Message Handler)

### 2. Reemplazar el código
1. **Seleccionar todo** el código actual (Ctrl+A / Cmd+A)
2. **Borrar** (Delete/Backspace)
3. **Copiar** el contenido de `salesiq/message_handler_v16_smart_signals.deluge` desde GitHub:
   - Opción A: Abrir https://github.com/jreyesilc/kaven-bot/blob/main/salesiq/message_handler_v16_smart_signals.deluge
   - Click en el botón **"Raw"** (arriba a la derecha del código)
   - Copiar todo el código (Ctrl+A → Ctrl+C)
   - Pegar en el editor de SalesIQ (Ctrl+V)
   
   - Opción B: Desde el archivo local en `/home/ubuntu/github_repos/kaven-bot/salesiq/message_handler_v16_smart_signals.deluge`

4. **Cerrar** cualquier menú de autocompletado (tecla Escape)
5. Verificar que el código pegado muestre en la línea 10:
   ```
   // MESSAGE HANDLER v16 - RAG + SMART SIGNALS (señales inteligentes)
   ```

### 3. Guardar y publicar
1. Click en **"Guardar"** (botón azul arriba a la derecha)
2. Esperar confirmación (el editor no debe mostrar errores rojos)
3. Click en **"Publicar"** (botón verde al lado de Guardar)
4. ✅ **Listo** — v16 está en producción

---

## Validación en producción

### Prueba 1: Pregunta informativa (debe responder primero, NO formulario)
Mensaje de prueba:
```
¿Tienen catálogo o todo es personalizado?
```

**Comportamiento esperado:**
- El bot **responde** explicando que todo es 100% custom
- Incluye un CTA suave (ej. "¿Para qué deporte lo necesitas?")
- **NO** muestra el formulario de contacto inmediatamente

### Prueba 2: Solicitud directa (formulario inmediato)
Mensaje de prueba:
```
Me interesa cotizar uniformes de fútbol
```

**Comportamiento esperado:**
- El bot muestra **directamente el formulario** de contacto (WhatsApp, nombre, productos)
- Comportamiento idéntico a v15

### Prueba 3: Click en botón de producto (formulario inmediato)
1. Abrir https://www.kavensports.com/cycling-gear
2. Click en cualquier botón **"Get a quote"**
3. El chat debe abrir con el formulario directo (igual que v15)

---

## Rollback (si es necesario)

Si v16 presenta algún problema, puedes volver a v15:

1. Abrir el editor del Message Handler (pasos 1-6 arriba)
2. Copiar el código de `salesiq/message_handler_v15_rag.deluge` (en lugar de v16)
3. Guardar → Publicar

---

## Notas técnicas

### Lógica de detección (v16)
```deluge
// Detecta palabras interrogativas
isQuestion = false;
questionWords = {"que ", "como ", "tienen ", "hay ", "cual ", "what ", "how ", "do you ", ...};

// Decide si mostrar formulario:
if (tiene "direct_interest") → formulario inmediato
else if (tiene señales Y NO es pregunta) → formulario inmediato  
else if (es pregunta) → responder con RAG primero
```

### Archivo
- Ubicación: `/home/ubuntu/github_repos/kaven-bot/salesiq/message_handler_v16_smart_signals.deluge`
- Líneas: 472
- Diferencias vs v15: +22 líneas (lógica de dos niveles + instrucciones de CTA suave)

---

## Soporte

- **Endpoint RAG:** https://kaven-bot.onrender.com/rag/stats (verificar que devuelva `"ready":true`)
- **GitHub repo:** https://github.com/jreyesilc/kaven-bot
- **Documentación RAG:** Ver `rag/SETUP_DATABASE.md` para activar persistencia permanente
