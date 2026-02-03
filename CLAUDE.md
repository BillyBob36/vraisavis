# FoodBack - Spécifications Techniques Complètes

## Vue d'ensemble

FoodBack est une **plateforme SaaS multi-tenant** de gestion de feedback restaurant avec système de gamification (machine à sous).

### Objectif business
Permettre aux restaurants de collecter des avis clients de manière ludique, avec un jeu de machine à sous qui récompense les participants.

### Modèle économique
- Abonnements mensuels/annuels via Stripe
- Réseau de vendeurs commissionnés via Stripe Connect
- Toi (super admin) = seul gestionnaire de la plateforme

---

## Architecture : 4 interfaces distinctes

| Interface | Utilisateurs | Accès | Tech |
|-----------|--------------|-------|------|
| **Client** | Clients du resto | QR code / URL publique | Vanilla JS + PWA |
| **Manager** | Gérants de resto | Compte validé | Next.js |
| **Vendeur** | Commerciaux | Compte créé par super admin | Next.js |
| **Super Admin** | Toi uniquement | Accès direct | Next.js |

---

## Stack technique

### Backend
- **Runtime** : Node.js
- **Framework** : Fastify (plus performant qu'Express)
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Auth** : JWT + bcrypt
- **Paiements** : Stripe + Stripe Connect

### Frontend Admin/Manager/Vendeur
- **Framework** : Next.js (App Router)
- **UI** : Shadcn/ui + TailwindCSS
- **Graphiques** : Recharts
- **État** : React Query pour le cache/sync

### Frontend Client
- **Tech** : Vanilla JS (légèreté maximale)
- **PWA** : Service Worker pour mode offline
- **Animations** : CSS + requestAnimationFrame

### Infrastructure (Coolify/Hetzner)
- Service PostgreSQL
- Service Node.js (API Fastify)
- Service Next.js (interfaces admin)
- Service statique (interface client)
- Volumes persistants pour données

---

## Structure du projet

```
foodback/
├── CLAUDE.md                    # Ce fichier
├── apps/
│   ├── api/                     # Backend Fastify
│   │   ├── src/
│   │   │   ├── routes/          # Endpoints par domaine
│   │   │   ├── services/        # Logique métier
│   │   │   ├── middleware/      # Auth, validation, rate-limit
│   │   │   └── utils/           # Helpers
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Schéma BDD
│   │   └── package.json
│   ├── web/                     # Next.js (admin/manager/vendeur)
│   │   ├── app/
│   │   │   ├── (auth)/          # Pages login/register
│   │   │   ├── admin/           # Interface super admin
│   │   │   ├── manager/         # Interface manager resto
│   │   │   ├── vendor/          # Interface vendeur
│   │   │   └── api/             # Route handlers Next.js
│   │   ├── components/          # Composants réutilisables
│   │   └── package.json
│   └── client/                  # Interface client (vanilla JS)
│       ├── index.html
│       ├── css/
│       ├── js/
│       └── sw.js                # Service Worker PWA
├── packages/
│   └── shared/                  # Types, utils partagés
└── docker-compose.yml           # Dev local
```

---

## Base de données - Schéma Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// GESTION UTILISATEURS ET MULTI-TENANT
// ============================================

enum UserRole {
  SUPER_ADMIN
  VENDOR
  MANAGER
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum RestaurantStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

enum CommissionStatus {
  PENDING
  PAID
}

enum PrizeClaimStatus {
  PENDING
  CLAIMED
  EXPIRED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          UserRole
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  managedRestaurants Restaurant[] @relation("RestaurantManager")
  
  @@map("users")
}

model Vendor {
  id               String   @id @default(cuid())
  email            String   @unique
  passwordHash     String
  name             String
  phone            String?
  referralCode     String   @unique // Pour l'URL perso
  commissionAmount Int      @default(5000) // En centimes (50€)
  stripeAccountId  String?  // Stripe Connect
  stripeOnboarded  Boolean  @default(false)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relations
  restaurants      Restaurant[]
  commissions      Commission[]
  
  @@map("vendors")
}

model Plan {
  id                  String   @id @default(cuid())
  name                String   // "Starter", "Pro", "Premium"
  priceMonthly        Int      // En centimes
  priceYearly         Int      // En centimes
  maxRestaurants      Int
  maxFeedbacksPerMonth Int?    // null = illimité
  features            Json     // Liste des features
  stripePriceIdMonthly String?
  stripePriceIdYearly  String?
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  
  // Relations
  subscriptions Subscription[]
  
  @@map("plans")
}

model Restaurant {
  id              String           @id @default(cuid())
  name            String
  address         String
  latitude        Float
  longitude       Float
  geoRadius       Int              @default(100) // Rayon en mètres
  phone           String?
  qrCodeUrl       String?          // URL du QR code généré
  status          RestaurantStatus @default(PENDING)
  
  // Horaires de service (JSON)
  serviceHours    Json             // { lunch: { start: "12:00", end: "15:00" }, dinner: { start: "19:00", end: "23:00" } }
  
  // Personnalisation messages
  welcomeMessage  String?
  thankYouMessage String?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Relations
  managerId       String
  manager         User             @relation("RestaurantManager", fields: [managerId], references: [id])
  vendorId        String?
  vendor          Vendor?          @relation(fields: [vendorId], references: [id])
  subscription    Subscription?
  feedbacks       Feedback[]
  prizes          Prize[]
  prizeClaims     PrizeClaim[]
  fingerprints    Fingerprint[]
  dailyPrizePools DailyPrizePool[]
  
  @@map("restaurants")
}

model Subscription {
  id                   String             @id @default(cuid())
  status               SubscriptionStatus @default(TRIAL)
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  trialEndsAt          DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  
  // Relations
  restaurantId         String             @unique
  restaurant           Restaurant         @relation(fields: [restaurantId], references: [id])
  planId               String
  plan                 Plan               @relation(fields: [planId], references: [id])
  payments             Payment[]
  
  @@map("subscriptions")
}

model Payment {
  id              String   @id @default(cuid())
  amount          Int      // En centimes
  currency        String   @default("eur")
  status          String   // succeeded, failed, pending
  stripePaymentId String?
  invoiceUrl      String?
  createdAt       DateTime @default(now())
  
  // Relations
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  @@map("payments")
}

model Commission {
  id           String           @id @default(cuid())
  amount       Int              // En centimes
  status       CommissionStatus @default(PENDING)
  triggeredAt  DateTime         @default(now()) // Date du 1er paiement resto
  paidAt       DateTime?
  stripeTransferId String?
  
  // Relations
  vendorId     String
  vendor       Vendor           @relation(fields: [vendorId], references: [id])
  restaurantId String
  
  @@map("commissions")
}

// ============================================
// FONCTIONNEL : FEEDBACKS ET JEU
// ============================================

model Feedback {
  id            String   @id @default(cuid())
  positiveText  String   // Points positifs
  negativeText  String?  // Points négatifs (optionnel)
  serviceType   String   // "lunch" ou "dinner"
  isRead        Boolean  @default(false)
  isProcessed   Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  // Relations
  restaurantId  String
  restaurant    Restaurant   @relation(fields: [restaurantId], references: [id])
  fingerprintId String
  fingerprint   Fingerprint  @relation(fields: [fingerprintId], references: [id])
  
  @@map("feedbacks")
}

model Fingerprint {
  id              String    @id @default(cuid())
  hash            String    // Hash combiné fingerprint + cookie + localStorage
  lastPlayedAt    DateTime?
  lastServiceType String?   // Dernier service joué
  createdAt       DateTime  @default(now())
  expiresAt       DateTime  // Date d'expiration (quelques mois)
  
  // Relations
  restaurantId    String
  restaurant      Restaurant  @relation(fields: [restaurantId], references: [id])
  feedbacks       Feedback[]
  prizeClaims     PrizeClaim[]
  
  @@unique([hash, restaurantId])
  @@map("fingerprints")
}

model Prize {
  id           String   @id @default(cuid())
  name         String   // "Café offert", "Dessert gratuit"
  description  String?
  probability  Float    // 0.0 à 1.0
  isActive     Boolean  @default(true)
  maxPerDay    Int?     // Limite quotidienne
  maxPerWeek   Int?     // Limite hebdomadaire
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  restaurantId String
  restaurant   Restaurant   @relation(fields: [restaurantId], references: [id])
  claims       PrizeClaim[]
  dailyPools   DailyPrizePool[]
  
  @@map("prizes")
}

model DailyPrizePool {
  id           String   @id @default(cuid())
  date         DateTime @db.Date
  allocated    Int      // Nombre alloué pour ce jour
  claimed      Int      @default(0) // Nombre déjà gagné
  
  // Relations
  prizeId      String
  prize        Prize      @relation(fields: [prizeId], references: [id])
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  
  @@unique([prizeId, date])
  @@map("daily_prize_pools")
}

model PrizeClaim {
  id           String           @id @default(cuid())
  code         String           @unique // Code à présenter
  status       PrizeClaimStatus @default(PENDING)
  claimedAt    DateTime?
  expiresAt    DateTime         // Date limite de réclamation
  createdAt    DateTime         @default(now())
  
  // Relations
  prizeId      String
  prize        Prize        @relation(fields: [prizeId], references: [id])
  restaurantId String
  restaurant   Restaurant   @relation(fields: [restaurantId], references: [id])
  fingerprintId String
  fingerprint  Fingerprint  @relation(fields: [fingerprintId], references: [id])
  
  @@map("prize_claims")
}
```

---

## API Endpoints

### Public (Interface Client)

```
POST /api/v1/client/verify-location
  Body: { latitude, longitude, restaurantId }
  Response: { allowed: boolean, message: string }

POST /api/v1/client/fingerprint
  Body: { hash, restaurantId }
  Response: { fingerprintId, canPlay: boolean, reason?: string }

POST /api/v1/client/feedback
  Body: { fingerprintId, restaurantId, positiveText, negativeText? }
  Response: { feedbackId, canSpin: boolean }

POST /api/v1/client/spin
  Body: { fingerprintId, restaurantId }
  Response: { won: boolean, prize?: { name, code, expiresAt } }

POST /api/v1/client/claim
  Body: { code }
  Response: { success: boolean }
  Note: Nécessite appui long 2 secondes côté client
```

### Auth

```
POST /api/v1/auth/login
  Body: { email, password }
  Response: { token, user: { id, role, name } }

POST /api/v1/auth/register
  Body: { email, password, name, restaurantName, address, phone, referralCode? }
  Response: { message: "Compte créé" }

POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-email
```

### Manager

```
GET    /api/v1/manager/dashboard
GET    /api/v1/manager/feedbacks?page=1&limit=20&filter=unread
PATCH  /api/v1/manager/feedbacks/:id (mark as read/processed)
GET    /api/v1/manager/feedbacks/export (CSV)

GET    /api/v1/manager/prizes
POST   /api/v1/manager/prizes
PATCH  /api/v1/manager/prizes/:id
DELETE /api/v1/manager/prizes/:id

GET    /api/v1/manager/claims?status=pending
GET    /api/v1/manager/stats (graphiques, tendances)

GET    /api/v1/manager/restaurant
PATCH  /api/v1/manager/restaurant

GET    /api/v1/manager/subscription
POST   /api/v1/manager/subscription/upgrade
POST   /api/v1/manager/subscription/cancel
```

### Vendeur

```
GET    /api/v1/vendor/dashboard
GET    /api/v1/vendor/restaurants
POST   /api/v1/vendor/restaurants (créer demande)
GET    /api/v1/vendor/commissions
GET    /api/v1/vendor/referral-link
GET    /api/v1/vendor/profile
PATCH  /api/v1/vendor/profile
```

### Super Admin

```
GET    /api/v1/admin/dashboard (stats globales, MRR)

GET    /api/v1/admin/restaurants
POST   /api/v1/admin/restaurants
PATCH  /api/v1/admin/restaurants/:id
DELETE /api/v1/admin/restaurants/:id

GET    /api/v1/admin/vendors
POST   /api/v1/admin/vendors
PATCH  /api/v1/admin/vendors/:id (dont commissionAmount)
DELETE /api/v1/admin/vendors/:id

GET    /api/v1/admin/users
POST   /api/v1/admin/users
PATCH  /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id

GET    /api/v1/admin/plans
POST   /api/v1/admin/plans
PATCH  /api/v1/admin/plans/:id

GET    /api/v1/admin/commissions
PATCH  /api/v1/admin/commissions/:id (mark as paid - si manuel)

GET    /api/v1/admin/subscriptions
```

### Webhooks Stripe

```
POST /api/v1/webhooks/stripe
  Events gérés:
  - checkout.session.completed (inscription)
  - invoice.paid (paiement réussi → trigger commission)
  - invoice.payment_failed
  - customer.subscription.updated
  - customer.subscription.deleted
```

---

## Logique métier clé

### 1. Anti-spam (fingerprinting)

```javascript
// Côté client : générer un hash combiné
const generateFingerprint = async () => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  
  const combined = [
    result.visitorId,
    localStorage.getItem('fb_uid') || crypto.randomUUID(),
    document.cookie.match(/fb_sid=([^;]+)/)?.[1] || ''
  ].join('|');
  
  // Stocker pour persistance
  localStorage.setItem('fb_uid', combined.split('|')[1]);
  
  return sha256(combined);
};

// Côté serveur : vérifier éligibilité
const canPlay = async (fingerprintHash, restaurantId) => {
  const fingerprint = await prisma.fingerprint.findUnique({
    where: { hash_restaurantId: { hash: fingerprintHash, restaurantId } }
  });
  
  if (!fingerprint) return { allowed: true, reason: null };
  
  const currentService = getCurrentService(restaurantId);
  
  if (fingerprint.lastServiceType === currentService && 
      isToday(fingerprint.lastPlayedAt)) {
    return { allowed: false, reason: 'already_played_this_service' };
  }
  
  return { allowed: true, reason: null };
};
```

### 2. Machine à sous (résultat prédéterminé)

```javascript
// Le backend décide AVANT l'animation
const spinSlotMachine = async (fingerprintId, restaurantId) => {
  // 1. Vérifier éligibilité
  const canSpin = await canPlay(fingerprintId, restaurantId);
  if (!canSpin.allowed) throw new Error(canSpin.reason);
  
  // 2. Récupérer le pool du jour
  const today = new Date().toISOString().split('T')[0];
  const pools = await prisma.dailyPrizePool.findMany({
    where: { restaurantId, date: today },
    include: { prize: true }
  });
  
  // 3. Calculer les lots encore disponibles
  const availablePrizes = pools
    .filter(p => p.claimed < p.allocated && p.prize.isActive)
    .map(p => ({ ...p.prize, remaining: p.allocated - p.claimed }));
  
  // 4. Tirage au sort pondéré
  const totalWeight = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  let wonPrize = null;
  
  for (const prize of availablePrizes) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      wonPrize = prize;
      break;
    }
  }
  
  // 5. Si gagné, créer le claim et mettre à jour le pool
  if (wonPrize) {
    const code = generateUniqueCode(); // Ex: "FB-A3X9-K2M1"
    
    await prisma.$transaction([
      prisma.prizeClaim.create({
        data: {
          code,
          prizeId: wonPrize.id,
          restaurantId,
          fingerprintId,
          expiresAt: addDays(new Date(), 7)
        }
      }),
      prisma.dailyPrizePool.update({
        where: { prizeId_date: { prizeId: wonPrize.id, date: today } },
        data: { claimed: { increment: 1 } }
      })
    ]);
    
    return { won: true, prize: { name: wonPrize.name, code } };
  }
  
  return { won: false };
};
```

### 3. Horaires de service

```javascript
// Déterminer le service actuel
const getCurrentService = (restaurantId) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { serviceHours: true }
  });
  
  const now = new Date();
  const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const { lunch, dinner } = restaurant.serviceHours;
  
  if (currentTime >= lunch.start && currentTime <= lunch.end) {
    return 'lunch';
  }
  if (currentTime >= dinner.start && currentTime <= dinner.end) {
    return 'dinner';
  }
  
  return null; // Hors service
};
```

### 4. Commission Stripe Connect

```javascript
// Webhook: invoice.paid
const handleInvoicePaid = async (invoice) => {
  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
    include: { restaurant: { include: { vendor: true } } }
  });
  
  if (!subscription) return;
  
  // Vérifier si c'est le premier paiement (pas l'essai)
  const existingPayments = await prisma.payment.count({
    where: { subscriptionId: subscription.id, status: 'succeeded' }
  });
  
  // Premier paiement réel ET vendeur associé → commission
  if (existingPayments === 0 && subscription.restaurant.vendor) {
    const vendor = subscription.restaurant.vendor;
    
    // Créer le transfert Stripe Connect
    if (vendor.stripeAccountId && vendor.stripeOnboarded) {
      const transfer = await stripe.transfers.create({
        amount: vendor.commissionAmount,
        currency: 'eur',
        destination: vendor.stripeAccountId,
        metadata: {
          restaurantId: subscription.restaurantId,
          vendorId: vendor.id
        }
      });
      
      await prisma.commission.create({
        data: {
          vendorId: vendor.id,
          restaurantId: subscription.restaurantId,
          amount: vendor.commissionAmount,
          status: 'PAID',
          paidAt: new Date(),
          stripeTransferId: transfer.id
        }
      });
    }
  }
  
  // Enregistrer le paiement
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: invoice.amount_paid,
      status: 'succeeded',
      stripePaymentId: invoice.payment_intent
    }
  });
};
```

### 5. Génération QR Code

```javascript
import QRCode from 'qrcode';

