// Test local del RAG con un cliente de embeddings SIMULADO (determinístico).
// Esto valida la lógica de recuperación/caché/aprendizaje sin necesitar la
// OPENAI_KEY real. En producción (Render) se usa el cliente real de OpenAI.

const rag = require("./rag");

// Embedding falso pero determinístico: vector bag-of-words sobre un vocabulario
// fijo, normalizado. Palabras compartidas => mayor similitud coseno.
function fakeEmbed(text) {
  const vocab = [
    "catalogo", "catalog", "personalizado", "custom", "modelos", "ready",
    "jersey", "pieza", "single", "minimo", "minimum", "diseno", "design",
    "logo", "gama", "tier", "standard", "elite", "premiere", "precio",
    "price", "cuanto", "cost", "ubicados", "located", "donde", "where",
    "futbol", "soccer", "ciclismo", "cycling", "uniforme", "uniform",
    "color", "equipo", "team", "silencio", "demora"
  ];
  const t = String(text).toLowerCase();
  const vec = vocab.map((w) => (t.includes(w) ? 1 : 0));
  // añade algo de ruido estable por longitud para evitar vectores cero
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

const mockOpenAI = {
  embeddings: {
    create: async ({ input }) => ({ data: [{ embedding: fakeEmbed(input) }] })
  }
};

(async () => {
  console.log("=== INIT RAG (mock embeddings) ===");
  await rag.initRAG(mockOpenAI);
  console.log("Stats:", JSON.stringify(rag.getStats()));

  const queries = [
    { q: "tienen catalogo ya hecho o todo es personalizado?", lang: "es" },
    { q: "can I order a single jersey, is there a minimum?", lang: "en" },
    { q: "no tengo diseno solo el logo de mi equipo", lang: "es" },
    { q: "cuanto cuesta un kit?", lang: "es" },
    { q: "where are you located?", lang: "en" },
    { q: "hacen uniformes de futbol?", lang: "es" }
  ];

  for (const { q, lang } of queries) {
    const results = await rag.retrieve(q, { lang, topK: 2, minScore: 0.05 });
    console.log(`\n🔎 Query (${lang}): "${q}"`);
    if (results.length === 0) {
      console.log("   (sin coincidencias)");
    } else {
      results.forEach((r) =>
        console.log(`   -> ${r.entry.id} [${r.score.toFixed(2)}] ${r.entry.tags.join(",")}`)
      );
    }
  }

  console.log("\n=== TEST APRENDIZAJE (learnExample) ===");
  const before = rag.getStats().total;
  const learned = await rag.learnExample({
    lang: "es",
    sport: "baseball",
    tags: ["baseball", "jersey", "equipo"],
    user: "Hacen uniformes de baseball para mi equipo?",
    assistant: "¡Sí! Para baseball manejamos calidad premium 100% sublimada, totalmente personalizada. ¿Para cuántos jugadores sería?",
    note: "Baseball: calidad unica premium, no gamas de ciclismo.",
    outcome: "positivo"
  });
  console.log("Aprendido:", JSON.stringify(learned));
  const after = rag.getStats().total;
  console.log(`KB: ${before} -> ${after} (esperado +1)`);

  // Verificar que ahora se recupera el nuevo ejemplo
  const r2 = await rag.retrieve("quiero uniformes de baseball", { lang: "es", topK: 1, minScore: 0.05 });
  console.log("Recupera baseball:", r2.length > 0 ? r2[0].entry.id : "NO");

  // Limpiar: quitar el ejemplo de prueba del JSON para no contaminar la KB real
  const fs = require("fs");
  const path = require("path");
  const KB_PATH = path.join(__dirname, "knowledge_base.json");
  const CACHE_PATH = path.join(__dirname, "embeddings_cache.json");
  const kb = JSON.parse(fs.readFileSync(KB_PATH, "utf-8")).filter((e) => e.sport !== "baseball");
  fs.writeFileSync(KB_PATH, JSON.stringify(kb, null, 2));
  if (fs.existsSync(CACHE_PATH)) fs.unlinkSync(CACHE_PATH); // limpiar cache de prueba
  console.log("\n🧹 Limpieza: ejemplo de prueba removido y cache de prueba borrado.");
  console.log("\n✅ TEST COMPLETO");
})();
