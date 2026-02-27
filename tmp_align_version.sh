#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Patching baileys-version.json to match CONFIG_SESSION_PHONE_VERSION ==="
echo '{"version":[2,3000,1034183557]}' | docker exec -i $EVO sh -c "cat > /evolution/node_modules/baileys/lib/Defaults/baileys-version.json"

echo "Verify:"
docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json

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
echo "=== Polling QR ==="
for i in $(seq 1 5); do
  sleep 4
  RESP=$(curl -s "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" -H "apikey: $EVO_KEY")
  COUNT=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else [d]; print(sum(1 for i in items if i.get('base64')))" 2>/dev/null)
  echo "  [$i] QR count=$COUNT"
  if [ "$COUNT" != "0" ] && [ -n "$COUNT" ]; then
    echo "QR ready — scan via https://evolution.vraisavis.fr/manager"
    break
  fi
done
