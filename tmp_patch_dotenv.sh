#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Patching /evolution/.env ==="
# Replace the old version with the current one
docker exec $EVO sed -i 's/CONFIG_SESSION_PHONE_VERSION=2\.3000\.1015901307/CONFIG_SESSION_PHONE_VERSION=2.3000.1034191470/' /evolution/.env

echo "Verify:"
docker exec $EVO grep 'CONFIG_SESSION_PHONE_VERSION' /evolution/.env

echo ""
echo "=== Delete and recreate instance ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" -H "apikey: $EVO_KEY"
echo ""
sleep 2

curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))"

echo ""
echo "=== Watch logs 20s ==="
sleep 20
docker logs --since 25s $EVO 2>&1 | grep -E 'Baileys version|QR|qr|open|close|REMOVED|LOGOUT' | tail -10
