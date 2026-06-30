const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const cors = require("cors");
const rag = require("./rag/rag");

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

⚠️ VERY IMPORTANT — PRODUCT LINES BY SPORT ⚠️

CYCLING PRODUCT LINE (3 tiers)
We offer three cycling tiers, all 100% sublimated and built with Dryfit, antibacterial, and UV-protection fabrics. The difference between them is the level of technical development, aerodynamic fit, and construction complexity:
- STANDARD: Excellent balance of comfort and durability. Ideal for regular training and recreational riders.
- ELITE: Optimized body fit and improved breathability. Built for superior performance on more demanding rides.
- PREMIERE: Our top tier, with advanced aerodynamic engineering and ultra-light materials. Designed for high-level competition.
- A standard cycling kit includes a Jersey + Bibshort, fully customized.
- For detailed cuts and options, you can share our cycling catalog: https://www.kavensports.com/files/info/Catalogo_Ciclismo.pdf

SOCCER / FÚTBOL PRODUCT LINE (single premium quality)
For soccer we offer ONE premium quality level (no Standard/Elite/Premier tiers). All soccer uniforms are fully sublimated with Dryfit, antibacterial, and UV-protection fabrics. Products include:
- Jersey (cuello redondo / round neck OR cuello V / V-neck)
- Shorts
- Medias / Socks
- Kit completo / Full kit (jersey + shorts + socks)
When a customer asks about soccer uniforms, recommend these products and explain they are all premium quality, 100% custom. Do NOT mention cycling tiers.

OTHER TEAM SPORTS (baseball, softball, basketball, football, volleyball, track & field, padel)
For all other team sports, we offer ONE premium quality level (no tiers). All uniforms are fully sublimated with Dryfit, antibacterial, and UV-protection fabrics, 100% custom to the team's design. We do not yet have a detailed catalog for these sports, but we manufacture jerseys, pants, shorts, and full kits for each sport. When a customer asks about these sports, focus on our custom capabilities and premium quality, and offer to connect them with the team for specific product options.

KEY SELLING POINTS (mention naturally when relevant)
- No minimum order — perfect for a single player, a sample piece, or a full organization.
- Unlimited FREE custom designs with expert designers — we can work from the customer's own design or create one for them.
- Fast production: typically delivered in about 1-3 weeks (design + shipping included).
- Proudly made in San Diego, USA.
- 100% satisfaction guarantee.

YOUR ROLE & GOALS
- Help teams, coaches, and players find the perfect custom uniforms for their sport.
- Understand their needs (sport, quantity, colors, logos, timeline, design status) and recommend the right products. For cycling specifically, help them choose between our three tiers (Standard/Elite/Premiere). For other sports, focus on our premium custom quality.
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
- If the customer says they have to step away, got busy, or left unexpectedly (e.g. "salí de imprevisto"): reassure them warmly — "¡Hola, [nombre]! No te preocupes, entiendo perfectamente. Aquí sigo para cuando estés listo. 😊" Then gently offer a helpful next step based on their sport (for cycling: help choose tier; for others: clarify product needs or prepare quote), OR ask if there's any other doubt you can help with.
- If the customer wants to postpone or continue later (e.g. "mañana le damos seguimiento"): agree graciously with zero pressure — "¡Claro que sí, Eligio! Entendido perfectamente. Aquí estaré pendiente para cuando estés listo mañana para continuar. ¡Que tengas una excelente tarde y nos leemos pronto! 😊"
- When the customer thanks you or says goodbye (e.g. "Gracias, buena tarde"): warmly thank them back, wish them well, and confirm you'll be available whenever they want to resume — "¡Gracias a ti, Eligio! Que tengas una excelente tarde. Aquí estaré pendiente para cuando gustes retomar el tema. ¡Hasta pronto! 😊"
- Always address the customer by name, validate what they said, and keep your replies short and human in these moments.
- When the moment is right and the customer is engaged, gently move the lead forward. For cycling customers, offer to help pick the right tier (Standard/Elite/Premiere). For other sports, offer to prepare a personalized quote with product recommendations. Always as a helpful suggestion, never as a push.
- Respect the customer's pace above all: a warm, patient, "I'm here whenever you're ready" attitude is what wins the sale.

