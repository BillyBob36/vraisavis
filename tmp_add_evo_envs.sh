#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
API_UUID="x840o4o8gwgccsoscs0gckok"

add_env() {
  local key="$1"
  local val="$2"
  curl -s -X POST "http://localhost:8000/api/v1/applications/$API_UUID/envs" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$val\",\"is_preview\":false}" | python3 -m json.tool | grep -E 'message|uuid'
}

add_env "EVOLUTION_API_URL" "https://evolution.vraisavis.fr"
add_env "EVOLUTION_API_KEY" "VraisAvis-Evo-2026-x7K9mP4qR2wL5nJ8"
add_env "WHATSAPP_DEFAULT_INSTANCE" "vraisavis-default"
add_env "WHATSAPP_WEBHOOK_SECRET" ""

echo "=== Done ==="
