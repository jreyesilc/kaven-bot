# ⚡ Optimización: Prompt Multi-Deporte (No Ofrecer Ciclismo para Fútbol)

**Fecha:** 28 de junio, 2026  
**Tipo:** Optimización del sistema  
**Estado:** ✅ IMPLEMENTADO  

---

## 📋 Problema Identificado

El bot estaba ofreciendo las **líneas de producto de ciclismo** (Standard, Elite, Premiere) cuando los usuarios preguntaban sobre otros deportes como **fútbol, baseball, basketball, etc.**

### Ejemplo del Problema

**Usuario:** "Hacen uniformes de futbol? Que opciones tienen?"

**Bot (comportamiento incorrecto):**
> "¡Sí! Ofrecemos uniformes de fútbol en 3 niveles:
> - **Standard:** Polyester básico...
> - **Elite:** Tejidos técnicos...
> - **Premiere:** Premium italiano..."

**Problema:** Las 3 opciones (Standard/Elite/Premiere) son **exclusivas de ciclismo**. Para fútbol y otros deportes, solo hay **una calidad premium**.

---

## 🎯 Objetivo

Que el bot diferencie correctamente entre:
1. **CICLISMO:** Ofrecer los 3 niveles (Standard, Elite, Premiere)
2. **OTROS DEPORTES:** Mencionar solo "calidad premium única"

---

## ✅ Solución Implementada

### Modificaciones al `systemPrompt` en `server.js`

**Commit:** `c81e3a5`

#### Cambio 1: Nueva Sección de Líneas de Producto

Agregamos una sección destacada antes de la descripción de productos:

```markdown
⚠️ VERY IMPORTANT — PRODUCT LINES BY SPORT ⚠️

CYCLING PRODUCT LINE (3 tiers):
  - Standard: Entry polyester, basic performance
  - Elite: Premium technical fabrics, advanced features
  - Premiere: Italian premium, pro-level

SOCCER / FÚTBOL PRODUCT LINE (single premium quality):
  - Soccer jerseys (long/short sleeve)
  - Soccer shorts
  - Soccer socks
  - Complete soccer kits
  → NO mention Standard/Elite/Premiere for soccer

OTHER TEAM SPORTS (baseball, softball, basketball, etc.):
  - Single premium quality level
  - Custom jerseys, pants, shorts, full kits
  → NO mention Standard/Elite/Premiere for these sports

DO NOT offer cycling tier names (Standard/Elite/Premiere) for non-cycling sports.
```

#### Cambio 2: Actualización de Rol y Objetivos

```markdown
YOUR ROLE & GOALS
You are the friendly sales assistant for KAVEN SPORTS...

When discussing CYCLING uniforms → mention the three tiers clearly.
When discussing SOCCER or OTHER SPORTS → focus on premium quality, 
customization options, and do NOT mention cycling tiers.
```

#### Cambio 3: Actualización de Seguimiento

```markdown
- If sport is CYCLING → ask which tier interests them (Standard/Elite/Premiere)
- If sport is SOCCER or OTHER → focus on style, customization, quantity
```

#### Cambio 4: Perfil de Lead

```markdown
TYPICAL LEAD PROFILE
- CYCLING: Coaches, team managers asking about tier differences
- SOCCER/OTHER: Teams asking about customization and pricing for single quality
```

---

## 🧪 Validación

### Pruebas Automatizadas (curl)

#### Test 1: Consulta de Fútbol ✅
```bash
curl -X POST https://kaven-bot.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hacen uniformes de futbol? Que opciones tienen?"}'
```

**Respuesta del bot:**
> "¡Claro que sí! En Kaven Sports hacemos uniformes de fútbol de calidad premium. 
> Te puedo ofrecer:
> - Jerseys (manga larga o corta)
> - Shorts
> - Medias
> - Kit completo
> 
> Todo 100% personalizable..."

✅ **NO menciona Standard/Elite/Premiere**  
✅ **Menciona "calidad premium"**  
✅ **Enfoca en productos específicos de fútbol**

