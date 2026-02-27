#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
API_UUID="x840o4o8gwgccsoscs0gckok"
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

# 1. Switch EVOLUTION_API_URL to stable public URL
echo "=== Deleting old EVOLUTION_API_URL ==="
for UUID in $(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/applications/$API_UUID/envs" | python3 -c "import sys,json;[print(e['uuid']) for e in json.load(sys.stdin) if e['key']=='EVOLUTION_API_URL']"); do
  curl -s -X DELETE "http://localhost:8000/api/v1/applications/$API_UUID/envs/$UUID" -H "Authorization: Bearer $TOKEN"
  echo " Deleted $UUID"
done

echo "=== Setting EVOLUTION_API_URL to https://evolution.vraisavis.fr ==="
curl -s -X POST "http://localhost:8000/api/v1/applications/$API_UUID/envs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"EVOLUTION_API_URL","value":"https://evolution.vraisavis.fr","is_preview":false}'
echo ""

# 2. Configure global webhook on Evolution API
echo "=== Setting global webhook on Evolution API ==="
EVO_CONTAINER=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
curl -s -X POST "http://${EVO_CONTAINER}:8080/webhook/set/global" \
  -H "Content-Type: application/json" \
  -H "apikey: $EVO_KEY" \
  -d '{
    "url": "https://api.vraisavis.fr/api/v1/whatsapp/webhook",
    "enabled": true,
    "events": ["MESSAGES_UPSERT","CONNECTION_UPDATE","QRCODE_UPDATED"],
    "webhookByEvents": false,
    "webhookBase64": true
  }'
echo ""

# 3. Redeploy API
echo "=== Redeploying API ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=$API_UUID&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo ""
echo "=== Done ==="
