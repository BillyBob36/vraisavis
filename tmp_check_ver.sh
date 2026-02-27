#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "Container: $EVO"
echo "baileys-version.json:"
docker exec $EVO cat /evolution/node_modules/baileys/lib/Defaults/baileys-version.json
echo ""
echo "CONFIG_SESSION_PHONE_VERSION env:"
docker exec $EVO env | grep CONFIG_SESSION_PHONE_VERSION
