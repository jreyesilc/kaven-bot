// Test del modo Postgres real del RAG.
// Requiere DATABASE_URL apuntando a un Postgres accesible.
// Valida: seed automático, embeddings persistidos, learn permanente,
// y que tras "reiniciar" (re-init) NO se recalculan embeddings.

const rag = require("./rag");
const db = require("./db");

function fakeEmbed(text) {
  const vocab = [
    "catalogo","catalog","personalizado","custom","jersey","pieza","single",
    "minimo","minimum","diseno","design","logo","precio","price","ubicados",
    "located","where","donde","futbol","soccer","ciclismo","cycling","baseball"
  ];
  const t = String(text).toLowerCase();
  const vec = vocab.map((w) => (t.includes(w) ? 1 : 0));
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

let embedCalls = 0;
const mockOpenAI = {
  embeddings: {
    create: async ({ input }) => {
      embedCalls++;
      return { data: [{ embedding: fakeEmbed(input) }] };
    }
  }
};

(async () => {
  console.log("=== TEST POSTGRES MODE ===");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "(set)" : "(MISSING!)");

  // Limpieza previa: borrar tabla para empezar de cero
  await db.initDB();
  if (db.getMode() !== "pg") {
    console.log("❌ No se conectó a Postgres. Abortando test.");
    process.exit(1);
  }

  // 1) Primer arranque: debe sembrar desde knowledge_base.json y embeber todo
  console.log("\n--- Arranque 1 (seed + embed) ---");
  embedCalls = 0;
  await rag.initRAG(mockOpenAI);
  const stats1 = rag.getStats();
  console.log("Stats:", JSON.stringify(stats1));
  console.log("Embeddings calculados en arranque 1:", embedCalls, "(esperado = total de ejemplos)");

  // 2) Recuperación funciona
  const r = await rag.retrieve("tienen catalogo o todo personalizado?", { lang: "es", topK: 2, minScore: 0.05 });
  console.log("Retrieve catalogo ->", r.map((x) => `${x.entry.id}[${x.score.toFixed(2)}]`).join(", "));

  // 3) Aprender un ejemplo nuevo (debe persistir en BD)
  console.log("\n--- Learn (persistente) ---");
  const learned = await rag.learnExample({
    lang: "es", sport: "baseball", tags: ["baseball","jersey"],
    user: "Hacen uniformes de baseball?",
    assistant: "¡Sí! Baseball premium 100% sublimado, totalmente personalizado.",
    note: "Baseball premium.", outcome: "positivo", source: "auto"
  });
  console.log("Aprendido:", JSON.stringify(learned));

  // 4) Simular REINICIO: re-init. Los embeddings ya están en BD,
  //    por lo que NO deben recalcularse (embedCalls de init = 0).
  console.log("\n--- Arranque 2 (simula reinicio de Render) ---");
  embedCalls = 0;
  await rag.initRAG(mockOpenAI);
  const reinitEmbedCalls = embedCalls; // capturar ANTES del retrieve (que también embebe la query)
  const stats2 = rag.getStats();
  console.log("Stats tras reinicio:", JSON.stringify(stats2));
  console.log("Embeddings recalculados en arranque 2:", reinitEmbedCalls, "(esperado 0 = persistencia OK)");

  // 5) El ejemplo aprendido debe seguir ahí tras el reinicio
  const r2 = await rag.retrieve("quiero uniformes de baseball", { lang: "es", topK: 1, minScore: 0.05 });
  console.log("Baseball sigue tras reinicio:", r2.length > 0 ? "✅ " + r2[0].entry.id : "❌ NO");

  // Validaciones finales
  console.log("\n=== RESULTADO ===");
  const ok =
    db.getMode() === "pg" &&
    stats2.total === stats1.total + 1 &&
    reinitEmbedCalls === 0 &&
    r2.length > 0;
  console.log(ok ? "✅ POSTGRES PERSISTENCIA OK" : "❌ FALLO EN ALGUNA VALIDACIÓN");

  await db.close();
  process.exit(ok ? 0 : 1);
})();
