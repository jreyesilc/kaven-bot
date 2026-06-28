// Migración manual: knowledge_base.json -> Postgres (con embeddings reales).
//
// Cuándo usarlo:
//   - Primera vez que conectas una BD nueva (aunque el server también
//     siembra solo en su primer arranque, este script te deja hacerlo a mano).
//   - Para re-sincronizar: si editaste knowledge_base.json en el repo y
//     quieres empujar esos cambios/nuevos ejemplos a la BD.
//
// Requiere variables de entorno:
//   - DATABASE_URL  (Postgres destino)
//   - OPENAI_KEY    (para calcular los embeddings reales)
//
// Uso:
//   DATABASE_URL=... OPENAI_KEY=... node rag/migrate_to_db.js

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const db = require("./db");

const KB_PATH = path.join(__dirname, "knowledge_base.json");
const EMBEDDING_MODEL = "text-embedding-3-small";

function entryText(entry) {
  const parts = [];
  if (entry.user) parts.push(entry.user);
  if (entry.tags && entry.tags.length) parts.push(entry.tags.join(" "));
  if (entry.sport) parts.push(entry.sport);
  return parts.join(" \n ");
}

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error("❌ Falta DATABASE_URL. Aborto.");
    process.exit(1);
  }
  if (!process.env.OPENAI_KEY) {
    console.error("❌ Falta OPENAI_KEY (necesario para los embeddings). Aborto.");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

  const mode = await db.initDB();
  if (mode !== "pg") {
    console.error("❌ No se pudo conectar a Postgres. Aborto.");
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
  console.log(`📦 ${base.length} ejemplos en knowledge_base.json`);

  let done = 0;
  for (const e of base) {
    const text = entryText(e);
    let embedding = null;
    try {
      const resp = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text });
      embedding = resp.data[0].embedding;
    } catch (err) {
      console.log(`🔥 Error embebiendo ${e.id}:`, err.message);
    }
    await db.saveEntry({
      ...e,
      tags: e.tags || [],
      outcome: e.outcome || "positivo",
      note: e.note || "",
      source: e.source || "seed",
      embedding
    });
    done++;
    process.stdout.write(`\r   migrados ${done}/${base.length}`);
  }

  const total = await db.countEntries();
  console.log(`\n✅ Migración completa. Total en BD: ${total}`);
  await db.close();
  process.exit(0);
})();
