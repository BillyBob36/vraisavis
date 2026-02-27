#!/bin/bash
echo "=== API logs ==="
docker logs --tail 5 $(docker ps --format '{{.Names}}' | grep x840o4o8 | head -1) 2>&1

echo ""
echo "=== Containers status ==="
docker ps --format '{{.Names}} {{.Status}} {{.CreatedAt}}' | grep -E 'x840o4o8|y4cokwkk'
