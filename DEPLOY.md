# Déploiement FoodBack sur Coolify (Hetzner)

## Prérequis
- Compte Coolify configuré avec serveur Hetzner
- Repository Git (GitHub/GitLab)

## Variables d'environnement à configurer dans Coolify

### Service PostgreSQL
```
POSTGRES_USER=foodback
POSTGRES_PASSWORD=<générer_mot_de_passe_fort>
POSTGRES_DB=foodback
```

### Service API (apps/api)
```
DATABASE_URL=postgresql://foodback:<password>@postgres:5432/foodback
JWT_SECRET=<générer_secret_jwt_64_chars>
JWT_REFRESH_SECRET=<générer_secret_refresh_64_chars>
NODE_ENV=production
PORT=3001

# Stripe (à configurer plus tard)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_COMMISSION_PRODUCT_ID=

# SMTP (à configurer plus tard)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# URLs
API_URL=https://api.votredomaine.com
WEB_URL=https://app.votredomaine.com
CLIENT_URL=https://client.votredomaine.com
```

### Service Web (apps/web)
```
NEXT_PUBLIC_API_URL=https://api.votredomaine.com
NODE_ENV=production
```

### Service Client (apps/client)
Pas de variables d'environnement nécessaires (configuré via nginx)

## Configuration Coolify

### 1. Créer le projet
- Nom: FoodBack
- Repository: votre-repo-git
- Branch: main

### 2. Service PostgreSQL
- Type: PostgreSQL 16
- Nom: foodback-db
- Configurer les variables ci-dessus
- Persistent volume: /var/lib/postgresql/data

### 3. Service API
- Type: Docker
- Context: apps/api
- Dockerfile: apps/api/Dockerfile
- Port: 3001
- Build command: `pnpm install && pnpm --filter api prisma:generate && pnpm --filter api build`
- Start command: `pnpm --filter api start`
- Healthcheck: /health
- Variables d'environnement: voir ci-dessus
- **Important**: Ajouter un script de démarrage pour les migrations:
  ```
  pnpm --filter api prisma:migrate && pnpm --filter api prisma:seed && pnpm --filter api start
  ```

### 4. Service Web
- Type: Docker
- Context: apps/web
- Dockerfile: apps/web/Dockerfile
- Port: 3000
- Build command: `pnpm install && pnpm --filter web build`
- Start command: `pnpm --filter web start`
- Variables d'environnement: voir ci-dessus

### 5. Service Client
- Type: Docker
- Context: apps/client
- Dockerfile: créer un Dockerfile nginx simple
- Port: 80
- Pas de build command nécessaire

## Ordre de déploiement
1. PostgreSQL
2. API (attendre que PostgreSQL soit prêt)
3. Web
4. Client

## Post-déploiement

### Connexion super admin
- Email: `admin`
- Password: `admin123`
- **IMPORTANT**: Changer le mot de passe immédiatement après la première connexion

### Vérifications
1. API health: https://api.votredomaine.com/health
2. Web: https://app.votredomaine.com
3. Client: https://client.votredomaine.com

## Génération des secrets

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Domaines recommandés
- API: api.foodback.votredomaine.com
- Web (Admin/Manager/Vendor): app.foodback.votredomaine.com
- Client (PWA): client.foodback.votredomaine.com ou votredomaine.com/r/{restaurantId}

## Notes importantes
- Les migrations Prisma s'exécutent automatiquement au démarrage de l'API
- Le seed crée le super admin par défaut
- Stripe et SMTP peuvent être configurés plus tard
- Activer HTTPS via Coolify (Let's Encrypt)
