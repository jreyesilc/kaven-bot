# ⚙️ Configuración: Actualizar Formularios de Meta (Kings → Kaven)

**Fecha:** 29 de junio, 2026  
**Tipo:** Configuración pendiente  
**Estado:** ⏳ PENDIENTE  
**Prioridad:** 🔴 ALTA (branding)

---

## 📋 Problema Identificado

Los formularios de leads en Meta Business Suite (Facebook/Instagram Instant Forms) todavía muestran el **nombre antiguo de la empresa** en el mensaje de agradecimiento:

> "En breve, un asesor de **KINGS SPORTSWEAR** te contactará por WhatsApp para enviarte una cotización personalizada."

Además, el botón **"Ver sitio web"** probablemente apunta a un landing page antiguo que ya no está en uso.

---

## 📸 Evidencia

![Captura del formulario con Kings Sportswear](../../Uploads/image%20(3).png)

**Visible en:**
- Formularios de leads de Facebook/Instagram
- Mensaje de confirmación después de completar el formulario
- Botón de acción "Ver sitio web"

---

## 🎯 Cambios Necesarios

### 1. Texto de Agradecimiento

**Actual (incorrecto):**
```
En breve, un asesor de KINGS SPORTSWEAR te contactará por 
WhatsApp para enviarte una cotización personalizada.

[Ver sitio web]
```

**Recomendado (optimizado):**
```
¡Gracias, [NOMBRE]! 🎯

Tu solicitud para uniformes de [DEPORTE] está registrada.

✅ Nuestro equipo revisará tu información
✅ Te contactaremos por WhatsApp al [TELÉFONO] en las próximas horas
✅ Recibirás una cotización personalizada

Mientras tanto, ¿quieres ver ejemplos de nuestros diseños?

[Ver Catálogo] [Iniciar Chat]
```

### 2. Botón "Ver sitio web"

**Verificar que apunte a:**
```
https://kavensports.com
```

**NO a:** `kingsportswear.com` o cualquier landing page antiguo

---

## 📍 Ubicación de los Formularios

### Meta Ads Manager → Formularios Instantáneos

**URL directa:**
```
https://business.facebook.com/latest/instant_forms/forms/
```

**Formularios identificados con nombre antiguo:**
1. **"Kings - Thinkers-copy"** (activo)
2. **"Kings - Thinkers"** (activo)

---

## 🔧 Pasos para Corregir

### ⚠️ Limitación Importante
Los formularios activos en Meta **NO se pueden editar directamente**. Debes crear un nuevo formulario.

### Proceso Recomendado

