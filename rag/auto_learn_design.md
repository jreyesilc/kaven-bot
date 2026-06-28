# Diseño: Auto-aprendizaje semanal del RAG

## Objetivo
Que el bot mejore solo cada semana, extrayendo automáticamente conversaciones exitosas de SalesIQ y Meta, y agregándolas a la base de conocimiento RAG.

## Flujo propuesto

```
Cada lunes a las 9:00 AM (hora Tijuana)
  ↓
1. EXTRAER conversaciones de la semana pasada:
   - SalesIQ (vía API de Zoho)
   - Meta Business Suite (vía scraping o exportación manual mensual)
  ↓
2. FILTRAR solo las exitosas:
   - Que generaron lead (datos de contacto capturados)
   - O que terminaron en venta/cotización enviada
   - Excluir conversaciones cortas (<3 mensajes) o sin valor
  ↓
3. EXTRAER patrones de aprendizaje:
   - Pregunta del cliente (user)
   - Mejor respuesta del bot/equipo (assistant)
   - Tags automáticos (deporte, tema, idioma)
  ↓
4. AGREGAR al RAG:
   - Llamar a POST /rag/learn por cada conversación
   - Almacenar log de lo agregado
  ↓
5. NOTIFICAR:
   - Email o mensaje con resumen: "Esta semana se aprendieron 5 nuevas conversaciones"
```

## Implementación técnica

### Opción 1: Script Python completo (recomendada)
**Ventajas:**
- Acceso directo a API de Zoho SalesIQ
- Procesamiento robusto (filtrado, limpieza, deduplicación)
- Puede guardar backups locales de las conversaciones

**Archivo:** `rag/auto_learn_weekly.py`

**Ejecución:** Tarea programada (daemon) que corre cada lunes 9 AM

### Opción 2: Híbrido (exportación manual mensual + procesamiento automático)
**Para Meta:** Exportación manual mensual (Meta no tiene API pública de conversaciones)
**Para SalesIQ:** Script automático vía API

## Consideraciones

### Meta Business Suite
- **Problema:** Meta NO tiene API pública para extraer conversaciones de WhatsApp/Instagram del Business Inbox
- **Solución 1 (manual):** Una vez al mes, exportar conversaciones manualmente (CSV o screenshots) y procesarlas
- **Solución 2 (semi-auto):** Usar browser automation para extraer conversaciones (más frágil, puede romperse si Meta cambia UI)

### Zoho SalesIQ
- **API disponible:** SÍ → https://www.zoho.com/salesiq/help/developer-section/rest-api-v2.html
- **Endpoints relevantes:**
  - `GET /api/v2/{portal}/visitors/{visitor_id}/chats` → lista de chats de un visitante
  - `GET /api/v2/{portal}/chats/{chat_id}` → detalles de un chat (mensajes completos)
- **Filtros posibles:**
  - Por fecha (última semana)
  - Por estado (convertidos a lead o no)

### Deduplicación
- No agregar la misma conversación dos veces
- Comparar por similitud de embeddings (si existe un ejemplo muy parecido, no agregarlo)

## Variables de entorno necesarias

```bash
# Zoho SalesIQ
ZOHO_SALESIQ_PORTAL_ID=<tu portal ID>
ZOHO_SALESIQ_ACCESS_TOKEN=<OAuth token>

# RAG Admin (para llamar a /rag/learn)
RAG_ADMIN_TOKEN=<token opcional para proteger el endpoint>

# Notificaciones (opcional)
NOTIFICATION_EMAIL=<tu email para recibir resumen semanal>
```

## Próximo paso
Implementar `rag/auto_learn_weekly.py` con acceso a SalesIQ vía API.
