#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
PG=$(docker ps --format '{{.Names}}' | grep x4osww00 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Container: $EVO ==="
echo "=== Postgres: $PG ==="

# Check what baileys-version.json currently has
echo ""
echo "=== Current baileys-version.json ==="
docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json

# Check CONFIG_SESSION_PHONE_VERSION in container env
echo ""
echo "=== CONFIG_SESSION_PHONE_VERSION in container ==="
docker exec $EVO env | grep PHONE_VERSION || echo "NOT SET in container env"

# Purge ALL settings from DB that might have a cached version
echo ""
echo "=== Purge Setting table in DB ==="
docker exec $PG psql -U vraisavis -d evolution_api -c "
  DELETE FROM evolution.\"Setting\";
  DELETE FROM evolution.\"Instance\";
  SELECT 'DB purged' as status;
" 2>/dev/null

# Also purge local instances folder
echo ""
echo "=== Purge local instances folder ==="
docker exec $EVO rm -rf /evolution/instances/ 2>/dev/null
docker exec $EVO mkdir -p /evolution/instances/ 2>/dev/null
echo "Done"

# Ensure baileys-version.json has the latest version
echo ""
echo "=== Setting baileys-version.json to 1034191470 ==="
echo '{"version":[2,3000,1034191470]}' | docker exec -i $EVO sh -c "cat > /evolution/node_modules/baileys/lib/Defaults/baileys-version.json"
docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json

# Recreate instance
echo ""
echo "=== Creating fresh instance ==="
sleep 2
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))"

# Watch logs for 30s - looking for actual version used
echo ""
echo "=== Logs for 30s (watching for version and QR) ==="
sleep 30
docker logs --since 35s $EVO 2>&1 | grep -v 'Group Ignore' | tail -20
