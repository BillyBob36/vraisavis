#!/bin/bash
echo "=== Web container build info ==="
CONTAINER=$(docker ps --format '{{.Names}}' | grep y4cokwkk | head -1)
echo "Container: $CONTAINER"
docker inspect $CONTAINER --format '{{.Config.Labels}}' 2>/dev/null | tr ',' '\n' | grep -i 'git\|commit\|sha\|source' | head -10

echo ""
echo "=== Web container created at ==="
docker inspect $CONTAINER --format '{{.Created}}'

echo ""
echo "=== Check if botPhone is in the web bundle ==="
docker exec $CONTAINER find /app -name "*.js" -newer /app/package.json 2>/dev/null | head -5
docker exec $CONTAINER sh -c "grep -rl 'botPhone' /app/.next 2>/dev/null | head -3"
