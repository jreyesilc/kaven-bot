# 🔑 Cómo obtener el token OAuth de Zoho SalesIQ

Para que el script `auto_learn_weekly.py` pueda extraer conversaciones de SalesIQ, necesitas crear una aplicación OAuth en Zoho y obtener un `access_token`.

---

## Paso 1: Crear una aplicación OAuth en Zoho

1. Ir a https://api-console.zoho.com/
2. Hacer clic en **"Get Started"** o **"Add Client"**
3. Seleccionar **"Server-based Applications"**
4. Llenar el formulario:
   - **Client Name:** `Kaven Bot Auto-Learn` (o el nombre que prefieras)
   - **Homepage URL:** `https://kavensports.com`
   - **Authorized Redirect URIs:** `https://kaven-bot.onrender.com/oauth/callback` (puede ser cualquier URL válida, no se usará interactivamente)
5. Hacer clic en **"Create"**
6. **Guardar** el `Client ID` y `Client Secret` que aparecen

---

## Paso 2: Generar el código de autorización (una sola vez)

1. En tu navegador, abrir esta URL (reemplaza `<CLIENT_ID>` con tu Client ID):

```
https://accounts.zoho.com/oauth/v2/auth?scope=ZohoSalesIQ.chats.READ&client_id=<CLIENT_ID>&response_type=code&access_type=offline&redirect_uri=https://kaven-bot.onrender.com/oauth/callback
```

2. Iniciar sesión con tu cuenta de Zoho (la que tiene acceso a SalesIQ)
3. Aceptar los permisos (scope `ZohoSalesIQ.chats.READ`)
4. Serás redirigido a una URL como:
   ```
   https://kaven-bot.onrender.com/oauth/callback?code=1000.XXXXXX.YYYYYY
   ```
5. **Copiar el valor del parámetro `code`** (el que viene después de `code=`)

---

## Paso 3: Intercambiar el código por un access_token

Ejecutar este comando `curl` (reemplaza `<CODE>`, `<CLIENT_ID>` y `<CLIENT_SECRET>`):

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "code=<CODE>" \
  -d "client_id=<CLIENT_ID>" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "redirect_uri=https://kaven-bot.onrender.com/oauth/callback" \
  -d "grant_type=authorization_code"
```

**Respuesta esperada:**
```json
{
  "access_token": "1000.abcd1234...",
  "refresh_token": "1000.efgh5678...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Guardar:**
- `access_token` → lo usarás como `ZOHO_SALESIQ_ACCESS_TOKEN` (válido por 1 hora)
- `refresh_token` → para renovar el access_token cuando expire (válido por siempre)

---

## Paso 4: Obtener el Portal ID de SalesIQ

1. Ir a https://salesiq.zoho.com
2. En el menú lateral: **Settings → Developers → API**
3. Copiar el **Portal ID** (ejemplo: `jreyesilcmx`)

---

## Paso 5: Configurar las variables de entorno

Crear un archivo `.env` en `/home/ubuntu/github_repos/kaven-bot/rag/` con:

```bash
ZOHO_SALESIQ_PORTAL_ID=jreyesilcmx
ZOHO_SALESIQ_ACCESS_TOKEN=1000.abcd1234...
ZOHO_SALESIQ_REFRESH_TOKEN=1000.efgh5678...
ZOHO_CLIENT_ID=<tu Client ID>
ZOHO_CLIENT_SECRET=<tu Client Secret>
```

---

## Paso 6: Script de renovación automática del token

El `access_token` expira cada hora. Para renovarlo automáticamente, agregar este snippet al script `auto_learn_weekly.py` (ya está incluido en versiones futuras):

```python
import requests

def refresh_zoho_token():
    """Renueva el access_token usando el refresh_token."""
    url = "https://accounts.zoho.com/oauth/v2/token"
    data = {
        "refresh_token": os.getenv("ZOHO_SALESIQ_REFRESH_TOKEN"),
        "client_id": os.getenv("ZOHO_CLIENT_ID"),
        "client_secret": os.getenv("ZOHO_CLIENT_SECRET"),
        "grant_type": "refresh_token"
    }
    resp = requests.post(url, data=data)
    resp.raise_for_status()
    return resp.json()["access_token"]
```

---

## Resumen de variables necesarias

| Variable | Dónde obtenerla | Ejemplo |
|----------|----------------|---------|
| `ZOHO_SALESIQ_PORTAL_ID` | SalesIQ → Settings → Developers → API | `jreyesilcmx` |
| `ZOHO_SALESIQ_ACCESS_TOKEN` | Paso 3 (OAuth flow) | `1000.abcd1234...` |
| `ZOHO_SALESIQ_REFRESH_TOKEN` | Paso 3 (OAuth flow) | `1000.efgh5678...` |
| `ZOHO_CLIENT_ID` | API Console (Paso 1) | `1000.XXXXX` |
| `ZOHO_CLIENT_SECRET` | API Console (Paso 1) | `abc123def456` |

---

## Próximo paso

Una vez configuradas las variables, probar manualmente el script:

```bash
cd /home/ubuntu/github_repos/kaven-bot
source rag/.env  # o export manual de las variables
python3 rag/auto_learn_weekly.py
```

Si funciona, proceder a configurar la tarea programada semanal.
