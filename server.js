const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

console.log("🚀 Starting server...");

//////////////////////////////////////////////////////
// ✅ OPENAI SEGURO
//////////////////////////////////////////////////////

let openai = null;

try {
  if (!process.env.OPENAI_KEY) {
    console.log("⚠️ OPENAI KEY missing");
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY
    });
    console.log("✅ OpenAI initialized");
  }
} catch (err) {
  console.log("🔥 OpenAI init error:", err.message);
  openai = null;
}

//////////////////////////////////////////////////////
// ✅ SYSTEM PROMPT - VOZ DE MARCA KAVEN SPORTS
//////////////////////////////////////////////////////

const systemPrompt = `You are the sales assistant for Kaven Sports, an expert in custom sports uniforms. Kaven Sports (formerly known as Kings Sportswear) is a San Diego, USA based manufacturer of premium, fully sublimated custom athletic apparel for teams of every size.

ABOUT KAVEN SPORTS
- We design and manufacture 100% custom sports uniforms and team apparel in San Diego, USA.
- We use advanced full sublimation so colors stay vibrant and fade-resistant through heavy use and frequent washing.
- Our fabrics feature Dryfit technology, antibacterial properties, and UV protection, so athletes stay comfortable, cool, and fresh.
- Our promise: full customization, professional quality, and expert guidance from real designers.

PRODUCTS & SPORTS WE COVER
- Sport uniforms: baseball, softball, basketball, soccer, football, volleyball, track & field, padel, cycling, and off-road/racing.
- Custom team apparel: jerseys, pants, shorts, hoodies, parkas, tracksuits, polos, socks, buffs, and bags.
- Promotional gear: custom tents, flags, and table covers.

CYCLING PRODUCT LINE (3 tiers)
We offer three cycling tiers, all 100% sublimated and built with Dryfit, antibacterial, and UV-protection fabrics. The difference between them is the level of technical development, aerodynamic fit, and construction complexity:
- STANDARD: Excellent balance of comfort and durability. Ideal for regular training and recreational riders.
- ELITE: Optimized body fit and improved breathability. Built for superior performance on more demanding rides.
- PREMIERE: Our top tier, with advanced aerodynamic engineering and ultra-light materials. Designed for high-level competition.
- A standard cycling kit includes a Jersey + Bibshort, fully customized.
- For detailed cuts and options, you can share our cycling catalog: https://www.kavensports.com/files/info/Catalogo_Ciclismo.pdf

KEY SELLING POINTS (mention naturally when relevant)
- No minimum order — perfect for a single player, a sample piece, or a full organization.
- Unlimited FREE custom designs with expert designers — we can work from the customer's own design or create one for them.
- Fast production: typically delivered in about 1-3 weeks (design + shipping included).
- Proudly made in San Diego, USA.
- 100% satisfaction guarantee.

YOUR ROLE & GOALS
- Help teams, coaches, and players find the perfect custom uniforms for their sport.
- Understand their needs (sport, quantity, colors, logos, timeline, design status) and recommend the right products or cycling tier.
- Qualify leads: when a visitor shows buying intent (asks about pricing, quantity, customization/logos, delivery timeline, or says they want to order), guide them toward sharing their contact details (full name, phone, email) so our team can prepare a personalized quote.
- Be genuinely helpful first — build rapport, answer questions, and make the customer feel confident about ordering custom gear.

TONE & STYLE (modeled on our best human + AI conversations)
- Warm, friendly, and enthusiastic — like a knowledgeable teammate, never a pushy salesperson.
- Address the customer by name whenever you know it.
- Validate the customer often: "Great question!", "That's an excellent idea!", "Love that design!".
- Be concise but informative — get to the point while staying warm.
- Use light, tasteful emojis only when they add energy (e.g., 😊 ✨ 🚴) — at most one per message, never overdo it.
- End most replies with an open question that moves the conversation forward.
- When a customer shares their own design, acknowledge it positively and personally before continuing.
- For sample or single-piece requests (e.g., one kit before a group order), respond positively — it's a great way for a team to check quality first-hand.

FIRST REPLY AFTER A LEAD / FORM SUBMISSION (welcome message)
When a visitor arrives having just submitted a form or shared their details (name, sport, quantity, design status, etc.), open the relationship with a warm, structured welcome. Follow this proven flow:
1. Greet them by name and thank them genuinely for sharing their details and their interest, mentioning the specific sport they care about (e.g. "tu interés en nuestros uniformes de ciclismo").
2. Give a short, confident intro about Kaven Sports: high-quality custom uniforms, Dryfit antibacterial fabric with UV protection (comfortable and professional), and the fact that we work with NO minimum order so they have total freedom to outfit a whole team or just themselves.
3. State the approximate delivery time (about 1-3 weeks, including custom design and shipping). IMPORTANT: reference the data they already gave you to feel personal and move faster — for example, if they said "ya tengo el diseño", say something like "Como ya cuentas con tu diseño, podemos avanzar más rápido"; if they gave a quantity or a date, acknowledge it.
4. Close with a single open, low-pressure question that invites them to continue (e.g. "¿Qué más te gustaría saber o en qué otra cosa te puedo ayudar por ahora? ✨").
Keep it warm and easy to read (2-4 short paragraphs), one tasteful emoji at most per paragraph.

FOLLOW-UP & LEAD NURTURING (the most important behavior — model this tone exactly)
You are a patient, attentive follow-up assistant. NEVER pressure the customer. Always make them feel that you are calmly available on their schedule. Mirror these real, successful behaviors:
- If the customer says they have to step away, got busy, or left unexpectedly (e.g. "salí de imprevisto"): reassure them warmly — "¡Hola, Eligio! No te preocupes, entiendo perfectamente. Aquí sigo para cuando estés listo. 😊" Then gently offer a helpful next step, such as helping them choose between our cycling tiers (Standard, Elite or Premiere) so you can prepare a more precise quote, OR ask if there's any other doubt you can help with.
- If the customer wants to postpone or continue later (e.g. "mañana le damos seguimiento"): agree graciously with zero pressure — "¡Claro que sí, Eligio! Entendido perfectamente. Aquí estaré pendiente para cuando estés listo mañana para continuar. ¡Que tengas una excelente tarde y nos leemos pronto! 😊"
- When the customer thanks you or says goodbye (e.g. "Gracias, buena tarde"): warmly thank them back, wish them well, and confirm you'll be available whenever they want to resume — "¡Gracias a ti, Eligio! Que tengas una excelente tarde. Aquí estaré pendiente para cuando gustes retomar el tema. ¡Hasta pronto! 😊"
- Always address the customer by name, validate what they said, and keep your replies short and human in these moments.
- When the moment is right and the customer is engaged, gently move the lead forward by offering to help pick the right cycling tier (Standard / Elite / Premiere) or to prepare a personalized quote — but only as a helpful suggestion, never as a push.
- Respect the customer's pace above all: a warm, patient, "I'm here whenever you're ready" attitude is what wins the sale.

These follow-up examples are in Spanish because that's the customer's language; when the customer writes in English, deliver the exact same warm, patient, no-pressure tone in natural English.

LANGUAGE
- Bilingual: always reply in the SAME language the user writes in (English or Spanish). Match their tone and wording naturally.

GUIDELINES
- For exact pricing, gather the customer's needs (tier, quantity, design details) and offer a personalized formal quote from the team, since final cost depends on the selected tier and specific design.
- If you don't know a specific detail, offer to connect them with the Kaven Sports team rather than guessing.
- Never reference the old "Kings Sportswear" name unless the customer brings it up; lead with "Kaven Sports".
- Keep the conversation focused on helping them get the best custom uniforms for their team.`;

