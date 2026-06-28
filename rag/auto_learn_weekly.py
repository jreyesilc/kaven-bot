#!/usr/bin/env python3
"""
Auto-aprendizaje semanal del RAG desde conversaciones de Zoho SalesIQ.

Ejecuta cada semana (lunes 9 AM) para:
1. Extraer conversaciones de la última semana desde Zoho SalesIQ
2. Filtrar solo las que generaron lead (exitosas)
3. Procesarlas y agregarlas al RAG vía /rag/learn
4. Enviar resumen por email (opcional)

Requiere variables de entorno:
- ZOHO_SALESIQ_PORTAL_ID
- ZOHO_SALESIQ_ACCESS_TOKEN (OAuth token con permisos de lectura)
- RAG_BACKEND_URL (default: https://kaven-bot.onrender.com)
- RAG_ADMIN_TOKEN (opcional, si el endpoint /rag/learn está protegido)
"""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# ============================================================================
# CONFIGURACION
# ============================================================================

SALESIQ_PORTAL_ID = os.getenv("ZOHO_SALESIQ_PORTAL_ID", "")
SALESIQ_TOKEN = os.getenv("ZOHO_SALESIQ_ACCESS_TOKEN", "")
RAG_BACKEND = os.getenv("RAG_BACKEND_URL", "https://kaven-bot.onrender.com")
RAG_TOKEN = os.getenv("RAG_ADMIN_TOKEN", "")

# Criterios de filtrado
MIN_MESSAGES = 3  # Conversaciones con menos de 3 mensajes se descartan
DAYS_BACK = 7  # Extraer conversaciones de los últimos 7 días


# ============================================================================
# ZOHO SALESIQ API
# ============================================================================

