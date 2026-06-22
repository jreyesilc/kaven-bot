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
// ✅ ENDPOINT PRINCIPAL
//////////////////////////////////////////////////////

app.post("/chat", async (req, res) => {

  console.log("✅ Request received:", req.body);

  const { message, name, phone } = req.body;

  let reply = "";

  try {

    console.log("🔑 OPENAI:", process.env.OPENAI_KEY ? "OK" : "MISSING");

    //////////////////////////////////////////////////////
    // ✅ GPT RESPONSE
    //////////////////////////////////////////////////////
    if (!openai) {

      console.log("⚠️ Using fallback (no OpenAI)");

      reply = "Hi 👋 we offer 100% custom sports uniforms 🔥 How many uniforms do you need?";

    } else {

      try {

        console.log("🚀 Calling OpenAI...");

        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: "You are a sales assistant for custom sports uniforms. Reply in same language as user."
            },
            {
              role: "user",
              content: message || "hello"
            }
          ]
        });

        console.log("✅ OpenAI responded");

        reply = response.choices[0].message.content;

      } catch (err) {

        console.log("🔥 GPT error:", err.message);

        reply = "Hi 👋 we offer custom uniforms 🔥 How many do you need?";
      }
    }

    //////////////////////////////////////////////////////
    // ✅ DETECCIÓN INTELIGENTE DE LEADS
    //////////////////////////////////////////////////////
    if (
      message &&
      /uniform|price|quote|order|custom|cotizar|precio|uniforme/i.test(message)
    ) {
      try {
        console.log("📊 Sending lead to Zoho...");
        await crearLead(name, phone, message);
        console.log("✅ Lead created");
      } catch (zohoError) {
        console.log("🔥 Zoho error:", zohoError.message);
      }
    }

    //////////////////////////////////////////////////////
    // ✅ RESPUESTA FINAL
    //////////////////////////////////////////////////////
    reply += "\n\n👉 https://kavensports.com";

    console.log("✅ Sending response");

    res.json({ reply });

  } catch (err) {

    console.log("🔥 GENERAL ERROR:", err.message);

    res.json({
      reply: "Hi 👋 something went wrong but we can still help you. How many uniforms do you need?"
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
