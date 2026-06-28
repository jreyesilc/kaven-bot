//////////////////////////////////////////////////////
// ✅ RAG — Aprendizaje desde conversaciones reales
//   - Indexa ejemplos de conversaciones exitosas (knowledge_base.json)
//   - En cada turno, busca los ejemplos mas parecidos a lo que pregunta
//     el cliente y los inyecta en el prompt para que el bot responda
//     siguiendo patrones reales que ya funcionaron.
//   - Permite "aprender" agregando nuevas conversaciones en caliente.
//////////////////////////////////////////////////////

const fs = require("fs");
const path = require("path");

const KB_PATH = path.join(__dirname, "knowledge_base.json");
const CACHE_PATH = path.join(__dirname, "embeddings_cache.json");
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

function loadKnowledgeBase() {
  try {
    const raw = fs.readFileSync(KB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.log("⚠️ RAG: no se pudo leer knowledge_base.json:", err.message);
    return [];
  }
}

function loadCache() {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    return JSON.parse(raw); // { [id]: { text, embedding } }
  } catch (err) {
    return {};
  }
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (err) {
    console.log("⚠️ RAG: no se pudo guardar cache de embeddings:", err.message);
  }
}

function saveKnowledgeBase(entries) {
  // Guardamos la KB SIN los embeddings (esos viven en el cache).
  const clean = entries.map(({ embedding, ...rest }) => rest);
  fs.writeFileSync(KB_PATH, JSON.stringify(clean, null, 2), "utf-8");
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

  const entries = loadKnowledgeBase();
  const cache = loadCache();
  let cacheChanged = false;

  for (const entry of entries) {
    const text = entryText(entry);
    const cached = cache[entry.id];

    if (cached && cached.text === text && Array.isArray(cached.embedding)) {
      entry.embedding = cached.embedding;
    } else {
      try {
        entry.embedding = await embed(text);
        cache[entry.id] = { text, embedding: entry.embedding };
        cacheChanged = true;
      } catch (err) {
        console.log(`🔥 RAG: error embebiendo ${entry.id}:`, err.message);
        entry.embedding = null;
      }
    }
  }

  if (cacheChanged) saveCache(cache);

  kb = entries.filter((e) => Array.isArray(e.embedding));
  ready = kb.length > 0;
  console.log(`✅ RAG listo: ${kb.length} ejemplos indexados`);
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

  const entries = loadKnowledgeBase();
  const id = example.id || `kb-${String(Date.now())}`;
  const newEntry = {
    id,
    lang: example.lang || "es",
    sport: example.sport || "general",
    tags: example.tags || [],
    outcome: example.outcome || "positivo",
    user: example.user,
    assistant: example.assistant,
    note: example.note || ""
  };

  entries.push(newEntry);
  saveKnowledgeBase(entries);

  // Embeber y cachear el nuevo ejemplo
  const text = entryText(newEntry);
  const embedding = await embed(text);
  const cache = loadCache();
  cache[id] = { text, embedding };
  saveCache(cache);

  // Agregar a la KB en memoria (caliente, sin reiniciar)
  newEntry.embedding = embedding;
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
