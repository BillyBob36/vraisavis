#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
PG=$(docker ps --format '{{.Names}}' | grep x4osww00 | head -1)

echo "=== Evolution container: $EVO ==="
echo "=== PostgreSQL container: $PG ==="

echo ""
echo "=== Delete vraisavis-bot via API ==="
curl -s -X DELETE "https://evolution.vraisavis.fr/instance/delete/vraisavis-bot" \
  -H "apikey: $EVO_KEY"
echo ""

sleep 2

echo "=== Purge ALL auth data from PostgreSQL evolution schema ==="
docker exec $PG psql -U vraisavis -d evolution_api -c "
  DELETE FROM evolution.\"Auth\" WHERE \"instanceId\" IN (
    SELECT id FROM evolution.\"Instance\" WHERE name = 'vraisavis-bot'
  );
  DELETE FROM evolution.\"Instance\" WHERE name = 'vraisavis-bot';
  SELECT 'Cleaned' as status;
" 2>/dev/null || echo "Tables may have different names, trying alternative..."

# Try with lowercase table names
docker exec $PG psql -U vraisavis -d evolution_api -c "
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'evolution' ORDER BY table_name;
" 2>/dev/null

echo ""
echo "=== Also purge local instance folder ==="
docker exec $EVO rm -rf /evolution/instances/vraisavis-bot 2>/dev/null && echo "Local folder purged" || echo "No local folder"

echo ""
echo "=== Recreate clean instance ==="
sleep 1
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))"

echo "=== Wait 15s and check logs for QR ==="
sleep 15
docker logs --since 20s $EVO 2>&1 | grep -v 'Browser:\|Baileys version env:\|Group Ignore:' | tail -15
