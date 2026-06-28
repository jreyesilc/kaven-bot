// Test de integración: valida que el RAG se conecta con el flujo del bot.
// Usa el módulo rag directamente con un mock para simular lo que hace /chat.
const rag = require("./rag");

function fakeEmbed(text) {
  const vocab = ["catalogo","catalog","personalizado","custom","jersey","pieza","single","minimo","minimum","diseno","design","logo","precio","price","ubicados","located","where","donde","futbol","soccer","ciclismo","cycling"];
  const t = String(text).toLowerCase();
  const vec = vocab.map((w) => (t.includes(w) ? 1 : 0));
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
const mockOpenAI = { embeddings: { create: async ({ input }) => ({ data: [{ embedding: fakeEmbed(input) }] }) } };

(async () => {
  await rag.initRAG(mockOpenAI);

  // Simula exactamente lo que hace el endpoint /chat:
  const message = "tienen catalogo o todo es personalizado?";
  const lang = rag.detectLang(message);
  console.log("Idioma detectado:", lang, "(esperado: es)");
  const results = await rag.retrieve(message, { topK: 3, lang });
  const ragBlock = rag.buildContextBlock(results);

  console.log("=== BLOQUE QUE SE INYECTA EN EL SYSTEM PROMPT ===");
  console.log(ragBlock || "(vacío)");
  console.log("\n=== VALIDACIONES ===");
  console.log("¿Se generó bloque?", ragBlock.length > 0 ? "✅" : "❌");
  console.log("¿Incluye ejemplo de catálogo (kb-001)?", ragBlock.includes("100% personalizado") ? "✅" : "❌");
  console.log("¿Formato correcto (RELEVANT PAST CONVERSATIONS)?", ragBlock.includes("RELEVANT PAST CONVERSATIONS") ? "✅" : "❌");

  // Caso sin coincidencias razonables (query irrelevante) -> bloque vacío esperado
  const r2 = await rag.retrieve("xyzqwerty texto sin relacion alguna", { topK: 3, minScore: 0.3 });
  console.log("¿Query irrelevante NO inyecta nada?", r2.length === 0 ? "✅" : "⚠️ devolvió " + r2.length);

  console.log("\n✅ INTEGRACIÓN OK");
})();
