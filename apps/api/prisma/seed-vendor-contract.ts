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

Ci-après désignées ensemble « les Parties » et individuellement « la Partie »

---

## PRÉAMBULE

La Société édite et commercialise une plateforme web destinée aux restaurants professionnels, accessible à l'adresse https://vraisavis.fr (ci-après la « **Plateforme** »). Cette plateforme propose des services de gestion d'avis clients et de réputation en ligne pour les restaurateurs.

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

### 2.3 Obligations déclaratives
L'Apporteur est responsable de ses propres obligations fiscales, sociales et administratives. Il s'engage à :
- Déclarer ses revenus issus de ce contrat aux administrations compétentes
- S'acquitter de toutes cotisations sociales et fiscales applicables
- Fournir à la Société tout justificatif nécessaire (numéro SIRET si applicable, attestation URSSAF, etc.)

La Société ne saurait être tenue responsable du non-respect par l'Apporteur de ses obligations déclaratives.

### 2.4 Absence d'exclusivité
L'Apporteur est libre d'exercer toute autre activité professionnelle, y compris pour le compte de tiers, dès lors que cette activité n'est pas directement concurrente de la Société au sens de l'article 6.4 du présent contrat.

L'Apporteur n'a aucune obligation de résultat, ni d'exclusivité, ni de quota à atteindre.

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

**La commission est due uniquement pendant une durée maximale de 12 (douze) mois consécutifs à compter de la date de validation de l'inscription du client apporté** (ci-après la « Période de Commission »).

**À l'issue de cette Période de Commission de 12 mois, aucune commission ne sera due à l'Apporteur, même si la relation commerciale entre la Société et le client apporté se poursuit.**

### 4.3 Conditionnement au paiement effectif
**La commission n'est due que sur les paiements effectivement et définitivement encaissés par la Société.**

En cas de remboursement, d'impayé, de contestation de paiement (chargeback) ou d'annulation de transaction, la commission correspondante ne sera pas due ou sera déduite des commissions futures.

### 4.4 Plafonnement
Le montant total maximum de commission par client apporté est plafonné à **147€ HT** (soit 12 mois × 12,25€ HT).

### 4.5 Résiliation anticipée par le client - CLAUSE ESSENTIELLE

