#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "=== Watching ALL logs for 120s — scan QR now ==="
docker logs -f --since 5s $EVO 2>&1
