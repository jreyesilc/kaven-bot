# 📱 WhatsApp + Zoho SalesIQ — Estado del Proyecto (PAUSADO)

**Fecha:** 27 de Junio, 2026  
**Estado:** ⏸️ PAUSADO — pendiente verificación de número

---

## ✅ LO QUE SE COMPLETÓ EN ESTA SESIÓN

### 1. **Bot v14 nativo funcionando end-to-end** 
- ✅ Message Handler v14: OpenAI nativo vía `invokeurl` + Connection `openai_kaven`
- ✅ Context Handler v14: Crea leads directamente en Zoho CRM (sin Render)
- ✅ Verificado: lead creado exitosamente con señales de compra mapeadas
- ✅ Idioma bilingüe (en/es) detectado y persistido correctamente
- ✅ Formulario corto se dispara con texto libre (keywords, no solo botones)

**Archivos:**
- `/home/ubuntu/github_repos/kaven-bot/salesiq/message_handler_v14_native_openai.deluge` (395 líneas, publicado ✅)
- `/home/ubuntu/github_repos/kaven-bot/salesiq/context_handler_v14_native_crm.deluge` (482 líneas, publicado ✅)

---

### 2. **GPT entrenado para NO empujar ciclismo en otros deportes**

**Problema inicial:** Cuando preguntaban por soccer uniforms, el bot respondía con los productos de cycling (Standard/Elite/Premier Jersey + Bib Short).

**Solución aplicada:**
- Agregada sección **"VERY IMPORTANT — TIERS ONLY APPLY TO CYCLING"** en el system prompt
- Documentada línea de productos de **SOCCER**:
  - Jersey (cuello redondo o cuello V)
  - Shorts
  - Medias (socks)
  - Kit completo (jersey + shorts + socks)
  - Una sola calidad premium (sin niveles Standard/Elite/Premier)
- Agregada nota para **otros deportes** (baseball, softball, basketball, football, volleyball, track & field, padel): calidad única premium, sin catálogo aún.
- Generalizado el prompt de seguimiento para que no fuerce cycling tiers en conversaciones de otros deportes.

**Prueba verificada:** Pregunta "Do you make soccer uniforms? What options do you have?" → Bot respondió correctamente con productos de fútbol, sin mencionar ciclismo. ✅

**Commit:** `1cd6c24 - train gpt: tiers are cycling-only; add soccer + other team sports product lines; stop defaulting to cycling`

---

### 3. **Número de WhatsApp comprado y registrado**

**Número:** `+1 (858) 330-3306` (Twilio, número de EE.UU.)  
**Costo:** ~$1.15 USD/mes (solo alquiler del número)

**Registrado en Meta WhatsApp Business Manager:**
- ✅ Cuenta: "Kaven" (Facebook Business Manager del usuario)
- ✅ Nombre visible: **"Kaven Sports"**
- ✅ Categoría: Ropa y accesorios
- ✅ Descripción: "Custom sports uniforms, 100% sublimated. Made in San Diego, USA. No minimum order, free custom designs." (tiene typos menores: "10%" en vez de "100%", "San iego", "orde" — editables después)
- 🔴 **Estado:** NO VERIFICADO

---

## ⏸️ DONDE SE PAUSÓ

### Problema: Verificación del número de WhatsApp

Para que el número esté activo en WhatsApp Business, Meta requiere **verificación por código de 6 dígitos** (SMS o llamada).

**Intentos realizados:**
1. **SMS:** El código de verificación de Meta NO apareció en los logs de Twilio → el SMS fue filtrado por el operador (problema común con números 10DLC no registrados para A2P).
2. **Llamada telefónica:** Configuramos reenvío de llamada (TwiML Bin) para que la llamada de verificación de Meta (+1 858-330-3306) se reenviara al celular del usuario (858-544-2255). Resultado: mensaje "la línea no está en uso" → el reenvío falló porque:
   - La cuenta de Twilio está en modo **Trial** (prueba)
   - En modo trial, Twilio solo puede llamar/reenviar a números **verificados como Caller ID**
   - El celular 858-544-2255 no estaba verificado como Caller ID

**Por qué se pausó aquí:**
El usuario decidió pausar en lugar de continuar con las opciones de desbloqueo (verificar Caller ID en Twilio, sacar cuenta de trial, o usar un celular físico de EE.UU.).

---

## 🔄 OPCIONES PARA RETOMAR (cuando el usuario decida continuar)

### Opción A: Celular físico de EE.UU. (la más simple)
- Si el usuario tiene acceso a un **número de celular real de EE.UU.** (SIM física), puede:
  - Crear un nuevo WhatsApp Business Account en Meta con ese número
  - La verificación entra al instante (SMS/llamada a teléfono real)
  - Conectar ese WhatsApp Business a SalesIQ (Settings → Messaging Channels → WhatsApp → Add)
  - **Ventaja:** Zoho SalesIQ actúa como BSP nativo → no necesita Twilio para mensajería
