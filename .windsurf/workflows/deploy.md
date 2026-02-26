---
description: Déployer l'API et/ou le Frontend VraisAvis via l'API Coolify
---

# Workflow de déploiement VraisAvis

## Prérequis
- Le code doit être commité et pushé sur GitHub (branche `master`)
- Token API Coolify : `6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3`

## UUIDs des applications Coolify
- **API** : `x840o4o8gwgccsoscs0gckok` (port 3001, Dockerfile: `/apps/api/Dockerfile`)
- **Web Dashboard** : `y4cokwkkcks8k4k8wcw440cc` (port 3000, Dockerfile: `/apps/web/Dockerfile`)
- **Evolution API (WhatsApp)** : `xck88kk4880ocoss4wgoswsk` (port 8080, Docker image: `atendai/evolution-api:v2.2.3`, domaine: `evolution.vraisavis.fr`)

## Étapes

### 1. Commit et push
// turbo
```bash
cd c:\Users\lamid\CascadeProjects\VraisAvis
git add -A && git commit -m "<message>" && git push
```

### 2. Appliquer les migrations SQL (si nécessaire)
**IMPORTANT** : Les noms de colonnes dans les migrations SQL doivent être en **camelCase** (ex: `"commissionRate"`, pas `"commission_rate"`). C'est la convention de la DB existante.

Si une migration doit être appliquée, l'exécuter via le container API existant AVANT de déployer :
```bash
ssh -i C:\Users\lamid\.ssh\coolify-key root@65.21.146.193 "docker exec \$(docker ps --format '{{.Names}}' | grep x840o4o8 | head -1) npx prisma migrate deploy"
```

### 3. Déployer via l'API Coolify
**NE JAMAIS faire `docker stop/rm/run` manuellement.** Toujours utiliser l'API Coolify.

Créer un script `/tmp/deploy.sh` sur le serveur avec le contenu suivant, puis l'exécuter :

```bash
#!/bin/bash
TOKEN="6|ZLq8Z3BUrMxt8cgHz1gBcEWXlAenlE7f3cEb2PxVed2b67e3"

# Déployer l'API
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=x840o4o8gwgccsoscs0gckok&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"

# Déployer le Web
curl -s -X POST "http://localhost:8000/api/v1/deploy?uuid=y4cokwkkcks8k4k8wcw440cc&force=true" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"
```

Les réponses contiendront des `deployment_uuid` pour suivre l'avancement.

### 4. Suivre l'avancement
```bash
# Vérifier le statut d'un déploiement
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/deployments/<deployment_uuid>" | python3 -m json.tool | grep status
```
Statuts possibles : `queued`, `in_progress`, `finished`, `failed`

### 5. Vérifier après déploiement
```bash
# Containers actifs
docker ps --format '{{.Names}} {{.Status}}' | grep -E 'x840o4o8|y4cokwkk'

# Logs API
docker logs --tail 10 $(docker ps --format '{{.Names}}' | grep x840o4o8 | head -1)

# Test CORS
curl -sI -X OPTIONS -H 'Origin: https://app.vraisavis.fr' -H 'Access-Control-Request-Method: POST' https://api.vraisavis.fr/api/v1/auth/login | head -5
```

### 6. Ajouter une variable d'environnement (si nécessaire)
**IMPORTANT** : Coolify **écrase** le fichier `.env` à chaque déploiement avec les variables stockées dans sa DB. Modifier le fichier `.env` directement ne sert à rien — il faut utiliser l'API Coolify.

```bash
# Ajouter une variable à l'app API
curl -s -X POST "http://localhost:8000/api/v1/applications/x840o4o8gwgccsoscs0gckok/envs" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"MA_VARIABLE","value":"ma_valeur","is_preview":false}'

# Ajouter une variable à l'app Web
curl -s -X POST "http://localhost:8000/api/v1/applications/y4cokwkkcks8k4k8wcw440cc/envs" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"MA_VARIABLE","value":"ma_valeur","is_preview":false,"is_build_time":true}'
```
Note: Pour le Web (Next.js), les variables `NEXT_PUBLIC_*` doivent avoir `is_build_time: true`.

Pour lister les variables existantes :
```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/applications/<uuid>/envs" | python3 -m json.tool | grep '"key"'
```

## Règles critiques — NE JAMAIS FAIRE :
1. **NE JAMAIS** `docker stop/rm/run` un container Coolify manuellement → Coolify perd le contrôle et affiche "Exited"
2. **NE JAMAIS** modifier `/data/coolify/applications/<uuid>/.env` directement → Coolify l'écrase à chaque déploiement. Utiliser l'API `/envs` à la place
3. **NE JAMAIS** utiliser des noms de colonnes en snake_case dans les migrations SQL → la DB utilise du camelCase
4. **NE JAMAIS** mettre le port 3000 pour l'API dans les labels Traefik → l'API écoute sur 3001
