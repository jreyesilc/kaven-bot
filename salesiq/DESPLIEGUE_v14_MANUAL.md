# Despliegue Manual Context Handler v14 Nativo

## Estado: Código generado y commi teado ✅

El **Context Handler v14 nativo** está listo para desplegar. Elimina completamente la dependencia de Render para la creación de leads.

---

## ¿Qué hace el v14?

- ✅ Crea leads **directamente en Zoho CRM** con `zoho.crm.createRecord()`
- ✅ **Deduplicación por email**: Si ya existe un lead, **actualiza** con merge de señales
- ✅ Lee señales de compra (`lead_signals`) del Message Handler v14
- ✅ Mapea señales a etiquetas exactas del picklist `Se_ales_de_Compra`
- ✅ Protección anti-duplicados (5 capas, igual que v13)
- ✅ Email placeholder generado automáticamente: `lead-{teléfono}@kavensports.com`

**Resultado**: Render queda SOLO para respaldo. Todos los leads nuevos se crean directo en CRM.

---

## Instrucciones de Despliegue

### 1. Abrir el archivo del código

El código está en:
```
/home/ubuntu/github_repos/kaven-bot/salesiq/context_handler_v14_native_crm.deluge
```

**Opción A - Desde el repositorio GitHub:**
1. Ve a: https://github.com/jreyesilc/kaven-bot/blob/main/salesiq/context_handler_v14_native_crm.deluge
2. Haz clic en el botón **"Raw"**
3. Selecciona todo el código (Ctrl+A)
4. Copia (Ctrl+C)

**Opción B - Desde el HTML helper local:**
1. Abre el archivo `/tmp/ch_v14_native_fix.html` en tu navegador
2. Haz clic en el botón **"Copiar al portapapeles"**

### 2. Pegar en SalesIQ

1. Ve a: https://salesiq.zoho.com/jreyesilcmx/settings/bot/zobot/854630000000222065/dre
2. En el menú lateral izquierdo, haz clic en **"Contexto"** (debajo de "Responder")
3. En el dropdown superior, selecciona **"Controlador de contexto"**
4. Verás el editor de código actual (v13)
5. Selecciona **TODO** el código actual (Ctrl+A)
6. Pega el código v14 (Ctrl+V)
7. Haz clic en **"Publicar"** (botón azul arriba a la derecha)

### 3. Verificar publicación

- Si no hay errores → **"Context Handler v14 publicado exitosamente"** ✅
- Si hay error de sintaxis → Revisar que se copió completo (debe tener 511 líneas)

---

## Prueba End-to-End

### Paso 1: Abrir preview del bot
1. En el editor del bot, haz clic en el icono del **ojo** (preview) arriba a la derecha
2. Se abre el panel de chat

### Paso 2: Disparar formulario corto
Escribe en el chat:
```
Quiero cotizar para 15 personas, ¿cuánto cuesta?
```

El bot debe:
1. Detectar señales de compra (**quantity**, **pricing**, **direct_interest**)
2. Responder con info de Kaven Sports
3. Preguntar por tu **WhatsApp** (formulario corto)

### Paso 3: Llenar formulario
1. Ingresa un **teléfono de prueba** (ej: +52 664 123 4567)
2. Ingresa tu **nombre** (ej: Juan Test)
3. **Producto** (opcional, puedes elegir o dejarlo)
4. Haz clic en **"Enviar"**

### Paso 4: Verificar en Zoho CRM
1. Ve a: https://crm.zoho.com/crm/jreyesilcmx/tab/Leads
2. Busca el lead con el teléfono que usaste
3. **Verificar**:
   - ✅ Email placeholder: `lead-6641234567@kavensports.com`
   - ✅ Campo `Se_ales_de_Compra` tiene las etiquetas:
     - `Cantidad / Pedido mínimo (quantity)`
     - `Precio / Cotización (pricing)`
     - `Interés directo de compra (direct_interest)`
   - ✅ Layout: **Sports Leads**
   - ✅ Lead Source: **Bot SalesIQ**

### Paso 5: Probar deduplicación
1. Vuelve al chat preview
2. Inicia una **nueva conversación** (botón "Reiniciar" si está disponible, o refresca la página)
3. Escribe:
   ```
   Necesito uniformes personalizados con logo
   ```
4. Llena el formulario con el **MISMO teléfono** de antes
5. Envía

**Resultado esperado**:
- No se crea un lead duplicado
- El lead existente se **actualiza** con la nueva señal: `Personalización / Logo / Diseño (customization)`

---

## ¿Qué pasa con Render?

Por ahora, **Render sigue encendido** pero **YA NO SE USA para leads nuevos**.

El v13 (anterior) llamaba a:
```deluge
invokeurl [url: "https://kaven-bot.onrender.com/lead", ...]
```

El v14 (nuevo) hace:
```deluge
zoho.crm.createRecord("Leads", leadMap)
zoho.crm.updateRecord("Leads", existingId, updateMap)
```

**Ventaja**: Sin cold-start de Render para leads. Todo instantáneo.

---

## Si algo falla

### Error: "Unable to find 'isInstanceOf' function"
→ Ya corregido en el código v14. Asegúrate de copiar el archivo `context_handler_v14_native_crm.deluge` (no el antiguo `zobot_context_handler_v14_native.deluge` si aún existe en otra carpeta).

### Error: "Missing return statement"
→ El código debe terminar con:
```deluge
response.put("action","reply");
response.put("replies",{confirmation});
return response;
```
Revisa que se copió completo.

### Error de CRM: "INVALID_DATA" en Se_ales_de_Compra
→ Las etiquetas del picklist deben coincidir EXACTAMENTE. El código ya las tiene correctas.

### No se crea el lead en CRM
1. Revisa que el formulario tenga `context_id = "lead_details"` en el Message Handler v14
2. Abre la consola del navegador en el preview y busca errores
3. Revisa los datos de sesión guardados: `zoho.salesiq.visitorsession.get("jreyesilcmx", "crm_ok")`

---

## Archivos relacionados

- **Context Handler v14 nativo**: `salesiq/context_handler_v14_native_crm.deluge`
- **Message Handler v14 nativo**: `salesiq/message_handler_v14_native_openai.deluge` (ya desplegado ✅)
- **Conexión OpenAI**: `openai_kaven` (ya creada ✅)
- **Backend Render (respaldo)**: `server.js` (sigue funcionando, pero NO se llama)

---

## Siguiente paso después del despliegue

Una vez que confirmes que el v14 funciona:
- Render puede apagarse para **conversación** (ya no se usa `/chat`)
- Render puede apagarse para **leads** (ya no se usa `/lead`)
- **Ahorro**: ~$7/mes del plan Render

Te aviso cuando esté listo para la validación final 🚀
