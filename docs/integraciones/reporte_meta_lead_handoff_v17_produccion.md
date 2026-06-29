# Reporte de implementación: Meta Lead Handoff v17 en producción

Fecha: 2026-06-29

## Resumen

Se accedió a Zoho SalesIQ con la sesión guardada en el navegador de la VM y se localizó el Zobot **Kaven Sports** en `Settings → Bots → Zobot → Kaven Sports → Controlador de mensajes`.

Se cargó en el editor de Zoho el archivo local:

`/home/ubuntu/github_repos/kaven-bot/salesiq/message_handler_v17_meta_aware.deluge`

El editor muestra correctamente el encabezado `MESSAGE HANDLER v17 - META AWARE`, lo cual confirma que el contenido v17 fue pegado en el Message Handler.

## Estado de publicación en Zoho SalesIQ

El código v17 quedó visible en el editor de Zoho y el botón **Publicar** permaneció disponible. Se intentó publicar desde la interfaz; sin embargo, la interfaz no mostró una confirmación inequívoca de publicación ni un mensaje final de éxito. Por esta razón, el estado debe considerarse como **código v17 cargado en el editor, publicación pendiente de confirmación visual**.

Evidencia del handler v17 cargado en el editor:

![Handler v17 cargado](../../../../screenshots/screenshot_1782774233762.png)

Evidencia del editor con controles de publicar visibles:

![Editor Zoho con publicar](../../../../screenshots/screenshot_1782774168916.png)

## Verificación del script público en la landing

Se verificó la URL pública:

`https://www.kavensports.com/landing/meta-lead-context.js`

Resultado: **404 - File Not Found**. El archivo local existe en el repositorio, pero todavía no está publicado en el sitio web de Kaven Sports.

Esto implica que la landing actualmente no puede inyectar automáticamente los datos de Meta al visitante mediante `$zoho.salesiq.visitor.info(...)`, por lo que el handoff v17 no puede activarse end-to-end en producción hasta agregar el script al HTML/CMS/hosting.

## Testing del flujo Meta

Se abrió la URL de prueba:

`https://www.kavensports.com/catalogo-ciclismo?source=meta&name=Juan+Test&phone=+526641234567&sport=ciclismo&quantity=10&date=2+semanas&design=necesito_ayuda`

La página cargó correctamente y el widget de Zobot estuvo disponible.

Evidencia de la landing con parámetros Meta:

![Landing con parámetros Meta](../../../../screenshots/screenshot_1782774189751.png)

Evidencia del Zobot abierto:

![Zobot abierto](../../../../screenshots/screenshot_1782774207805.png)

Resultado observado: el bot saludó con el mensaje estándar:

`Hi 👋 welcome to Kaven Sports! How can I help you today?`

No saludó por nombre como `Hola Juan Test!`. Esto es consistente con la ausencia del script público `/landing/meta-lead-context.js`, porque los parámetros de URL aún no están siendo transferidos al contexto del visitante de SalesIQ.

Evidencia del saludo estándar sin handoff Meta:

![Saludo estándar sin contexto Meta](../../../../screenshots/screenshot_1782774222882.png)

## Qué se logró

Se accedió exitosamente a Zoho SalesIQ, se localizó el Message Handler del Zobot Kaven Sports y se cargó el código v17 Meta Aware en el editor. También se verificó la landing real y se documentó el estado público del script requerido.

## Qué requiere acceso adicional

Para completar el handoff end-to-end se requiere acceso al hosting, CMS o editor del sitio web de Kaven Sports para publicar el archivo:

`/landing/meta-lead-context.js`

y agregarlo al HTML de la landing de ciclismo, idealmente antes o después del snippet de Zoho SalesIQ según la guía en:

`/home/ubuntu/github_repos/kaven-bot/docs/integraciones/meta_lead_handoff.md`

También se recomienda confirmar manualmente en Zoho que el botón **Publicar** haya guardado el handler v17, porque la UI no mostró confirmación final visible durante esta sesión.

## Resultado final

La implementación quedó parcialmente aplicada: el handler v17 está cargado en el editor de Zoho, pero el flujo completo de Meta Lead Handoff no queda validado en producción porque falta publicar el script de landing y no hubo confirmación visual inequívoca de publicación del handler en Zoho.
