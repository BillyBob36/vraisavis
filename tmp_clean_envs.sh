#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"
EVO_UUID="xck88kk4880ocoss4wgoswsk"

echo "=== Getting all env vars with duplicates ==="
ENVS=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/applications/$EVO_UUID/envs")

# Find and delete duplicates, keeping only the first occurrence
echo "$ENVS" | python3 << 'PYEOF'
import sys, json, subprocess

data = json.loads(sys.stdin.read())
seen = {}
to_delete = []

for e in data:
    k = e['key']
    uuid = e['uuid']
    if k in seen:
        to_delete.append((k, uuid))
    else:
        seen[k] = uuid

print(f"Found {len(to_delete)} duplicates to delete")
for k, uuid in to_delete:
    print(f"  Deleting duplicate: {k} ({uuid})")
    result = subprocess.run(
        ['curl', '-s', '-X', 'DELETE',
         f'http://localhost:8000/api/v1/applications/xck88kk4880ocoss4wgoswsk/envs/{uuid}',
         '-H', 'Authorization: Bearer 6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3'],
        capture_output=True, text=True
    )
    print(f"  Result: {result.stdout[:60]}")

print(f"\nKept keys: {len(seen)}")
# Print current values for key vars
for k in ['CONFIG_SESSION_PHONE_NAME', 'LOG_BAILEYS', 'DEL_INSTANCE']:
    if k in seen:
        # Find value
        for e in data:
            if e['key'] == k and e['uuid'] == seen[k]:
                print(f"  {k}={e['value']} (uuid={seen[k]})")
PYEOF
