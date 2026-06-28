//////////////////////////////////////////////////////
// ✅ RAG — Aprendizaje desde conversaciones reales
//   - Indexa ejemplos de conversaciones exitosas (knowledge_base.json)
//   - En cada turno, busca los ejemplos mas parecidos a lo que pregunta
//     el cliente y los inyecta en el prompt para que el bot responda
//     siguiendo patrones reales que ya funcionaron.
//   - Permite "aprender" agregando nuevas conversaciones en caliente.
//////////////////////////////////////////////////////

const db = require("./db");

const EMBEDDING_MODEL = "text-embedding-3-small";

let openaiClient = null;
let kb = [];            // [{id, lang, sport, tags, user, assistant, note, embedding}]
let ready = false;

//////////////////////////////////////////////////////
// Utilidades
//////////////////////////////////////////////////////

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Texto que representa a cada ejemplo para la busqueda semantica.
function entryText(entry) {
  const parts = [];
  if (entry.user) parts.push(entry.user);
  if (entry.tags && entry.tags.length) parts.push(entry.tags.join(" "));
  if (entry.sport) parts.push(entry.sport);
  return parts.join(" \n ");
}

//////////////////////////////////////////////////////
// Embeddings (OpenAI)
//////////////////////////////////////////////////////

async function embed(text) {
  if (!openaiClient) throw new Error("RAG: OpenAI client no inicializado");
  const resp = await openaiClient.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text
  });
  return resp.data[0].embedding;
}

//////////////////////////////////////////////////////
// Inicializacion: carga la KB y asegura embeddings (con cache)
//////////////////////////////////////////////////////

async function initRAG(openai) {
  openaiClient = openai;

  if (!openaiClient) {
    console.log("⚠️ RAG deshabilitado: falta OpenAI client");
    ready = false;
    return;
  }

  // 1) Inicializa la capa de persistencia (Postgres si hay DATABASE_URL,
  //    si no JSON local). Esto define dónde viven los ejemplos/embeddings.
  await db.initDB();

  // 2) Si usamos BD y está vacía, la sembramos desde knowledge_base.json
  //    (migración automática en el primer arranque con BD).
  if (db.isPersistent()) {
    const n = await db.countEntries();
    if (n === 0) {
      await db.seedFromJsonFile();
    }
  }

  // 3) Cargar todos los ejemplos (con o sin embedding).
  const entries = await db.loadEntries();

  // 4) Rellenar embeddings faltantes y persistirlos (en BD o cache JSON).
  //    Una vez calculados, sobreviven a reinicios -> no se recalculan.
  for (const entry of entries) {
    if (Array.isArray(entry.embedding) && entry.embedding.length > 0) continue;
    try {
      entry.embedding = await embed(entryText(entry));
      await db.saveEntry(entry); // guarda el embedding de forma permanente
    } catch (err) {
      console.log(`🔥 RAG: error embebiendo ${entry.id}:`, err.message);
      entry.embedding = null;
    }
  }

  kb = entries.filter((e) => Array.isArray(e.embedding));
  ready = kb.length > 0;
  console.log(
    `✅ RAG listo: ${kb.length} ejemplos indexados (persistencia: ${db.getMode()})`
  );
}

//////////////////////////////////////////////////////
// Recuperacion: top-K ejemplos mas parecidos
//   - opts.lang  : filtra por idioma ("es"/"en") si se pasa
//   - opts.topK  : cuantos ejemplos devolver (default 3)
//   - opts.minScore : umbral minimo de similitud (default 0.30)
//////////////////////////////////////////////////////

async function retrieve(query, opts = {}) {
  const topK = opts.topK || 3;
  const minScore = typeof opts.minScore === "number" ? opts.minScore : 0.3;

  if (!ready || !query || !query.trim()) return [];

  let queryEmbedding;
  try {
    queryEmbedding = await embed(query);
  } catch (err) {
    console.log("🔥 RAG: error embebiendo query:", err.message);
    return [];
  }

  const pool = opts.lang ? kb.filter((e) => e.lang === opts.lang) : kb;
  const candidates = (pool.length > 0 ? pool : kb)
    .map((e) => ({ entry: e, score: cosineSimilarity(queryEmbedding, e.embedding) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return candidates;
}

//////////////////////////////////////////////////////
// Construye el bloque de texto para inyectar en el system prompt
//////////////////////////////////////////////////////

function buildContextBlock(results) {
  if (!results || results.length === 0) return "";

  let block = "\n\nRELEVANT PAST CONVERSATIONS (real successful examples — use them as a guide for tone, content and next step; do NOT copy verbatim, adapt to the current customer):\n";
  results.forEach((r, i) => {
    block += `\nExample ${i + 1} (similarity ${r.score.toFixed(2)}):\n`;
    block += `Customer: ${r.entry.user}\n`;
    block += `Great reply: ${r.entry.assistant}\n`;
    if (r.entry.note) block += `Why it works: ${r.entry.note}\n`;
  });
  return block;
}

//////////////////////////////////////////////////////
// Aprender: agregar una nueva conversacion exitosa a la KB
//////////////////////////////////////////////////////

async function learnExample(example) {
  // example: { lang, sport, tags, user, assistant, note, outcome }
  if (!example || !example.user || !example.assistant) {
    throw new Error("learnExample requiere al menos { user, assistant }");
  }
  if (!openaiClient) throw new Error("RAG: OpenAI client no inicializado");

  const id = example.id || `kb-${String(Date.now())}`;
  const newEntry = {
    id,
    lang: example.lang || "es",
    sport: example.sport || "general",
    tags: example.tags || [],
    outcome: example.outcome || "positivo",
    user: example.user,
    assistant: example.assistant,
    note: example.note || "",
    source: example.source || "manual"
  };

  // Embeber el nuevo ejemplo y persistirlo (BD o JSON) — permanente.
  newEntry.embedding = await embed(entryText(newEntry));
  await db.saveEntry(newEntry);

  // Agregar a la KB en memoria (caliente, sin reiniciar)
  kb.push(newEntry);
  ready = kb.length > 0;

  return { id, total: kb.length };
}

// Detección de idioma simple y robusta (acentos + palabras frecuentes ES).
function detectLang(text) {
  if (!text) return undefined;
  const t = String(text).toLowerCase();
  if (/[áéíóúñ¿¡]/.test(t)) return "es";
  const esWords = [
    " que ", " como ", " donde ", " cuanto ", " precio ", " tienen ",
    " quiero ", " hola ", " gracias ", " uniforme", " equipo ", " diseno",
    " catalogo", " todo ", " para ", " con ", " una ", " los ", " las ",
    " hacen ", " puedo ", " necesito ", " cuesta "
  ];
  const padded = ` ${t} `;
  const esHits = esWords.filter((w) => padded.includes(w)).length;
  if (esHits >= 1) return "es";
  return "en";
}

function getStats() {
  const byLang = {};
  const bySport = {};
  kb.forEach((e) => {
    byLang[e.lang] = (byLang[e.lang] || 0) + 1;
    bySport[e.sport] = (bySport[e.sport] || 0) + 1;
  });
  return { ready, total: kb.length, byLang, bySport };
}

module.exports = {
  initRAG,
  retrieve,
  buildContextBlock,
  learnExample,
  detectLang,
  getStats
};
