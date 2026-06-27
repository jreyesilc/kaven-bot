# 🤖 Sesión 27 Junio 2026 — Entrenamiento de Bots + Ubicación por Idioma

**Estado:** ✅ COMPLETADO  
**Repositorio:** `jreyesilc/kaven-bot`  
**Commits subidos:** 3 nuevos commits a `main`

---

## ✅ 1. META BUSINESS AI — Dirección Corregida y Ubicación por Idioma

### Problema detectado
La IA de Meta respondía con **dirección exacta** al preguntarle la ubicación:
> *"...Lago Patzcuaro 842, 22890 Ensenada, Baja California... y también Ciudad de México, tienda Aphesis..."*

### Solución implementada (ya en vivo)

#### A. Campo de dirección física
**Antes:** `Lago Patzcuaro 842, 22890 Ensenada, Baja California, Mexico`  
**Ahora:** `Ensenada`

#### B. Instrucción personalizada actualizada
```
UBICACION: Responde según el idioma de la conversacion.
- Si la conversacion es en ESPAÑOL: menciona que tienen presencia en Baja California y en Ciudad de Mexico.
- Si la conversacion es en INGLES: menciona San Diego.
- Nunca des direccion exacta (calle, numero, codigo postal).
- No menciones calle Lago Patzcuaro ni el numero ni codigo postal.
```

### Verificación en vivo (Chat de prueba de Meta AI)

✅ **Pregunta en INGLÉS:** "Where are you located?"  
**Respuesta:** *"We are located in San Diego. Please let us know if there is anything else we can assist you with today!"*

✅ **Pregunta en ESPAÑOL:** "donde tienen oficinas?"  
**Respuesta:** *"¡Con mucho gusto te informo que tenemos presencia en Baja California y en la Ciudad de México. ¿Hay algo más en lo que te pueda ayudar hoy?"*

---

## ✅ 2. BOT DE KAVEN (Web/SalesIQ) — Entrenamiento con Conversaciones Reales

### Análisis de conversaciones (WhatsApp + Instagram)

Se revisaron las últimas conversaciones de clientes reales en Meta Business Suite:
- **Roberto Chavarría (WhatsApp):** solicitó catálogo, pidió cotización por 1 pieza
- **Jose Alfredo (Instagram):** confusión diseño vs logo, equipo envió seguimiento por demora
- **patricio gonzalez (Instagram):** formulario completo (ciclismo, 1-5 personas, necesita diseño)
- **Juan Carlos García Medina (Instagram):** lead similar (ciclismo, necesita diseño)

### 6 Aprendizajes aplicados al system prompt

Se agregó la sección **"LEARNINGS FROM REAL CUSTOMER CONVERSATIONS"** con estos patrones:

#### 1. CATÁLOGO vs CUSTOM
**Patrón:** Clientes preguntan constantemente "¿tienen catálogo hecho o todo es personalizado?"  
**Regla:** Explicar que TODO es 100% personalizado (no stock) y enmarcar como fortaleza, no limitación. El catálogo de ciclismo es solo referencia de estilos/cortes.

#### 2. PEDIDOS DE UNA SOLA PIEZA
**Patrón:** Muchos clientes piden UN jersey antes de ordenar para el equipo completo  
**Regla:** Reaccionar positivo, recordar que NO hay mínimo de orden

#### 3. NECESITAN AYUDA CON DISEÑO
**Patrón:** La respuesta más común en formularios es "necesito ayuda para crearlo"  
**Regla:** Ofrecer diseño gratis proactivamente, distinguir DISEÑO (layout completo) vs LOGO (marca)

#### 4. PERFIL TÍPICO DE LEAD DE CICLISMO
**Patrón:** Grupos pequeños (1-5 personas), próximas semanas, necesitan diseño  
**Regla:** Explicar las 3 gamas (Standard/Elite/Premiere) de forma consultiva, ayudar a elegir según uso (entrenamiento vs competencia)

#### 5. RE-ENGANCHE TRAS SILENCIO
**Patrón:** Cliente se queda callado esperando diseño/cotización  
**Regla:** Reconectar cálido sin presión, disculpa breve por demora, ofrecer paso concreto

#### 6. UBICACIÓN POR IDIOMA
**Patrón:** Necesidad de responder diferente según idioma del cliente  
**Regla:**
- **Conversaciones en ESPAÑOL:** mencionar presencia en Baja California y Ciudad de México
- **Conversaciones en INGLÉS:** mencionar San Diego
- **Nunca** dar dirección exacta (calle, número, código postal)

---

## 📁 Archivos modificados

### 1. Bot de Meta (manual, ya publicado)
- **Meta Business Suite → Instrucciones → Custom instructions:** actualizada con regla de ubicación por idioma
- **Meta Business Suite → Tu información → Dirección:** cambiada a "Ensenada"

### 2. Bot de Kaven (código actualizado, pendiente publicación manual en SalesIQ)
- `salesiq/message_handler_v14_native_openai.deluge` (líneas 276-282)
- `server.js` (líneas 109-115)

---

## 🔄 Git & GitHub

### Commits (3 nuevos, todos subidos a GitHub)
```bash
e26a77e - Ubicacion por idioma: ES=Baja+CDMX, EN=San Diego (sin direccion exacta)
028f5d6 - Ajuste punto 6 (privacidad de ubicacion): neutral, sin contradecir el resto del prompt
1fc523a - Entrenar bot Kaven con aprendizajes de conversaciones reales (...)
```

### Estado del repositorio
- ✅ GitHub token renovado
- ✅ Push exitoso (`a5519d6..e26a77e`)
- ✅ Rama: `main`
- ✅ Remote: `https://github.com/jreyesilc/kaven-bot.git`

---

## 📋 PENDIENTES (acción del usuario)

### ⚠️ IMPORTANTE: Publicar Message Handler v14 actualizado

El **system prompt actualizado** está en el archivo `salesiq/message_handler_v14_native_openai.deluge`, pero hay que **pegarlo y publicarlo manualmente** en Zoho SalesIQ:

1. Ir a **Zoho SalesIQ → Settings → Bots → Kaven Bot**
2. Editar **Message Handler**
3. Copiar el contenido completo de `message_handler_v14_native_openai.deluge`
4. Pegar en el editor de SalesIQ
5. **Publicar** (botón "Publish" o "Save & Publish")

Sin esto, el bot de la web seguirá usando la versión anterior (sin los 6 aprendizajes ni la regla de ubicación por idioma).

---

## 🎯 Resumen ejecutivo

| Canal | Estado | Ubicación EN | Ubicación ES | Dirección exacta |
|---|---|---|---|---|
| **Meta AI (FB/IG/WA)** | ✅ EN VIVO | San Diego | Baja + CDMX | ❌ Nunca |
| **Bot Kaven (Web/SalesIQ)** | ⏸️ Código listo, pendiente publicar | San Diego | Baja + CDMX | ❌ Nunca |

**Aprendizajes aplicados:** 6 patrones de conversaciones reales integrados al prompt  
**GitHub:** 3 commits subidos exitosamente  
**Documentación:** Este archivo + commits en historial de git

---

**Archivo:** `/home/ubuntu/github_repos/kaven-bot/SESION_JUNIO27_BOT_ENTRENAMIENTO.md`  
**Fecha:** 27 de Junio, 2026
