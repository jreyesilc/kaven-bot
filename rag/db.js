//////////////////////////////////////////////////////
// ✅ RAG DB — Capa de persistencia permanente
//
//   Objetivo: que el auto-aprendizaje sea 100% PERMANENTE.
//
//   - Si existe la variable de entorno DATABASE_URL (Postgres, ej. Neon o
//     Render Postgres), guarda los ejemplos Y sus embeddings en la BD.
//     -> Sobreviven reinicios y redeploys de Render (filesystem efímero).
//   - Si NO hay DATABASE_URL, cae a los archivos locales
//     (knowledge_base.json + embeddings_cache.json) — igual que antes.
//     Esto mantiene el desarrollo local y los tests funcionando sin cambios.
//
//   Esquema de cada "entry":
//     { id, lang, sport, tags[], outcome, user, assistant, note,
//       embedding[]|null, source }
//////////////////////////////////////////////////////

const fs = require("fs");
const path = require("path");

const KB_PATH = path.join(__dirname, "knowledge_base.json");
const CACHE_PATH = path.join(__dirname, "embeddings_cache.json");

let pool = null;
let mode = "json"; // "pg" | "json"

//////////////////////////////////////////////////////
// Inicialización
//////////////////////////////////////////////////////

async function initDB() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    mode = "json";
    console.log("ℹ️ RAG DB: sin DATABASE_URL → usando JSON local (no permanente en Render)");
    return mode;
  }

  try {
    const { Pool } = require("pg");

    // SSL: los Postgres gestionados (Neon, Render, Supabase) lo requieren,
    // pero un Postgres local no. Detectamos por la URL o por PGSSL=disable.
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const sslDisabled =
      process.env.PGSSL === "disable" || /sslmode=disable/.test(url) || isLocal;
    const ssl = sslDisabled ? false : { rejectUnauthorized: false };

    pool = new Pool({ connectionString: url, ssl });

    // Probar conexión y crear tabla si no existe.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_examples (
        id            TEXT PRIMARY KEY,
        lang          TEXT        NOT NULL DEFAULT 'es',
        sport         TEXT        NOT NULL DEFAULT 'general',
        tags          JSONB       NOT NULL DEFAULT '[]'::jsonb,
        outcome       TEXT        NOT NULL DEFAULT 'positivo',
        user_msg      TEXT        NOT NULL,
        assistant_msg TEXT        NOT NULL,
        note          TEXT        NOT NULL DEFAULT '',
        embedding     JSONB,
        source        TEXT        NOT NULL DEFAULT 'manual',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    mode = "pg";
    console.log("✅ RAG DB: Postgres conectado (persistencia permanente activa)");
    return mode;
  } catch (err) {
    console.log("⚠️ RAG DB: fallo al conectar Postgres, uso JSON local:", err.message);
    pool = null;
    mode = "json";
    return mode;
  }
}

function getMode() {
  return mode;
}

function isPersistent() {
  return mode === "pg";
}

//////////////////////////////////////////////////////
// Helpers de fila <-> entry
//////////////////////////////////////////////////////

function rowToEntry(row) {
  return {
    id: row.id,
    lang: row.lang,
    sport: row.sport,
    tags: Array.isArray(row.tags) ? row.tags : (row.tags || []),
    outcome: row.outcome,
    user: row.user_msg,
    assistant: row.assistant_msg,
    note: row.note || "",
    embedding: Array.isArray(row.embedding) ? row.embedding : null,
    source: row.source || "manual"
  };
}

//////////////////////////////////////////////////////
// Lectura de todos los ejemplos
//////////////////////////////////////////////////////

