#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID="xck88kk4880ocoss4wgoswsk"
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
# Latest stable from wppconnect.io 2026-02-27
VERSION="2.3000.1034191470"
VERSION_NUMS="2,3000,1034191470"

echo "Container: $EVO"
echo "Setting version: $VERSION"

# 1. Patch baileys-version.json in current container immediately
echo "{\"version\":[$VERSION_NUMS]}" | docker exec -i $EVO sh -c "cat > /evolution/node_modules/baileys/lib/Defaults/baileys-version.json"
echo "Patched baileys-version.json:"
docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json

echo ""
# 2. Update CONFIG_SESSION_PHONE_VERSION in Coolify (for persistence after redeploy)
# Get all envs and delete existing CONFIG_SESSION_PHONE_VERSION
python3 << PYEOF
import json, subprocess

TOKEN = "$TOKEN"
EVO_UUID = "$EVO_UUID"

def api(method, path, data=None):
    args = ['curl', '-s', '-X', method,
            f'http://localhost:8000/api/v1{path}',
            '-H', f'Authorization: Bearer {TOKEN}',
            '-H', 'Content-Type: application/json']
    if data:
        args += ['-d', json.dumps(data)]
    r = subprocess.run(args, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return r.stdout

envs = api('GET', f'/applications/{EVO_UUID}/envs')
for e in envs:
    if e['key'] == 'CONFIG_SESSION_PHONE_VERSION':
        print(f"Removing old CONFIG_SESSION_PHONE_VERSION={e['value']}")
        api('DELETE', f'/applications/{EVO_UUID}/envs/{e["uuid"]}')

result = api('POST', f'/applications/{EVO_UUID}/envs',
             {"key": "CONFIG_SESSION_PHONE_VERSION", "value": "$VERSION", "is_preview": False})
print(f"Set CONFIG_SESSION_PHONE_VERSION=$VERSION -> {result.get('uuid','?')}")
PYEOF

echo ""
# 3. Delete and recreate instance immediately (no redeploy needed — patch is live)
echo "=== Deleting instance ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" -H "apikey: $EVO_KEY"
echo ""
sleep 2

echo "=== Creating fresh instance ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))"

echo ""
echo "=== Polling QR (20s) ==="
for i in $(seq 1 6); do
  sleep 3
  RESP=$(curl -s "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" -H "apikey: $EVO_KEY")
  COUNT=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else [d]; print(sum(1 for i in items if i.get('base64')))" 2>/dev/null)
  echo "  [$i] QR count=$COUNT"
  if [ "$COUNT" != "0" ] && [ -n "$COUNT" ]; then
    echo "QR READY — scan on https://evolution.vraisavis.fr/manager"
    break
  fi
done
