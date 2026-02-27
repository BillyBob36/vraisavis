#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)

echo "=== /evolution/.env content ==="
docker exec $EVO cat /evolution/.env

echo ""
echo "=== Grep for PHONE_VERSION in .env ==="
docker exec $EVO grep -i 'PHONE_VERSION\|SESSION_PHONE' /evolution/.env