async function loadEntries() {
  if (mode === "pg") {
    const { rows } = await pool.query(
      "SELECT * FROM rag_examples ORDER BY created_at ASC"
    );
    return rows.map(rowToEntry);
  }

  // JSON mode: knowledge_base.json + embeddings_cache.json (igual que antes)
  let base = [];
  try {
    base = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
  } catch (err) {
    console.log("⚠️ RAG DB(json): no se pudo leer knowledge_base.json:", err.message);
    base = [];
  }

  let cache = {};
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch (err) {
    cache = {};
  }

  return base.map((e) => ({
    ...e,
    tags: e.tags || [],
    outcome: e.outcome || "positivo",
    note: e.note || "",
    source: e.source || "seed",
    embedding:
      cache[e.id] && Array.isArray(cache[e.id].embedding)
        ? cache[e.id].embedding
        : null
  }));
}

async function countEntries() {
  if (mode === "pg") {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM rag_examples");
    return rows[0].n;
  }
  const entries = await loadEntries();
  return entries.length;
}

//////////////////////////////////////////////////////
// Guardar / actualizar un ejemplo (upsert)
//   Se usa tanto al "aprender" como al rellenar embeddings faltantes.
//////////////////////////////////////////////////////

async function saveEntry(entry) {
  if (mode === "pg") {
    await pool.query(
      `INSERT INTO rag_examples
         (id, lang, sport, tags, outcome, user_msg, assistant_msg, note, embedding, source, updated_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9::jsonb,$10, now())
       ON CONFLICT (id) DO UPDATE SET
         lang=EXCLUDED.lang,
         sport=EXCLUDED.sport,
         tags=EXCLUDED.tags,
         outcome=EXCLUDED.outcome,
         user_msg=EXCLUDED.user_msg,
         assistant_msg=EXCLUDED.assistant_msg,
         note=EXCLUDED.note,
         embedding=EXCLUDED.embedding,
         source=EXCLUDED.source,
         updated_at=now()`,
      [
        entry.id,
        entry.lang || "es",
        entry.sport || "general",
        JSON.stringify(entry.tags || []),
        entry.outcome || "positivo",
        entry.user,
        entry.assistant,
        entry.note || "",
        entry.embedding ? JSON.stringify(entry.embedding) : null,
        entry.source || "manual"
      ]
    );
    return;
  }

  // JSON mode: actualizar knowledge_base.json + embeddings_cache.json
  let base = [];
  try {
    base = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
  } catch (err) {
    base = [];
  }

  const clean = {
    id: entry.id,
    lang: entry.lang || "es",
    sport: entry.sport || "general",
    tags: entry.tags || [],
    outcome: entry.outcome || "positivo",
    user: entry.user,
    assistant: entry.assistant,
    note: entry.note || ""
  };

  const idx = base.findIndex((e) => e.id === entry.id);
  if (idx >= 0) base[idx] = clean;
  else base.push(clean);
  fs.writeFileSync(KB_PATH, JSON.stringify(base, null, 2), "utf-8");

  // Guardar embedding en el cache si viene
  if (Array.isArray(entry.embedding)) {
    let cache = {};
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    } catch (err) {
      cache = {};
    }
    cache[entry.id] = { embedding: entry.embedding };
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  }
}

//////////////////////////////////////////////////////
// Sembrar la BD desde knowledge_base.json (primer arranque con BD vacía)
//   Inserta los ejemplos SIN embedding; rag.js los embeberá y guardará.
//////////////////////////////////////////////////////

async function seedFromJsonFile() {
  if (mode !== "pg") return 0;
  let base = [];
  try {
    base = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
  } catch (err) {
    console.log("⚠️ RAG DB: no hay knowledge_base.json para sembrar:", err.message);
    return 0;
  }
  let n = 0;
  for (const e of base) {
    await saveEntry({ ...e, embedding: null, source: e.source || "seed" });
    n++;
  }
  console.log(`🌱 RAG DB: sembrados ${n} ejemplos desde knowledge_base.json`);
  return n;
}

async function close() {
  if (pool) await pool.end();
}

module.exports = {
  initDB,
  getMode,
  isPersistent,
  loadEntries,
  countEntries,
  saveEntry,
  seedFromJsonFile,
  close
};
