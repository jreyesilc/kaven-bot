# 🔗 Integración: Handoff de Leads de Meta → Zobot (sin preguntas duplicadas)

**Fecha:** 29 de junio, 2026
**Tipo:** Integración / Optimización de conversión
**Estado:** ✅ IMPLEMENTADO (código) · ⏳ PENDIENTE de publicar en producción
**Componentes:** `landing/meta-lead-context.js` · `salesiq/message_handler_v17_meta_aware.deluge`

---

## 🎯 Problema que resuelve

Los leads que completan el cuestionario de **Meta (Instant Form / Messenger)** —tipo de uniforme, cantidad de personas, fecha de entrega, estado del diseño, nombre/email/teléfono— llegan a la landing
`https://www.kavensports.com/catalogo-ciclismo` y **el Zobot les vuelve a hacer las MISMAS preguntas**.

Esto genera fricción, sensación de "no me escucharon" y **pérdida de leads calientes**.

### Causa raíz (del análisis previo)
- El Zobot está activo en la landing ✅
- **NO** había captura de parámetros de la URL ❌
- SalesIQ no tenía forma de saber que el visitante ya venía calificado desde Meta ❌

---

## ✅ Solución (arquitectura)

```
┌──────────────┐   link con parámetros    ┌────────────────────────────┐
│  Meta Bot /  │ ───────────────────────► │  Landing kavensports.com   │
│ Instant Form │  ?source=meta&name=..    │  + meta-lead-context.js    │
└──────────────┘  &phone=..&sport=..      └─────────────┬──────────────┘
                  &quantity=..&date=..                   │  $zoho.salesiq.visitor.info({ kvn_meta: "META|name=..|..." })
                  &design=..                             ▼
                                            ┌────────────────────────────┐
                                            │  Zoho SalesIQ (Zobot)      │
                                            │  Message Handler v17       │
                                            │  - lee payload "kvn_meta"  │
                                            │  - salta el formulario     │
                                            │  - saluda por nombre       │
                                            │  - va directo al catálogo  │
                                            │  - crea el lead en CRM     │
                                            └────────────────────────────┘
```

**Canal de datos:** el script JS guarda los parámetros en `localStorage`/`sessionStorage` y los inyecta al visitante de SalesIQ con `$zoho.salesiq.visitor.info()`, en un campo compacto llamado **`kvn_meta`**:

```
META|name=Juan|phone=+526641234567|email=juan@x.com|sport=ciclismo|quantity=5|date=2026-07-15|design=necesito ayuda|lead_id=123|campaign=cycling_2026|lang=es
```

El **Message Handler v17** en Deluge lee ese campo desde el objeto `visitor`, lo parsea, lo guarda en la sesión del visitante y ajusta el flujo.

---

## 1️⃣ Configurar el link en el Meta Bot / Instant Form

El botón final del flujo de Meta (o el mensaje de seguimiento en Messenger) debe enviar al usuario a la landing **con los parámetros del lead**.

### URL recomendada
```
https://www.kavensports.com/catalogo-ciclismo?source=meta&name={{full_name}}&phone={{phone_number}}&email={{email}}&sport={{tipo_uniforme}}&quantity={{cantidad}}&date={{fecha_entrega}}&design={{estado_diseno}}&campaign=cycling_2026&lang=es
```

### Parámetros aceptados
| Parámetro | Alias aceptados | Descripción |
|-----------|-----------------|-------------|
| `source`  | `utm_source` | Debe contener `meta`, `facebook`, `fb`, `instagram` o `ig`. **Obligatorio** para activar el flujo. |
| `name`    | `full_name`, `first_name` | Nombre del lead |
| `phone`   | `phone_number`, `tel` | Teléfono (WhatsApp) |
| `email`   | — | Correo |
| `sport`   | `deporte`, `uniform_type`, `tipo_uniforme` | Tipo de uniforme/deporte |
| `quantity`| `cantidad`, `qty` | Cantidad de personas |
| `date`    | `fecha`, `delivery_date`, `fecha_entrega` | Fecha de entrega deseada |
| `design`  | `diseno`, `design_status`, `estado_diseno` | Estado del diseño (ya tengo / necesito ayuda) |
| `lead_id` | `leadgen_id`, `fb_lead_id` | ID del lead de Meta (opcional, también activa el flujo) |
| `campaign`| `utm_campaign` | Campaña |
| `lang`    | `idioma` | `es` (por defecto) o `en` |

> 💡 En Meta, los campos dinámicos se insertan con las variables del formulario (p. ej. `{{form.full_name}}`). El nombre exacto depende de cómo se llamen las preguntas en tu Instant Form. Verifica que **codifiquen espacios** (`%20`) — Meta normalmente lo hace automáticamente.

> ⚠️ Si Meta no permite pasar todos los campos por URL (límite de longitud o de variables), basta con `source=meta` + `name` + `sport`. El bot igual saluda por nombre y no repite preguntas; los datos faltantes se confirman conversacionalmente sin re-preguntar lo ya conocido.

---

## 2️⃣ Desplegar el script en la landing

El script vive en `landing/meta-lead-context.js`.

### Opción A — archivo externo (recomendado)
1. Sube `meta-lead-context.js` a tu hosting/CDN (por ejemplo a `/js/meta-lead-context.js`).
2. En el `<head>` de **todas** las páginas donde esté el Zobot (mínimo `/catalogo-ciclismo`), agrega **después** del snippet de Zoho SalesIQ:
   ```html
   <script src="/js/meta-lead-context.js" defer></script>
   ```

### Opción B — inline
Pega el contenido completo del archivo dentro de una etiqueta `<script>...</script>` en el `<head>`, después del snippet de SalesIQ.

