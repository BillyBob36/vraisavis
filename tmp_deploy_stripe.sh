#!/bin/bash
set -e

API_CONTAINER="x840o4o8gwgccsoscs0gckok-225511236261"
WEB_CONTAINER="y4cokwkkcks8k4k8wcw440cc-225717731828"

# Save current env
docker inspect "$API_CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' > /tmp/api_env.txt
docker inspect "$WEB_CONTAINER" --format '{{range .Config.Env}}{{println .}}{{end}}' > /tmp/web_env.txt

# Add Stripe env vars to API if not already present
if ! grep -q "STRIPE_PRICE_ID" /tmp/api_env.txt; then
  echo "STRIPE_PRICE_ID=price_1SyzED6li27z0nRT2VrJbSDy" >> /tmp/api_env.txt
fi
if ! grep -q "STRIPE_WEBHOOK_SECRET" /tmp/api_env.txt; then
  echo "STRIPE_WEBHOOK_SECRET=whsec_emKtQLR0nRx9GUXo6428dNOer1y7Bk41" >> /tmp/api_env.txt
fi
if ! grep -q "FRONTEND_URL" /tmp/api_env.txt; then
  echo "FRONTEND_URL=https://app.vraisavis.fr" >> /tmp/api_env.txt
fi

# Add Stripe publishable key to Web if not already present
if ! grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" /tmp/web_env.txt; then
  echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SyzED6li27z0nRTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" >> /tmp/web_env.txt
fi

echo "=== API env (Stripe lines) ==="
grep -i stripe /tmp/api_env.txt || echo "(none)"
grep -i FRONTEND_URL /tmp/api_env.txt || echo "(none)"
echo ""
echo "=== Web env (Stripe lines) ==="
grep -i stripe /tmp/web_env.txt || echo "(none)"

# Build
rm -rf /tmp/vraisavis-build
git clone --depth 1 https://github.com/BillyBob36/vraisavis.git /tmp/vraisavis-build
cd /tmp/vraisavis-build
COMMIT=$(git rev-parse HEAD)
echo ""
echo "Building commit: $COMMIT"

echo "=== Building API ==="
docker build --no-cache -f apps/api/Dockerfile -t x840o4o8gwgccsoscs0gckok:$COMMIT .

echo "=== Building Web ==="
docker build --no-cache -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.vraisavis.fr -t y4cokwkkcks8k4k8wcw440cc:$COMMIT .

docker stop "$API_CONTAINER" && docker rm "$API_CONTAINER"
docker stop "$WEB_CONTAINER" && docker rm "$WEB_CONTAINER"

docker run -d \
  --name "$API_CONTAINER" \
  --env-file /tmp/api_env.txt \
  --network coolify \
  --restart unless-stopped \
  --label "traefik.enable=true" \
  --label "traefik.http.middlewares.gzip.compress=true" \
  --label "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https" \
  --label "traefik.http.routers.http-0-x840o4o8gwgccsoscs0gckok.entryPoints=http" \
  --label "traefik.http.routers.http-0-x840o4o8gwgccsoscs0gckok.middlewares=redirect-to-https" \
  --label "traefik.http.routers.http-0-x840o4o8gwgccsoscs0gckok.rule=Host(\`api.vraisavis.fr\`) && PathPrefix(\`/\`)" \
  --label "traefik.http.routers.http-0-x840o4o8gwgccsoscs0gckok.service=http-0-x840o4o8gwgccsoscs0gckok" \
  --label "traefik.http.routers.https-0-x840o4o8gwgccsoscs0gckok.entryPoints=https" \
  --label "traefik.http.routers.https-0-x840o4o8gwgccsoscs0gckok.middlewares=gzip" \
  --label "traefik.http.routers.https-0-x840o4o8gwgccsoscs0gckok.rule=Host(\`api.vraisavis.fr\`) && PathPrefix(\`/\`)" \
  --label "traefik.http.routers.https-0-x840o4o8gwgccsoscs0gckok.service=https-0-x840o4o8gwgccsoscs0gckok" \
  --label "traefik.http.routers.https-0-x840o4o8gwgccsoscs0gckok.tls=true" \
  --label "traefik.http.routers.https-0-x840o4o8gwgccsoscs0gckok.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.http-0-x840o4o8gwgccsoscs0gckok.loadbalancer.server.port=3001" \
  --label "traefik.http.services.https-0-x840o4o8gwgccsoscs0gckok.loadbalancer.server.port=3001" \
  --label "coolify.managed=true" \
  x840o4o8gwgccsoscs0gckok:$COMMIT

docker run -d \
  --name "$WEB_CONTAINER" \
  --env-file /tmp/web_env.txt \
  --network coolify \
  --restart unless-stopped \
  --label "traefik.enable=true" \
  --label "traefik.http.middlewares.gzip.compress=true" \
  --label "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https" \
  --label "traefik.http.routers.http-0-y4cokwkkcks8k4k8wcw440cc.entryPoints=http" \
  --label "traefik.http.routers.http-0-y4cokwkkcks8k4k8wcw440cc.middlewares=redirect-to-https" \
  --label "traefik.http.routers.http-0-y4cokwkkcks8k4k8wcw440cc.rule=Host(\`app.vraisavis.fr\`) && PathPrefix(\`/\`)" \
  --label "traefik.http.routers.http-0-y4cokwkkcks8k4k8wcw440cc.service=http-0-y4cokwkkcks8k4k8wcw440cc" \
  --label "traefik.http.routers.https-0-y4cokwkkcks8k4k8wcw440cc.entryPoints=https" \
  --label "traefik.http.routers.https-0-y4cokwkkcks8k4k8wcw440cc.middlewares=gzip" \
  --label "traefik.http.routers.https-0-y4cokwkkcks8k4k8wcw440cc.rule=Host(\`app.vraisavis.fr\`) && PathPrefix(\`/\`)" \
  --label "traefik.http.routers.https-0-y4cokwkkcks8k4k8wcw440cc.service=https-0-y4cokwkkcks8k4k8wcw440cc" \
  --label "traefik.http.routers.https-0-y4cokwkkcks8k4k8wcw440cc.tls=true" \
  --label "traefik.http.routers.https-0-y4cokwkkcks8k4k8wcw440cc.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.http-0-y4cokwkkcks8k4k8wcw440cc.loadbalancer.server.port=3000" \
  --label "traefik.http.services.https-0-y4cokwkkcks8k4k8wcw440cc.loadbalancer.server.port=3000" \
  --label "coolify.managed=true" \
  y4cokwkkcks8k4k8wcw440cc:$COMMIT

sleep 10
echo "=== Status ==="
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'x840o4o8|y4cokwkk'
echo ""
echo "=== API logs ==="
docker logs --tail 5 "$API_CONTAINER" 2>&1
echo ""
echo "=== Web logs ==="
docker logs --tail 3 "$WEB_CONTAINER" 2>&1

rm -rf /tmp/vraisavis-build /tmp/api_env.txt /tmp/web_env.txt
echo ""
echo "DONE"