//////////////////////////////////////////////////////
// ✅ HELPERS DE CONTEXTO Y CUALIFICACIÓN
//////////////////////////////////////////////////////

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getConversationTexts(payload = {}) {
  const texts = [];

  if (typeof payload.message === "string") {
    texts.push(payload.message);
  }

  if (typeof payload.conversation === "string") {
    texts.push(payload.conversation);
  }

  if (Array.isArray(payload.history)) {
    payload.history.forEach((item) => {
      if (typeof item === "string") {
        texts.push(item);
      } else if (item && typeof item === "object") {
        if (typeof item.content === "string") texts.push(item.content);
        if (typeof item.message === "string") texts.push(item.message);
        if (typeof item.text === "string") texts.push(item.text);
      }
    });
  }

  if (Array.isArray(payload.messages)) {
    payload.messages.forEach((item) => {
      if (typeof item === "string") {
        texts.push(item);
      } else if (item && typeof item === "object") {
        if (typeof item.content === "string") texts.push(item.content);
        if (typeof item.message === "string") texts.push(item.message);
        if (typeof item.text === "string") texts.push(item.text);
      }
    });
  }

  return texts.filter(Boolean);
}

// Construye el historial conversacional preservando el rol (user/assistant)
// para que el GPT entienda quien dijo que y pueda dar un seguimiento natural
// (clave para imitar el tono del agente de Meta). Si no hay roles claros,
// devuelve un array vacio y el endpoint recurre al contexto plano.
function getConversationMessages(payload = {}) {
  const out = [];

  const roleOf = (item) => {
    const raw = (
      item.role ||
      item.sender ||
      item.from ||
      item.author ||
      item.type ||
      ""
    )
      .toString()
      .toLowerCase();
    if (/assistant|bot|agent|ai|operator|system/.test(raw)) return "assistant";
    if (/user|visitor|customer|client|human|guest/.test(raw)) return "user";
    return null; // desconocido
  };

  const contentOf = (item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      return item.content || item.message || item.text || "";
    }
    return "";
  };

  const collections = [];
  if (Array.isArray(payload.history)) collections.push(payload.history);
  if (Array.isArray(payload.messages)) collections.push(payload.messages);

  collections.forEach((arr) => {
    arr.forEach((item) => {
      const content = (contentOf(item) || "").toString().trim();
      if (!content) return;
      const role = roleOf(item) || "user"; // default visitante
      out.push({ role, content });
    });
  });

  return out;
}

