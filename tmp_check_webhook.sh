#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "Container: $EVO"

echo "=== Check global webhook ==="
curl -s "http://$EVO:8080/webhook/find/global" -H "apikey: $EVO_KEY" | python3 -m json.tool 2>/dev/null || echo "(empty)"

echo "=== Set global webhook ==="
curl -s -X POST "http://$EVO:8080/webhook/set/global" \
  -H "Content-Type: application/json" \
  -H "apikey: $EVO_KEY" \
  -d '{
    "url": "https://api.vraisavis.fr/api/v1/whatsapp/webhook",
    "enabled": true,
    "events": ["MESSAGES_UPSERT","CONNECTION_UPDATE","QRCODE_UPDATED"],
    "webhookByEvents": false,
    "webhookBase64": true
  }' | python3 -m json.tool 2>/dev/null || echo "(empty or error)"

echo "=== Verify webhook set ==="
curl -s "http://$EVO:8080/webhook/find/global" -H "apikey: $EVO_KEY" | python3 -m json.tool 2>/dev/null || echo "(empty)"
