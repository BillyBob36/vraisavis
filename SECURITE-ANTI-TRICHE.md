# Systeme de Securite Anti-Triche — FoodBack V4

## Vue d'ensemble

FoodBack est une application de collecte de feedbacks gamifiee pour les restaurants.
Le client donne son avis (positif et negatif), puis joue a une machine a sous pour
tenter de gagner un cadeau (cafe offert, dessert gratuit, etc.).

Le systeme repose sur **4 couches de protection** pour empecher toute triche.

---

## COUCHE 1 — Empreinte digitale de l'appareil (Fingerprint)

A l'ouverture de l'app, **FingerprintJS v3** genere un identifiant unique base sur
les caracteristiques materielles et logicielles du telephone :
- Navigateur et version
- Resolution d'ecran
- Systeme d'exploitation
- Fuseau horaire
- GPU (WebGL)
- Polices installees
- Canvas fingerprinting

Cet identifiant est quasiment impossible a modifier sans changer de telephone.
Il sert de cle d'identification tout au long du processus.

**Fichier :** `app.js` (lignes 57-65)

---

## COUCHE 2 — Verification de geolocalisation

L'application demande l'autorisation de geolocalisation du navigateur.
La distance entre le client et le restaurant est calculee avec la **formule de Haversine**
(precision d'environ 0.5 metre).

Si le client n'est pas physiquement a proximite du restaurant, il ne peut pas jouer.
Cela empeche toute tentative de jeu a distance.

**Fichier :** `app.js` (lignes 68-151)

---

## COUCHE 3 — Anti-spam : une seule partie par service

Avant de lancer le jeu, l'application envoie le fingerprint au backend, qui verifie
dans la feuille Google Sheets `fingerprints-recents` si cet appareil a deja joue
pendant le service en cours (petit-dejeuner, dejeuner ou diner).

- Si oui  -> Acces refuse : "Vous avez deja joue recemment. Une partie par service maximum."
- Si non  -> Le jeu peut commencer

Le reset se fait entre les services.

**Fichiers :** `app.js` (lignes 153-164), `server.js` (lignes 258-295)

---

## COUCHE 4 — Validation physique par le serveur du restaurant

C'est le verrou final. Quand le client gagne, il ne peut pas recuperer son cadeau seul.

### Processus exact, etape par etape :

```
1. Le client gagne au jeu
   -> Un code cadeau de 8 caracteres alphanumeriques est genere
   -> Le code est enregistre dans la base de donnees (Google Sheets)

2. L'ecran "Presentez cet ecran au serveur" s'affiche
   -> Le code et le lot gagne sont affiches en gros caracteres

3. Un avertissement s'affiche en rouge :
   "Attention ! Si vous appuyez sans responsable, votre lot sera perdu."

4. Le client montre PHYSIQUEMENT son telephone au serveur du restaurant

5. Le serveur verifie visuellement le code et le lot affiches

6. Le serveur MAINTIENT le bouton "Ne pas appuyer" ENFONCE pendant 2 SECONDES
   -> Ce maintien prolonge empeche tout clic accidentel
   -> C'est une action intentionnelle qui necessite la presence du serveur

7. Au relachement du bouton (apres les 2 secondes) :
   -> Un appel est fait au backend
   -> Le backend verifie dans Google Sheets :
      a) Le code existe-t-il ?
      b) Le code est-il bien un code gagnant ?
      c) Le code est-il actif ?
      d) Le code n'a-t-il PAS deja ete retire/utilise ?
   -> Si TOUTES les verifications passent :
      Le code est marque comme UTILISE dans la feuille "fingerprints-gagnants"
      avec un timestamp de recuperation

8. Message : "Cadeau valide ! Profitez bien de votre recompense"

9. Retour a l'ecran d'accueil
   -> Le fingerprint reste marque en base
   -> Impossible de rejouer
```

**Fichiers :** `app.js` (lignes 220-250, 387-420), `index.html` (lignes 147-163)

---

## SYSTEME DE RECUPERATION DIFFEREE — "Venir chercher son cadeau un autre jour"

En plus de la recuperation immediate, le systeme prevoit un mecanisme pour les clients
qui ne veulent pas (ou ne peuvent pas) recuperer leur lot le jour meme.

### Comment ca fonctionne

Quand le client gagne, il recoit un **code secret de 8 caracteres** (ex: A7K9X2M5).
Ce code est enregistre dans la base de donnees.
Le client est invite a noter ce code ou a scanner un QR code affiche dans le restaurant.

### Le jour ou le client revient

```
1. Le client ouvre l'application depuis le restaurant

2. Sur l'ecran d'accueil, il clique sur "Recuperer mes cadeaux"
   (bouton secondaire, different du bouton "Jouer")

3. L'ecran "Recuperer mon cadeau" s'affiche
   -> Champ de saisie : "Entre ton code secret"
   -> Le bouton "Recuperer ce lot" est DESACTIVE tant que le champ est vide

4. Le client tape son code et clique sur "Recuperer ce lot"

5. Le code est envoye au backend qui verifie dans Google Sheets :
   -> Le code existe-t-il ?       Non -> "Code invalide"
   -> Le code est-il deja utilise ? Oui -> "Code deja utilise"
   -> Le code est-il valide ?      Oui -> Le lot gagne est affiche

6. Si le code est valide :
   -> Redirection vers le MEME ecran de presentation au serveur

7. Le MEME processus de validation s'applique :
   -> Le serveur maintient le bouton 2 secondes
   -> Appel backend pour verifier que le code est gagnant et non utilise
   -> Marquage comme recupere dans la base
```

**Fichiers :** `index.html` (lignes 39, 138-145), `app.js` (lignes 207-217, 387-402)

### Etat d'implementation

| Element                                              | Etat                                  |
|------------------------------------------------------|---------------------------------------|
| Bouton "Recuperer mes cadeaux" sur l'accueil         | Fonctionnel                           |
| Ecran de saisie du code secret                       | Fonctionnel                           |
| Activation du bouton quand le code est saisi         | Fonctionnel                           |
| Validation du code et redirection vers ecran serveur | Fonctionnel                           |
| Ecran de presentation au serveur + bouton 2 secondes | Fonctionnel                           |
| Verification backend reelle (Google Sheets)          | En simulation (codes de test en dur)  |
| Generation de QR code                                | Non implemente                        |
| Envoi du code par email ou SMS                       | Non implemente                        |
| Sauvegarde du code dans le navigateur (localStorage) | Non implemente                        |

---

## TABLEAU RECAPITULATIF DES PROTECTIONS

| Tentative de triche                      | Ce qui bloque                                          |
|------------------------------------------|--------------------------------------------------------|
| Rejouer depuis le meme telephone         | Fingerprint deja en base                               |
| Jouer sans etre au restaurant            | Geolocalisation hors perimetre                         |
| Jouer plusieurs fois dans la journee     | Anti-spam : 1 partie par service                       |
| Recuperer le lot sans serveur            | Avertissement + bouton maintien 2s                     |
| Reutiliser un code deja recupere         | Verification backend au moment du maintien du bouton   |
| Inventer un faux code                    | Verification backend : code inexistant                 |
| Cliquer accidentellement sur le bouton   | Maintien obligatoire de 2 secondes                     |

---

## REFERENCES DES FICHIERS CLES

| Fichier                | Lignes      | Fonction securite                        |
|------------------------|-------------|------------------------------------------|
| `app.js`               | 57-65       | Initialisation du fingerprint            |
| `app.js`               | 68-151      | Verification geolocalisation             |
| `app.js`               | 153-164     | Verification anti-spam                   |
| `app.js`               | 207-217     | Saisie et validation code cadeau         |
| `app.js`               | 220-250     | Bouton maintien 2 secondes              |
| `app.js`               | 273-281     | Enregistrement du fingerprint            |
| `app.js`               | 306-349     | Recuperation du resultat du jeu          |
| `app.js`               | 387-420     | Validation du code + appel backend       |
| `server.js`            | 23-28       | Rate limiting (100 req / 15 min)         |
| `server.js`            | 117-173     | Endpoint soumission feedback             |
| `server.js`            | 175-210     | Endpoint resultat du lot                 |
| `server.js`            | 212-254     | Endpoint enregistrement fingerprint      |
| `server.js`            | 258-295     | Endpoint verification fingerprint        |
| `google-sheets-api.js` | 112-142     | Verification fingerprint en base         |
| `google-sheets-api.js` | 145-201     | Enregistrement fingerprint               |
| `google-sheets-api.js` | 204-258     | Validation code cadeau                   |
| `google-sheets-api.js` | 261-292     | Marquage code comme utilise              |
| `index.html`           | 39          | Bouton "Recuperer mes cadeaux"           |
| `index.html`           | 128         | Message recuperation ulterieure          |
| `index.html`           | 138-145     | Ecran saisie code secret                 |
| `index.html`           | 147-163     | Ecran presentation au serveur            |