function detectBuyingSignals(payload = {}) {
  const signalPatterns = {
    pricing: [
      /\bprecio\b/i,
      /\bprice\b/i,
      /\bprices\b/i,
      /\bpricing\b/i,
      /per\s+unit/i,
      /per\s+piece/i,
      /cuanto\s+cuesta/i,
      /cost(o|ar|s)?/i,
      /how\s+much/i,
      /quote/i,
      /cotiz(ar|acion)/i,
      /\bbudget\b/i,
      /\$\s*\d/i
    ],
    quantity: [
      /\bcuantos\b/i,
      /\bcantidad\b/i,
      /minimum\s+order/i,
      /minimo\s+de\s+(pedido|compra)/i,
      /moq/i,
      /how\s+many/i,
      /\bunits?\b/i,
      /\bpieces?\b/i,
      /\bbulk\b/i,
      /\bdozen\b/i,
      /\d{1,6}\s*(custom\s+)?(uniforms?|jerseys?|shirts?|kits?|pieces?|units?|sets?|pcs?|players?|team)/i
    ],
    customization: [
      /\bdiseno\b/i,
      /personaliz(ar|ado)/i,
      /customi[sz]e/i,
      /custom\b/i,
      /logo/i,
      /colores?/i,
      /nombre\s+en\s+el\s+uniforme/i
    ],
    timeline: [
      /cuanto\s+tiempo/i,
      /\bentrega\b/i,
      /delivery/i,
      /when\b/i,
      /lead\s*time/i,
      /tiempo\s+de\s+produccion/i
    ],
    direct_interest: [
      /quiero\s+cotizar/i,
      /me\s+interesa/i,
      /i\s*(am|'m)\s+interested/i,
      /want\s+a\s+quote/i,
      /how\s+to\s+order/i,
      /como\s+ordeno/i,
      /quiero\s+comprar/i,
      /listo\s+para\s+comprar/i
    ]
  };

  const conversationTexts = getConversationTexts(payload);
  const normalizedConversation = normalizeText(conversationTexts.join(" \n "));

  const categories = [];
  for (const [category, patterns] of Object.entries(signalPatterns)) {
    if (patterns.some((regex) => regex.test(normalizedConversation))) {
      categories.push(category);
    }
  }

  const collectContact = categories.length > 0;

  return {
    collectContact,
    categories,
    signalCount: categories.length,
    analyzedText: normalizedConversation
  };
}

//////////////////////////////////////////////////////
// ✅ ZOHO TOKEN
//////////////////////////////////////////////////////

async function refreshZohoToken() {
  try {
    const res = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token"
        }
      }
    );

    return res.data.access_token;
  } catch (err) {
    console.log("🔥 Zoho token error:", err.message);
    return null;
  }
}

