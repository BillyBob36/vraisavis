#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Check what version Baileys actually loads ==="
docker exec $EVO node -e "
const v = require('/evolution/node_modules/baileys/lib/Defaults/baileys-version.json');
console.log('Loaded version:', JSON.stringify(v));
"

echo ""
echo "=== Check if there's a BAILEYS_VERSION in env ==="
docker exec $EVO env | grep -i 'BAILEYS\|WA_VERSION\|WHATSAPP_VERSION'

echo ""
echo "=== Delete and recreate instance, then immediately check QR ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" -H "apikey: $EVO_KEY" > /dev/null
sleep 1
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' > /dev/null

echo "Polling QR every 3s for 60s..."
for i in $(seq 1 20); do
  sleep 3
  RESP=$(curl -s "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" -H "apikey: $EVO_KEY")
  COUNT=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else [d]; print(sum(1 for i in items if i.get('base64')))" 2>/dev/null)
  CODE=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else [d]; [print(i.get('code','')) for i in items if i.get('code')]" 2>/dev/null)
  echo "  [$i] QR count=$COUNT code=$CODE raw=$(echo $RESP | head -c 60)"
  if [ "$COUNT" != "0" ] && [ -n "$COUNT" ]; then
    echo "QR FOUND!"
    echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else [d]; [open('/tmp/qr.txt','w').write(i.get('base64','')) for i in items if i.get('base64')]"
    echo "Base64 saved to /tmp/qr.txt ($(wc -c < /tmp/qr.txt 2>/dev/null) bytes)"
    break
  fi
done
