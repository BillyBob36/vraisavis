import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const contractContent = `# CONTRAT D'APPORTEUR D'AFFAIRES

**ENTRE LES SOUSSIGNÉS :**

**D'UNE PART,**

KAISER JOHANN (KAISER CO)
Entrepreneur individuel (Micro-entreprise)
Siège social : 61 RUE DE LYON, 75012 PARIS
SIRET : 791 069 610 00032
N° TVA intracommunautaire : FR52791069610

Représentée par KAISER JOHANN, en qualité de Chef d'entreprise

Ci-après dénommée « **la Société** »

**ET D'AUTRE PART,**

[NOM PRÉNOM ou RAISON SOCIALE de l'apporteur]
[Si personne physique : adresse complète]
[Si personne morale : forme juridique, siège social, RCS, SIRET]

Ci-après dénommé(e) « **l'Apporteur** »

---

## PRÉAMBULE

La Société édite et commercialise une plateforme web destinée aux restaurants professionnels, accessible à l'adresse https://vraisavis.fr (ci-après la « **Plateforme** »).

Dans le cadre du développement de son activité, la Société souhaite recourir aux services d'apporteurs d'affaires pour identifier et mettre en relation avec de nouveaux clients restaurateurs.

L'Apporteur déclare disposer des compétences et du réseau nécessaires pour accomplir cette mission.

---

## ARTICLE 1 - OBJET DU CONTRAT

Le présent contrat a pour objet de définir les conditions dans lesquelles l'Apporteur s'engage à effectuer des **mises en relation ponctuelles** entre la Société et des clients potentiels (restaurateurs professionnels).

**La mission de l'Apporteur se limite strictement à :**
- Identifier des restaurateurs susceptibles d'être intéressés par la Plateforme
- Présenter l'offre commerciale de la Société à ces prospects
- Communiquer au prospect le lien d'inscription personnalisé fourni par la Société
- Encourager le prospect à s'inscrire sur la Plateforme

## ARTICLE 2 - STATUT DE L'APPORTEUR

### 2.1 Indépendance
L'Apporteur intervient en toute indépendance, sans lien de subordination avec la Société. Il organise librement son activité, ses horaires et ses méthodes de travail.

Le présent contrat ne constitue pas un contrat de travail et ne crée aucun lien de subordination entre les Parties.

### 2.2 Qualification juridique
Le présent contrat est un **contrat d'apporteur d'affaires** au sens de la jurisprudence française. L'Apporteur n'a pas la qualité d'agent commercial au sens des articles L134-1 et suivants du Code de commerce.

## ARTICLE 3 - MODALITÉS D'EXÉCUTION

### 3.1 Lien de parrainage personnalisé
La Société fournit à l'Apporteur un lien d'inscription personnalisé unique permettant de tracer les inscriptions provenant de ses mises en relation.

Format : https://app.vraisavis.fr/register?ref=[CODE_UNIQUE]

### 3.2 Validation de l'apport
Un apport est considéré comme validé lorsque :
1. Le prospect s'est inscrit via le Lien de Parrainage de l'Apporteur
2. Le prospect a complété son inscription
3. Le prospect a accepté les CGU/CGV de la Société
4. Le premier paiement a été effectué avec succès

## ARTICLE 4 - RÉMUNÉRATION

### 4.1 Taux de commission
Le taux de commission est fixé à **25% HT** du montant de l'abonnement mensuel (hors taxes) payé par le client.

**Base de calcul :**
- Abonnement client : 49€ HT / mois
- Commission apporteur : 12,25€ HT / mois (soit 25%)

### 4.2 Durée de validité de l'apport

**La commission est due uniquement pendant une durée maximale de 12 (douze) mois consécutifs à compter de la date de validation de l'inscription du client apporté.**

**À l'issue de cette Période de Commission de 12 mois, aucune commission ne sera due à l'Apporteur, même si la relation commerciale entre la Société et le client apporté se poursuit.**

### 4.3 Conditionnement au paiement effectif
**La commission n'est due que sur les paiements effectivement et définitivement encaissés par la Société.**

### 4.4 Plafonnement
Le montant total maximum de commission par client apporté est plafonné à **147€ HT** (soit 12 mois × 12,25€ HT).

## ARTICLE 5 - MODALITÉS DE PAIEMENT

Les commissions sont calculées et versées **mensuellement**, au cours du mois M+1 suivant le mois durant lequel les paiements ont été encaissés.

Le paiement des commissions s'effectue par virement bancaire sur le compte communiqué par l'Apporteur.

## ARTICLE 6 - OBLIGATIONS DE L'APPORTEUR

L'Apporteur s'engage à :
- Agir avec loyauté et bonne foi
- Présenter de manière exacte et non trompeuse l'offre de la Société
- Respecter la législation en vigueur (RGPD, démarchage)
- Conserver confidentielles les informations commerciales

## ARTICLE 7 - DURÉE ET RÉSILIATION

Le présent contrat est conclu pour une **durée indéterminée**.

Chaque Partie peut résilier le présent contrat à tout moment, moyennant un préavis de **30 jours calendaires**.

**Les Parties reconnaissent expressément que l'Apporteur n'a droit à aucune indemnité de fin de contrat.**

## ARTICLE 8 - PROTECTION DES DONNÉES PERSONNELLES

L'Apporteur s'engage à respecter le RGPD et à :
- Ne collecter que les données strictement nécessaires
- Informer les prospects de la transmission de leurs coordonnées
- Obtenir le consentement explicite des prospects

## ARTICLE 9 - DROIT APPLICABLE

Le présent contrat est soumis au droit français.

En cas de litige, compétence est attribuée aux **Tribunaux compétents de Paris**.

---

**Fait en deux exemplaires**

**Pour la Société**
KAISER JOHANN (KAISER CO)
KAISER JOHANN, Chef d'entreprise

**Pour l'Apporteur**
[NOM PRÉNOM ou RAISON SOCIALE]

*(Mention manuscrite "Lu et approuvé, bon pour accord")*

---

**ANNEXE - INFORMATIONS APPORTEUR**

**Coordonnées bancaires :**
- IBAN : [À compléter lors de la signature]

**Lien de Parrainage attribué :**
https://app.vraisavis.fr/register?ref=[CODE_UNIQUE]`;

