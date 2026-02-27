#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
PID=$(docker exec $EVO ps aux 2>/dev/null | grep node | grep -v grep | awk '{print $1}' | head -1)
echo "Node PID: $PID"
echo "=== All PHONE/SESSION/VERSION vars in process env ==="
docker exec $EVO cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -E 'PHONE|SESSION|VERSION|BAILEYS' | head -10
echo ""
echo "=== Docker-injected env (docker inspect) ==="
docker inspect $EVO --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E 'PHONE|SESSION|VERSION|BAILEYS' | head -10
