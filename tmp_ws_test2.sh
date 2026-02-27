#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)
echo "Container: $EVO"

cat > /tmp/ws_test2.js << 'EOF'
const ws = require('/app/node_modules/ws');
const s = new ws('wss://web.whatsapp.com/ws/chat', {
  headers: { 'Origin': 'https://web.whatsapp.com' }
});
s.on('open', () => { console.log('WS OK - WhatsApp reachable'); s.close(); process.exit(0); });
s.on('error', e => { console.log('WS ERROR:', e.message); process.exit(1); });
setTimeout(() => { console.log('WS TIMEOUT after 8s'); process.exit(2); }, 8000);
EOF

docker cp /tmp/ws_test2.js $EVO:/tmp/ws_test2.js
docker exec $EVO node /tmp/ws_test2.js
