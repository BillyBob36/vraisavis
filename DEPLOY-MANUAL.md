# 🚀 Déploiement FoodBack - Guide Manuel Coolify

## ✅ Projet créé automatiquement
**Projet UUID:** `s4g0sc04ccgg400sg0ocoosg`  
**Nom:** FoodBack

---

## 📋 Configuration à faire dans Coolify

### 1️⃣ PostgreSQL Database

**Dans Coolify:**
1. Aller dans le projet **FoodBack**
2. Cliquer sur **+ Add Resource** → **Database** → **PostgreSQL**
3. Remplir les informations:

```
Name: foodback-postgres
PostgreSQL Version: 16
```

**Variables d'environnement:**
```
POSTGRES_USER=foodback
POSTGRES_PASSWORD=lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q
POSTGRES_DB=foodback
```

**Volume persistant:**
```
/var/lib/postgresql/data
```

4. Cliquer sur **Save** puis **Deploy**
5. ⏳ Attendre que PostgreSQL soit **Running** (environ 1-2 minutes)

---

### 2️⃣ API Backend (Fastify)

**Dans Coolify:**
1. Dans le projet **FoodBack**, cliquer sur **+ Add Resource** → **Application** → **Public Repository**
2. Remplir les informations:

```
Name: foodback-api
Git Repository: https://github.com/BillyBob36/foodback-fevrier
Branch: master
Build Pack: Dockerfile
Dockerfile Location: apps/api/Dockerfile
Base Directory: apps/api
Port: 3001
```

**Variables d'environnement (copier-coller):**
```
DATABASE_URL=postgresql://foodback:lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q@foodback-postgres:5432/foodback
JWT_SECRET=8bb0b09f49d92fcabe6f80d737cb921c28727f629ce3298a5048d0978bb18cf80bc1ae339140b8c812ae44111e717f770d1bf0a4f431ce7c937812d9ba5e4104
JWT_REFRESH_SECRET=2611d0bddc3cda831493c12b393ce4c1ede1c7c972f57d3c8b70b6716f0531912732d8438779ff1f5f4b6b48cb87ca9bf5f6a8582d3047b4a451a72c96c954b5
NODE_ENV=production
PORT=3001
API_URL=https://api.vraisavis.fr
WEB_URL=https://app.vraisavis.fr
CLIENT_URL=https://client.vraisavis.fr
```

**Domaine:**
```
api.vraisavis.fr
```

**Health Check:**
```
/health
```

3. Cliquer sur **Save**
4. Aller dans **Settings** → **Domains** → Ajouter `api.vraisavis.fr`
5. Activer **HTTPS** (Let's Encrypt)
6. Cliquer sur **Deploy**

---

### 3️⃣ Web Dashboard (Next.js)

**Dans Coolify:**
1. Dans le projet **FoodBack**, cliquer sur **+ Add Resource** → **Application** → **Public Repository**
2. Remplir les informations:

```
Name: foodback-web
Git Repository: https://github.com/BillyBob36/foodback-fevrier
Branch: master
Build Pack: Dockerfile
Dockerfile Location: apps/web/Dockerfile
Base Directory: apps/web
Port: 3000
```

**Variables d'environnement:**
```
NEXT_PUBLIC_API_URL=https://api.vraisavis.fr
NODE_ENV=production
```

**Domaine:**
```
app.vraisavis.fr
```

3. Cliquer sur **Save**
4. Aller dans **Settings** → **Domains** → Ajouter `app.vraisavis.fr`
5. Activer **HTTPS** (Let's Encrypt)
6. Cliquer sur **Deploy**

---

### 4️⃣ Client PWA (Vanilla JS)

**Dans Coolify:**
1. Dans le projet **FoodBack**, cliquer sur **+ Add Resource** → **Application** → **Public Repository**
2. Remplir les informations:

```
Name: foodback-client
Git Repository: https://github.com/BillyBob36/foodback-fevrier
Branch: master
Build Pack: Dockerfile
Dockerfile Location: apps/client/Dockerfile
Base Directory: apps/client
Port: 80
```

**Pas de variables d'environnement nécessaires**

**Domaine:**
```
client.vraisavis.fr
```

3. Cliquer sur **Save**
4. Aller dans **Settings** → **Domains** → Ajouter `client.vraisavis.fr`
5. Activer **HTTPS** (Let's Encrypt)
6. Cliquer sur **Deploy**

---

## 🌐 Configuration DNS (Hostinger)

Dans votre panneau Hostinger pour **vraisavis.fr**, ajouter ces enregistrements DNS:

```
Type: A
Name: api
Value: 65.21.146.193
TTL: 3600

Type: A
Name: app
Value: 65.21.146.193
TTL: 3600

Type: A
Name: client
Value: 65.21.146.193
TTL: 3600
```

⏳ **Attendre 5-10 minutes** pour la propagation DNS

---

## 📝 Ordre de déploiement

1. ✅ **PostgreSQL** → Attendre qu'il soit Running
2. ✅ **API** → Attendre qu'il soit Running (les migrations s'exécutent automatiquement)
3. ✅ **Web + Client** → Peuvent être déployés en parallèle

---

## 🔍 Vérifications

### API Health Check
```bash
curl https://api.vraisavis.fr/health
# Retour attendu: {"status":"ok"}
```

### Connexion Super Admin
1. Aller sur: `https://app.vraisavis.fr/login`
2. **Email:** `admin`
3. **Password:** `admin123`
4. ⚠️ **IMPORTANT:** Changer le mot de passe immédiatement dans Paramètres

---

## 🐛 Debugging

### Voir les logs
Dans Coolify, chaque service a un onglet **Logs** pour voir les logs en temps réel.

### Problèmes courants

**API ne démarre pas:**
- Vérifier que PostgreSQL est Running
- Vérifier DATABASE_URL (le nom doit être exactement `foodback-postgres`)
- Consulter les logs de l'API

**Web ne se connecte pas à l'API:**
- Vérifier que NEXT_PUBLIC_API_URL est correct
- Vérifier que l'API est accessible: `curl https://api.vraisavis.fr/health`
- Vérifier les logs du Web

**Erreur 502 Bad Gateway:**
- Le service est en cours de démarrage, attendre 1-2 minutes
- Vérifier les logs du service

---

## 🔄 Mises à jour

Pour déployer une mise à jour du code:

1. Faire les modifications localement
2. Commit et push:
```bash
git add .
git commit -m "Update"
git push
```
3. Dans Coolify, aller sur chaque service et cliquer sur **Redeploy**

---

## 📊 Monitoring

Dans Coolify, vous pouvez voir:
- CPU usage
- Memory usage
- Logs en temps réel
- Status des services

---

## 🎯 Prochaines étapes

Après le déploiement initial:

1. ✅ Créer un compte vendeur via l'interface Super Admin
2. ✅ Créer un restaurant via l'interface Manager
3. ✅ Tester le parcours client: `https://client.vraisavis.fr/{restaurantId}`
4. 🔜 Configurer Stripe (plus tard)
5. 🔜 Configurer SMTP pour les emails (plus tard)

---

## 📞 Support

En cas de problème:
1. Vérifier les logs dans Coolify
2. Vérifier que tous les services sont "Running"
3. Vérifier les variables d'environnement
4. Tester la connectivité: `curl https://api.vraisavis.fr/health`