async function main() {
  console.log('Création du template de contrat vendeur...');

  const existingTemplate = await prisma.contractTemplate.findFirst({
    where: { type: 'VENDOR_CONTRACT', isActive: true },
  });

  if (existingTemplate) {
    console.log('Un template actif existe déjà, mise à jour...');
    await prisma.contractTemplate.update({
      where: { id: existingTemplate.id },
      data: {
        version: '1.0',
        companyName: 'KAISER JOHANN (KAISER CO)',
        companyLegalForm: 'Entrepreneur individuel (Micro-entreprise)',
        companyCapital: 'Non applicable (EI)',
        companyAddress: '61 RUE DE LYON, 75012 PARIS',
        companyRCS: 'Non inscrit au RCS (Entrepreneur individuel)',
        companySIRET: '791 069 610 00032',
        companyVAT: 'FR52791069610',
        companyPhone: '+33 7 83 82 61 30',
        companyEmail: 'contact@vraisavis.fr',
        companyDirector: 'KAISER JOHANN',
        hostingProvider: 'Hetzner Online GmbH',
        hostingAddress: 'Industriestr. 25, 91710 Gunzenhausen, Allemagne',
        mediatorName: 'CNPM - MÉDIATION DE LA CONSOMMATION',
        mediatorAddress: '27 avenue de la Libération, 42400 Saint-Chamond',
        mediatorWebsite: 'https://cnpm-mediation-consommation.eu',
        jurisdiction: 'Tribunaux compétents de Paris',
        commissionRate: 25,
        commissionDuration: 12,
        contractContent,
      },
    });
    console.log('Template mis à jour !');
  } else {
    await prisma.contractTemplate.create({
      data: {
        type: 'VENDOR_CONTRACT',
        version: '1.0',
        companyName: 'KAISER JOHANN (KAISER CO)',
        companyLegalForm: 'Entrepreneur individuel (Micro-entreprise)',
        companyCapital: 'Non applicable (EI)',
        companyAddress: '61 RUE DE LYON, 75012 PARIS',
        companyRCS: 'Non inscrit au RCS (Entrepreneur individuel)',
        companySIRET: '791 069 610 00032',
        companyVAT: 'FR52791069610',
        companyPhone: '+33 7 83 82 61 30',
        companyEmail: 'contact@vraisavis.fr',
        companyDirector: 'KAISER JOHANN',
        hostingProvider: 'Hetzner Online GmbH',
        hostingAddress: 'Industriestr. 25, 91710 Gunzenhausen, Allemagne',
        mediatorName: 'CNPM - MÉDIATION DE LA CONSOMMATION',
        mediatorAddress: '27 avenue de la Libération, 42400 Saint-Chamond',
        mediatorWebsite: 'https://cnpm-mediation-consommation.eu',
        jurisdiction: 'Tribunaux compétents de Paris',
        commissionRate: 25,
        commissionDuration: 12,
        contractContent,
        isActive: true,
      },
    });
    console.log('Template créé !');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
