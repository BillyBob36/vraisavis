#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)

echo "=== Search 1015901307 in main.mjs ==="
docker exec $EVO grep -c '1015901307' /evolution/dist/main.mjs 2>/dev/null
docker exec $EVO grep -o '.\{0,30\}1015901307.\{0,30\}' /evolution/dist/main.mjs 2>/dev/null | head -5

echo ""
echo "=== Grep for PHONE_VERSION in main.mjs ==="
docker exec $EVO grep -o '.\{0,50\}PHONE_VERSION.\{0,50\}' /evolution/dist/main.mjs 2>/dev/null | head -5

echo ""
echo "=== What is ju() - search baileys-version in main.mjs ==="
docker exec $EVO grep -o '.\{0,80\}baileys-version.\{0,80\}' /evolution/dist/main.mjs 2>/dev/null | head -5

echo ""
echo "=== Config file that might have default phone version ==="
docker exec $EVO find /evolution -name 'config*' -name '*.json' 2>/dev/null | head -5
docker exec $EVO find /evolution -name '*.env' 2>/dev/null | head -5
