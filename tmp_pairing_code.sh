#!/bin/bash
# Usage: bash /tmp/pairing_code.sh <phone_number>
# Example: bash /tmp/pairing_code.sh 33612345678
EVO_KEY="VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
PHONE="${1:-}"

if [ -z "$PHONE" ]; then
  echo "Usage: bash $0 <phone_without_plus_or_spaces>"
  echo "Example: bash $0 33612345678"
  exit 1
fi

echo "=== Requesting pairing code for $PHONE on instance vraisavis-bot ==="
curl -s -X POST "https://evolution.vraisavis.fr/instance/pairingCode/vraisavis-bot" \
  -H "apikey: $EVO_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"number\": \"$PHONE\"}" \
  | python3 -m json.tool 2>/dev/null || echo "Error"
