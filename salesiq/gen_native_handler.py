#!/usr/bin/env python3
"""Genera el Message Handler NATIVO de SalesIQ (OpenAI via invokeurl + Connection)
portando fielmente systemPrompt y detectBuyingSignals desde server.js."""
import re, json

SERVER = "/home/ubuntu/github_repos/kaven-bot/server.js"
src = open(SERVER, encoding="utf-8").read()

# --- 1. Extraer systemPrompt (entre los backticks) ---
m = re.search(r"const systemPrompt = `(.*?)`;", src, re.S)
system_prompt = m.group(1)

# Construir la cadena Deluge del systemPrompt por concatenación de líneas.
# Escapamos comillas dobles y backslashes. Cada línea termina en \n.
def deluge_escape(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')

lines = system_prompt.split("\n")
deluge_sp = "systemPrompt = \"\";\n"
for ln in lines:
    esc = deluge_escape(ln)
    deluge_sp += f'systemPrompt = systemPrompt + "{esc}\\n";\n'

# --- 2. Regex de detección de señales (alternancias Java) ---
# Portadas desde detectBuyingSignals (sin lookahead, compatibles con Java Pattern)
signal_regexes = {
    "pricing":        r"\\bprecio\\b|\\bprice\\b|\\bprices\\b|\\bpricing\\b|per\\s+unit|per\\s+piece|cuanto\\s+cuesta|cost(o|ar|s)?|how\\s+much|quote|cotiz(ar|acion)|\\bbudget\\b|\\$\\s*\\d",
    "quantity":       r"\\bcuantos\\b|\\bcantidad\\b|minimum\\s+order|minimo\\s+de\\s+(pedido|compra)|moq|how\\s+many|\\bunits?\\b|\\bpieces?\\b|\\bbulk\\b|\\bdozen\\b|\\d{1,6}\\s*(custom\\s+)?(uniforms?|jerseys?|shirts?|kits?|pieces?|units?|sets?|pcs?|players?|team)",
    "customization":  r"\\bdiseno\\b|personaliz(ar|ado)|customi[sz]e|custom\\b|logo|colores?|nombre\\s+en\\s+el\\s+uniforme",
    "timeline":       r"cuanto\\s+tiempo|\\bentrega\\b|delivery|when\\b|lead\\s*time|tiempo\\s+de\\s+produccion",
    "direct_interest":r"quiero\\s+cotizar|me\\s+interesa|i\\s*(am|'m)\\s+interested|want\\s+a\\s+quote|how\\s+to\\s+order|como\\s+ordeno|quiero\\s+comprar|listo\\s+para\\s+comprar",
}

sig_code = ""
for cat, rgx in signal_regexes.items():
    sig_code += f'if(norm.matches(".*({rgx}).*"))\n{{\n\tsignalCats.add("{cat}");\n}}\n'

# --- 3. Ensamblar el handler completo ---
handler = '''response = Map();
input = message.get("text");
inputText = "";
if(input != null)
{
\tinputText = "" + input;
}

// =========================================================================
// MESSAGE HANDLER v14 - NATIVO (OpenAI via invokeurl + Connection)
// =========================================================================
// CAMBIO: Elimina la llamada al backend Render. OpenAI se llama directo
// desde Deluge usando la Connection segura "openai_kaven" (API key NO
// expuesta en el codigo). detectBuyingSignals portado a Deluge nativo.
// El formulario corto v13 se mantiene identico.
// =========================================================================

// ---------------------------------------------------------------
// Productos del catalogo de ciclismo (botones "Get a quote")
// ---------------------------------------------------------------
allProducts = {"Standard Jersey","Elite Jersey","Premier Jersey","Standard Bib Short","Elite Bib Short","Premier Bib Short"};

clickedProduct = "";
if(inputText.indexOf("Quiero cotizar:") >= 0)
{
\tclickedProduct = inputText.getSuffix("Quiero cotizar:").trim();
\tprodSess = Map();
\tprodSess.put("lead_clicked_product",clickedProduct);
\tzoho.salesiq.visitorsession.set("jreyesilcmx",prodSess);
}

// Estado de sesion
captured = "false";
sess = zoho.salesiq.visitorsession.get("jreyesilcmx","lead_captured");
if(sess != null && sess.get("data") != null && sess.get("data").get("lead_captured") != null)
{
\tcaptured = sess.get("data").get("lead_captured");
}

// =========================================================================
// DETECCION DE SEnALES DE COMPRA (portado de detectBuyingSignals - nativo)
// =========================================================================
norm = inputText.toLowerCase();
norm = norm.replaceAll("á","a",true);
norm = norm.replaceAll("é","e",true);
norm = norm.replaceAll("í","i",true);
norm = norm.replaceAll("ó","o",true);
norm = norm.replaceAll("ú","u",true);
norm = norm.replaceAll("ñ","n",true);
norm = norm.replaceAll("ü","u",true);
norm = norm.replaceAll("\\\\s+"," ",false);
norm = norm.trim();

signalCats = List();
__SIGNALS__
collectContact = "false";
if(signalCats.size() > 0)
{
\tcollectContact = "true";
}

// Guardar senales en sesion para el Context Handler (creacion de lead)
sigSess = Map();
sigSess.put("lead_signals",signalCats.toString());
zoho.salesiq.visitorsession.set("jreyesilcmx",sigSess);

// =========================================================================
// LLAMADA A OPENAI (NATIVA - invokeurl + Connection segura)
// =========================================================================
__SYSTEMPROMPT__
msgs = List();
sysMsg = Map();
sysMsg.put("role","system");
sysMsg.put("content",systemPrompt);
msgs.add(sysMsg);
usrMsg = Map();
usrMsg.put("role","user");
usrMsg.put("content",inputText);
msgs.add(usrMsg);

bodyMap = Map();
bodyMap.put("model","gpt-4.1-mini");
bodyMap.put("temperature",0.7);
bodyMap.put("messages",msgs);

hdr = Map();
hdr.put("Content-Type","application/json");

reply = "";
try
{
\taiResp = invokeurl
\t[
\t\turl :"https://api.openai.com/v1/chat/completions"
\t\ttype :POST
\t\tparameters:bodyMap.toString()
\t\theaders:hdr
\t\tconnection:"openai_kaven"
\t];
\taiMap = aiResp.toMap();
\tchoices = aiMap.get("choices");
\tif(choices != null && choices.size() > 0)
\t{
\t\tfirstChoice = choices.get(0);
\t\tmsgObj = firstChoice.get("message");
\t\tif(msgObj != null)
\t\t{
\t\t\treply = msgObj.get("content");
\t\t}
\t}
}
catch (e)
{
\treply = "";
}
if(reply == null || reply == "")
{
\treply = "Gracias por escribir a Kaven Sports. Cuentame que deporte y cuantos uniformes necesitas y con gusto te ayudo con una cotizacion.";
}
reply = reply + "\\n\\n👉 https://kavensports.com";

// Si el visitante hizo clic en un boton de producto, forzar captura
if(clickedProduct != "")
{
\tcollectContact = "true";
}

// =========================================================================
// FORMULARIO CORTO (identico a v13)
// =========================================================================
if(captured != "true" && collectContact == "true")
{
\tresponse.put("action","context");
\tresponse.put("context_id","lead_details");
\tquestions = Collection();
\tq0 = {"name":"phone","replies":{{"text":"Perfecto! Para enviarte la cotizacion por WhatsApp, cual es tu numero?","field_name":"siq_phone"}},"input":{"type":"tel","placeholder":"+52 664 123 4567","error":{"Ingresa un numero valido"}}};
\tquestions.insert(q0);
\tq1 = {"name":"name","replies":{{"text":"Gracias! Y tu nombre es...?","field_name":"siq_name"}},"input":{"type":"name","placeholder":"Tu nombre completo"}};
\tquestions.insert(q1);
\tif(clickedProduct == "" || !allProducts.contains(clickedProduct))
\t{
\t\tprodOptions = List();
\t\tfor each p in allProducts
\t\t{
\t\t\tprodOptions.add(p);
\t\t}
\t\tprodOptions.add("Aun no estoy seguro");
\t\tq2 = {"name":"products","replies":{{"text":"Que producto te interesa cotizar? (puedes elegir uno o varios)"}},"input":{"type":"multiple-select","options":prodOptions,"min_selection":"1"}};
\t\tquestions.insert(q2);
\t}
\tresponse.put("questions",questions);
\treturn response;
}

response.put("action","reply");
response.put("replies",{reply});
return response;
'''

handler = handler.replace("__SIGNALS__", sig_code.rstrip())
handler = handler.replace("__SYSTEMPROMPT__", deluge_sp.rstrip())

with open("/home/ubuntu/zobot_message_handler_v14_native.deluge", "w", encoding="utf-8") as f:
    f.write(handler)

print("OK - handler v14 nativo generado")
print("Lineas:", handler.count(chr(10)))
print("Caracteres:", len(handler))
