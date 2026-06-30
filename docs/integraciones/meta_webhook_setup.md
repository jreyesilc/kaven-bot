# Integración Webhook de Meta Lead Ads → Kaven Bot

**Fecha:** 30 de junio de 2026
**Autor:** Equipo Kaven Sports
**Estado:** Implementado en código (server.js). Falta configurar la App de Meta y las variables en Render.

---

## 1. ¿Qué hace esta integración y por qué?

Cuando una persona llena tu **formulario instantáneo (Instant Form)** en un anuncio de
Facebook/Instagram, Meta **NO** puede enviar los datos del formulario (nombre, teléfono,
respuestas) dentro de la URL del botón que abre tu sitio web. El identificador del lead
(`leadgen_id`) se genera **después** de que la persona envía el formulario, así que es
imposible "meterlo" en el enlace del sitio.

La **única** forma profesional y confiable de obtener esos datos es el **Webhook
servidor-a-servidor**:

```
1. La persona envía el formulario en el anuncio de Meta.
2. Meta hace un POST a  https://kaven-bot.onrender.com/webhook/meta  con el leadgen_id.
3. Nuestro backend consulta la Graph API de Meta con ese id y obtiene TODOS los datos.
4. Guardamos el contexto (nombre, teléfono, deporte, cantidad, fecha, diseño).
5. Cuando esa persona escribe en el chat del Zobot, el bot recupera el contexto
   por su teléfono o nombre y NO vuelve a preguntar lo que ya respondió.
```

> **Nota honesta sobre el "match" en el sitio web:** Como el `leadgen_id` no puede viajar
> en la URL del Instant Form, el cruce visitante↔lead se hace por **teléfono o nombre**
> cuando la persona los proporciona en el chat. El webhook llena el almacén de contexto de
> forma confiable; el bot lo recupera en cuanto identifica al visitante. Para un saludo
> instantáneo por nombre sin que la persona escriba nada, la única vía 100% confiable es
> **Click-to-Messenger** (anuncio que abre Messenger directamente). Esta integración de
> webhook es la mejor opción para el flujo actual (anuncio → sitio web → Zobot).

---

## 2. Lo que YA está hecho (en el código)

En `server.js` ya quedaron implementados:

| Componente | Descripción |
|---|---|
| `GET /webhook/meta` | Verificación (handshake) con Meta usando `hub.verify_token`. |
| `POST /webhook/meta` | Recibe la notificación de nuevo lead, valida la firma y procesa en segundo plano. |
| `verifyMetaSignature()` | Valida la firma `X-Hub-Signature-256` (HMAC-SHA256 con tu App Secret). |
| `fetchMetaLead()` | Consulta la Graph API para traer los datos completos del lead. |
| `mapMetaFieldData()` | Traduce los campos de Meta (ES/EN) a: nombre, teléfono, email, deporte, cantidad, fecha, diseño. |
| `processLeadgen()` | Orquesta: consulta → mapea → limpia tokens → guarda contexto. |
| `GET /webhook/meta/test/:leadId` | Endpoint de diagnóstico para procesar un lead manualmente. |

El contexto se indexa por **lead_id, teléfono y nombre**, con vigencia de 24 horas.

---

## 3. Variables de entorno que debes configurar en Render

Entra a tu servicio en **Render → kaven-bot → Environment** y agrega:

| Variable | Obligatoria | Valor / descripción |
|---|---|---|
| `META_VERIFY_TOKEN` | ✅ Sí | Una contraseña que tú inventas (ej. `kaven_meta_2026_xyz`). La misma que pondrás en la App de Meta. |
| `META_PAGE_ACCESS_TOKEN` | ✅ Sí | Token de acceso de tu **Página** con permiso `leads_retrieval`. (Ver paso 4.5) |
| `META_APP_SECRET` | ✅ Sí (recomendado) | El "App Secret" de tu App de Meta. Sirve para validar que el POST viene de Meta. |
| `META_GRAPH_VERSION` | ⬜ Opcional | Versión de la Graph API. Por defecto `v21.0`. |
| `META_WEBHOOK_CREATE_CRM` | ⬜ Opcional | `true` o `false`. Por defecto **false**. Déjalo en false: tu integración nativa (LeadChain) ya crea los leads en el CRM; activarlo los duplicaría. |

> Después de agregar las variables, Render reinicia el servicio automáticamente.

---

## 4. Configuración paso a paso en Meta (developers.facebook.com)

### 4.1 Crear (o usar) una App de Meta
1. Ve a **https://developers.facebook.com/apps/**
2. Si ya tienes una App para Kaven, úsala. Si no: **Crear app → Tipo "Empresa" (Business)**.
3. Anota el **App ID** y el **App Secret** (en *Configuración → Básica*). El App Secret va en `META_APP_SECRET`.

### 4.2 Agregar el producto "Webhooks"
1. En el panel de la App: **Agregar producto → Webhooks**.
2. En el desplegable, elige el objeto **Page** (Página).