def get_salesiq_chats(start_date: datetime, end_date: datetime) -> List[Dict]:
    """
    Obtiene lista de chats de SalesIQ en el rango de fechas.
    
    Ref: https://www.zoho.com/salesiq/help/developer-section/rest-api-chats.html
    """
    if not SALESIQ_PORTAL_ID or not SALESIQ_TOKEN:
        print("⚠️ Falta ZOHO_SALESIQ_PORTAL_ID o ZOHO_SALESIQ_ACCESS_TOKEN")
        return []
    
    url = f"https://salesiq.zoho.com/api/v2/{SALESIQ_PORTAL_ID}/chats"
    headers = {"Authorization": f"Zoho-oauthtoken {SALESIQ_TOKEN}"}
    
    # SalesIQ filtra por milisegundos (epoch)
    params = {
        "start_time": int(start_date.timestamp() * 1000),
        "end_time": int(end_date.timestamp() * 1000),
        "limit": 100  # ajustar si hay más de 100 chats/semana
    }
    
    try:
        resp = requests.get(url, headers=headers, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        print(f"🔥 Error llamando a SalesIQ API: {e}")
        return []


def get_chat_messages(chat_id: str) -> List[Dict]:
    """
    Obtiene los mensajes completos de un chat específico.
    """
    if not SALESIQ_PORTAL_ID or not SALESIQ_TOKEN:
        return []
    
    url = f"https://salesiq.zoho.com/api/v2/{SALESIQ_PORTAL_ID}/chats/{chat_id}/messages"
    headers = {"Authorization": f"Zoho-oauthtoken {SALESIQ_TOKEN}"}
    
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except Exception as e:
        print(f"🔥 Error obteniendo mensajes del chat {chat_id}: {e}")
        return []


# ============================================================================
# FILTRADO Y PROCESAMIENTO
# ============================================================================

def is_successful_chat(chat: Dict) -> bool:
    """
    Determina si un chat fue exitoso (generó lead).
    
    Criterios:
    - Tiene contacto capturado (email o phone)
    - O tiene al menos 1 señal de compra (tags, custom fields)
    """
    # Revisar si tiene datos de contacto
    visitor = chat.get("visitor", {})
    email = visitor.get("email")
    phone = visitor.get("phone")
    
    if email or phone:
        return True
    
    # Revisar tags/signals (si los guardaste en custom fields o tags)
    tags = chat.get("tags", [])
    if any(tag in ["pricing", "quantity", "customization", "direct_interest"] for tag in tags):
        return True
    
    return False


def extract_learning_examples(messages: List[Dict], chat_meta: Dict) -> List[Dict]:
    """
    Extrae pares (pregunta cliente → mejor respuesta) para aprender.
    
    Estrategia:
    - Tomar turnos donde el cliente pregunta algo específico
    - Y el bot/agente responde con información útil (>30 chars)
    - Intentar detectar idioma, deporte, tags automáticamente
    """
    examples = []
    
    for i in range(len(messages) - 1):
        current = messages[i]
        next_msg = messages[i + 1]
        
        # Buscar patrón: cliente (visitor) -> bot/agente (operator)
        if current.get("sender_type") == "visitor" and next_msg.get("sender_type") in ["bot", "operator"]:
            user_text = current.get("text", "").strip()
            assistant_text = next_msg.get("text", "").strip()
            
            # Filtros de calidad
            if len(user_text) < 10 or len(assistant_text) < 30:
                continue
            
            # Detectar idioma (simple: si tiene acentos/ñ = español)
            lang = "es" if any(c in user_text for c in "áéíóúñ¿¡") else "en"
            
            # Detectar deporte mencionado
            sport = detect_sport(user_text + " " + assistant_text)
            
            # Tags automáticos (keywords)
            tags = auto_tag(user_text)
            
            examples.append({
                "lang": lang,
                "sport": sport,
                "tags": tags,
                "user": user_text,
                "assistant": assistant_text,
                "note": f"Extraído automáticamente de chat {chat_meta.get('id', 'unknown')} el {datetime.now().strftime('%Y-%m-%d')}",
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
        print(f"🔥 Error agregando al RAG: {e}")
        return False


# ============================================================================
# MAIN: Ejecución semanal
# ============================================================================

def main():
    print("🤖 Auto-aprendizaje semanal del RAG - inicio")
    print(f"📅 Extrayendo conversaciones de los últimos {DAYS_BACK} días...")
    
    # Rango de fechas
    end_date = datetime.now()
    start_date = end_date - timedelta(days=DAYS_BACK)
    
    print(f"   Desde: {start_date.strftime('%Y-%m-%d %H:%M')}")
    print(f"   Hasta: {end_date.strftime('%Y-%m-%d %H:%M')}")
    
    # 1. Obtener chats de SalesIQ
    chats = get_salesiq_chats(start_date, end_date)
    print(f"✅ Extraídos {len(chats)} chats de SalesIQ")
    
    if len(chats) == 0:
        print("⚠️ No hay chats nuevos esta semana. Fin.")
        return
    
    # 2. Filtrar exitosos
    successful = [c for c in chats if is_successful_chat(c)]
    print(f"✅ {len(successful)} chats exitosos (con lead)")
    
    if len(successful) == 0:
        print("⚠️ No hay chats exitosos para aprender. Fin.")
        return
    
    # 3. Extraer ejemplos de aprendizaje
    all_examples = []
    for chat in successful:
        chat_id = chat.get("id")
        messages = get_chat_messages(chat_id)
        
        if len(messages) < MIN_MESSAGES:
            continue
        
        examples = extract_learning_examples(messages, chat)
        all_examples.extend(examples)
    
    print(f"✅ Extraídos {len(all_examples)} ejemplos de aprendizaje")
    
    if len(all_examples) == 0:
        print("⚠️ No se encontraron ejemplos válidos. Fin.")
        return
    
    # 4. Agregar al RAG
    added = 0
    for ex in all_examples:
        if add_to_rag(ex):
            added += 1
            print(f"   ✅ Agregado: [{ex['sport']}] {ex['user'][:50]}...")
        else:
            print(f"   ❌ Fallo: {ex['user'][:50]}...")
    
    print(f"\n🎉 Completado: {added}/{len(all_examples)} ejemplos agregados al RAG")
    
    # 5. (Opcional) Enviar notificación por email
    # send_notification_email(added, len(all_examples))
    
    print("✅ Auto-aprendizaje semanal finalizado")


if __name__ == "__main__":
    main()
