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

async function crearLeadCompleto({ name, email, phone, signals, message }) {
  const token = await refreshZohoToken();
  if (!token) {
    return { ok: false, error: "no_token" };
  }

  // Construir etiquetas de señales válidas
  const labels = [];
  (signals || []).forEach((s) => {
    const key = (s || "").toString().trim().toLowerCase();
    if (SIGNAL_LABELS[key] && !labels.includes(SIGNAL_LABELS[key])) {
      labels.push(SIGNAL_LABELS[key]);
    }
  });

  const record = {
    Last_Name: name || "Unknown",
    Email: email || "",
    Phone: phone || "",
    Company: "Kaven Sports - Web Chat",
    Lead_Source: "Chatbot - SalesIQ",
    Description: message || "Lead from Kaven Sports chatbot",
    Layout: { id: SPORTS_LEADS_LAYOUT_ID }
  };

  if (labels.length > 0) {
    record.Se_ales_de_Compra = labels;
  }

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
      return {
        ok: true,
        id: detail.details ? detail.details.id : "",
        signals: labels
      };
    }
    return { ok: false, error: JSON.stringify(resp.data) };
  } catch (err) {
    const apiErr =
      err.response && err.response.data
        ? JSON.stringify(err.response.data)
        : err.message;
    console.log("🔥 crearLeadCompleto error:", apiErr);
    return { ok: false, error: apiErr };
  }
}

//////////////////////////////////////////////////////
// ✅ ENDPOINT /lead  (llamado por el Context Handler de SalesIQ)
//////////////////////////////////////////////////////

app.post("/lead", async (req, res) => {
  console.log("📥 /lead request:", JSON.stringify(req.body));
  try {
    let { name, email, phone, signals, message } = req.body || {};

    // signals puede llegar como array, como string CSV o como string tipo "pricing,quantity,"
    if (typeof signals === "string") {
      signals = signals.split(/[,\s]+/).filter(Boolean);
    }
    if (!Array.isArray(signals)) {
      signals = [];
    }

    const result = await crearLeadCompleto({ name, email, phone, signals, message });
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

        const conversationContext = getConversationTexts(req.body)
          .slice(-8)
          .join("\n");

        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a sales assistant for custom sports uniforms. Reply in same language as user. Keep responses concise and practical."
            },
            {
              role: "user",
              content: conversationContext || message || "hello"
            }
          ]
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