### 4.3 Configurar la URL de devolución (Callback)
1. Clic en **Suscribirse a este objeto** / **Editar suscripción**.
2. **Callback URL:** `https://kaven-bot.onrender.com/webhook/meta`
3. **Token de verificación:** el mismo valor que pusiste en `META_VERIFY_TOKEN`.
4. Clic en **Verificar y guardar**. Meta hará un GET a tu webhook; si el token coincide,
   verás una palomita verde. (Nuestro backend ya responde correctamente a ese handshake.)

### 4.4 Suscribir el campo `leadgen`
1. En la lista de campos del objeto Page, busca **`leadgen`** y actívalo (**Subscribe**).
2. Esto hace que Meta te avise cada vez que llega un nuevo lead.

### 4.5 Suscribir tu Página y obtener el Page Access Token
1. Ve a **Herramientas → Explorador de la API Graph** (Graph API Explorer):
   `https://developers.facebook.com/tools/explorer/`
2. Selecciona tu App y tu **Página** de Kaven.
3. Agrega estos permisos y genera el token:
   - `leads_retrieval` (obligatorio para leer los datos del lead)
   - `pages_manage_metadata` (para suscribir la página al webhook)
   - `pages_show_list`
   - `pages_read_engagement`
4. Genera el **Page Access Token** y pégalo en `META_PAGE_ACCESS_TOKEN` en Render.
   - **Recomendado:** convierte el token en uno de larga duración (long-lived) para que
     no expire cada hora. (Graph API Explorer → "i" junto al token → "Open in Access Token Tool" → "Extend Access Token").
5. Suscribe la página al webhook (una sola vez), con este request en el Explorador:
   - Método **POST** a: `/{PAGE_ID}/subscribed_apps`
   - Campo: `subscribed_fields=leadgen`

> Para producción real, Meta exige que la App pase **App Review** con el permiso
> `leads_retrieval`. Mientras tanto, puedes probar todo con cuentas de
> desarrollador/administrador de la App (no requiere review para usuarios de prueba).

---

## 5. Cómo probar que todo funciona

### 5.1 Probar el handshake (verificación)
Ya validado en local. En producción, lo confirma la palomita verde del paso 4.3.

### 5.2 Probar con la Lead Ads Testing Tool (sin gastar en anuncios)
1. Ve a **https://developers.facebook.com/tools/lead-ads-testing**
2. Selecciona tu Página y tu formulario.
3. Clic en **Create lead** (crea un lead de prueba).
4. Meta enviará el POST a tu webhook. Revisa los **logs de Render**: debe aparecer
   `📥 Webhook lead guardado en contexto: {...}` con los datos mapeados.

### 5.3 Probar manualmente un lead específico (diagnóstico)
Si tienes un `leadgen_id` real, puedes forzar el procesamiento:
```
https://kaven-bot.onrender.com/webhook/meta/test/EL_LEADGEN_ID
```
Devuelve un JSON con los datos mapeados (útil para depurar el mapeo de campos).

---

## 6. Mapeo de campos del formulario

`mapMetaFieldData()` reconoce automáticamente estos campos (en español e inglés,
sin distinguir acentos ni mayúsculas):

| Campo Kaven | Palabras clave que detecta |
|---|---|
| **name** | `full name`, `nombre completo`, o `first name` + `last name` |
| **email** | `email`, `correo`, `e-mail` |
| **phone** | `phone`, `teléfono`, `celular`, `whatsapp` |
| **quantity** | `cuánt...`, `cantidad`, `piezas`, `personas`, `how many`, `quantity` |
| **date** | `cuándo`, `fecha`, `entrega`, `when`, `date` |
| **design** | `diseño`, `design`, `logo` |
| **sport** | `uniforme`, `deporte`, `sport`, `uniform` |

> **Importante:** la cantidad se revisa **antes** que el deporte, porque preguntas como
> "¿Cuántos uniformes necesitas?" / "How many uniforms?" contienen la palabra "uniforme"
> pero en realidad piden la cantidad. El orden del código ya está ajustado para esto.

Si en tu formulario usas otros textos para las preguntas, avísanos para agregar las
palabras clave correspondientes.

---

## 7. Resumen de seguridad

- El webhook **rechaza** (403) cualquier POST cuya firma `X-Hub-Signature-256` no coincida
  con tu `META_APP_SECRET`. Esto evita que terceros inyecten leads falsos.
- Si no configuras `META_APP_SECRET`, el webhook **acepta** los POST pero deja una
  advertencia en los logs (modo de prueba). Para producción, **siempre** configura el secret.
- El token de verificación (`META_VERIFY_TOKEN`) solo se usa en el handshake inicial.

---

## 8. Checklist final

- [ ] `META_VERIFY_TOKEN` configurado en Render
- [ ] `META_PAGE_ACCESS_TOKEN` (con `leads_retrieval`, larga duración) configurado en Render
- [ ] `META_APP_SECRET` configurado en Render
- [ ] Producto "Webhooks" agregado a la App de Meta
- [ ] Callback URL `https://kaven-bot.onrender.com/webhook/meta` verificada (palomita verde)
- [ ] Campo `leadgen` suscrito
- [ ] Página suscrita vía `/{PAGE_ID}/subscribed_apps` con `subscribed_fields=leadgen`
- [ ] Lead de prueba creado con la Lead Ads Testing Tool y visible en los logs de Render
- [ ] (Producción) App Review aprobado para `leads_retrieval`