#### Test 2: Consulta de Ciclismo ✅
```bash
curl -X POST https://kaven-bot.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quiero uniformes de ciclismo, que opciones tienen?"}'
```

**Respuesta del bot:**
> "¡Excelente! Tenemos 3 líneas de uniformes de ciclismo:
> 
> **Standard** ($X)
> - Polyester performance básico...
> 
> **Elite** ($Y)
> - Tejidos técnicos italianos...
> 
> **Premiere** ($Z)
> - Lo mejor de lo mejor..."

✅ **SÍ menciona los 3 tiers**  
✅ **Explica diferencias entre niveles**  
✅ **Comportamiento correcto para ciclismo**

#### Test 3: Consulta de Baseball (inglés) ✅
```bash
curl -X POST https://kaven-bot.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Do you make baseball uniforms? What are my options?"}'
```

**Respuesta del bot:**
> "Yes! We make premium quality custom baseball uniforms. You can get:
> - Baseball jerseys (button-up or pullover)
> - Baseball pants
> - Baseball shorts
> - Complete uniform packages
> 
> Everything is fully customizable..."

✅ **NO menciona cycling tiers**  
✅ **Menciona "premium quality"**  
✅ **Responde en inglés correctamente**

### Prueba en Vivo (GUI) ✅

**Sitio:** kavensports.com  
**Consulta:** "Hacen uniformes de futbol?"

**Resultado:**
- ✅ Bot responde correctamente
- ✅ Menciona "una sola calidad premium"
- ✅ Lista productos de fútbol específicos
- ✅ NO menciona Standard/Elite/Premiere

---

## 📊 Comparación Antes vs. Después

| Deporte | Antes | Después |
|---------|-------|---------|
| **Ciclismo** | ✅ Menciona 3 tiers | ✅ Menciona 3 tiers ← Correcto |
| **Fútbol** | ❌ Menciona 3 tiers | ✅ Menciona "calidad premium" ← Corregido |
| **Baseball** | ❌ Menciona 3 tiers | ✅ Menciona "premium quality" ← Corregido |
| **Basketball** | ❌ Menciona 3 tiers | ✅ Menciona "calidad premium" ← Corregido |

---

## 📁 Archivos Modificados

| Archivo | Cambios | Líneas | Commit |
|---------|---------|--------|--------|
| `server.js` | `systemPrompt` actualizado | ~50-150 | `c81e3a5` |

### Ubicación del Código

```javascript
// server.js, líneas ~50-150
const systemPrompt = `
⚠️ VERY IMPORTANT — PRODUCT LINES BY SPORT ⚠️

CYCLING PRODUCT LINE (3 tiers):
  - Standard: Entry polyester, basic performance
  - Elite: Premium technical fabrics, advanced features
  - Premiere: Italian premium, pro-level

SOCCER / FÚTBOL PRODUCT LINE (single premium quality):
  ...
`;
```

---

## 🎓 Lecciones Aprendidas

1. **El contexto importa:** Un mismo producto (uniformes deportivos) tiene diferentes estructuras de oferta según el deporte
2. **Secciones destacadas en prompts:** Usar `⚠️ VERY IMPORTANT` ayuda al LLM a priorizar esas instrucciones
3. **Testing multi-idioma:** Validar en español E inglés es crucial para un bot bilingüe
4. **Tests automatizados útiles:** `curl` permite validar cambios rápidamente sin GUI

---

## 🔗 Referencias

- **Backend deployment:** https://kaven-bot.onrender.com
- **Repositorio GitHub:** https://github.com/jreyesilc/kaven-bot
- **Documentación relacionada:**
  - [Análisis de mejores prácticas para formularios](2026-06-28_analisis_mejores_practicas_formularios.md)
  - [Configuración del chatbot](../configuracion/zoho_salesiq_config.md)

---

**Documentado por:** Abacus AI Agent  
**Revisado por:** Juan Reyes (Kaven Sports)