const generateRestaurantQR = async (restaurantId) => {
  const url = `${process.env.CLIENT_URL}/${restaurantId}`;
  
  // Générer en base64 pour stockage
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
  
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { qrCodeUrl: qrDataUrl }
  });
  
  return qrDataUrl;
};
```

---

## Interface Client (PWA)

### Service Worker

```javascript
// sw.js
const CACHE_NAME = 'foodback-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/css/style.css',
  '/js/app.js',
  '/js/fingerprint.js',
  '/js/slot-machine.js',
  '/offline.html',
  '/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
    );
  }
});
```

### Validation du cadeau (appui long)

```javascript
// Bouton de validation par le personnel
const claimButton = document.getElementById('claim-button');
let pressTimer;
let isPressed = false;

claimButton.addEventListener('touchstart', startPress);
claimButton.addEventListener('mousedown', startPress);
claimButton.addEventListener('touchend', endPress);
claimButton.addEventListener('mouseup', endPress);
claimButton.addEventListener('mouseleave', endPress);

function startPress(e) {
  e.preventDefault();
  isPressed = true;
  claimButton.classList.add('pressing');
  
  pressTimer = setTimeout(async () => {
    if (isPressed) {
      await claimPrize();
    }
  }, 2000); // 2 secondes
}

function endPress() {
  isPressed = false;
  clearTimeout(pressTimer);
  claimButton.classList.remove('pressing');
}

