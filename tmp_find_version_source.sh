#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "=== All baileys-version files ==="
docker exec $EVO find /evolution -name 'baileys-version*' 2>/dev/null

echo ""
echo "=== Content of each ==="
for f in $(docker exec $EVO find /evolution -name 'baileys-version*' 2>/dev/null); do
  echo "--- $f ---"
  docker exec $EVO cat "$f"
  echo ""
done

echo ""
echo "=== Search for 1015901307 in all JS/JSON files ==="
docker exec $EVO grep -rl '1015901307' /evolution/ --include='*.js' --include='*.json' --include='*.mjs' 2>/dev/null | head -10

echo ""
echo "=== What does Evolution API log for Baileys version? (search in dist) ==="
docker exec $EVO grep -o 'Baileys version env.*' /evolution/dist/main.mjs 2>/dev/null | head -3