#### Paso 1: Crear Nuevo Formulario
1. Ve a [Meta Business Suite > Formularios instantáneos](https://business.facebook.com/latest/instant_forms/forms)
2. Haz clic en **"Crear formulario"** (botón azul)
3. Selecciona **"Duplicar formulario existente"** → elige "Kings - Thinkers-copy"

#### Paso 2: Actualizar Información
**En la sección "Introducción":**
- Título: "Cotización Uniformes Deportivos - Kaven Sports"
- Imagen de portada: Logo actualizado de Kaven Sports

**En la sección "Preguntas":**
- Mantener los 7 campos actuales (están bien estructurados)
- Opcional: reordenar según [análisis de mejores prácticas](../optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md)

**En la sección "Pantalla de agradecimiento":**
- ✅ Cambiar "KINGS SPORTSWEAR" → **"KAVEN SPORTS"**
- ✅ Actualizar URL del botón a `https://kavensports.com`
- ✅ Usar el texto optimizado (ver sección "Cambios Necesarios" arriba)

#### Paso 3: Configurar Opciones Avanzadas

**Tipo de formulario:**
- Recomendado: **"Higher Intent"** (incluye pantalla de revisión)
- Beneficio: Filtra leads de baja calidad (+40% mejor calidad)

**Política de privacidad:**
- Agregar link si tienes: `https://kavensports.com/privacidad`

#### Paso 4: Publicar y Probar
1. Haz clic en **"Publicar"**
2. Usa la herramienta de prueba de Meta: **"Meta Lead Ads Testing Tool"**
3. Completa un formulario de prueba y verifica:
   - ✅ Texto dice "Kaven Sports"
   - ✅ Botón va a kavensports.com
   - ✅ Lead se crea en Zoho CRM correctamente

#### Paso 5: Actualizar Anuncios Activos
1. Ve a **Meta Ads Manager**
2. Edita tus campañas activas de leads
3. Cambia el formulario de "Kings - Thinkers-copy" → **"Kaven Sports - [nuevo nombre]"**
4. Publica los cambios

#### Paso 6: Archivar Formularios Antiguos
1. Vuelve a Formularios instantáneos
2. Selecciona "Kings - Thinkers-copy" y "Kings - Thinkers"
3. Menú **"Acciones"** → **"Archivar"**
4. Confirma

---

## 📊 Campos Actuales del Formulario

Según la investigación, tus formularios tienen estos 7 campos (orden actual):

1. ¿Para cuándo necesitas los uniformes?
2. ¿Para cuántas personas sería el pedido?
3. ¿Qué tipo de uniforme te interesa personalizar?
4. Email
5. ¿Ya tienes tu diseño o necesitas ayuda para crearlo?
6. Nombre completo
7. Número de teléfono

**Evaluación:** ✅ Número óptimo de campos (3-5 es ideal, 7 está en el límite aceptable)

**Mejora opcional:** Reordenar según [análisis de mejores prácticas](../optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md#3%EF%B8%8F⃣-optimización-de-la-secuencia-de-preguntas)

---

## 🎯 Optimizaciones Adicionales Recomendadas

### Texto del Botón CTA
**Actual:** "Enviar" (genérico)  
**Recomendado:** "Obtener mi cotización gratis"  
**Beneficio:** +5-15% conversión

### Configuración de Performance Goal (Meta Ads)
**Actual:** Probablemente "Leads" (volumen)  
**Recomendado:** "Conversion Leads" (calidad)  
**Beneficio:** -19% costo por lead calificado  
**Requisito:** Integrar Zoho CRM con Meta Conversions API

---

## 📁 Referencias

### Documentación Relacionada
- [Análisis de mejores prácticas para formularios](../optimizaciones/2026-06-28_analisis_mejores_practicas_formularios.md) ⭐ LEER PRIMERO
- [Guía de publicación de cambios](../guias_implementacion/como_publicar_cambios.md)

### URLs Útiles
- **Meta Business Suite:** https://business.facebook.com
- **Formularios instantáneos:** https://business.facebook.com/latest/instant_forms/forms
- **Meta Ads Manager:** https://www.facebook.com/adsmanager
- **Meta Lead Ads Testing Tool:** [Buscar en Meta Business Help]

---

## ✅ Checklist de Implementación

- [ ] Crear nuevo formulario duplicando "Kings - Thinkers-copy"
- [ ] Actualizar texto de agradecimiento ("Kings" → "Kaven Sports")
- [ ] Verificar URL del botón (https://kavensports.com)
- [ ] Cambiar tipo de formulario a "Higher Intent"
- [ ] Cambiar botón CTA a "Obtener mi cotización gratis"
- [ ] Publicar formulario nuevo
- [ ] Probar con Meta Lead Ads Testing Tool
- [ ] Actualizar campañas activas para usar nuevo formulario
- [ ] Archivar formularios antiguos "Kings - Thinkers*"
- [ ] Verificar en producción que todo funciona

---

## 💡 Nota Importante

**Por qué no se hizo directamente desde la VM:**
- La navegación en Meta Business Suite desde el browser de la VM es lenta
- Requiere verificación de identidad que es más fácil hacer desde tu navegador local
- Meta tiene protecciones anti-automatización que pueden bloquear la VM

**Recomendación:** Hacer estos cambios **manualmente desde tu navegador local** siguiendo esta guía.

---

**Documentado por:** Abacus AI Agent  
**Para implementar por:** Juan Reyes (Kaven Sports)  
**Fecha de creación:** 29 de junio, 2026
