# 🧠 Sistema RAG — Bot de Kaven que aprende de conversaciones

**Objetivo:** Que el bot de SalesIQ "aprenda" de las conversaciones reales (igual que la IA de Meta), recuperando ejemplos exitosos y usándolos para responder mejor.

---

## ¿Cómo funciona? (en simple)

```
Cliente escribe  →  el sistema busca en conversaciones pasadas las 3 más
                    parecidas  →  se las "muestra" a GPT como guía  →  GPT
                    responde siguiendo esos patrones que ya funcionaron
```

A diferencia de la IA de Meta (que aprende sola en su plataforma cerrada),
aquí **tú tienes control total**: ves de qué ejemplos aprende, decides cuáles
agregar, y nada se vuelve una "caja negra".

---

## Componentes

| Archivo | Qué hace |
|---------|----------|
| `rag/knowledge_base.json` | La "memoria": ejemplos de conversaciones exitosas (pregunta → mejor respuesta) |
| `rag/rag.js` | Motor: genera embeddings, busca por similitud, permite aprender |
| `rag/embeddings_cache.json` | Caché automático de embeddings (se regenera solo, NO se sube a git) |
| `rag/test_rag.js` | Test de la lógica de recuperación y aprendizaje |
| `rag/test_integration.js` | Test de cómo se inyecta en el prompt |
| `salesiq/rag_integration_v15.deluge` | Cómo conectar el bot v14 de SalesIQ al RAG |

---

## Endpoints disponibles (en server.js / Render)

### `POST /rag/context`  ← el que usa el bot de SalesIQ
Devuelve el bloque de ejemplos para inyectar en el prompt.
```json
// Request
{ "message": "tienen catalogo o todo es personalizado?" }

// Response
{ "ok": true, "lang": "es", "count": 3, "context": "...ejemplos..." }
```

### `POST /rag/learn`  ← para enseñarle algo nuevo
Agrega una conversación exitosa a la memoria (el bot aprende).
```json
// Headers: { "x-rag-token": "<RAG_ADMIN_TOKEN>" }  (si está configurado)
// Request
{
  "lang": "es",
  "sport": "ciclismo",
  "tags": ["entrega", "tiempo"],
  "user": "¿En cuánto tiempo entregan?",
  "assistant": "Normalmente en 1-3 semanas incluyendo diseño y envío 🚴 ...",
  "note": "Pregunta frecuente sobre tiempos de entrega."
}
```

### `POST /rag/search`  ← para depurar
Muestra qué recupera el RAG para una consulta (sin generar respuesta).

### `GET /rag/stats`  ← estado de la memoria
```json
{ "ok": true, "stats": { "ready": true, "total": 12, "byLang": {...} } }
```

---

## Cómo se conecta al bot v14 de SalesIQ

El bot v14 llama a OpenAI **directo desde Deluge** (no pasa por server.js).
Para que aprenda, antes de llamar a OpenAI hace UNA llamada a `/rag/context`
y concatena el resultado a su system prompt.

👉 Ver el código exacto en `salesiq/rag_integration_v15.deluge`.

**Requisito:** el backend de Render (`server.js`) debe estar **encendido**,
porque ahí vive el motor RAG y la `OPENAI_KEY` para los embeddings.

---

## Cómo hacer que "aprenda" de las conversaciones de Meta/SalesIQ

### Opción manual (recomendada para empezar)
1. Revisa las conversaciones que terminaron bien (venta, buen manejo de objeción).
2. Por cada una buena, llama a `POST /rag/learn` con la pregunta del cliente
   y la mejor respuesta. Ya queda disponible al instante.

### Opción automatizable (futuro)
Crear una tarea programada (daemon) que:
1. Cada semana lea las conversaciones nuevas de SalesIQ (vía API de Zoho).
2. Filtre las exitosas (las que generaron lead o venta).
3. Llame a `/rag/learn` automáticamente con cada una.

Así el bot mejora solo, semana a semana, con conversaciones reales.

---

## Costos

- **Embeddings (OpenAI `text-embedding-3-small`):** ~$0.02 por millón de tokens.
  Con un caché que evita recalcular, el costo es prácticamente nulo
  (centavos al mes incluso con miles de consultas).
- **No requiere base de datos externa** para empezar (usa archivos JSON).
  Si la memoria crece a miles de ejemplos, se puede migrar a una base
  vectorial (Pinecone/PostgreSQL) sin cambiar la interfaz.

---

## Pruebas

```bash
cd /home/ubuntu/github_repos/kaven-bot
node rag/test_rag.js          # lógica de recuperación + aprendizaje
node rag/test_integration.js  # inyección en el prompt
```

Ambos tests usan un cliente de embeddings simulado, así que corren sin
necesitar la OPENAI_KEY. En producción se usa el cliente real de OpenAI.

---

## Estado actual

- ✅ Motor RAG implementado y probado
- ✅ 12 ejemplos iniciales (es/en) basados en conversaciones reales de Meta
- ✅ Endpoints `/rag/context`, `/rag/learn`, `/rag/search`, `/rag/stats`
- ✅ Integrado también en el endpoint `/chat` (backend completo)
- ✅ Snippet de integración para el bot v14 de SalesIQ
- ⏸️ Pendiente: encender Render + pegar el bloque RAG en el handler de SalesIQ
- ⏸️ Futuro opcional: daemon que auto-aprende de conversaciones nuevas
