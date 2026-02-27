#!/bin/bash
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
PHONE="306998120577"

echo "=== Trying pairing code endpoint ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/connect/vraisavis-bot" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw "{\"number\":\"$PHONE\"}" \
  | python3 -m json.tool 2>/dev/null

echo ""
echo "=== Trying alternative pairing endpoint ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/pairingCode/vraisavis-bot" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  --data-raw "{\"number\":\"$PHONE\"}" \
  | python3 -m json.tool 2>/dev/null
