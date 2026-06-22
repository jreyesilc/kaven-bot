app.post("/chat", async (req, res) => {
  const { message, name, phone } = req.body;

  let reply = "";

  try {
    // ✅ Intentar usar GPT
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
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

      reply = response.choices[0].message.content;

    } catch (gptError) {

      console.log("🔥 GPT ERROR:", gptError.message);

      // ✅ fallback SIEMPRE responde
      reply = "Hi 👋 we offer 100% custom sports uniforms 🔥 How many uniforms do you need?";
    }

    // ✅ Intentar guardar lead SIN romper server
    if (message && message.toLowerCase().includes("uniform")) {
      try {
        await crearLead(name, phone, message);
      } catch (zohoError) {
        console.log("Zoho error:", zohoError.message);
      }
    }

    // ✅ agregar link siempre
    reply += "\n\n👉 https://kavensports.com";

    res.json({ reply });

  } catch (err) {

    console.log("🔥 ERROR GENERAL:", err.message);

    res.json({
      reply: "Hi 👋 something went wrong but we can still help you. How many uniforms do you need?"
    });
  }
});
