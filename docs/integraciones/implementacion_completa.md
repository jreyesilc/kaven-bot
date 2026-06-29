# Implementación del script `meta-lead-context.js` en Zoho Sites

Fecha: 2026-06-29
Proyecto: Kaven Bot / Kaven Sports
Página objetivo: `https://www.kavensports.com/catalogo-ciclismo`
Archivo fuente: `/home/ubuntu/github_repos/kaven-bot/landing/meta-lead-context.js`

## Resumen ejecutivo

Se accedió a Zoho Sites, se localizó el sitio **Kaven** (`www.kavensports.com`) y la página **Catalogo Ciclismo** (`catalogo-ciclismo`). Se agregó el contenido de `meta-lead-context.js` dentro del campo **Editar página → Código de encabezado** y se publicó el sitio.

Durante la verificación pública se detectó un problema crítico: la página empezó a mostrar parte del JavaScript como texto visible. La causa identificada es que el archivo original contiene, dentro de un comentario de documentación, la cadena literal `</script>` en el ejemplo de carga externa. Al pegar el archivo completo dentro de un bloque `<script>...</script>`, el navegador interpreta ese `</script>` interno como cierre real del script, corta el bloque prematuramente y renderiza el resto como texto.

## Estado actual

La publicación inicial sí se aplicó, pero **la implementación no debe considerarse completa todavía** porque la landing pública sigue mostrando código JavaScript visible. Se preparó una versión corregida en `/tmp/kaven_script_wrapped_fixed.html`, reemplazando la cadena interna `</script>` por `<\/script>` para que pueda vivir de forma segura dentro de un script inline. Sin embargo, después de intentar reabrir el editor de Zoho Sites para sustituir el bloque, el builder quedó detenido en pantalla de carga “Por favor, espere”, por lo que no fue posible completar la corrección dentro del presupuesto seguro de reintentos de UI.

## Evidencia de acciones realizadas

1. Se abrió Zoho Sites y se visualizó el sitio **Kaven** en el panel de sitios.
2. Se buscó `catalogo-ciclismo` en la sección **Páginas**.
3. Se abrió **Editar información de la página**.
4. Se pegó el script en **Código de encabezado**.
5. Se guardó la página; Zoho mostró “Página actualizada”.
6. Se publicó el sitio; Zoho mostró “Los cambios han sido publicados”.
7. Se abrió la landing pública y se observó código JavaScript visible, confirmando que el cierre `</script>` interno rompió el bloque inline.

Screenshots de referencia generados durante la sesión:

- Zoho Sites / sitio Kaven localizado: `/home/ubuntu/screenshots/screenshot_1782774707000.png`
- Página `Catalogo Ciclismo` encontrada: `/home/ubuntu/screenshots/screenshot_1782774722908.png`
- Campo **Código de encabezado** abierto: `/home/ubuntu/screenshots/screenshot_1782774748636.png`
- Script pegado en Header Code: `/home/ubuntu/screenshots/screenshot_1782774883370.png`
- Guardado con mensaje “Página actualizada”: `/home/ubuntu/screenshots/screenshot_1782774903062.png`
- Publicación completada con mensaje “Los cambios han sido publicados”: `/home/ubuntu/screenshots/screenshot_1782774927577.png`
- Verificación pública mostrando el código como texto visible: `/home/ubuntu/screenshots/screenshot_1782774935147.png`
- Verificación con parámetros Meta mostrando el mismo problema visible: `/home/ubuntu/screenshots/screenshot_1782775163194.png`

## Resultado de verificación

La prueba solicitada `window.KavenMetaLead` no pudo validarse exitosamente porque el bloque quedó cortado antes de terminar. La página pública carga, pero el script no queda instalado de forma funcional y parte del código aparece como texto visible en la landing.

La URL de prueba usada fue:

`https://www.kavensports.com/catalogo-ciclismo?source=meta&name=Test+Usuario&phone=%2B526641234567&sport=ciclismo&quantity=5`

El widget de Zoho SalesIQ sí aparece en la landing, pero no se pudo confirmar que `window.KavenMetaLead.getContext()` o la API global equivalente devuelvan los datos capturados, porque la inyección inline quedó rota.

## Corrección necesaria

Para completar la implementación en Zoho Sites, se debe reemplazar el contenido actual del **Código de encabezado** de la página `Catalogo Ciclismo` por una de estas dos opciones:

### Opción recomendada: versión inline segura

Usar el contenido de `/tmp/kaven_script_wrapped_fixed.html`, que contiene el archivo original dentro de `<script>...</script>` pero con el `</script>` del comentario escapado como `<\/script>`.

### Opción alternativa: limpiar el comentario problemático

Editar `/home/ubuntu/github_repos/kaven-bot/landing/meta-lead-context.js` antes de pegarlo y cambiar esta línea de comentario:

```js
*     archivo externo:  <script src="/js/meta-lead-context.js" defer></script>
```

por:

```js
*     archivo externo:  <script src="/js/meta-lead-context.js" defer><\/script>
```

o eliminar ese ejemplo del comentario.

Después, pegar de nuevo todo el bloque en **Código de encabezado**, guardar y publicar.

## Checklist pendiente tras corregir

Cuando Zoho Sites permita volver a editar la página, se debe repetir la verificación completa:

1. Abrir `https://www.kavensports.com/catalogo-ciclismo` y confirmar que no se muestre código JavaScript visible.
2. En consola ejecutar `window.KavenMetaLead` y confirmar que devuelve un objeto.
3. Abrir `https://www.kavensports.com/catalogo-ciclismo?source=meta&name=Test+Usuario&phone=%2B526641234567&sport=ciclismo&quantity=5`.
4. Ejecutar en consola `window.KavenMetaLead.get()` o el método disponible en el objeto global.
5. Confirmar que los campos capturados incluyan `source=meta`, `name=Test Usuario`, `phone=+526641234567`, `sport=ciclismo` y `quantity=5`.
6. Abrir el Zobot y verificar que use el nombre del lead en el saludo.

## Nota técnica importante

El archivo fuente actual expone los métodos `get()`, `isMetaLead()`, `payloadString()`, `reinject()` y `clear()`. La instrucción original mencionaba `getContext()`, pero el archivo actual no define ese método. Si se requiere compatibilidad exacta con `window.KavenMetaLead.getContext()`, debe agregarse un alias en `buildGlobalApi`, por ejemplo:

```js
getContext: function () { return data ? JSON.parse(JSON.stringify(data)) : null; }
```

Esto permitiría que tanto `window.KavenMetaLead.get()` como `window.KavenMetaLead.getContext()` funcionen durante las pruebas.
