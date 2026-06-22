app.post("/chat", async (req, res) => {

  // ✅ LOG PRINCIPAL (IMPORTANTE)
  console.log("✅ Request received:", req.body);

  const { message, name, phone } = req.body;

  let reply = "";

  try {

    // ✅ CONFIRMAR QUE EXISTE LA API KEY
    console.log("🔑 OPENAI KEY:", process.env.OPENAI_KEY);

    // ✅ AVISO DE INICIO DE LLAMADA
    console.log("🚀 Calling OpenAI...");

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini", // 🔥 más estable para pruebas
        messages: [
          {
            role: "system",
            content: "You are a sales assistant for custom sports uniforms."
          },
          {
            role: "user",
            content: message || "hello"
          }
        ]
      });

      console.log("✅ OpenAI responded");

      reply = response.choices[0].message.content;

    } catch (gptError) {

      console.log("🔥 GPT ERROR FULL:", gptError);

      // ✅ fallback SIEMPRE responde (CRÍTICO)
      reply = "Hi 👋 we offer 100% custom sports uniforms 🔥 How many uniforms do you need?";
    }

    // ✅ PROTEGER ZOHO
    if (message && message.toLowerCase().includes("uniform")) {
      try {
        console.log("📊 Sending lead to Zoho...");
        await crearLead(name, phone, message);
        console.log("✅ Lead sent to Zoho");
      } catch (zohoError) {
        console.log("🔥 ZOHO ERROR:", zohoError);
      }
    }

    // ✅ RESPUESTA FINAL
    reply += "\n\n👉 https://kavensports.com";

    console.log("✅ Sending response to user");

    res.json({ reply });

  } catch (err) {

    console.log("🔥 ERROR GENERAL:", err);

    res.json({
      reply: "Hi 👋 something went wrong but we can still help you. How many uniforms do you need?"
    });
  }
});
