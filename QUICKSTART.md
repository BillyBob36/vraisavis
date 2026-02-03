# 🚀 Déploiement FoodBack sur Coolify - Guide Rapide

## ✅ Code déjà sur GitHub
Repository: **https://github.com/BillyBob36/foodback-fevrier**

## 🔐 Secrets générés

```bash
JWT_SECRET=8bb0b09f49d92fcabe6f80d737cb921c28727f629ce3298a5048d0978bb18cf80bc1ae339140b8c812ae44111e717f770d1bf0a4f431ce7c937812d9ba5e4104

JWT_REFRESH_SECRET=2611d0bddc3cda831493c12b393ce4c1ede1c7c972f57d3c8b70b6716f0531912732d8438779ff1f5f4b6b48cb87ca9bf5f6a8582d3047b4a451a72c96c954b5

POSTGRES_PASSWORD=lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q
```

## 📋 Configuration Coolify (Interface Web)

### 1. Créer le projet
- Nom: **FoodBack**
- Repository: `https://github.com/BillyBob36/foodback-fevrier`
- Branch: `master`

### 2. Service PostgreSQL
**Type:** PostgreSQL 16  
**Nom:** `foodback-postgres`

**Variables:**
```
POSTGRES_USER=foodback
POSTGRES_PASSWORD=lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q
POSTGRES_DB=foodback
```

**Volume:** `/var/lib/postgresql/data`

### 3. Service API
**Type:** Docker  
**Dockerfile:** `apps/api/Dockerfile`  
**Context:** `apps/api`  
**Port:** `3001`

**Variables (remplacer VOTRE_DOMAINE):**
```
DATABASE_URL=postgresql://foodback:lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q@foodback-postgres:5432/foodback
JWT_SECRET=8bb0b09f49d92fcabe6f80d737cb921c28727f629ce3298a5048d0978bb18cf80bc1ae339140b8c812ae44111e717f770d1bf0a4f431ce7c937812d9ba5e4104
JWT_REFRESH_SECRET=2611d0bddc3cda831493c12b393ce4c1ede1c7c972f57d3c8b70b6716f0531912732d8438779ff1f5f4b6b48cb87ca9bf5f6a8582d3047b4a451a72c96c954b5
NODE_ENV=production
PORT=3001
API_URL=https://api.VOTRE_DOMAINE.com
WEB_URL=https://app.VOTRE_DOMAINE.com
CLIENT_URL=https://client.VOTRE_DOMAINE.com
```

**Domaine:** `api.VOTRE_DOMAINE.com`  
**Health Check:** `/health`

### 4. Service Web
**Type:** Docker  
**Dockerfile:** `apps/web/Dockerfile`  
**Context:** `apps/web`  
**Port:** `3000`

**Variables:**
```
NEXT_PUBLIC_API_URL=https://api.VOTRE_DOMAINE.com
NODE_ENV=production
```

**Domaine:** `app.VOTRE_DOMAINE.com`

### 5. Service Client
**Type:** Docker  
**Dockerfile:** `apps/client/Dockerfile`  
**Context:** `apps/client`  
**Port:** `80`

**Domaine:** `client.VOTRE_DOMAINE.com`

## 🎯 Ordre de déploiement
1. PostgreSQL (attendre qu'il soit Running)
2. API (attendre qu'il soit Running)
3. Web + Client (peuvent démarrer ensemble)

## 🔍 Vérifications

### API
```bash
curl https://api.VOTRE_DOMAINE.com/health
# Retour attendu: {"status":"ok"}
```

### Connexion Super Admin
- URL: `https://app.VOTRE_DOMAINE.com/login`
- Email: `admin`
- Password: `admin123`
- ⚠️ **Changer le mot de passe immédiatement**

## 📝 Notes importantes

- Les migrations Prisma s'exécutent automatiquement au démarrage de l'API
- Le seed crée le super admin par défaut
- Activer HTTPS (Let's Encrypt) dans Coolify pour chaque service
- Stripe et SMTP peuvent être configurés plus tard

## 🆘 Problèmes courants

**API ne démarre pas:**
- Vérifier que PostgreSQL est Running
- Vérifier DATABASE_URL (nom du service = `foodback-postgres`)
- Consulter les logs de l'API dans Coolify

**Web ne se connecte pas à l'API:**
- Vérifier que NEXT_PUBLIC_API_URL est correct
- Vérifier que l'API est accessible publiquement

## 📦 Fichier de configuration

Le fichier `coolify.json` contient toute la configuration en JSON pour référence.

## 🔄 Mises à jour

Pour déployer une mise à jour:
```bash
git add .
git commit -m "Update"
git push
```

Puis dans Coolify, cliquer sur "Redeploy" pour chaque service.