### Requisitos de orden
- El snippet de **Zoho SalesIQ debe cargarse primero** (o en paralelo). El script espera de forma segura (callback `ready` + polling de ~20 s) a que `$zoho.salesiq` exista antes de inyectar, así que el orden exacto no rompe nada, pero lo ideal es: SalesIQ → meta-lead-context.js.

### Verificación rápida en el navegador (DevTools → Console)
```js
// 1. Abrir la landing con parámetros de prueba:
//    https://www.kavensports.com/catalogo-ciclismo?source=meta&name=Prueba&sport=ciclismo&quantity=5
// 2. En la consola:
KavenMetaLead.isMetaLead();   // -> true
KavenMetaLead.get();          // -> { source:"meta", name:"Prueba", sport:"ciclismo", quantity:"5", ... }
KavenMetaLead.payloadString();// -> "META|name=Prueba|phone=|...|sport=ciclismo|quantity=5|..."
localStorage.getItem('kaven_meta_lead'); // -> JSON persistido
```

---

## 3️⃣ Publicar el nuevo Message Handler v17 en SalesIQ

> Sigue la guía general [`como_publicar_cambios_bot.md`](../guias_implementacion/como_publicar_cambios_bot.md). Resumen:

1. Entra a **Zoho SalesIQ → Settings → Bot → Kaven Sports → Message Handler**.
2. Abre `salesiq/message_handler_v17_meta_aware.deluge`, copia **todo** el contenido.
3. Pega reemplazando el script v16 actual.
4. **Guarda** y **Publica** el bot.
5. El **Context Handler v14** (`context_handler_v14_minimal.deluge`) **NO cambia** — sigue igual. v17 simplemente no lo invoca para leads de Meta.

> 🔎 **Dependencia clave:** v17 lee el payload desde el objeto `visitor` (`visitor.get("kvn_meta")` y, como respaldo, `visitor.get("info").get("kvn_meta")`). Si tu plan/versión de SalesIQ expone la información personalizada con otra estructura, revisa el bloque "DETECCION DE LEAD DE META" del handler: está aislado y comentado para ajustarlo fácil. Una vez detectado en el primer mensaje, el payload se **persiste en sesión**, por lo que los mensajes siguientes no dependen del objeto `visitor`.

### Comportamiento esperado del bot v17
| Visitante | Comportamiento |
|-----------|----------------|
| **Viene de Meta** (`source=meta...`) | 1) NO muestra formulario. 2) Saluda por nombre y reconoce su deporte/cantidad/fecha/diseño. 3) Comparte el catálogo. 4) Crea el lead en CRM (una vez). 5) Sigue conversando con OpenAI ya con el contexto cargado (sin re-preguntar). |
| **Directo / orgánico** | Flujo NORMAL idéntico a v16 (RAG + señales + formulario cuando hay intención de compra). |

---

## 4️⃣ Testing checklist

### A. Script en la landing
- [ ] Abrir `…/catalogo-ciclismo?source=meta&name=Prueba&sport=ciclismo&quantity=5&date=2026-07-15&design=necesito%20ayuda`
- [ ] `KavenMetaLead.isMetaLead()` → `true`
- [ ] `localStorage.kaven_meta_lead` contiene los datos
- [ ] Recargar la página: los datos **persisten** (storage)
- [ ] Navegar a otra página interna con el Zobot: el contexto **se mantiene**
- [ ] Abrir sin parámetros (visitante directo): `KavenMetaLead.isMetaLead()` → `false`

### B. Zobot v17 — lead de Meta
- [ ] Llegar desde el link de Meta y escribir cualquier mensaje (p. ej. "hola")
- [ ] El bot **saluda por nombre** y menciona el deporte ("Vi que ya nos compartiste tu información para ciclismo…")
- [ ] El bot **NO** muestra el formulario de teléfono/nombre
- [ ] El bot comparte el **catálogo**
- [ ] Se crea **un** lead en Zoho CRM con `Lead Source` = Meta y los datos en la Description (cantidad/fecha/diseño)
- [ ] En mensajes siguientes el bot **no vuelve a preguntar** deporte/cantidad/fecha/diseño
- [ ] No se crea un lead duplicado (dedup del backend por teléfono→email)

### C. Zobot v17 — visitante directo (regresión)
- [ ] Entrar a la landing **sin** parámetros
- [ ] El flujo v16 funciona igual: responde preguntas y muestra el formulario al detectar intención de compra
- [ ] El botón "Obtener precio / Quiero cotizar" sigue activando el formulario normal

### D. Idioma
- [ ] `lang=en` → saludo en inglés
- [ ] sin `lang` o `lang=es` → saludo en español

---

## 🔁 Rollback

Si algo falla en producción:
1. **SalesIQ:** vuelve a pegar `message_handler_v16_smart_signals.deluge` y publica. (El v17 es aditivo; volver a v16 restaura el comportamiento previo.)
2. **Landing:** quita la etiqueta `<script src=".../meta-lead-context.js">`. El script es inocuo (solo inyecta datos), pero puede retirarse sin afectar el resto.

Ningún cambio toca el backend (`server.js`) ni el Context Handler v14, por lo que el rollback es de bajo riesgo.

---

## 📁 Archivos de esta integración
| Archivo | Rol |
|---------|-----|
| `landing/meta-lead-context.js` | Captura parámetros URL + inyecta a SalesIQ + API global `window.KavenMetaLead` |
| `salesiq/message_handler_v17_meta_aware.deluge` | Handler que detecta Meta, salta el formulario, saluda y crea el lead |
| `docs/integraciones/meta_lead_handoff.md` | Esta guía |

---

**Autor:** Abacus AI Agent · **Proyecto:** Kaven Sports Bot