async function claimPrize() {
  const code = document.getElementById('prize-code').value;
  const response = await fetch('/api/v1/client/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  
  if (response.ok) {
    showSuccess('Cadeau validé !');
  } else {
    showError('Code invalide ou expiré');
  }
}
```

---

## Polling Dashboard Manager

```javascript
// hooks/useFeedbackPolling.ts
import { useQuery } from '@tanstack/react-query';

export const useFeedbackPolling = () => {
  return useQuery({
    queryKey: ['feedbacks', 'unread'],
    queryFn: () => fetch('/api/v1/manager/feedbacks?filter=unread').then(r => r.json()),
    refetchInterval: 60000, // 60 secondes
    refetchIntervalInBackground: false
  });
};
```

---

## Variables d'environnement

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/foodback

# Auth
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx

# URLs
API_URL=https://api.foodback.fr
CLIENT_URL=https://play.foodback.fr
WEB_URL=https://app.foodback.fr

# Email (optionnel pour notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
FROM_EMAIL=noreply@foodback.fr
ADMIN_EMAIL=admin@foodback.fr
```

---

## Déploiement Coolify

### docker-compose.yml (référence)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: foodback
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: foodback
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U foodback"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://foodback:${DB_PASSWORD}@postgres:5432/foodback
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3001:3001"

  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "3000:3000"

  client:
    image: nginx:alpine
    volumes:
      - ./apps/client:/usr/share/nginx/html:ro
    ports:
      - "3002:80"

volumes:
  postgres_data:
```

---

## Workflow de développement avec Claude Code

### Ordre de développement recommandé

1. **Setup initial**
   - Initialiser le monorepo (pnpm workspace)
   - Configurer Prisma + PostgreSQL local
   - Créer le schéma de base de données
   - Générer le client Prisma

2. **Backend API**
   - Structure Fastify de base
   - Routes d'authentification
   - Middleware JWT
   - CRUD restaurants de base

3. **Interface Client**
   - Page de feedback (géoloc + fingerprint)
   - Machine à sous avec animations
   - PWA + Service Worker
   - Page de réclamation cadeau

4. **Dashboard Manager**
   - Layout Next.js + Shadcn
   - Page feedbacks avec polling
   - Configuration machine à sous
   - Stats et graphiques

5. **Interface Vendeur**
   - Dashboard vendeur
   - Création de demandes
   - Suivi commissions

6. **Super Admin**
   - Gestion globale
   - Stripe Connect onboarding
   - Monitoring

7. **Intégration Stripe**
   - Checkout pour inscription
   - Webhooks
   - Stripe Connect pour vendeurs

8. **Finalisation**
   - Tests
   - PWA complète
   - Déploiement Coolify

### Commandes utiles

```bash
# Initialisation
pnpm install
pnpm prisma generate
pnpm prisma migrate dev

# Développement
pnpm dev              # Lance tous les services
pnpm --filter api dev # Lance uniquement l'API
pnpm --filter web dev # Lance uniquement le front

# Base de données
pnpm prisma studio    # Interface visuelle BDD
pnpm prisma migrate reset # Reset complet (dev)

# Production
pnpm build
pnpm start
```

---

## Notes importantes pour Claude Code

1. **Toujours utiliser TypeScript** pour l'API et le front Next.js
2. **Valider les entrées** avec Zod sur chaque endpoint
3. **Gérer les erreurs** de manière cohérente (try/catch + error handler global)
4. **Utiliser les transactions Prisma** pour les opérations multi-tables
5. **Sécuriser les routes** avec le middleware d'authentification
6. **Tester la géolocalisation** avec des coordonnées réelles
7. **Ne jamais exposer** les secrets côté client
8. **Logger** les actions importantes (connexions, paiements, erreurs)

---

## Checklist avant production

- [ ] Variables d'environnement configurées
- [ ] SSL/HTTPS activé
- [ ] Rate limiting en place
- [ ] Backups PostgreSQL automatisés
- [ ] Monitoring des erreurs (Sentry optionnel)
- [ ] Webhooks Stripe testés
- [ ] PWA testée offline
- [ ] QR codes fonctionnels
- [ ] Emails transactionnels configurés
