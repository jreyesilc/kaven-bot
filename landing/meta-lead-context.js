/* ==========================================================================
 * KAVEN SPORTS · META LEAD CONTEXT  (meta-lead-context.js)
 * --------------------------------------------------------------------------
 * OBJETIVO
 *   Evitar que el Zobot (Zoho SalesIQ) vuelva a preguntar datos que el lead
 *   YA respondio en el formulario/cuestionario de Meta (Instant Form /
 *   Messenger). Para lograrlo, este script:
 *
 *     1. Captura los parametros de la URL con los que Meta abre la landing:
 *        ?source=meta&name=XXX&phone=XXX&sport=XXX&quantity=XXX&date=XXX&design=XXX
 *        (tambien acepta utm_source, lead_id, email y campaign).
 *     2. Guarda esos datos de forma persistente en localStorage Y sessionStorage
 *        (sobreviven a recargas y a la navegacion interna de la landing).
 *     3. Inyecta los datos al visitante de Zoho SalesIQ usando la API oficial
 *        $zoho.salesiq.visitor.info()/name()/email()/contactnumber(), de modo
 *        que el Message Handler en Deluge pueda LEERLOS (objeto `visitor`).
 *     4. Expone una funcion/objeto GLOBAL (window.KavenMetaLead) para que
 *        cualquier otro script del sitio o SalesIQ pueda consumir el contexto.
 *
 * COMPATIBILIDAD
 *   - Vanilla JS (sin dependencias). Compatible con todos los navegadores
 *     modernos. Se puede pegar en el <head> de la landing o cargar como
 *     archivo externo:  <script src="/js/meta-lead-context.js" defer></script>
 *   - Debe cargarse DESPUES (o junto) del snippet de Zoho SalesIQ. El script
 *     espera de forma segura a que $zoho.salesiq este listo antes de inyectar.
 *
 * SEGURIDAD / PRIVACIDAD
 *   - Solo se guardan datos si efectivamente vienen de Meta (source=meta* o
 *     existe lead_id). No se rastrea trafico organico/directo.
 *   - Los datos se limpian (trim, longitud maxima) antes de almacenarse.
 * ========================================================================== */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // CONFIGURACION
  // ---------------------------------------------------------------------------
  var STORAGE_KEY = "kaven_meta_lead";     // clave en local/sessionStorage
  var PORTAL_DEBUG = false;                // poner true para ver logs en consola
  var MAX_LEN = 120;                       // longitud maxima por campo (sanitizacion)
  var ZOHO_WAIT_MS = 500;                  // intervalo de polling para $zoho.salesiq
  var ZOHO_MAX_TRIES = 40;                 // ~20s esperando a que cargue SalesIQ
  // Backend que respalda el handoff (v18): el handler Deluge consulta aqui el
  // contexto de Meta por nombre/telefono, porque los campos personalizados de
  // visitor.info() NO llegan de forma confiable a Deluge.
  var BACKEND_URL = "https://kaven-bot.onrender.com";

  function log() {
    if (PORTAL_DEBUG && window.console) {
      console.log.apply(console, ["[KavenMetaLead]"].concat([].slice.call(arguments)));
    }
  }

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  /** Limpia y acota un valor de texto proveniente de la URL. */
  function clean(value) {
    if (value === null || value === undefined) {
      return "";
    }
    var v = ("" + value).trim();
    // El Message Handler en Deluge parsea el payload usando '|' como separador
    // y '=' como delimitador clave/valor. Neutralizamos esos caracteres dentro
    // de los valores para no romper el parseo aguas abajo.
    v = v.replace(/\|/g, " ").replace(/=/g, " ");
    // URLSearchParams ya decodifica; solo recortamos longitud por seguridad.
    if (v.length > MAX_LEN) {
      v = v.substring(0, MAX_LEN);
    }
    return v;
  }

  /** Lee un parametro probando varios alias (el primero no vacio gana). */
  function pick(params, names) {
    for (var i = 0; i < names.length; i++) {
      var val = clean(params.get(names[i]));
      if (val !== "") {
        return val;
      }
    }
    return "";
  }

  /** Acceso seguro a Storage (algunos navegadores bloquean en modo privado). */
  function safeStorage(kind) {
    try {
      var s = kind === "local" ? window.localStorage : window.sessionStorage;
      var testKey = "__kvn_test__";
      s.setItem(testKey, "1");
      s.removeItem(testKey);
      return s;
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // 1) CAPTURA DE PARAMETROS DE LA URL
  // ---------------------------------------------------------------------------
  function captureFromUrl() {
    var params = new URLSearchParams(window.location.search || "");

    var data = {
      source:   pick(params, ["source", "utm_source"]),
      lead_id:  pick(params, ["lead_id", "leadgen_id", "fb_lead_id"]),
      campaign: pick(params, ["campaign", "utm_campaign"]),
      medium:   pick(params, ["medium", "utm_medium"]),
      name:     pick(params, ["name", "full_name", "first_name"]),
      email:    pick(params, ["email"]),
      phone:    pick(params, ["phone", "phone_number", "tel"]),
      sport:    pick(params, ["sport", "deporte", "uniform_type", "tipo_uniforme"]),
      quantity: pick(params, ["quantity", "cantidad", "qty"]),
      date:     pick(params, ["date", "fecha", "delivery_date", "fecha_entrega"]),
      design:   pick(params, ["design", "diseno", "design_status", "estado_diseno"]),
      lang:     pick(params, ["lang", "idioma"]),
      captured_at: new Date().toISOString()
    };

    return data;
  }

  /** ¿Estos datos realmente provienen de Meta? */
  function looksLikeMeta(data) {
    if (!data) {
      return false;
    }
    var src = (data.source || "").toLowerCase();
    var isMetaSource =
      src.indexOf("meta") >= 0 ||
      src.indexOf("facebook") >= 0 ||
      src.indexOf("fb") === 0 ||
      src.indexOf("instagram") >= 0 ||
      src.indexOf("ig") === 0;
    return isMetaSource || (data.lead_id && data.lead_id !== "");
  }

  // ---------------------------------------------------------------------------
  // 2) PERSISTENCIA (merge con lo ya guardado para no perder datos)
  // ---------------------------------------------------------------------------
  function readStored() {
    var stores = [safeStorage("session"), safeStorage("local")];
    for (var i = 0; i < stores.length; i++) {
      if (!stores[i]) {
        continue;
      }
      try {
        var raw = stores[i].getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function writeStored(data) {
    var json = JSON.stringify(data);
    var local = safeStorage("local");
    var session = safeStorage("session");
    if (local) {
      try { local.setItem(STORAGE_KEY, json); } catch (e) {}
    }
    if (session) {
      try { session.setItem(STORAGE_KEY, json); } catch (e) {}
    }
  }

  /** Combina datos previos con los nuevos (los nuevos no vacios mandan). */
  function mergeData(prev, next) {
    var out = {};
    var keys = ["source", "lead_id", "campaign", "medium", "name", "email",
                "phone", "sport", "quantity", "date", "design", "lang", "captured_at"];
    prev = prev || {};
    next = next || {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      out[k] = (next[k] && next[k] !== "") ? next[k] : (prev[k] || "");
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // 3) INYECCION HACIA ZOHO SALESIQ
  // ---------------------------------------------------------------------------
  // Construye un "payload" compacto y delimitado por '|' que el Message
  // Handler en Deluge puede parsear de forma trivial. Formato:
  //   META|name=...|phone=...|sport=...|quantity=...|date=...|design=...|lead_id=...
  function buildPayloadString(data) {
    function part(k, v) { return k + "=" + (v || ""); }
    return [
      "META",
      part("name", data.name),
      part("phone", data.phone),
      part("email", data.email),
      part("sport", data.sport),
      part("quantity", data.quantity),
      part("date", data.date),
      part("design", data.design),
      part("lead_id", data.lead_id),
      part("campaign", data.campaign),
      part("lang", data.lang)
    ].join("|");
  }

  function injectToSalesIQ(data) {
    if (typeof window.$zoho === "undefined" || !window.$zoho.salesiq) {
      return false;
    }
    try {
      var siq = window.$zoho.salesiq;

      // a) Campos estandar (aparecen como datos del visitante para el operador
      //    y quedan disponibles en Deluge: visitor.get("name"/"email"/"phone")).
      if (data.name && siq.visitor && siq.visitor.name) {
        siq.visitor.name(data.name);
      }
      if (data.email && siq.visitor && siq.visitor.email) {
        siq.visitor.email(data.email);
      }
      if (data.phone && siq.visitor && siq.visitor.contactnumber) {
        siq.visitor.contactnumber(data.phone);
      }

      // b) Informacion personalizada (visitor.info). El Message Handler la lee
      //    desde el objeto `visitor`. Mandamos un payload compacto + campos
      //    individuales legibles para el operador humano.
      if (siq.visitor && siq.visitor.info) {
        siq.visitor.info({
          "Lead Source": data.source || "meta",
          "kvn_meta": buildPayloadString(data),   // <- clave que parsea Deluge
          "Meta Sport": data.sport || "",
          "Meta Quantity": data.quantity || "",
          "Meta Delivery Date": data.date || "",
          "Meta Design Status": data.design || "",
          "Meta Lead ID": data.lead_id || "",
          "Meta Campaign": data.campaign || ""
        });
      }

      log("Datos inyectados a SalesIQ", data);
      return true;
    } catch (e) {
      log("Error inyectando a SalesIQ", e);
      return false;
    }
  }

  /** Reintenta inyectar hasta que $zoho.salesiq este disponible. */
  function injectWhenReady(data) {
    var tries = 0;
    // Camino feliz: usar el callback ready de SalesIQ si existe.
    if (typeof window.$zoho !== "undefined" && window.$zoho.salesiq) {
      var prevReady = window.$zoho.salesiq.ready;
      window.$zoho.salesiq.ready = function () {
        if (typeof prevReady === "function") {
          try { prevReady(); } catch (e) {}
        }
        injectToSalesIQ(data);
      };
    }
    // Respaldo: polling por si el snippet aun no expone .ready.
    var timer = setInterval(function () {
      tries++;
      if (injectToSalesIQ(data) || tries >= ZOHO_MAX_TRIES) {
        clearInterval(timer);
      }
    }, ZOHO_WAIT_MS);
  }

  // ---------------------------------------------------------------------------
  // 3.b) RESPALDO POR BACKEND  (canal confiable hacia el handler Deluge)
  // ---------------------------------------------------------------------------
  // Los campos personalizados de visitor.info() (p.ej. "kvn_meta") NO llegan
  // de forma confiable al handler Deluge del Zobot. SI llegan los estandar
  // (name/phone). Por eso enviamos TODO el contexto al backend, indexado por
  // nombre y telefono; el handler luego lo recupera con esos campos estandar.
  function postToBackend(data) {
    try {
      var payload = JSON.stringify({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        sport: data.sport || "",
        quantity: data.quantity || "",
        date: data.date || "",
        design: data.design || "",
        lead_id: data.lead_id || "",
        campaign: data.campaign || "",
        lang: data.lang || "es"
      });
      // fetch con keepalive: sobrevive aunque el usuario navegue de inmediato.
      if (window.fetch) {
        window.fetch(BACKEND_URL + "/meta-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
          mode: "cors"
        }).then(function () {
          log("Contexto Meta enviado al backend");
        }).catch(function (e) {
          log("Error enviando contexto al backend (fetch)", e);
        });
      } else {
        // Respaldo para navegadores muy antiguos.
        var xhr = new XMLHttpRequest();
        xhr.open("POST", BACKEND_URL + "/meta-context", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(payload);
      }
    } catch (e) {
      log("Error enviando contexto al backend", e);
    }
  }

  // ---------------------------------------------------------------------------
  // 4) API GLOBAL  (window.KavenMetaLead)
  // ---------------------------------------------------------------------------
  function buildGlobalApi(data) {
    return {
      /** Devuelve el objeto de datos del lead de Meta (o null). */
      get: function () { return data ? JSON.parse(JSON.stringify(data)) : null; },
      /** true si el visitante actual proviene de Meta. */
      isMetaLead: function () { return looksLikeMeta(data); },
      /** Payload compacto que consume el Message Handler de Deluge. */
      payloadString: function () { return data ? buildPayloadString(data) : ""; },
      /** Fuerza re-inyeccion manual hacia SalesIQ (util para debug). */
      reinject: function () { return injectToSalesIQ(data); },
      /** Limpia el contexto almacenado (al cerrar el ciclo del lead). */
      clear: function () {
        var local = safeStorage("local");
        var session = safeStorage("session");
        if (local) { try { local.removeItem(STORAGE_KEY); } catch (e) {} }
        if (session) { try { session.removeItem(STORAGE_KEY); } catch (e) {} }
        data = null;
      }
    };
  }

  // ---------------------------------------------------------------------------
  // EJECUCION PRINCIPAL
  // ---------------------------------------------------------------------------
  function init() {
    var fromUrl = captureFromUrl();
    var stored = readStored();

    // Si la URL trae datos de Meta, los combinamos y persistimos.
    // Si no, recuperamos lo que ya hubieramos guardado en una visita previa.
    var finalData;
    if (looksLikeMeta(fromUrl)) {
      finalData = mergeData(stored, fromUrl);
      if (!finalData.source) {
        finalData.source = "meta";
      }
      writeStored(finalData);
      log("Lead de Meta detectado en URL", finalData);
    } else if (stored && looksLikeMeta(stored)) {
      finalData = stored;
      log("Lead de Meta recuperado de storage", finalData);
    } else {
      finalData = null;
      log("Visitante directo/organico (sin contexto Meta).");
    }

    // Exponer API global SIEMPRE (aunque no haya datos, para consultas).
    window.KavenMetaLead = buildGlobalApi(finalData);

    // Inyectar a SalesIQ solo si hay contexto de Meta.
    if (finalData) {
      injectWhenReady(finalData);
      // Canal confiable (v18): registrar el contexto en el backend para que
      // el handler Deluge lo recupere por nombre/telefono.
      postToBackend(finalData);
    }
  }

  // Arrancar cuando el DOM este listo (o de inmediato si ya lo esta).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
