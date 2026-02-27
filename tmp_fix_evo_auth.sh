#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID="xck88kk4880ocoss4wgoswsk"

add_env() {
  curl -s -X POST "http://localhost:8000/api/v1/applications/$EVO_UUID/envs" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$1\",\"value\":\"$2\",\"is_preview\":false}" | python3 -m json.tool | grep -E 'uuid|message'
}

echo "=== Adding missing Baileys auth chain env vars ==="
add_env "DATABASE_SAVE_DATA_AUTH_CHAIN" "true"
add_env "DATABASE_SAVE_MESSAGE_UPDATE" "true"
add_env "DATABASE_SAVE_DATA_NEW_MESSAGE" "true"
add_env "DATABASE_SAVE_DATA_CONTACTS" "true"
add_env "DATABASE_SAVE_DATA_CHATS" "true"

echo ""
echo "=== Redeploying Evolution API ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=$EVO_UUID&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo ""
echo "=== Done — wait ~2 min then test ==="
