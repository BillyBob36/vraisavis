#!/bin/bash
CONTAINER=$(docker ps --format '{{.Names}}' | grep y4cokwkk | head -1)
echo "Container: $CONTAINER"
echo "Created:"
docker inspect $CONTAINER --format '{{.Created}}'
echo ""
echo "Settings chunk file:"
ls -la /app/.next/static/chunks/app/manager/settings/ 2>/dev/null || \
  docker exec $CONTAINER ls /app/.next/static/chunks/app/manager/settings/ 2>/dev/null
echo ""
echo "botPhone occurrences in settings chunk:"
docker exec $CONTAINER sh -c "grep -c 'botPhone' /app/.next/static/chunks/app/manager/settings/*.js 2>/dev/null || echo 'not found'"
