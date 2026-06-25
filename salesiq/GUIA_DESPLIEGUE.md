# Guía de despliegue — Cotización por producto desde la landing de ciclismo

Esta función hace que los botones **"Get a quote"** de la landing de ciclismo
(`https://www.kavensports.com/cycling-catalog`) **abran el bot (Zoho SalesIQ)** en
lugar de ir al formulario `/contact`. El bot:

1. Identifica **qué producto** seleccionó el visitante.
2. Le pregunta si desea **agregar otros productos** a su cotización formal.
3. Continúa con el **mismo cuestionario** ya configurado (cantidad, fecha de
   entrega, diseño, correo, nombre, teléfono).
4. Guarda todo en el CRM (módulo Posibles clientes / "Sports Leads"), incluyendo
   la lista de productos.

---

## ✅ Lo que YA quedó hecho (automático)

- **Backend (Render):** `server.js` actualizado y desplegado.
  - `/lead` ahora acepta el campo `products` y lo guarda en la **Descripción** del
    lead (garantizado) e intenta además el campo "Tipo de uniforme" de forma
    tolerante (si no existe, no rompe nada).
  - El prompt del bot reconoce el mensaje `"Quiero cotizar: <producto>"`.
  - Verificado en vivo: el bot responde identificando el producto y pidiendo
    agregar más; `/lead` crea el lead correctamente.
- **Código versionado** en GitHub (`jreyesilc/kaven-bot`, rama `main`).

Quedan **2 pasos manuales** (requieren tu login de Zoho): pegar el snippet en
Zoho Sites y pegar los handlers en el Zobot de SalesIQ.

---

## Paso 1 — Landing en Zoho Sites

Archivo: `landing/cycling-catalog-snippet.html`

1. Entra al editor de **Zoho Sites** → página del catálogo de ciclismo.
2. Abre el bloque de **HTML/código personalizado** (contenedor `#kvn-ciclismo`).
3. Reemplaza todo el contenido con el del archivo
   `landing/cycling-catalog-snippet.html`.
4. Publica.

Qué cambió en el snippet:
- Los **6 botones de producto** ahora llaman a `kvnQuote('<Producto>')` y abren el
  bot con el mensaje `Quiero cotizar: <Producto>`.
- Se quitaron los botones genéricos del hero y de la sección intermedia.
- El botón de cierre ("Request a free quote") abre el bot de forma general.
- Se agregó la función `kvnQuote()` que muestra el chat de SalesIQ y envía el
  primer mensaje. Si SalesIQ no estuviera disponible, cae de respaldo a
  `/contact`.

> Nota: el widget de SalesIQ ya está embebido en todo el sitio, así que el botón
> sólo necesita abrirlo. No hay que insertar el código del widget de nuevo.

---

## Paso 2 — Zobot en Zoho SalesIQ

Portal SalesIQ: `jreyesilcmx` · Bot con `context_id = lead_details`.

### 2a. Message Handler
Archivo: `salesiq/message_handler.deluge`

1. SalesIQ → **Settings → Bot → (tu Zobot) → Message Handler**.
2. Reemplaza el código por el de `salesiq/message_handler.deluge`.
3. Guarda.

Qué hace:
- Detecta `"Quiero cotizar: <producto>"` y guarda el producto en la sesión.
- Al disparar el formulario añade una **pregunta Q0 de selección múltiple**
  (`multiple-select`) para agregar más productos:
  - Si vino de un botón de producto: muestra los **otros 5** productos + la opción
    "No, solo &lt;producto&gt;".
  - Si entró sin producto: muestra los **6** productos.
- Luego encadena el cuestionario existente (cantidad, fecha, diseño, correo,
  nombre, teléfono) — **sin cambios** en esas preguntas.

### 2b. Context Handler
Archivo: `salesiq/context_handler.deluge`

1. En el mismo Zobot → **Context Handler** (contexto `lead_details`).
2. Reemplaza el código por el de `salesiq/context_handler.deluge`.
3. Guarda.

Qué hace:
- Combina el producto del botón + los productos elegidos en Q0.
- Hace `POST` a `https://kaven-bot.onrender.com/lead` con nombre, correo,
  teléfono, cantidad, fecha, diseño y **products** → crea el lead en el CRM.
- Confirma al visitante e incluye la lista de productos cotizados.

---

## Paso 3 — Probar de punta a punta

1. Abre la landing publicada y haz clic en **"Get a quote"** de, por ejemplo,
   *Elite Jersey*.
2. Debe abrirse el chat; el bot responde reconociendo *Elite Jersey* y muestra la
   pregunta de productos (con los otros 5 + "No, solo Elite Jersey").
3. Elige productos (o sólo ese) → responde el cuestionario.
4. Verifica en **Zoho CRM → Posibles clientes** que se creó el lead y que en la
   **Descripción** aparece `Productos de interés: ...` junto con cantidad, fecha y
   diseño.

> Recordatorio: durante las pruebas de backend se creó un lead de prueba
> **"PRUEBA Agente Bot"** (correo `prueba-agente-bot@example.com`). Puedes
> eliminarlo del CRM.

---

## Notas técnicas

- Tipo de input para selección múltiple en SalesIQ: **`multiple-select`**
  (con guion), con `min_selection` = 1.
- El backend de Render se redespliega solo al hacer push a `main` en GitHub.
- Los productos siempre quedan en la **Descripción** del lead (a prueba de fallos).
  El campo personalizado "Tipo de uniforme" se intenta de forma tolerante: si el
  api_name no existe en el layout, se descarta sin afectar la creación del lead.
