#!/bin/bash
echo "=== Check Baileys version in evolution-api:latest ==="
docker pull atendai/evolution-api:latest 2>&1 | tail -3
docker run --rm --entrypoint="" atendai/evolution-api:latest \
  cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json 2>/dev/null \
  || docker run --rm --entrypoint="" atendai/evolution-api:latest \
     find / -name 'baileys-version.json' 2>/dev/null | head -3

echo ""
echo "=== Check in v2.1.1 ==="
docker run --rm --entrypoint="" atendai/evolution-api:v2.1.1 \
  cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json 2>/dev/null
