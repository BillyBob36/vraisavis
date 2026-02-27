#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "Container: $EVO"

# Verify new config
echo "=== New browser config ==="
docker exec $EVO env | grep -E 'CONFIG_SESSION_PHONE|LOG_BAILEYS'

# Delete old instance
echo "=== Deleting old instance ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" \
  -H "apikey: $EVO_KEY"
echo ""
sleep 2

# Create new
echo "=== Creating new instance ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status'))"

echo "=== Watching logs for 30s ==="
timeout 30 docker logs -f $EVO 2>&1 | grep -v 'Browser\|Baileys version env\|Group Ignore' | grep -E 'vraisavis-bot|QR|qr|error|ERROR|state|connect|open|close|warn|WARN|socket|timeout' &
BGPID=$!
sleep 30
kill $BGPID 2>/dev/null

echo ""
echo "=== Final instance state ==="
curl -s "https://evolution.vraisavis.fr/instance/fetchInstances" \
  -H "apikey: $EVO_KEY" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for i in d:
    print(f\"  {i['name']}: {i['connectionStatus']}\")
" 2>/dev/null
