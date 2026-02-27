#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "Container: $EVO"
echo "Version in container:"
docker exec $EVO env | grep -E 'npm_package_version|SERVER_URL' | head -3

echo ""
echo "=== Creating fresh instance (DB and local folder already purged) ==="
RESULT=$(curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"test-fresh","integration":"WHATSAPP-BAILEYS","qrcode":true}')
echo "$RESULT" | python3 -m json.tool 2>/dev/null | head -15

echo ""
echo "=== ALL logs next 45s (no filter) ==="
docker logs -f $EVO 2>&1 &
PID=$!
sleep 45
kill $PID 2>/dev/null

echo ""
echo "=== QR check ==="
curl -s "https://evolution.vraisavis.fr/instance/connect/test-fresh" \
  -H "apikey: $EVO_KEY" | head -c 300