//////////////////////////////////////////////////////
// ✅ BUSCAR LEAD EXISTENTE POR EMAIL (anti-duplicados)
//////////////////////////////////////////////////////

// Busca un Lead existente en Zoho CRM por email exacto.
// Devuelve el primer registro encontrado o null.
// IMPORTANTE: si la busqueda falla por cualquier razon, devolvemos null
// para NO bloquear la creacion del lead (preferimos un posible duplicado
// antes que perder un lead).
async function buscarLeadPorEmail(token, email) {
  const cleanEmail = (email || "").toString().trim();
  if (!cleanEmail) {
    console.log("🔎 buscarLeadPorEmail: sin email, se omite dedup");
    return null;
  }

  try {
    const resp = await axios.get(
      "https://www.zohoapis.com/crm/v2/Leads/search",
      {
        params: { criteria: `(Email:equals:${cleanEmail})` },
        headers: { Authorization: `Zoho-oauthtoken ${token}` }
      }
    );

    // Zoho devuelve 204 (sin contenido) cuando no hay resultados
    if (resp.status === 204 || !resp.data || !Array.isArray(resp.data.data)) {
      console.log(`🔎 buscarLeadPorEmail: sin lead previo para ${cleanEmail}`);
      return null;
    }

    if (resp.data.data.length > 0) {
      const found = resp.data.data[0];
      console.log(`♻️ buscarLeadPorEmail: lead existente ${found.id} para ${cleanEmail}`);
      return found;
    }

    return null;
  } catch (err) {
    const status = err.response ? err.response.status : null;
    if (status === 204) {
      console.log(`🔎 buscarLeadPorEmail: 204 sin lead previo para ${cleanEmail}`);
      return null;
    }
    const apiErr = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    console.log("⚠️ buscarLeadPorEmail error (se continua con creacion):", apiErr);
    return null;
  }
}

// Combina las señales existentes en CRM con las nuevas (sin duplicar)
function mergeSignals(existingValue, newLabels) {
  const merged = [];
  const pushUnique = (v) => {
    const val = (v || "").toString().trim();
    if (val && !merged.includes(val)) merged.push(val);
  };

  // existingValue puede ser array (multiselect) o string
  if (Array.isArray(existingValue)) {
    existingValue.forEach(pushUnique);
  } else if (typeof existingValue === "string" && existingValue.trim()) {
    existingValue.split(/[;,]/).forEach(pushUnique);
  }

  (newLabels || []).forEach(pushUnique);
  return merged;
}

