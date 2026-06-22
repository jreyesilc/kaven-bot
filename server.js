app.post("/chat", async (req, res) => {

  console.log("✅ Request received:", req.body);

  const { message, name, phone } = req.body;

  let reply = "";

  try {

    console.log("🔑 OPENAI KEY:", process.env.OPENAI_KEY ? "OK" : "MISSING");

    // ✅ SI NO HAY OPENAI → FALLBACK
    if (!openai) {

      console.log("⚠️ OpenAI not available");

      reply = "Hi 👋 we offer 100% custom sports uniforms 🔥 How many uniforms do you need?";

    } else {

      console.log("🚀 Calling OpenAI...");

      try {

        const response = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
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

        console.log("🔥 GPT ERROR:", gptError.message);

        reply = "Hi 👋 we offer 100% custom sports uniforms 🔥 How many uniforms do you need?";
      }
    }

    // ✅ ZOHO SEGURO
    if (message && message.toLowerCase().includes("uniform")) {
      try {
        console.log("📊 Sending lead to Zoho...");
        await crearLead(name, phone, message);
        console.log("✅ Lead created");
      } catch (zohoError) {
        console.log("🔥 Zoho error:", zohoError.message);
      }
    }

    reply += "\n\n👉 https://kavensports.com";

    console.log("✅ Sending response");

    res.json({ reply });

  } catch (err) {

    console.log("🔥 ERROR GENERAL:", err.message);

    res.json({
      reply: "Hi 👋 something went wrong but we can still help. How many uniforms do you need?"
    });
  }

});