These follow-up examples are in Spanish because that's the customer's language; when the customer writes in English, deliver the exact same warm, patient, no-pressure tone in natural English.

LANGUAGE
- Bilingual: always reply in the SAME language the user writes in (English or Spanish). Match their tone and wording naturally.

CYCLING LANDING – PRODUCT QUOTE FLOW (botones "Get a quote")
On our cycling catalog page, each product has a "Get a quote" button that opens THIS chat with a first message like "Quiero cotizar: <product>" (e.g. "Quiero cotizar: Elite Jersey"). The six products are: Standard Jersey, Elite Jersey, Premier Jersey, Standard Bib Short, Elite Bib Short, Premier Bib Short. When you receive such a message:
1. Acknowledge the SPECIFIC product they clicked by name, warmly (e.g. "¡Excelente elección! El Elite Jersey es uno de nuestros favoritos 🚴").
2. Ask if they would like to ADD another product to their formal quote (e.g. "¿Te gustaría agregar algún otro producto a tu cotización formal? Por ejemplo un bib short a juego, o varios modelos. Si solo quieres este, dímelo y seguimos.").
3. After they confirm which products they want (one or several), continue with the standard qualifying questionnaire to prepare the formal quote: for how many people is the order, by when they need the uniforms, and whether they already have a design or need help. Then collect their email, full name and phone so the team can send the personalized quote.
Note: normally a structured form handles steps 2-3 automatically; only run this conversationally if the structured form is not shown. Always keep the exact product name(s) the customer mentioned so they appear in the quote.

LEARNINGS FROM REAL CUSTOMER CONVERSATIONS (apply these patterns — they reflect how our best chats convert)
1. "CATALOG vs CUSTOM" QUESTION: Customers very often ask something like "¿tienen catálogo / modelos ya hechos, o todo es personalizado?" ("do you have a ready catalog or is everything custom?"). Answer warmly that EVERYTHING is 100% custom-made to order — there is no pre-made stock. Explain this is our strength: they choose colors, design, names, numbers and logos with no extra cost. For cycling you can share the catalog link as a STYLE/CUT reference (not as ready-made stock). Never make them feel that "custom" is a limitation — frame it as total freedom.
2. SINGLE-PIECE & SAMPLE ORDERS ARE COMMON: Many real customers order just ONE piece (e.g. a single jersey) before committing to a team order. Always react positively and reassure them there is NO minimum order, so a single custom piece is perfectly fine — it's a great way to check our quality first-hand.
3. MOST CUSTOMERS NEED DESIGN HELP: In the lead forms the most common answer is "necesito ayuda para crearlo" (they need help creating the design). Proactively offer our FREE professional design service and make it feel easy and exciting. Distinguish clearly between a DESIGN (the full look/layout of the uniform) and a LOGO (just their team or sponsor mark): if it's unclear, gently ask whether they already have a finished design, only a logo, or need us to create everything from scratch. This avoids confusion seen in past chats.
4. HELPING CUSTOMERS CHOOSE THE RIGHT PRODUCT: Most leads are small groups (1–5 people) who need uniforms within the next few weeks and need design help. When a CYCLING customer is unsure which option fits, explain the three tiers consultatively (Standard/Elite/Premiere) and offer to help them pick the best one for their use (training vs competition) before preparing the quote. For SOCCER and OTHER SPORTS, there are no tiers — we offer one premium quality level, so focus on helping them choose the right products (jersey, shorts, socks, full kit, etc.) and customization options. Never mention cycling tiers when discussing non-cycling sports.
5. RE-ENGAGEMENT AFTER SILENCE (often while waiting for a design): If a customer went quiet after we promised a design or quote, reconnect warmly with zero pressure: briefly apologize for any delay, confirm we're still here for them, and offer a concrete next step to resume (finish the design, pick options, or send the quote). Example: "¡Hola, [nombre]! Una disculpa por la demora. Aquí seguimos para ayudarte a terminar tu diseño y avanzar con tu cotización cuando gustes. 😊"
6. LOCATION BY LANGUAGE: If a customer asks where we are located, answer based on the conversation language. For SPANISH conversations: mention presence in Baja California and Ciudad de Mexico. For ENGLISH conversations: mention San Diego. NEVER give an exact street address, number or postal code in any language — if they need logistics details, offer to coordinate through the formal quote or team member.

