#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID="xck88kk4880ocoss4wgoswsk"

# Fix 1: Change browser name (known workaround for v2.2.3 loop bug)
# Fix 2: Enable full Baileys logs to see what crashes

# Get UUIDs of vars to update
echo "=== Getting env UUIDs ==="
PHONE_NAME_UUID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/applications/$EVO_UUID/envs" \
  | python3 -c "
import sys, json
envs = json.load(sys.stdin)
seen = set()
for e in envs:
    k = e['key']
    if k == 'CONFIG_SESSION_PHONE_NAME' and k not in seen:
        seen.add(k)
        print(e['uuid'])
        break
")

LOG_UUID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/applications/$EVO_UUID/envs" \
  | python3 -c "
import sys, json
envs = json.load(sys.stdin)
seen = set()
for e in envs:
    k = e['key']
    if k == 'LOG_BAILEYS' and k not in seen:
        seen.add(k)
        print(e['uuid'])
        break
")

echo "CONFIG_SESSION_PHONE_NAME uuid: $PHONE_NAME_UUID"
echo "LOG_BAILEYS uuid: $LOG_UUID"

echo "=== Updating CONFIG_SESSION_PHONE_NAME to Firefox ==="
curl -s -X PATCH "http://localhost:8000/api/v1/applications/$EVO_UUID/envs/$PHONE_NAME_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"CONFIG_SESSION_PHONE_NAME","value":"Firefox","is_preview":false}' | python3 -m json.tool | head -3

echo "=== Updating LOG_BAILEYS to debug ==="
curl -s -X PATCH "http://localhost:8000/api/v1/applications/$EVO_UUID/envs/$LOG_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"LOG_BAILEYS","value":"debug","is_preview":false}' | python3 -m json.tool | head -3

echo "=== Redeploying ==="
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=$EVO_UUID&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
echo ""
echo "=== Done ==="
