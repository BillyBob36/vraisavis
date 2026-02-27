#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "=== Last 5 min of ALL logs ==="
docker logs --since 5m $EVO 2>&1