**En cas de résiliation du contrat par le client apporté avant l'expiration de la Période de Commission de 12 mois, quelle qu'en soit la raison (résiliation volontaire, non-paiement, fermeture d'établissement, etc.), le versement de la commission cesse immédiatement à la date effective de résiliation.**

L'Apporteur ne peut prétendre à aucune indemnité, dommages et intérêts ou compensation pour la perte des commissions futures non encore acquises.

### 4.6 Non-utilisation du service

Si un client apporté s'inscrit mais n'utilise jamais activement la Plateforme (aucune connexion, aucune utilisation des fonctionnalités) et cesse ses paiements dans les 3 premiers mois suivant son inscription, la Société se réserve le droit de considérer l'apport comme non qualifié et de cesser le versement de la commission, sans que l'Apporteur puisse prétendre à un quelconque dédommagement.

## ARTICLE 5 - MODALITÉS DE PAIEMENT

### 5.1 Périodicité
Les commissions sont calculées et versées **mensuellement**, au cours du mois M+1 suivant le mois durant lequel les paiements ont été encaissés.

Le paiement des commissions s'effectue par virement bancaire sur le compte communiqué par l'Apporteur dans l'Annexe 1.

### 5.2 Facturation

L'Apporteur est tenu d'émettre un document comptable conforme à la législation en vigueur pour chaque versement de commission.

**Si l'Apporteur est une personne physique non immatriculée**, il doit établir une note d'honoraires mentionnant ses coordonnées complètes, le détail des apports et le montant de la commission.

**Si l'Apporteur est un professionnel (micro-entreprise, société, etc.)**, il doit émettre une facture comportant toutes les mentions légales obligatoires (SIRET, numéro de facture, date, TVA si applicable).

Le paiement intervient dans un délai de 30 jours suivant réception du document comptable conforme. En l'absence de document conforme, la Société se réserve le droit de suspendre le versement jusqu'à réception.

## ARTICLE 6 - OBLIGATIONS DE L'APPORTEUR

### 6.1 Obligations générales
L'Apporteur s'engage à :
- Agir avec loyauté et bonne foi
- Présenter de manière exacte et non trompeuse l'offre de la Société
- Respecter la législation en vigueur (RGPD, démarchage commercial)
- Ne pas porter atteinte à l'image et à la réputation de la Société

### 6.2 Méthodes de prospection
L'Apporteur s'interdit tout démarchage abusif, agressif ou contraire aux bonnes pratiques commerciales. Il s'engage notamment à respecter les règles relatives au démarchage téléphonique et à la prospection par voie électronique.

### 6.3 Utilisation de la marque
L'Apporteur est autorisé à utiliser le nom et le logo de la Société uniquement dans le cadre de sa mission d'apporteur d'affaires et dans le respect des directives communiquées par la Société. Toute autre utilisation est interdite sans accord préalable écrit.

### 6.4 Non-concurrence pendant le contrat

Pendant la durée du présent contrat, l'Apporteur s'interdit d'apporter des clients à des sociétés proposant des services directement concurrents de la Plateforme dans le secteur de la gestion d'avis clients et de réputation en ligne pour les restaurants.

**Cette clause ne constitue pas une obligation d'exclusivité** mais une simple obligation de loyauté limitée aux activités directement concurrentes.

### 6.5 Interdiction de signature à la place du client - CLAUSE ESSENTIELLE

L'Apporteur s'interdit formellement de :
- Compléter le formulaire d'inscription à la place du restaurateur
- Utiliser une adresse email qu'il contrôle pour l'inscription du client
- Créer un compte au nom d'un restaurateur sans son accord préalable et exprès
- Signer ou valider le contrat d'abonnement sans l'accord préalable et exprès du restaurateur
- Fournir des informations fausses ou inexactes lors de l'inscription d'un prospect

**L'Apporteur s'engage à uniquement fournir au restaurateur le Lien de Parrainage et à laisser le restaurateur effectuer lui-même toutes les étapes d'inscription et de validation.**

**En cas de manquement à cette obligation :**
- Résiliation immédiate du présent contrat sans préavis
- Annulation de toutes les commissions liées aux clients frauduleusement inscrits
- Remboursement des commissions déjà versées pour ces clients
- Responsabilité de l'Apporteur pour tout préjudice causé à la Société ou aux clients concernés

## ARTICLE 7 - CONFIDENTIALITÉ

### 7.1 Informations confidentielles
L'Apporteur s'engage à conserver strictement confidentielles toutes les informations commerciales, techniques, financières ou stratégiques dont il pourrait avoir connaissance dans le cadre de l'exécution du présent contrat, notamment :
- Les conditions commerciales et tarifaires de la Société
- Les données relatives aux clients et prospects
- Les méthodes et outils de la Société
- Toute information désignée comme confidentielle par la Société

### 7.2 Durée de l'obligation
Cette obligation de confidentialité subsiste pendant toute la durée du contrat et pendant **2 (deux) ans après sa cessation**, quelle qu'en soit la cause.

### 7.3 Exceptions
Ne sont pas considérées comme confidentielles les informations :
- Déjà connues du public au moment de leur communication
- Devenues publiques sans faute de l'Apporteur
- Reçues légitimement d'un tiers non tenu à confidentialité

## ARTICLE 8 - DURÉE ET RÉSILIATION

### 8.1 Durée
Le présent contrat est conclu pour une **durée indéterminée** à compter de sa signature par les deux Parties.

### 8.2 Résiliation avec préavis
Chaque Partie peut résilier le présent contrat à tout moment, moyennant un préavis de **30 jours calendaires**, notifié par email avec accusé de réception ou par lettre recommandée avec accusé de réception.

### 8.3 Résiliation pour faute
En cas de manquement grave d'une Partie à ses obligations contractuelles, l'autre Partie pourra résilier le contrat de plein droit, sans préavis ni indemnité, après mise en demeure restée sans effet pendant 15 jours.

Constituent notamment des manquements graves :
- Pour l'Apporteur : violation de l'article 6.5 (inscription frauduleuse), violation de la confidentialité, atteinte à l'image de la Société
- Pour la Société : non-paiement des commissions dues pendant plus de 60 jours

### 8.4 Effets de la résiliation

À la date effective de résiliation du contrat :

**Concernant les commissions en cours :**
- Les commissions déjà acquises et non encore versées seront payées conformément aux modalités habituelles, sous réserve de la réception d'un document comptable conforme
- **Les clients apportés avant la résiliation continuent de générer des commissions jusqu'à l'expiration de leur Période de Commission de 12 mois respective**, sauf résiliation anticipée du client

**Exemple :** Si le contrat d'apporteur est résilié le 1er juillet 2026 mais qu'un client a été apporté le 1er mars 2026, l'Apporteur continuera de percevoir les commissions sur ce client jusqu'au 28 février 2027 (sous réserve que le client reste abonné).

**Obligations post-résiliation :**
- L'Apporteur cesse immédiatement toute utilisation du nom, de la marque et des supports commerciaux de la Société
- L'Apporteur détruit toutes les données personnelles de prospects en sa possession
- Le Lien de Parrainage est désactivé (aucune nouvelle inscription ne générera de commission)

### 8.5 Absence d'indemnité
**Les Parties reconnaissent expressément que l'Apporteur n'a droit à aucune indemnité de fin de contrat**, conformément à son statut d'apporteur d'affaires distinct de celui d'agent commercial.

## ARTICLE 9 - PROTECTION DES DONNÉES PERSONNELLES

L'Apporteur s'engage à respecter le Règlement Général sur la Protection des Données (RGPD) et la loi Informatique et Libertés, et notamment à :
- Ne collecter que les données strictement nécessaires à sa mission
- Informer les prospects de la transmission de leurs coordonnées à la Société
- Obtenir le consentement explicite des prospects avant toute transmission de données
- Ne pas conserver les données personnelles au-delà de la durée nécessaire
- Mettre en œuvre les mesures de sécurité appropriées

En cas de violation de données personnelles, l'Apporteur en informe immédiatement la Société.

## ARTICLE 10 - RESPONSABILITÉ

### 10.1 Responsabilité de l'Apporteur
L'Apporteur est seul responsable :
- Des méthodes de prospection qu'il emploie
- Du respect de la législation applicable (démarchage, RGPD, etc.)
- De ses déclarations fiscales et sociales
- De tout dommage causé à des tiers dans l'exercice de sa mission

L'Apporteur garantit la Société contre tout recours de tiers résultant d'un manquement de sa part à ses obligations légales ou contractuelles.

### 10.2 Responsabilité de la Société
La Société est responsable du bon fonctionnement de la Plateforme et du paiement des commissions dues conformément au présent contrat.

La Société ne saurait être tenue responsable :
- De la résiliation anticipée d'un contrat par un client apporté
- Du non-paiement par un client apporté
- De l'utilisation ou non-utilisation de la Plateforme par le client
- Des décisions commerciales du client apporté

### 10.3 Limitation de responsabilité
En tout état de cause, la responsabilité de chaque Partie au titre du présent contrat ne pourra excéder le montant total des commissions versées à l'Apporteur au cours des 12 derniers mois précédant le fait générateur de responsabilité.

Cette limitation ne s'applique pas en cas de faute lourde ou intentionnelle.

## ARTICLE 11 - ASSURANCE

Chaque Partie s'engage à souscrire et maintenir en vigueur pendant toute la durée du contrat une assurance responsabilité civile professionnelle couvrant les dommages pouvant résulter de son activité.

Sur demande, chaque Partie fournira à l'autre une attestation d'assurance en cours de validité dans un délai de 15 jours.

## ARTICLE 12 - FORCE MAJEURE

Aucune des Parties ne sera tenue responsable d'un retard ou d'une inexécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.

La Partie invoquant la force majeure doit en informer l'autre Partie dans les meilleurs délais et prendre toutes les mesures raisonnables pour en limiter les effets.

Si le cas de force majeure perdure au-delà de 60 jours, chaque Partie pourra résilier le contrat de plein droit, sans indemnité, par lettre recommandée avec accusé de réception.

## ARTICLE 13 - CONVENTION DE PREUVE

Les Parties conviennent expressément que les registres informatisés de la Société (logs de connexion, enregistrements des inscriptions via Lien de Parrainage, historique des paiements, emails échangés) font foi entre elles et constituent une preuve recevable des apports réalisés et des commissions dues.

En cas de contestation, les données enregistrées par la Société prévaudront, sauf preuve contraire apportée par l'Apporteur.

## ARTICLE 14 - NOTIFICATIONS

Toute notification au titre du présent contrat devra être effectuée :
- Par email avec accusé de réception (ou confirmation de lecture)
- Ou par lettre recommandée avec accusé de réception

**Pour la Société :**
Email : contact@vraisavis.fr
Adresse postale : 61 RUE DE LYON, 75012 PARIS

**Pour l'Apporteur :**
Email : [EMAIL APPORTEUR]
Adresse postale : [ADRESSE APPORTEUR]

Tout changement d'adresse devra être notifié à l'autre Partie dans les meilleurs délais.

## ARTICLE 15 - DISPOSITIONS GÉNÉRALES

### 15.1 Intégralité
Le présent contrat et ses annexes constituent l'intégralité de l'accord entre les Parties et remplacent tous accords antérieurs, écrits ou verbaux, relatifs à son objet.

### 15.2 Modification
Toute modification du présent contrat devra faire l'objet d'un avenant écrit signé par les deux Parties.

### 15.3 Nullité partielle
Si une ou plusieurs stipulations du présent contrat sont tenues pour non valides ou déclarées comme telles en application d'une loi, d'un règlement ou d'une décision définitive d'une juridiction compétente, les autres stipulations garderont toute leur force et leur portée.

### 15.4 Non-renonciation
Le fait pour l'une des Parties de ne pas se prévaloir d'un manquement de l'autre Partie à l'une quelconque des obligations visées au présent contrat ne saurait être interprété comme une renonciation à l'obligation en cause.

### 15.5 Cession
Le présent contrat est conclu intuitu personae. L'Apporteur ne peut céder tout ou partie de ses droits et obligations sans l'accord préalable écrit de la Société.

## ARTICLE 16 - DROIT APPLICABLE ET JURIDICTION

Le présent contrat est soumis au droit français.

En cas de litige relatif à l'interprétation ou à l'exécution du présent contrat, les Parties s'efforceront de trouver une solution amiable. À défaut d'accord amiable dans un délai de 30 jours, compétence exclusive est attribuée aux **Tribunaux compétents de Paris**, même en cas de pluralité de défendeurs ou d'appel en garantie.

---

**FAIT EN DEUX EXEMPLAIRES ORIGINAUX**

**Fait à [VILLE], le [DATE]**

*(Chaque signature doit être précédée de la mention manuscrite "Lu et approuvé, bon pour accord")*

**Pour la Société**
KAISER JOHANN (KAISER CO)
KAISER JOHANN, Chef d'entreprise

Signature : _______________________

**Pour l'Apporteur**
[NOM PRÉNOM ou RAISON SOCIALE de l'apporteur]

Signature : _______________________

---

## ANNEXE 1 - INFORMATIONS APPORTEUR

**Identité complète :**
- Nom/Prénom ou Raison sociale : [NOM PRÉNOM ou RAISON SOCIALE de l'apporteur]
- Adresse complète : [ADRESSE APPORTEUR]
- Email : [EMAIL APPORTEUR]
- Téléphone : ____________________

**Statut professionnel :**
☐ Micro-entreprise  ☐ Entreprise individuelle  ☐ Société  ☐ Particulier

**Informations fiscales et sociales :**
- Numéro SIRET (si applicable) : [Si personne morale : forme juridique, siège social, RCS, SIRET]
- Numéro de TVA intracommunautaire (si applicable) : ____________________
- Assujetti à TVA : ☐ Oui  ☐ Non

**Coordonnées bancaires pour virement des commissions :**
- Titulaire du compte : ____________________
- IBAN : ____________________
- BIC/SWIFT : ____________________

**Assurance responsabilité civile professionnelle :**
- Compagnie d'assurance : ____________________
- Numéro de contrat : ____________________

**Lien de Parrainage attribué :**
https://app.vraisavis.fr/register?ref=[CODE_UNIQUE_APPORTEUR]

---

**L'Apporteur certifie l'exactitude des informations ci-dessus et s'engage à informer la Société de tout changement.**

**Fait à [VILLE], le [DATE]**

**Signature de l'Apporteur :**
*(Précédée de la mention manuscrite "Lu et approuvé, bon pour accord")*

_______________________`;

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
        version: '2.0',
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
        version: '2.0',
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
