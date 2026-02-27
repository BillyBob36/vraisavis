#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
# Show ALL logs without any filter for the last 2 minutes
docker logs --since 2m $EVO 2>&1 | grep -v 'Browser:\|Baileys version env:\|Group Ignore:'
