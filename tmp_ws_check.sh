#!/bin/bash
EVO=$(docker ps --format '{{.Names}}' | grep xck88kk4 | head -1)

cat > /tmp/ws_check.js << 'EOF'
// Test WhatsApp WebSocket from inside container
const net = require('net');
const tls = require('tls');

// WhatsApp WS endpoint
const host = 'web.whatsapp.com';
const port = 443;

console.log(`Testing TCP to ${host}:${port}...`);
const sock = tls.connect(port, host, { servername: host, rejectUnauthorized: false }, () => {
    console.log('TLS connected! Authorized:', sock.authorized);
    // Send a minimal HTTP upgrade to WebSocket
    sock.write(
        'GET /ws/chat HTTP/1.1\r\n' +
        'Host: web.whatsapp.com\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
        'Sec-WebSocket-Version: 13\r\n' +
        'Origin: https://web.whatsapp.com\r\n' +
        '\r\n'
    );
    setTimeout(() => {
        sock.destroy();
        process.exit(0);
    }, 3000);
});

sock.on('data', (d) => {
    const resp = d.toString().substring(0, 200);
    console.log('Response:', resp);
    if (resp.includes('101')) {
        console.log('==> WebSocket Upgrade SUCCESS!');
    } else if (resp.includes('403') || resp.includes('blocked')) {
        console.log('==> BLOCKED by WhatsApp!');
    } else if (resp.includes('301') || resp.includes('302')) {
        console.log('==> Redirected');
    }
});

sock.on('error', (e) => {
    console.log('ERROR:', e.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('TIMEOUT - no response in 8s');
    process.exit(2);
}, 8000);
EOF

docker cp /tmp/ws_check.js $EVO:/tmp/ws_check.js
echo "Running WebSocket test from inside Evolution container..."
docker exec $EVO node /tmp/ws_check.js
