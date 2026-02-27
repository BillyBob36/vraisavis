#!/bin/bash
PG=$(docker ps --format '{{.Names}}' | grep x4osww00 | head -1)
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"

echo "=== Purge all sessions from DB for vraisavis-bot ==="
docker exec $PG psql -U vraisavis -d evolution_api -c "
DELETE FROM evolution.\"Session\" WHERE \"sessionId\" LIKE '%vraisavis-bot%';
DELETE FROM evolution.\"Message\" WHERE \"instanceId\" IN (SELECT id FROM evolution.\"Instance\" WHERE name='vraisavis-bot');
DELETE FROM evolution.\"Chat\" WHERE \"instanceId\" IN (SELECT id FROM evolution.\"Instance\" WHERE name='vraisavis-bot');
DELETE FROM evolution.\"Contact\" WHERE \"instanceId\" IN (SELECT id FROM evolution.\"Instance\" WHERE name='vraisavis-bot');
DELETE FROM evolution.\"Setting\" WHERE \"instanceId\" IN (SELECT id FROM evolution.\"Instance\" WHERE name='vraisavis-bot');
DELETE FROM evolution.\"Webhook\" WHERE \"instanceId\" IN (SELECT id FROM evolution.\"Instance\" WHERE name='vraisavis-bot');
DELETE FROM evolution.\"Instance\" WHERE name='vraisavis-bot';
SELECT 'All cleaned' as status;
"

echo ""
echo "=== Purge local folder ==="
docker exec $EVO rm -rf /evolution/instances/ && docker exec $EVO mkdir -p /evolution/instances/
echo "Done"

echo ""
echo "=== Recreate instance ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/create" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw '{"instanceName":"vraisavis-bot","integration":"WHATSAPP-BAILEYS","qrcode":true}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:', d.get('instance',{}).get('status','?'))"

echo ""
echo "=== Watch logs for 30s ==="
sleep 30
docker logs --since 35s $EVO 2>&1 | grep -v 'Browser:\|Baileys version env:\|Group Ignore:' | tail -20
