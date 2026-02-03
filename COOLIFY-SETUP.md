# Guide de déploiement Coolify - FoodBack

## 1. Push du code vers Git

### Créer un repository sur GitHub/GitLab
```bash
# Sur GitHub ou GitLab, créer un nouveau repository "foodback"
# Puis exécuter:

git remote add origin https://github.com/VOTRE_USERNAME/foodback.git
# OU
git remote add origin https://gitlab.com/VOTRE_USERNAME/foodback.git

git branch -M main
git push -u origin main
```

## 2. Configuration Coolify

### Étape 1: Créer le projet
1. Se connecter à Coolify
2. Créer un nouveau projet: **FoodBack**
3. Ajouter le repository Git créé ci-dessus

### Étape 2: Service PostgreSQL
1. Ajouter un service → PostgreSQL 16
2. Nom: `foodback-postgres`
3. Variables d'environnement:
   ```
   POSTGRES_USER=foodback
   POSTGRES_PASSWORD=<générer_mot_de_passe_fort>
   POSTGRES_DB=foodback
   ```
4. Volume persistant: `/var/lib/postgresql/data`
5. Démarrer le service

### Étape 3: Service API
1. Ajouter un service → Docker
2. Configuration:
   - **Nom**: `foodback-api`
   - **Repository**: votre repository Git
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Context**: `apps/api`
   - **Port**: `3001`

3. Variables d'environnement:
   ```
   DATABASE_URL=postgresql://foodback:<PASSWORD>@foodback-postgres:5432/foodback
   JWT_SECRET=<générer_avec_commande_ci-dessous>
   JWT_REFRESH_SECRET=<générer_avec_commande_ci-dessous>
   NODE_ENV=production
   PORT=3001
   API_URL=https://api.votredomaine.com
   WEB_URL=https://app.votredomaine.com
   CLIENT_URL=https://client.votredomaine.com
   ```

4. **Build Command** (dans les paramètres avancés):
   ```bash
   cd /app && pnpm install && pnpm --filter api prisma:generate && pnpm --filter api build
   ```

5. **Start Command**:
   ```bash
   cd /app && pnpm --filter api prisma:migrate deploy && pnpm --filter api prisma:seed && pnpm --filter api start
   ```

6. **Health Check**: `/health`

7. Configurer le domaine: `api.votredomaine.com`

8. Activer HTTPS (Let's Encrypt)

### Étape 4: Service Web (Next.js)
1. Ajouter un service → Docker
2. Configuration:
   - **Nom**: `foodback-web`
   - **Repository**: votre repository Git
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `apps/web/Dockerfile`
   - **Context**: `apps/web`
   - **Port**: `3000`

3. Variables d'environnement:
   ```
   NEXT_PUBLIC_API_URL=https://api.votredomaine.com
   NODE_ENV=production
   ```

4. **Build Command**:
   ```bash
   cd /app && pnpm install && pnpm --filter web build
   ```

5. **Start Command**:
   ```bash
   cd /app && pnpm --filter web start
   ```

6. Configurer le domaine: `app.votredomaine.com`

7. Activer HTTPS (Let's Encrypt)

### Étape 5: Service Client (PWA)
1. Ajouter un service → Docker
2. Configuration:
   - **Nom**: `foodback-client`
   - **Repository**: votre repository Git
   - **Branch**: `main`
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `apps/client/Dockerfile`
   - **Context**: `apps/client`
   - **Port**: `80`

3. Pas de variables d'environnement nécessaires

4. Configurer le domaine: `client.votredomaine.com`

5. Activer HTTPS (Let's Encrypt)

## 3. Générer les secrets

Sur votre machine locale:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PostgreSQL Password (générer un mot de passe fort)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 4. Ordre de déploiement
1. **PostgreSQL** → Attendre qu'il soit en ligne
2. **API** → Attendre qu'il soit en ligne (migrations + seed automatiques)
3. **Web** → Peut démarrer en parallèle avec Client
4. **Client** → Peut démarrer en parallèle avec Web

## 5. Vérifications post-déploiement

### Tester l'API
```bash
curl https://api.votredomaine.com/health
# Devrait retourner: {"status":"ok"}
```

### Tester le Web
Ouvrir: `https://app.votredomaine.com`
- Page de connexion doit s'afficher

### Tester le Client
Ouvrir: `https://client.votredomaine.com`
- Page d'erreur "Restaurant non trouvé" est normale (besoin d'un ID restaurant dans l'URL)

### Connexion Super Admin
1. Aller sur: `https://app.votredomaine.com/login`
2. Email: `admin`
3. Password: `admin123`
4. **IMPORTANT**: Changer immédiatement le mot de passe dans Paramètres

## 6. Configuration réseau Coolify

### Liens entre services
Coolify crée automatiquement un réseau Docker entre les services du même projet.
Le nom du service PostgreSQL dans DATABASE_URL doit correspondre au nom du service dans Coolify.

Exemple:
- Si votre service PostgreSQL s'appelle `foodback-postgres` dans Coolify
- Alors DATABASE_URL = `postgresql://foodback:password@foodback-postgres:5432/foodback`

## 7. Logs et debugging

### Voir les logs
Dans Coolify, chaque service a un onglet "Logs" pour voir les logs en temps réel.

### Problèmes courants

**API ne démarre pas:**
- Vérifier que PostgreSQL est bien démarré
- Vérifier DATABASE_URL (nom du service PostgreSQL)
- Vérifier les logs de l'API

**Migrations Prisma échouent:**
- Vérifier la connexion à PostgreSQL
- Vérifier que le user/password sont corrects
- Les migrations s'exécutent au démarrage de l'API

**Web ne se connecte pas à l'API:**
- Vérifier NEXT_PUBLIC_API_URL
- Vérifier que l'API est accessible publiquement
- Vérifier CORS dans l'API (déjà configuré pour accepter toutes les origines)

## 8. Mises à jour

Pour déployer une mise à jour:
1. Commit et push vers Git
2. Dans Coolify, cliquer sur "Redeploy" pour chaque service
3. Coolify va automatiquement pull le nouveau code et rebuild

## 9. Backup

### Base de données
Configurer des backups automatiques dans Coolify pour le service PostgreSQL:
- Aller dans le service PostgreSQL
- Onglet "Backups"
- Configurer la fréquence et la rétention

## 10. Prochaines étapes

Après le déploiement initial:
1. Créer un compte vendeur via l'interface Super Admin
2. Créer un restaurant via l'interface Manager
3. Tester le parcours client avec l'URL: `https://client.votredomaine.com/{restaurantId}`
4. Configurer Stripe (plus tard)
5. Configurer SMTP pour les emails (plus tard)

## Support

En cas de problème:
1. Vérifier les logs dans Coolify
2. Vérifier que tous les services sont "Running"
3. Vérifier les variables d'environnement
4. Tester la connectivité entre services
