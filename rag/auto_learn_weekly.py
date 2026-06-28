#!/usr/bin/env python3
"""
Auto-aprendizaje semanal del RAG desde conversaciones de Zoho SalesIQ.

Ejecuta cada semana (lunes 9 AM) para:
1. Renovar el token OAuth automáticamente (refresh_token)
2. Extraer conversaciones de la última semana desde Zoho SalesIQ API v2
3. Filtrar solo las que generaron lead (exitosas)
4. Procesarlas y agregarlas al RAG vía /rag/learn
5. Guardar log de cada ejecución

Requiere variables de entorno:
- ZOHO_SALESIQ_PORTAL_ID
- ZOHO_SALESIQ_ACCESS_TOKEN (OAuth token, se renueva automáticamente)
- ZOHO_SALESIQ_REFRESH_TOKEN (para renovar el access_token)
- ZOHO_CLIENT_ID
- ZOHO_CLIENT_SECRET
- RAG_BACKEND_URL (default: https://kaven-bot.onrender.com)
- RAG_ADMIN_TOKEN (opcional, si el endpoint /rag/learn está protegido)
"""

import os
import sys
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

# ============================================================================
# LOGGING
# ============================================================================

LOG_DIR = Path("/home/ubuntu/shared/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

log_filename = LOG_DIR / f"rag_autolearn_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURACION
# ============================================================================

SALESIQ_PORTAL_ID = os.getenv("ZOHO_SALESIQ_PORTAL_ID", "")
SALESIQ_TOKEN = os.getenv("ZOHO_SALESIQ_ACCESS_TOKEN", "")
REFRESH_TOKEN = os.getenv("ZOHO_SALESIQ_REFRESH_TOKEN", "")
CLIENT_ID = os.getenv("ZOHO_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("ZOHO_CLIENT_SECRET", "")
RAG_BACKEND = os.getenv("RAG_BACKEND_URL", "https://kaven-bot.onrender.com")
RAG_TOKEN = os.getenv("RAG_ADMIN_TOKEN", "")

# Criterios de filtrado
MIN_MESSAGES = 3
DAYS_BACK = 7

# ============================================================================
# TOKEN REFRESH
# ============================================================================

def refresh_zoho_token() -> str:
    """Renueva el access_token usando el refresh_token."""
    global SALESIQ_TOKEN
    
    if not REFRESH_TOKEN or not CLIENT_ID or not CLIENT_SECRET:
        logger.warning("No se puede renovar token: faltan REFRESH_TOKEN, CLIENT_ID o CLIENT_SECRET")
        return SALESIQ_TOKEN
    
    logger.info("Renovando access_token de Zoho...")
    url = "https://accounts.zoho.com/oauth/v2/token"
    data = {
        "refresh_token": REFRESH_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    
    try:
        resp = requests.post(url, data=data, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        new_token = result.get("access_token", "")
        if new_token:
            SALESIQ_TOKEN = new_token
            logger.info("✅ Token renovado exitosamente (expira en %s seg)", result.get("expires_in", "?"))
            return new_token
        else:
            logger.error("🔥 Respuesta de refresh sin access_token: %s", result)
            return SALESIQ_TOKEN
    except Exception as e:
        logger.error("🔥 Error renovando token: %s", e)
        return SALESIQ_TOKEN

# ============================================================================
# ZOHO SALESIQ API v2
# ============================================================================

def get_salesiq_conversations(start_date: datetime, end_date: datetime) -> List[Dict]:
    """
    Obtiene lista de conversaciones de SalesIQ API v2 en el rango de fechas.
    """
    if not SALESIQ_PORTAL_ID or not SALESIQ_TOKEN:
        logger.error("⚠️ Falta ZOHO_SALESIQ_PORTAL_ID o ZOHO_SALESIQ_ACCESS_TOKEN")
        return []
    
    url = f"https://salesiq.zoho.com/api/v2/{SALESIQ_PORTAL_ID}/conversations"
    headers = {"Authorization": f"Zoho-oauthtoken {SALESIQ_TOKEN}"}
    
    params = {
        "start_time": int(start_date.timestamp() * 1000),
        "end_time": int(end_date.timestamp() * 1000),
        "limit": 100
    }
    
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        
        # Si el token expiró, renovar e intentar de nuevo
        if resp.status_code == 401:
            logger.warning("Token expirado, renovando...")
            refresh_zoho_token()
            headers["Authorization"] = f"Zoho-oauthtoken {SALESIQ_TOKEN}"
            resp = requests.get(url, headers=headers, params=params, timeout=30)
        
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        logger.error("🔥 Error llamando a SalesIQ API: %s", e)
        return []


def get_conversation_messages(conversation_id: str) -> List[Dict]:
    """
    Obtiene los mensajes completos de una conversación específica.
    """
    if not SALESIQ_PORTAL_ID or not SALESIQ_TOKEN:
        return []
    
    url = f"https://salesiq.zoho.com/api/v2/{SALESIQ_PORTAL_ID}/conversations/{conversation_id}/messages"
    headers = {"Authorization": f"Zoho-oauthtoken {SALESIQ_TOKEN}"}
    
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        if resp.status_code == 401:
            refresh_zoho_token()
            headers["Authorization"] = f"Zoho-oauthtoken {SALESIQ_TOKEN}"
            resp = requests.get(url, headers=headers, timeout=30)
        
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        logger.error("🔥 Error obteniendo mensajes de conversación %s: %s", conversation_id, e)
        return []


# ============================================================================
# FILTRADO Y PROCESAMIENTO
# ============================================================================

def is_successful_chat(chat: Dict) -> bool:
    """
    Determina si un chat fue exitoso (generó lead).
    """
    visitor = chat.get("visitor", {})
    email = visitor.get("email")
    phone = visitor.get("phone")
    
    if email or phone:
        return True
    
    tags = chat.get("tags", [])
    if any(tag in ["pricing", "quantity", "customization", "direct_interest"] for tag in tags):
        return True
    
    return False


def extract_learning_examples(messages: List[Dict], chat_meta: Dict) -> List[Dict]:
    """
    Extrae pares (pregunta cliente → mejor respuesta) para aprender.
    """
    examples = []
    
    for i in range(len(messages) - 1):
        current = messages[i]
        next_msg = messages[i + 1]
        
        if current.get("sender_type") == "visitor" and next_msg.get("sender_type") in ["bot", "operator"]:
            user_text = current.get("text", "").strip()
            assistant_text = next_msg.get("text", "").strip()
            
            if len(user_text) < 10 or len(assistant_text) < 30:
                continue
            
            lang = "es" if any(c in user_text for c in "áéíóúñ¿¡") else "en"
            sport = detect_sport(user_text + " " + assistant_text)
            tags = auto_tag(user_text)
            
            examples.append({
                "lang": lang,
                "sport": sport,
                "tags": tags,
                "user": user_text,
                "assistant": assistant_text,
                "note": f"Extraído automáticamente de conversación {chat_meta.get('id', 'unknown')} el {datetime.now().strftime('%Y-%m-%d')}",
                "outcome": "positivo"
            })
    
    return examples


def detect_sport(text: str) -> str:
    """Detecta el deporte mencionado en el texto."""
    t = text.lower()
    if "ciclismo" in t or "cycling" in t or "bib" in t:
        return "ciclismo"
    if "futbol" in t or "soccer" in t:
        return "futbol"
    if "baseball" in t or "beisbol" in t:
        return "baseball"
    if "basketball" in t or "basquetbol" in t:
        return "basketball"
    return "general"


def auto_tag(text: str) -> List[str]:
    """Genera tags automáticos basados en keywords."""
    tags = []
    t = text.lower()
    
    if "catalogo" in t or "catalog" in t:
        tags.append("catalogo")
    if "personaliz" in t or "custom" in t:
        tags.append("personalizado")
    if "precio" in t or "price" in t or "cuanto" in t:
        tags.append("precio")
    if "minimo" in t or "minimum" in t or "pieza" in t or "single" in t:
        tags.append("minimo")
    if "diseno" in t or "design" in t or "logo" in t:
        tags.append("diseno")
    if "ubicados" in t or "located" in t or "donde" in t or "where" in t:
        tags.append("ubicacion")
    if "entrega" in t or "delivery" in t or "tiempo" in t:
        tags.append("entrega")
    
    return tags or ["general"]


# ============================================================================
# RAG: Agregar ejemplos
# ============================================================================

def add_to_rag(example: Dict) -> bool:
    """Agrega un ejemplo al RAG vía POST /rag/learn."""
    url = f"{RAG_BACKEND}/rag/learn"
    headers = {"Content-Type": "application/json"}
    
    if RAG_TOKEN:
        headers["x-rag-token"] = RAG_TOKEN
    
    try:
        resp = requests.post(url, json=example, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("ok", False)
    except Exception as e:
        logger.error("🔥 Error agregando al RAG: %s", e)
        return False


# ============================================================================
# MAIN: Ejecución semanal
# ============================================================================

def main():
    logger.info("=" * 60)
    logger.info("🤖 Auto-aprendizaje semanal del RAG - inicio")
    logger.info("=" * 60)
    
    # Verificar variables de entorno
    missing = []
    if not SALESIQ_PORTAL_ID:
        missing.append("ZOHO_SALESIQ_PORTAL_ID")
    if not SALESIQ_TOKEN and not REFRESH_TOKEN:
        missing.append("ZOHO_SALESIQ_ACCESS_TOKEN o ZOHO_SALESIQ_REFRESH_TOKEN")
    
    if missing:
        logger.error("🔥 Variables de entorno faltantes: %s", ", ".join(missing))
        logger.error("Configura las variables en /home/ubuntu/shared/.env")
        sys.exit(1)
    
    # Renovar token antes de empezar (el access_token dura 1 hora)
    if REFRESH_TOKEN and CLIENT_ID and CLIENT_SECRET:
        refresh_zoho_token()
    
    # Rango de fechas
    end_date = datetime.now()
    start_date = end_date - timedelta(days=DAYS_BACK)
    
    logger.info("📅 Extrayendo conversaciones de los últimos %d días...", DAYS_BACK)
    logger.info("   Desde: %s", start_date.strftime('%Y-%m-%d %H:%M'))
    logger.info("   Hasta: %s", end_date.strftime('%Y-%m-%d %H:%M'))
    
    # 1. Obtener conversaciones de SalesIQ
    conversations = get_salesiq_conversations(start_date, end_date)
    logger.info("✅ Extraídas %d conversaciones de SalesIQ", len(conversations))
    
    if len(conversations) == 0:
        logger.info("⚠️ No hay conversaciones nuevas esta semana. Fin.")
        return
    
    # 2. Filtrar exitosas
    successful = [c for c in conversations if is_successful_chat(c)]
    logger.info("✅ %d conversaciones exitosas (con lead)", len(successful))
    
    if len(successful) == 0:
        logger.info("⚠️ No hay conversaciones exitosas para aprender. Fin.")
        return
    
    # 3. Extraer ejemplos de aprendizaje
    all_examples = []
    for conv in successful:
        conv_id = conv.get("id")
        messages = get_conversation_messages(conv_id)
        
        if len(messages) < MIN_MESSAGES:
            continue
        
        examples = extract_learning_examples(messages, conv)
        all_examples.extend(examples)
    
    logger.info("✅ Extraídos %d ejemplos de aprendizaje", len(all_examples))
    
    if len(all_examples) == 0:
        logger.info("⚠️ No se encontraron ejemplos válidos. Fin.")
        return
    
    # 4. Agregar al RAG
    added = 0
    failed = 0
    for ex in all_examples:
        if add_to_rag(ex):
            added += 1
            logger.info("   ✅ Agregado: [%s] %s...", ex['sport'], ex['user'][:50])
        else:
            failed += 1
            logger.warning("   ❌ Fallo: %s...", ex['user'][:50])
    
    logger.info("")
    logger.info("🎉 Completado: %d/%d ejemplos agregados al RAG (%d fallidos)", 
                added, len(all_examples), failed)
    
    # 5. Verificar estado del RAG
    try:
        stats_resp = requests.get(f"{RAG_BACKEND}/rag/stats", timeout=10)
        if stats_resp.status_code == 200:
            stats = stats_resp.json().get("stats", {})
            logger.info("📊 Estado del RAG: %d ejemplos totales", stats.get("total", 0))
    except Exception:
        pass
    
    # Guardar resumen
    summary = {
        "timestamp": datetime.now().isoformat(),
        "conversations_found": len(conversations),
        "successful_conversations": len(successful),
        "examples_extracted": len(all_examples),
        "examples_added": added,
        "examples_failed": failed
    }
    summary_file = LOG_DIR / f"summary_{datetime.now().strftime('%Y%m%d')}.json"
    with open(summary_file, "w") as f:
        json.dump(summary, f, indent=2)
    
    logger.info("📝 Resumen guardado en %s", summary_file)
    logger.info("✅ Auto-aprendizaje semanal finalizado")


if __name__ == "__main__":
    main()