GUIDELINES
- For exact pricing, gather the customer's needs (sport, products, quantity, design details) and offer a personalized formal quote from the team. For cycling, also ask about preferred tier (Standard/Elite/Premiere) since final cost depends on it. For other sports, pricing depends on the specific products and design complexity.
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

// 🛡️ Caché en memoria de leads creados recientemente (clave = email determinista).
// Cubre la ventana en la que la busqueda de Zoho CRM aun no indexa el lead
// recien creado (~segundos a 1 min). Evita duplicados por envios rapidos.
const _recentLeads = new Map(); // email -> { id, ts }
const RECENT_LEAD_TTL_MS = 10 * 60 * 1000; // 10 minutos
function _recordRecentLead(email, id) {
  if (!email) return;
  _recentLeads.set(email, { id, ts: Date.now() });
}
function _getRecentLead(email) {
  if (!email) return null;
  const entry = _recentLeads.get(email);
  if (!entry) return null;
  if (Date.now() - entry.ts > RECENT_LEAD_TTL_MS) {
    _recentLeads.delete(email);
    return null;
  }
  return entry;
}

async function crearLeadCompleto({ name, email, phone, signals, message, uniforme }) {
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
  //
  // IMPORTANTE: el bot (Context Handler v14) ya NO envia email; solo envia
  // el telefono. Por eso derivamos aqui el email DETERMINISTA a partir del
  // telefono (lead-<digitos>@kavensports.com) ANTES de buscar duplicados.
  // Si la dedup se hiciera con el 'email' crudo (vacio) se omitiria y se
  // crearia un duplicado en cada envio.
  //////////////////////////////////////////////////////
  const phoneClean = (phone || "").toString().trim().replace(/[^0-9]/g, "");
  const emailFinal = email && email.trim()
    ? email.trim()
    : (phoneClean ? `lead-${phoneClean}@kavensports.com` : `lead-${Date.now()}@kavensports.com`);

  // 1) Chequeo rapido en cache (cubre la latencia de indexacion de Zoho)
  const cached = _getRecentLead(emailFinal);
  if (cached && cached.id) {
    console.log(`♻️ crearLeadCompleto: duplicado por cache para ${emailFinal} -> ${cached.id}`);
    return { ok: true, id: cached.id, duplicate: true, cached: true };
  }

  // 2) Chequeo en Zoho CRM por email exacto
  const existing = await buscarLeadPorEmail(token, emailFinal);
  if (existing && existing.id) {
    _recordRecentLead(emailFinal, existing.id);
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

  // ✅ FORMULARIO CORTO v13: Email puede ser opcional en el bot.
  // phoneClean / emailFinal ya se calcularon arriba (antes de la dedup).
  const record = {
    First_Name: firstName,
    Last_Name: lastName || firstName,
    Contact_Name: fullName,
    Email: emailFinal,
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

  // Campo personalizado OPCIONAL: "Tipo de uniforme" / productos de interés.
  // Los productos YA quedan guardados en Description (garantizado), asi que
  // este intento es solo un "extra": si el api_name no existe en el layout o
  // el valor no es valido, lo soltamos sin romper la creacion del lead.
  // droppableFields lista los campos custom que se pueden eliminar con
  // seguridad ante un INVALID_DATA.
  const droppableFields = {};
  if (uniforme) {
    record.Tipo_de_uniforme = uniforme;
    droppableFields["Tipo_de_uniforme"] = true;
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

    // Campo custom opcional invalido o inexistente (p.ej. Tipo_de_uniforme):
    // simplemente lo eliminamos y reintentamos. El dato ya vive en Description,
    // por lo que no se pierde informacion.
    if (
      detail.code === "INVALID_DATA" &&
      detail.details.api_name &&
      droppableFields[detail.details.api_name] &&
      record.hasOwnProperty(detail.details.api_name)
    ) {
      delete record[detail.details.api_name];
      delete droppableFields[detail.details.api_name];
      console.log("⚠️ Campo opcional " + detail.details.api_name + " INVALID_DATA -> eliminado (dato ya en Description), reintentando");
      return true;
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
        _recordRecentLead(emailFinal, newId);
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
// ✅ META LEAD CONTEXT STORE (v18 - handoff sin preguntas duplicadas)
//////////////////////////////////////////////////////
//
// PROBLEMA QUE RESUELVE:
// Los campos personalizados inyectados en SalesIQ con
// $zoho.salesiq.visitor.info({...}) (p.ej. "kvn_meta") NO llegan de forma
// confiable al handler Deluge del Zobot. Solo llegan los campos estandar
// (name, email, phone). Por eso el mecanismo v17 (leer "kvn_meta" desde el
// objeto visitor) nunca se disparaba y el bot caia al flujo generico v16,
// re-preguntando todo.
//
// SOLUCION v18 (mediada por backend):
//   1. El script de la landing  meta-lead-context.js  hace POST /meta-context
//      con TODO el contexto de Meta (name, phone, email, sport, quantity,
//      date, design, lead_id, campaign, lang).
//   2. El backend lo guarda en memoria, indexado por TELEFONO normalizado y
//      por NOMBRE normalizado (TTL ~24h).
//   3. El handler Deluge, en cada mensaje, lee  visitor.get("name") /
//      visitor.get("phone")  (campos estandar que SI llegan) y hace
//      GET /meta-context?name=..&phone=..  para recuperar el contexto.
//      Si lo encuentra -> saludo personalizado, sin formulario, lead unico.
//
// Es un Map en memoria del proceso Node (persistente en Render mientras el
// servicio este vivo). Si el proceso reinicia se pierde, pero el lead de Meta
// vuelve a entrar a la landing con sus parametros en la URL y se re-registra.
//////////////////////////////////////////////////////

const META_CONTEXT_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const metaContextStore = new Map(); // key -> { data, expiresAt }

function normalizePhone(phone) {
  if (!phone) return "";
  // Solo digitos; nos quedamos con los ultimos 10 para tolerar prefijos de pais
  const digits = ("" + phone).replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function normalizeName(name) {
  if (!name) return "";
  return ("" + name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/\s+/g, " ")
    .trim();
}

function metaStoreSet(data) {
  const expiresAt = Date.now() + META_CONTEXT_TTL_MS;
  const entry = { data, expiresAt };
  const phoneKey = normalizePhone(data.phone);
  const nameKey = normalizeName(data.name);
  if (phoneKey) metaContextStore.set("p:" + phoneKey, entry);
  if (nameKey) metaContextStore.set("n:" + nameKey, entry);
  // Limpieza oportunista de entradas vencidas
  const now = Date.now();
  for (const [k, v] of metaContextStore) {
    if (v.expiresAt < now) metaContextStore.delete(k);
  }
}

function metaStoreGet({ phone, name }) {
  const now = Date.now();
  const phoneKey = normalizePhone(phone);
  const nameKey = normalizeName(name);
  let entry = null;
  if (phoneKey && metaContextStore.has("p:" + phoneKey)) {
    entry = metaContextStore.get("p:" + phoneKey);
  } else if (nameKey && metaContextStore.has("n:" + nameKey)) {
    entry = metaContextStore.get("n:" + nameKey);
  }
  if (!entry) return null;
  if (entry.expiresAt < now) return null;
  return entry.data;
}

// Guardar el contexto de un lead de Meta (lo llama la landing al cargar)
// Meta NO sustituye tokens de plantilla como {{full_name}} o
// {{custom_question_1}} en URLs de sitios externos: llegan literales. Esta
// funcion elimina cualquier token sin sustituir para que NUNCA se almacene
// ni se propague "{{...}}" hacia el saludo del bot.
function stripMetaTemplateTokens(v) {
  if (v === null || v === undefined) return "";
  let s = ("" + v).trim();
  if (s.indexOf("{{") >= 0 && s.indexOf("}}") >= 0) {
    s = s.replace(/\{\{[^}]*\}\}/g, " ").replace(/\s+/g, " ").trim();
  }
  return s;
}

app.post("/meta-context", (req, res) => {
  try {
    const b = req.body || {};
    const data = {
      name: stripMetaTemplateTokens(b.name),
      phone: stripMetaTemplateTokens(b.phone),
      email: stripMetaTemplateTokens(b.email),
      sport: stripMetaTemplateTokens(b.sport),
      quantity: stripMetaTemplateTokens(b.quantity),
      date: stripMetaTemplateTokens(b.date),
      design: stripMetaTemplateTokens(b.design),
      lead_id: stripMetaTemplateTokens(b.lead_id),
      campaign: stripMetaTemplateTokens(b.campaign),
      lang: b.lang || "es",
      savedAt: new Date().toISOString()
    };
    // Tras limpiar tokens, si no quedan datos utiles (ni nombre ni telefono
    // reales), NO guardamos contexto: el bot usara su flujo normal en lugar
    // de saludar con datos vacios/rotos.
    if (!data.name && !data.phone) {
      return res.json({ ok: false, error: "missing_name_and_phone" });
    }
    metaStoreSet(data);
    console.log("📥 /meta-context guardado:", JSON.stringify(data));
    return res.json({ ok: true });
  } catch (err) {
    console.log("🔥 /meta-context error:", err.message);
    return res.json({ ok: false, error: err.message });
  }
});

// Recuperar el contexto de un lead de Meta (lo llama el handler Deluge)
app.get("/meta-context", (req, res) => {
  try {
    const phone = (req.query && req.query.phone) || "";
    const name = (req.query && req.query.name) || "";
    const data = metaStoreGet({ phone, name });
    if (!data) {
      return res.json({ ok: true, isMeta: false });
    }
    return res.json({ ok: true, isMeta: true, context: data });
  } catch (err) {
    console.log("🔥 GET /meta-context error:", err.message);
    return res.json({ ok: false, isMeta: false, error: err.message });
  }
});

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

app.post("/lead", (req, res) => {
  console.log("📥 /lead request:", JSON.stringify(req.body));

  // =====================================================================
  // FIX FREEZE (causa raíz del congelamiento del bot de SalesIQ):
  // El Context Handler de SalesIQ tiene un LÍMITE DE TIEMPO DE EJECUCIÓN
  // muy corto para su script. La creación del lead aquí hace VARIAS
  // llamadas SECUENCIALES a la API de Zoho CRM (refresh token + búsqueda
  // de duplicados + creación/actualización), que en conjunto tardaban lo
  // suficiente como para que SalesIQ MATARA el script del handler antes de
  // recibir la respuesta del invokeurl. Como el handler nunca devolvía una
  // respuesta, el bot quedaba en "escribiendo..." para siempre tras enviar
  // el formulario de WhatsApp.
  //
  // SOLUCIÓN: respondemos al instante (ok:true) y creamos el lead en
  // SEGUNDO PLANO (fire-and-forget). Así el invokeurl del handler regresa
  // en <1s, el handler termina y muestra el mensaje de confirmación. La
  // creación real del lead continúa en el servidor (proceso Node
  // persistente en Render) y la deduplicación por email evita duplicados.
  // El cliente puede pasar ?sync=1 para forzar el comportamiento síncrono
  // (útil para pruebas con curl).
  // =====================================================================
  const sync = req.query && (req.query.sync === "1" || req.query.sync === "true");

  const procesar = async () => {
    let { name, email, phone, signals, buying_signals, message, raw_message, quantity, deadline, design, products } = req.body || {};

    // ✅ Productos seleccionados desde la landing de ciclismo
    //    (botones "Get a quote" -> bot). Puede llegar como array o como
    //    string separado por comas. Se normaliza a texto.
    let productosTexto = "";
    if (Array.isArray(products)) {
      productosTexto = products.filter(Boolean).join(", ");
    } else if (typeof products === "string") {
      productosTexto = products.trim();
    }

    // ✅ Campos del formulario estilo anuncio de ciclismo (Meta):
    //    cantidad, fecha de entrega y estado del diseño.
    //    Se incorporan a la Description para guardarlos en el CRM
    //    sin requerir campos personalizados nuevos.
    const detallesFormulario = [];
    if (productosTexto) detallesFormulario.push("Productos de interés: " + productosTexto);
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
    const result = await crearLeadCompleto({ name, email, phone, signals, message, uniforme: productosTexto });
    console.log("📤 /lead resultado:", JSON.stringify(result));
    return result;
  };

  if (sync) {
    // Modo síncrono (pruebas): esperamos el resultado real.
    procesar()
      .then((result) => res.json(result))
      .catch((err) => {
        console.log("🔥 /lead error (sync):", err.message);
        res.json({ ok: false, error: err.message });
      });
    return;
  }

  // Modo normal (bot): responder de inmediato para no exceder el límite de
  // tiempo del Context Handler de SalesIQ.
  res.json({ ok: true, queued: true });

  // Crear el lead en segundo plano (no bloquea la respuesta).
  procesar().catch((err) => {
    console.log("🔥 /lead error (async):", err.message);
  });
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

        // ✅ RAG: busca conversaciones reales parecidas y las inyecta en el prompt
        // para que el bot responda siguiendo patrones que ya funcionaron.
        let ragBlock = "";
        try {
          const ragQuery =
            message ||
            (roleMessages.length > 0
              ? roleMessages[roleMessages.length - 1].content
              : "");
          if (ragQuery && ragQuery.trim()) {
            const lang = rag.detectLang(ragQuery);
            const results = await rag.retrieve(ragQuery, { topK: 3, lang });
            ragBlock = rag.buildContextBlock(results);
            if (results.length > 0) {
              console.log(
                `🔎 RAG: ${results.length} ejemplos inyectados (top score ${results[0].score.toFixed(2)})`
              );
            }
          }
        } catch (ragErr) {
          console.log("⚠️ RAG retrieve error (continuo sin RAG):", ragErr.message);
        }

        const chatMessages = [
          { role: "system", content: systemPrompt + ragBlock }
        ];

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
// ✅ RAG ADMIN — el bot "aprende" de nuevas conversaciones
//////////////////////////////////////////////////////

// 🔌 Endpoint ligero para el bot v14 de SalesIQ (que llama a OpenAI nativo).
// Recibe el mensaje del cliente y devuelve SOLO el bloque de ejemplos
// relevantes para que el handler Deluge lo concatene a su system prompt.
// Así el bot sigue llamando a OpenAI directo, pero "aprende" de las
// conversaciones reales sin reescribir su lógica.
app.post("/rag/context", async (req, res) => {
  try {
    const { message, lang } = req.body || {};
    if (!message || !message.trim()) {
      return res.json({ ok: true, context: "", count: 0 });
    }
    const useLang = lang || rag.detectLang(message);
    const results = await rag.retrieve(message, { topK: 3, lang: useLang });
    res.json({
      ok: true,
      lang: useLang,
      count: results.length,
      context: rag.buildContextBlock(results)
    });
  } catch (err) {
    // Nunca rompemos el flujo del bot: si falla, devolvemos contexto vacío.
    res.json({ ok: false, context: "", count: 0, error: err.message });
  }
});

// Estado / estadisticas de la base de conocimiento
app.get("/rag/stats", (req, res) => {
  try {
    res.json({ ok: true, stats: rag.getStats() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Probar que recupera el RAG para una consulta (debug)
app.post("/rag/search", async (req, res) => {
  try {
    const { query, lang, topK } = req.body || {};
    if (!query) return res.status(400).json({ ok: false, error: "Falta 'query'" });
    const results = await rag.retrieve(query, { lang, topK: topK || 3 });
    res.json({
      ok: true,
      results: results.map((r) => ({
        id: r.entry.id,
        score: Number(r.score.toFixed(3)),
        user: r.entry.user,
        assistant: r.entry.assistant,
        lang: r.entry.lang,
        sport: r.entry.sport
      }))
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Enseñar un nuevo ejemplo (conversacion exitosa) a la base de conocimiento.
// Protegido con un token simple via header 'x-rag-token' (env RAG_ADMIN_TOKEN).
app.post("/rag/learn", async (req, res) => {
  try {
    const required = process.env.RAG_ADMIN_TOKEN;
    if (required && req.get("x-rag-token") !== required) {
      return res.status(401).json({ ok: false, error: "No autorizado" });
    }
    const { user, assistant, lang, sport, tags, note, outcome } = req.body || {};
    if (!user || !assistant) {
      return res
        .status(400)
        .json({ ok: false, error: "Se requieren 'user' y 'assistant'" });
    }
    const result = await rag.learnExample({
      user,
      assistant,
      lang,
      sport,
      tags,
      note,
      outcome
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

//////////////////////////////////////////////////////
// ✅ SERVER
//////////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  // Inicializa el RAG (indexa la base de conocimiento con embeddings).
  // No bloquea el arranque: si falla, el bot sigue funcionando sin RAG.
  rag
    .initRAG(openai)
    .catch((err) => console.log("🔥 RAG init error:", err.message));
});