- **Costo:** Solo mensajes de WhatsApp (Meta cobra por conversación/mensaje)

### Opción B: Arreglar el número de Twilio +1 858-330-3306 (reutiliza lo que ya se compró)
Para que el reenvío de llamada funcione:
1. En Twilio → **Billing** → agregar método de pago (sacar de modo "Trial")
2. O alternativamente: **Phone Numbers → Manage → Verified Caller IDs** → agregar **+1 858 544 2255** → verificarlo con el código que envíen → entonces el `<Dial>` del TwiML funcionará
3. Volver a solicitar código de verificación por llamada en Meta
4. La llamada entrará al celular 858-544-2255 → anotar el código → ingresar en Meta
5. Número verificado → conectar a SalesIQ

**Costo:** ~$1.15/mes alquiler del número de Twilio + mensajes de WhatsApp con Meta

### Opción C: BSP externo que provea número ya listo (360dialog, Gupshup, WATI)
- Contratar un BSP que entregue el número ya verificado y listo para WhatsApp Business API
- Conectar ese BSP a SalesIQ
- **Costo:** ~$10-50/mes (depende del proveedor) + mensajes de WhatsApp

---

## 📋 PENDIENTES (catálogos y otros)

### 1. Catálogos de productos para otros deportes
**Estado:** PENDIENTE (dejado en pausa por el usuario antes de arrancar WhatsApp)

**Qué falta:**
- Crear catálogo de **SOCCER** (similar al de ciclismo: PDF con fotos, especificaciones técnicas)
  - Productos: Jersey (cuello redondo/V), Shorts, Medias, Kit completo
  - Telas/materiales: necesita info del usuario
  - Fotos reales o mockups
- Catálogos de otros deportes (baseball, softball, basketball, volleyball, etc.)

**Nota del usuario:** No hay archivo editable del catálogo de ciclismo (solo PDF). Para crear los nuevos catálogos, se puede:
- Generar mockups/ilustraciones (no serían prendas reales de Kaven)
- O esperar fotos reales de productos

---

## 🗂️ ARCHIVOS CLAVE

### Bot SalesIQ (publicados en producción)
- **Message Handler v14:** `salesiq/message_handler_v14_native_openai.deluge`
- **Context Handler v14:** `salesiq/context_handler_v14_native_crm.deluge`
- **Connection OpenAI:** `openai_kaven` (creada en SalesIQ, API key segura)

### Backend Render (ya NO se usa para leads/chat)
- **server.js:** sigue funcionando pero el bot v14 ya no lo llama
- Puede apagarse para ahorrar ~$7/mes

### Twilio
- **Número comprado:** +1 858-330-3306
- **TwiML Bin creado:** "Reenvio Verificacion Kaven" → `<Dial>+18585442255</Dial>`
- **Asignado al número:** Voice Configuration → "A call comes in" → TwiML Bin

### Meta WhatsApp Business
- **Business Manager:** Cuenta "Kaven" (del usuario)
- **Número registrado:** +1 858-330-3306 (Kaven Sports, No verificado)
- **URL:** https://business.facebook.com/wa/manage/phone-numbers/

---

## 🎯 PRÓXIMOS PASOS (cuando se retome)

1. **Decidir opción A, B o C** para verificar el número de WhatsApp
2. **Completar verificación** del número en Meta
3. **Conectar WhatsApp Business a Zoho SalesIQ:**
   - Settings → Messaging Channels → WhatsApp → Add
   - Login con Facebook → autorizar
   - Seleccionar WhatsApp Business Account
   - El bot v14 empezará a responder automáticamente en WhatsApp
4. **Probar flujo end-to-end** (mensaje de WhatsApp → bot responde → formulario → lead en CRM)
5. **(Opcional) Catálogos:** crear catálogo de soccer y otros deportes

---

## 💡 NOTAS IMPORTANTES

- **Zoho SalesIQ es BSP nativo** de WhatsApp → no necesitas Twilio, WATI ni otros proveedores para la mensajería (solo para conseguir el número si no tienes celular físico de EE.UU.)
- El bot v14 que ya funciona en el sitio web **responderá automáticamente en WhatsApp** una vez conectado el canal
- La misma lógica de detección de señales de compra, formulario corto, y creación de leads en CRM funcionará igual en WhatsApp
- Los leads de WhatsApp aparecerán en Zoho CRM con la misma estructura que los del sitio web

---

**Archivo:** `/home/ubuntu/github_repos/kaven-bot/SESION_WHATSAPP_ESTADO.md`
