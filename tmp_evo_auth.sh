#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "=== Auth/store env vars ==="
docker exec $EVO env | grep -E 'AUTH|STORE|INSTANCE' | sort

echo ""
echo "=== Check instances folder ==="
docker exec $EVO ls -la /evolution/instances/ 2>/dev/null || echo "No /evolution/instances folder"

echo ""
echo "=== Full logs for vraisavis-bot startup (non-repeating) ==="
docker logs $EVO 2>&1 | grep -v 'Browser\|Baileys version\|Group Ignore\|ChannelStartup' | grep 'vraisavis-bot' | head -20
