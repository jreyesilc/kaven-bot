const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

async function refreshZohoToken() {
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
}

async function crearLead(name, phone, message) {
  const token = await refreshZohoToken();

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
}

app.post("/chat", async (req, res) => {
  const { message, name, phone } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content: "You are a sales assistant for custom sports uniforms. Answer in the same language."
      },
      { role: "user", content: message }
    ]
  });

  let reply = response.choices[0].message.content;

  if (message.toLowerCase().includes("uniform")) {
    await crearLead(name, phone, message);
  }

  reply += "\n\n👉 https://kavensports.com";

  res.json({ reply });
});

app.listen(3000, () => {
  console.log("Server running");
});
