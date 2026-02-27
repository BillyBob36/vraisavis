#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "=== dotenv config in main.mjs ==="
docker exec $EVO grep -o '.\{0,60\}dotenv.\{0,60\}' /evolution/dist/main.mjs 2>/dev/null | head -5
docker exec $EVO grep -o '.\{0,60\}dotenv.\{0,60\}' /evolution/dist/main.js 2>/dev/null | head -5

echo ""
echo "=== Check actual process.env in running node process ==="
# Find the PID of the node process
PID=$(docker exec $EVO ps aux 2>/dev/null | grep 'node\|main.mjs\|main.js' | grep -v grep | awk '{print $1}' | head -1)
echo "Node PID: $PID"
if [ -n "$PID" ]; then
  docker exec $EVO cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep 'PHONE_VERSION'
fi
