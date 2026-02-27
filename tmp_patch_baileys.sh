#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Current baileys-version.json ==="
docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json

echo ""
echo "=== Fetching latest WhatsApp version from WhatsApp servers ==="
LATEST=$(docker exec $EVO node -e "
const https = require('https');
https.get('https://web.whatsapp.com/check-update?version=2.3000.1015901307&platform=web', (res) => {
  let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{ const j=JSON.parse(d); console.log(JSON.stringify(j)); }catch(e){ console.log(d.substring(0,200)); } });
}).on('error',e=>console.log('ERR:',e.message));
" 2>/dev/null)
echo "WhatsApp update check: $LATEST"

echo ""
echo "=== Fetching latest version from baileys GitHub ==="
BAILEYS_VER=$(curl -s "https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json" 2>/dev/null)
echo "Latest baileys version: $BAILEYS_VER"

if echo "$BAILEYS_VER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['version'])" 2>/dev/null; then
  echo ""
  echo "=== Patching baileys-version.json ==="
  echo "$BAILEYS_VER" | docker exec -i $EVO sh -c "cat > /evolution/node_modules/baileys/lib/Defaults/baileys-version.json"
  echo "Patched!"

  echo ""
  echo "=== Verify patch ==="
  docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json

  echo ""
  echo "=== Delete old instances ==="
  curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" -H "apikey: $EVO_KEY"
  curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/test-fresh" -H "apikey: $EVO_KEY"
  echo ""

  sleep 2

  echo "=== Create fresh instance ==="
  curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
    -H "apikey: $EVO_KEY" \
    -H "Content-Type: application/json" \
    --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))"

  echo "=== Watch logs 30s for QR event ==="
  sleep 30
  docker logs --since 35s $EVO 2>&1 | grep -v 'Browser:\|Baileys version env:\|Group Ignore:' | tail -20
else
  echo "Failed to fetch latest version from GitHub"
fi
