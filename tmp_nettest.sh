#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "=== TCP test to WhatsApp WS from container ==="
docker exec $EVO sh -c "timeout 5 bash -c 'echo > /dev/tcp/web.whatsapp.com/443' && echo 'TCP OK' || echo 'TCP FAIL'"

echo "=== Curl HTTPS test ==="
docker exec $EVO sh -c "curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://web.whatsapp.com/ && echo ' HTTP OK' || echo ' HTTP FAIL'"

echo "=== DNS test ==="
docker exec $EVO sh -c "nslookup web.whatsapp.com 2>&1 | head -5"
