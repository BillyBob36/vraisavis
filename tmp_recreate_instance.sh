#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Delete old instance ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" \
  -H "apikey: $EVO_KEY"
echo ""

sleep 2

echo "=== Create fresh instance ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -m json.tool 2>/dev/null
echo ""

echo "=== Auth chain env vars in new container ==="
NEW_EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
docker exec $NEW_EVO env | grep -E 'DATABASE_SAVE'

echo ""
echo "=== Wait 15s then check logs for QR/state ==="
sleep 15
docker logs $NEW_EVO 2>&1 | grep -v 'Browser\|Baileys version\|Group Ignore' | tail -15
