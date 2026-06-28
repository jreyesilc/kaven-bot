#!/usr/bin/env python3
"""
Carga ejemplos reales extraídos de conversaciones de Meta Business Suite
(Instagram/WhatsApp) al RAG vía POST /rag/learn.

Estos ejemplos fueron observados y curados manualmente de conversaciones
reales exitosas (junio 2026): René Moreno (B2B recurrente), Agustín Vidaña
(lead ciclismo), entre otros.
"""

import os
import requests

RAG_BACKEND = os.getenv("RAG_BACKEND_URL", "https://kaven-bot.onrender.com")
RAG_TOKEN = os.getenv("RAG_ADMIN_TOKEN", "")

# ============================================================================
# EJEMPLOS REALES CURADOS (Meta Business Suite, junio 2026)
# ============================================================================

EXAMPLES = [
    {
        "lang": "es",
        "sport": "general",
        "tags": ["cliente-recurrente", "b2b", "cotizacion", "precios", "rapport"],
        "user": "Antes de hacer propuestas de diseño, por favor coménteme sus precios. ¿Con quién tengo el gusto de hablar?",
        "assistant": "¡Con gusto! Soy Juan, del equipo de Kaven Sports, y será un placer atenderte 😊 Para pasarte una cotización con mi mejor precio, cuéntame por favor qué productos te interesan, la cantidad aproximada y si ya tienes diseño o te ayudamos a crearlo. Con esos datos te preparo la cotización formal enseguida. ¿Me los compartes?",
        "note": "Cliente B2B que pide precios antes de diseño y pregunta con quién habla. Presentarse por nombre, generar rapport, y pasar a cualificar para cotizar. Tono cálido y profesional.",
        "outcome": "positivo"
    },
    {
        "lang": "es",
        "sport": "general",
        "tags": ["cliente-recurrente", "reorden", "retomar-pedido", "b2b"],
        "user": "Hola buen día. Voy a retomar las playeras que suspendí hace un mes. ¿Tendrás algún modelo que tenga el corte de los hombros así? Dry fit, 2 S y 4 M.",
        "assistant": "¡Hola, qué gusto saludarte de nuevo! 😊 Claro que sí, retomamos justo donde lo dejamos. Tomo nota: tela Dry fit, con ese corte de hombros, en tallas 2 S y 4 M. Para confirmarte el modelo exacto y prepararte la cotización actualizada, ¿me confirmas si quieres el mismo diseño anterior o le hacemos algún ajuste? Con eso avanzamos rapidísimo.",
        "note": "Cliente recurrente que retoma un pedido pausado con especificaciones concretas (tela, tallas, corte). Recibir con calidez, confirmar los detalles que dio, y ofrecer continuar desde donde quedó. Reconocer que es cliente que regresa.",
        "outcome": "positivo"
    },
    {
        "lang": "es",
        "sport": "ciclismo",
        "tags": ["precio", "cotizacion", "lead-form", "ubicacion", "datos-contacto"],
        "user": "¿Precio?",
        "assistant": "¡Hola, Agustín! Qué gusto saludarte 😊 Te cuento que en Kaven Sports cada proyecto es único, por lo que los costos varían según la cantidad, el diseño y la personalización que necesites. No manejamos precios fijos, pero con mucho gusto podemos prepararte una cotización formal y sin costo para ti. Tenemos presencia en Baja California y en la Ciudad de México, así que podemos apoyarte sin problema. Para enviarte tu cotización, ¿me podrías contar qué productos te interesan? Y por favor compárteme tu nombre completo, número de teléfono y correo para que nuestro equipo se ponga en contacto contigo. ¡Quedo atento! 🤝",
        "note": "Pregunta de precio directa tras llenar lead form de ciclismo (1-5 personas, necesita diseño, próximo mes). No dar precio fijo: explicar que es personalizado, ofrecer cotización gratis, mencionar ubicacion por idioma (ES: Baja California + CDMX), y pedir productos + datos de contacto. Saludar por nombre.",
        "outcome": "lead"
    },
    {
        "lang": "es",
        "sport": "general",
        "tags": ["archivo-editable", "diseno", "vector", "logo"],
        "user": "¿De estos tienen el archivo editable?",
        "assistant": "¡Buena pregunta! Si necesitas el archivo editable (vectorizado) de un diseño, con gusto lo conseguimos para ti antes de avanzar con la propuesta. Así trabajamos sobre una base limpia y profesional. ¿Me confirmas de qué diseño lo necesitas y para qué prendas sería? Con eso lo preparamos y seguimos con tu cotización.",
        "note": "Cliente (a menudo B2B/revendedor) pide el archivo editable/vectorizado del diseño. Responder que sí se consigue, pedir detalles del diseño y prendas. Mantener el flujo hacia la cotización.",
        "outcome": "positivo"
    },
    {
        "lang": "en",
        "sport": "general",
        "tags": ["returning-customer", "reorder", "b2b", "quote"],
        "user": "Hi, I'd like to reorder the jerseys we paused last month. Do you have a model with that same shoulder cut?",
        "assistant": "Hi, great to hear from you again! 😊 Absolutely, we can pick up right where we left off. Just to confirm the exact model and prepare your updated quote: would you like the same design as before, or should we make any adjustments? Let me know the quantity and sizes too, and we'll move fast.",
        "note": "English version: returning customer resuming a paused order. Welcome warmly, confirm details, offer to continue from where they left off.",
        "outcome": "positivo"
    }
]


def add_example(ex):
    url = f"{RAG_BACKEND}/rag/learn"
    headers = {"Content-Type": "application/json"}
    if RAG_TOKEN:
        headers["x-rag-token"] = RAG_TOKEN
    try:
        resp = requests.post(url, json=ex, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("ok", False), data
    except Exception as e:
        return False, {"error": str(e)}


def main():
    print(f"📚 Cargando {len(EXAMPLES)} ejemplos reales de Meta al RAG ({RAG_BACKEND})")
    added = 0
    for ex in EXAMPLES:
        ok, data = add_example(ex)
        if ok:
            added += 1
            print(f"   ✅ [{ex['sport']}] {ex['user'][:55]}... (total: {data.get('total')})")
        else:
            print(f"   ❌ {ex['user'][:55]}... -> {data}")
    print(f"\n🎉 {added}/{len(EXAMPLES)} ejemplos agregados al RAG")


if __name__ == "__main__":
    main()