//////////////////////////////////////////////////////
// ✅ CREAR LEAD EN ZOHO
//////////////////////////////////////////////////////

async function crearLead(name, phone, message) {
  try {
    const token = await refreshZohoToken();

    if (!token) {
      console.log("❌ No Zoho token");
      return;
    }

    await axios.post(
      "https://www.zohoapis.com/crm/v2/Leads",
      {
        data: [
          {
            Last_Name: name || "Unknown",
            Phone: phone || "",
            Description: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`
        }
      }
    );

    console.log("✅ Lead created in Zoho");
  } catch (err) {
    console.log("🔥 Zoho error:", err.message);
  }
}

//////////////////////////////////////////////////////
// ✅ CREAR LEAD COMPLETO (layout Sports Leads + señales)
//////////////////////////////////////////////////////

// Mapea claves del backend -> etiquetas EXACTAS del picklist en CRM
const SIGNAL_LABELS = {
  pricing: "Precio / Cotización (pricing)",
  quantity: "Cantidad / Pedido mínimo (quantity)",
  customization: "Personalización / Logo / Diseño (customization)",
  timeline: "Tiempo de entrega (timeline)",
  direct_interest: "Interés directo de compra (direct_interest)"
};

const SPORTS_LEADS_LAYOUT_ID = "5941168000003464001";

// Actualiza el campo de señales (y opcionalmente telefono/descripcion) de un
// lead ya existente, en lugar de crear un duplicado.
async function actualizarLeadExistente(token, leadId, mergedLabels, phone, message) {
  try {
    const record = { id: leadId };
    if (mergedLabels && mergedLabels.length > 0) {
      record.Se_ales_de_Compra = mergedLabels;
    }
    if (phone) record.Phone = phone;
    if (message) record.Description = message;

    const resp = await axios.put(
      "https://www.zohoapis.com/crm/v2/Leads",
      { data: [record] },
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );

    const detail =
      resp.data && Array.isArray(resp.data.data) && resp.data.data[0]
        ? resp.data.data[0]
        : null;

    if (detail && detail.code === "SUCCESS") {
      console.log(`✅ Lead existente ${leadId} actualizado con señales:`, mergedLabels);
      return { ok: true };
    }
    console.log("⚠️ actualizarLeadExistente respuesta inesperada:", JSON.stringify(resp.data));
    return { ok: false, error: JSON.stringify(resp.data) };
  } catch (err) {
    const apiErr = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    console.log("🔥 actualizarLeadExistente error:", apiErr);
    return { ok: false, error: apiErr };
  }
}

async function crearLeadCompleto({ name, email, phone, signals, message }) {
  const token = await refreshZohoToken();
  if (!token) {
    console.log("❌ crearLeadCompleto: no se obtuvo token de Zoho");
    return { ok: false, error: "no_token" };
  }

  // Construir etiquetas de señales válidas (mapeo backend -> picklist CRM)
  const labels = [];
  const unknownSignals = [];
  (signals || []).forEach((s) => {
    const key = (s || "").toString().trim().toLowerCase();
    if (SIGNAL_LABELS[key]) {
      if (!labels.includes(SIGNAL_LABELS[key])) labels.push(SIGNAL_LABELS[key]);
    } else if (key) {
      unknownSignals.push(key);
    }
  });
  console.log("🏷️ Señales recibidas:", signals, "=> etiquetas CRM:", labels);
  if (unknownSignals.length > 0) {
    console.log("⚠️ Señales no reconocidas (ignoradas para picklist):", unknownSignals);
  }

  //////////////////////////////////////////////////////
  // 🛡️ DEDUPLICACION POR EMAIL (backend)
  // Antes de crear, buscamos si ya existe un lead con ese email.
  // Si existe: actualizamos sus señales (merge) en lugar de duplicar.
  //////////////////////////////////////////////////////
  const existing = await buscarLeadPorEmail(token, email);
  if (existing && existing.id) {
    const mergedLabels = mergeSignals(existing.Se_ales_de_Compra, labels);
    const upd = await actualizarLeadExistente(token, existing.id, mergedLabels, phone, message);
    return {
      ok: true,
      id: existing.id,
      duplicate: true,
      updated: upd.ok,
      signals: mergedLabels,
      update_error: upd.ok ? undefined : upd.error
    };
  }

  // El layout "Sports Leads" exige First_Name. Dividimos el nombre completo.
  const fullName = (name || "Unknown").toString().trim();
  let firstName = fullName;
  let lastName = fullName;
  const spaceIdx = fullName.indexOf(" ");
  if (spaceIdx > 0) {
    firstName = fullName.substring(0, spaceIdx).trim();
    lastName = fullName.substring(spaceIdx + 1).trim();
  }

  const record = {
    First_Name: firstName,
    Last_Name: lastName || firstName,
    Contact_Name: fullName,
    Email: email || "",
    Phone: phone || "",
    Company: "Kaven Sports - Web Chat",
    Lead_Source: "Chatbot - SalesIQ",
    Description: message || "Lead from Kaven Sports chatbot",
    Team_Club_Name: "Por confirmar",
    Layout: { id: SPORTS_LEADS_LAYOUT_ID }
  };

  if (labels.length > 0) {
    record.Se_ales_de_Compra = labels;
  }

  // Reintento automatico: el layout "Sports Leads" tiene varios campos
  // obligatorios. Si la API responde MANDATORY_NOT_FOUND, agregamos ese
  // campo con un valor placeholder y reintentamos (max 15 intentos).
  // Ademas, si Se_ales_de_Compra devuelve INVALID_DATA (valor que no
  // coincide con el picklist), movemos las señales a Description y
  // reintentamos para NO perder el lead.
  const filledMandatory = [];
  let signalsFieldDropped = false;

  // Procesa un "detail" de error de Zoho. Devuelve true si ajusto el
  // record y conviene reintentar; false si no es recuperable.
  const handleRetryableError = (detail) => {
    if (!detail || !detail.details) return false;

    if (detail.code === "MANDATORY_NOT_FOUND" && detail.details.api_name) {
      const missing = detail.details.api_name;
      if (!record.hasOwnProperty(missing)) {
        record[missing] = "Por confirmar";
        filledMandatory.push(missing);
        console.log("➕ Campo obligatorio autocompletado:", missing);
        return true;
      }
    }

    if (detail.code === "INVALID_DATA" && detail.details.api_name === "Se_ales_de_Compra") {
      if (record.Se_ales_de_Compra && !signalsFieldDropped) {
        const sigText = labels.join("; ");
        record.Description =
          (record.Description ? record.Description + " | " : "") +
          "Señales de compra detectadas: " + sigText;
        delete record.Se_ales_de_Compra;
        signalsFieldDropped = true;
        console.log("⚠️ Se_ales_de_Compra INVALID_DATA -> señales movidas a Description, reintentando");
        return true;
      }
    }

    return false;
  };

  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const resp = await axios.post(
        "https://www.zohoapis.com/crm/v2/Leads",
        { data: [record] },
        { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
      );

      const detail =
        resp.data &&
        Array.isArray(resp.data.data) &&
        resp.data.data[0] ? resp.data.data[0] : null;

      if (detail && detail.code === "SUCCESS") {
        const newId = detail.details ? detail.details.id : "";
        console.log(`✅ Lead creado en Zoho (id=${newId}) señales=${JSON.stringify(labels)} dropped=${signalsFieldDropped}`);
        return {
          ok: true,
          id: newId,
          duplicate: false,
          signals: labels,
          signals_in_description: signalsFieldDropped,
          auto_filled: filledMandatory
        };
      }

      if (handleRetryableError(detail)) continue;

      console.log("🔥 crearLeadCompleto respuesta no exitosa:", JSON.stringify(resp.data));
      return { ok: false, error: JSON.stringify(resp.data) };
    } catch (err) {
      const data = err.response && err.response.data ? err.response.data : null;
      const detail =
        data && Array.isArray(data.data) && data.data[0] ? data.data[0] : null;

      if (handleRetryableError(detail)) continue;

      const apiErr = data ? JSON.stringify(data) : err.message;
      console.log("🔥 crearLeadCompleto error:", apiErr);
      return { ok: false, error: apiErr };
    }
  }
  console.log("🔥 crearLeadCompleto: max reintentos alcanzado", filledMandatory);
  return { ok: false, error: "max_retries_mandatory_fields", auto_filled: filledMandatory };
}

//////////////////////////////////////////////////////
// ✅ ENDPOINT /lead  (llamado por el Context Handler de SalesIQ)
//////////////////////////////////////////////////////

// Endpoint de diagnostico: lista campos obligatorios del modulo Leads
app.get("/lead-fields", async (req, res) => {
  try {
    const token = await refreshZohoToken();
    if (!token) return res.json({ ok: false, error: "no_token" });
    const resp = await axios.get(
      "https://www.zohoapis.com/crm/v2/settings/fields?module=Leads",
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );
    const fields = (resp.data.fields || [])
      .filter((f) => f.system_mandatory || (f.required === true) || (f.custom_field && f.required))
      .map((f) => ({
        api_name: f.api_name,
        field_label: f.field_label,
        data_type: f.data_type,
        system_mandatory: f.system_mandatory,
        required: f.required
      }));
    return res.json({ ok: true, mandatory_fields: fields });
  } catch (err) {
    const apiErr = err.response && err.response.data ? err.response.data : err.message;
    return res.json({ ok: false, error: apiErr });
  }
});

app.post("/lead", async (req, res) => {
  console.log("📥 /lead request:", JSON.stringify(req.body));
  try {
    let { name, email, phone, signals, buying_signals, message, raw_message, quantity, deadline, design } = req.body || {};

    // ✅ Campos del formulario estilo anuncio de ciclismo (Meta):
    //    cantidad, fecha de entrega y estado del diseño.
    //    Se incorporan a la Description para guardarlos en el CRM
    //    sin requerir campos personalizados nuevos.
    const detallesFormulario = [];
    if (quantity) detallesFormulario.push("Cantidad/Pedido: " + quantity);
    if (deadline) detallesFormulario.push("Fecha de entrega: " + deadline);
    if (design) detallesFormulario.push("Diseño: " + design);
    if (detallesFormulario.length > 0) {
      const bloque = "Datos del formulario (anuncio ciclismo) -> " + detallesFormulario.join(" | ");
      message = message ? (message + " | " + bloque) : bloque;
    }

    // Compatibilidad con SalesIQ Context Handler v8/v9:
    // v8 envio el campo como buying_signals, mientras que el backend
    // originalmente esperaba signals. Aceptamos ambos para evitar que
    // el campo de CRM quede vacio aunque el handler use el nombre nuevo.
    if ((!signals || (Array.isArray(signals) && signals.length === 0)) && buying_signals) {
      signals = buying_signals;
    }

    // signals puede llegar como array, como string CSV o como string tipo "pricing,quantity,"
    if (typeof signals === "string") {
      signals = signals.split(/[,\s]+/).filter(Boolean);
    }
    if (!Array.isArray(signals)) {
      signals = [];
    }

    // RESPALDO ROBUSTO: si no llegaron señales desde la sesion de SalesIQ
    // pero si tenemos el mensaje original del visitante, las detectamos aqui
    // reutilizando el mismo motor de deteccion del endpoint /chat.
    if (signals.length === 0 && raw_message) {
      const detected = detectBuyingSignals({ message: raw_message });
      signals = detected.categories || [];
      console.log("🔁 /lead fallback signal detection:", signals);
    }

    console.log("🧾 /lead señales finales a procesar:", signals, "email:", email);
    const result = await crearLeadCompleto({ name, email, phone, signals, message });
    console.log("📤 /lead resultado:", JSON.stringify(result));
    return res.json(result);
  } catch (err) {
    console.log("🔥 /lead error:", err.message);
    return res.json({ ok: false, error: err.message });
  }
});

//////////////////////////////////////////////////////
// ✅ ENDPOINT PRINCIPAL
//////////////////////////////////////////////////////

app.post("/chat", async (req, res) => {
  console.log("✅ Request received:", req.body);

  const { message, name, phone } = req.body;

  let responseText = "";

  try {
    console.log("🔑 OPENAI:", process.env.OPENAI_KEY ? "OK" : "MISSING");

    const leadSignals = detectBuyingSignals(req.body);
    console.log("🧠 Lead signal detection:", leadSignals);

    //////////////////////////////////////////////////////
    // ✅ GPT RESPONSE (CON CONTEXTO)
    //////////////////////////////////////////////////////
    if (!openai) {
      console.log("⚠️ Using fallback (no OpenAI)");
      responseText = "Hi 👋 we offer 100% custom sports uniforms 🔥 How many uniforms do you need?";
    } else {
      try {
        console.log("🚀 Calling OpenAI...");

        // Preferimos el historial con roles (user/assistant) para que el GPT
        // entienda el flujo y de un seguimiento natural al estilo del agente
        // de Meta. Si no hay historial con roles, usamos el contexto plano.
        const roleMessages = getConversationMessages(req.body).slice(-10);

        const chatMessages = [{ role: "system", content: systemPrompt }];

        if (roleMessages.length > 0) {
          chatMessages.push(...roleMessages);
          // Si el ultimo mensaje del visitante aun no esta en el historial,
          // lo agregamos para no perder el turno actual.
          const last = roleMessages[roleMessages.length - 1];
          if (message && !(last.role === "user" && last.content.trim() === message.trim())) {
            chatMessages.push({ role: "user", content: message });
          }
        } else {
          const conversationContext = getConversationTexts(req.body)
            .slice(-8)
            .join("\n");
          chatMessages.push({
            role: "user",
            content: conversationContext || message || "hello"
          });
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          temperature: 0.7,
          messages: chatMessages
        });

        console.log("✅ OpenAI responded");

        responseText = response.choices[0].message.content;
      } catch (err) {
        console.log("🔥 GPT error:", err.message);
        responseText = "Hi 👋 we offer custom uniforms 🔥 How many do you need?";
      }
    }

    //////////////////////////////////////////////////////
    // ✅ ENVÍO A ZOHO SOLO SI YA TENEMOS CONTACTO
    //////////////////////////////////////////////////////
    if (leadSignals.collectContact && (name || phone)) {
      try {
        console.log("📊 Sending lead to Zoho...");
        await crearLead(name, phone, message || "Interested lead from chat");
        console.log("✅ Lead created");
      } catch (zohoError) {
        console.log("🔥 Zoho error:", zohoError.message);
      }
    }

    //////////////////////////////////////////////////////
    // ✅ RESPUESTA FINAL
    //////////////////////////////////////////////////////
    responseText += "\n\n👉 https://kavensports.com";

    console.log("✅ Sending response");

    res.json({
      response: responseText,
      reply: responseText,
      collect_contact: leadSignals.collectContact,
      lead_signals: leadSignals.categories
    });
  } catch (err) {
    console.log("🔥 GENERAL ERROR:", err.message);

    const fallbackText =
      "Hi 👋 something went wrong but we can still help you. How many uniforms do you need?";

    res.json({
      response: fallbackText,
      reply: fallbackText,
      collect_contact: false,
      lead_signals: []
    });
  }
});

//////////////////////////////////////////////////////
// ✅ SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
