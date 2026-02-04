-- Template de contrat vendeur pré-rempli pour KAISER JOHANN (KAISER CO)
INSERT INTO contract_templates (
    id,
    type,
    version,
    "companyName",
    "companyLegalForm",
    "companyCapital",
    "companyAddress",
    "companyRCS",
    "companySIRET",
    "companyVAT",
    "companyPhone",
    "companyEmail",
    "companyDirector",
    "hostingProvider",
    "hostingAddress",
    "dpoEmail",
    "mediatorName",
    "mediatorAddress",
    "mediatorWebsite",
    jurisdiction,
    "monthlyPrice",
    "commissionRate",
    "commissionDuration",
    "contractContent",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'VENDOR_CONTRACT',
    '1.0',
    'KAISER JOHANN (KAISER CO)',
    'Entrepreneur individuel (Micro-entreprise)',
    'Non applicable (EI)',
    '61 RUE DE LYON, 75012 PARIS',
    'Non inscrit au RCS (Entrepreneur individuel)',
    '791 069 610 00032',
    'FR52791069610',
    '+33 X XX XX XX XX',
    'contact@kaiserco.fr',
    'KAISER JOHANN',
    'Hetzner Online GmbH',
    'Industriestr. 25, 91710 Gunzenhausen, Allemagne',
    NULL,
    'Médiateur de la consommation CNPM - MÉDIATION DE LA CONSOMMATION',
    '27 avenue de la Libération, 42400 Saint-Chamond',
    'https://cnpm-mediation-consommation.eu',
    'Tribunaux compétents de Paris',
    NULL,
    25.0,
    12,
    '# CONTRAT D''APPORTEUR D''AFFAIRES

**ENTRE LES SOUSSIGNÉS :**

**D''UNE PART,**

KAISER JOHANN (KAISER CO)
Entrepreneur individuel (Micro-entreprise)
Siège social : 61 RUE DE LYON, 75012 PARIS
SIRET : 791 069 610 00032
N° TVA intracommunautaire : FR52791069610

Représentée par KAISER JOHANN, en qualité de Chef d''entreprise

Ci-après dénommée « **la Société** »

**ET D''AUTRE PART,**

[NOM PRÉNOM ou RAISON SOCIALE de l''apporteur]
[Si personne physique : adresse complète]
[Si personne morale : forme juridique, siège social, RCS, SIRET]

Ci-après dénommé(e) « **l''Apporteur** »

Ci-après ensemble dénommées « **les Parties** »

---

## PRÉAMBULE

La Société édite et commercialise une plateforme web destinée aux restaurants professionnels, accessible à l''adresse https://vraisavis.fr (ci-après la « **Plateforme** »).

Dans le cadre du développement de son activité, la Société souhaite recourir aux services d''apporteurs d''affaires pour identifier et mettre en relation avec de nouveaux clients restaurateurs.

L''Apporteur déclare disposer des compétences et du réseau nécessaires pour accomplir cette mission.

Les Parties ont donc convenu de conclure le présent contrat d''apport d''affaires, dont les termes et conditions sont les suivants.

---

## IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :

## ARTICLE 1 - OBJET DU CONTRAT

Le présent contrat a pour objet de définir les conditions dans lesquelles l''Apporteur s''engage à effectuer des **mises en relation ponctuelles** entre la Société et des clients potentiels (restaurateurs professionnels).

**La mission de l''Apporteur se limite strictement à :**
- Identifier des restaurateurs susceptibles d''être intéressés par la Plateforme
- Présenter l''offre commerciale de la Société à ces prospects
- Communiquer au prospect le lien d''inscription personnalisé fourni par la Société
- Encourager le prospect à s''inscrire sur la Plateforme

**La mission de l''Apporteur ne comprend pas :**
- La négociation des conditions contractuelles (qui relèvent de la Société)
- La signature du contrat (effectuée directement par le client)
- Le suivi commercial du client après son inscription
- La gestion de la relation client
- Toute obligation de développement d''un portefeuille client permanent

**Nature ponctuelle de la mission :**
La mission de l''Apporteur est ponctuelle et indépendante. Chaque mise en relation constitue une opération distincte et autonome. L''Apporteur n''a aucune obligation de résultat, ni d''exclusivité, ni de quota à atteindre.

## ARTICLE 2 - STATUT DE L''APPORTEUR

### 2.1 Indépendance
L''Apporteur intervient en toute indépendance, sans lien de subordination avec la Société. Il organise librement son activité, ses horaires et ses méthodes de travail.

Le présent contrat ne constitue pas un contrat de travail et ne crée aucun lien de subordination entre les Parties.

### 2.2 Absence d''exclusivité
L''Apporteur est libre d''exercer toute autre activité professionnelle, y compris pour le compte de tiers, dès lors que cette activité n''est pas directement concurrente de la Société.

### 2.3 Qualification juridique
Le présent contrat est un **contrat d''apporteur d''affaires** au sens de la jurisprudence française. L''Apporteur n''a pas la qualité d''agent commercial au sens des articles L134-1 et suivants du Code de commerce.

En conséquence, **l''Apporteur n''est pas tenu de s''inscrire au Registre Spécial des Agents Commerciaux (RSAC)**.

### 2.4 Obligations déclaratives
L''Apporteur est responsable de ses propres obligations fiscales, sociales et administratives. Il s''engage à :
- Déclarer ses revenus issus de ce contrat aux administrations compétentes
- S''acquitter de toutes cotisations sociales et fiscales
- Fournir à la Société tout justificatif nécessaire (numéro SIRET si applicable, attestation URSSAF, etc.)

## ARTICLE 3 - MODALITÉS D''EXÉCUTION

### 3.1 Lien de parrainage personnalisé
La Société fournit à l''Apporteur un lien d''inscription personnalisé unique (ci-après le « **Lien de Parrainage** ») permettant de tracer les inscriptions provenant de ses mises en relation.

Format : https://app.vraisavis.fr/register?ref=[CODE_UNIQUE_APPORTEUR]

### 3.2 Processus d''apport
Lorsqu''un prospect identifié par l''Apporteur souhaite s''inscrire, l''Apporteur lui communique son Lien de Parrainage. Le prospect s''inscrit alors librement et directement sur la Plateforme via ce lien.

**L''inscription est réalisée directement par le restaurateur lui-même**, qui accepte les Conditions Générales d''Utilisation et de Vente de la Société. L''Apporteur n''intervient à aucun moment dans le processus contractuel entre la Société et le client.

### 3.3 Validation de l''apport
Un apport est considéré comme validé lorsque :
1. Le prospect s''est inscrit via le Lien de Parrainage de l''Apporteur
2. Le prospect a complété son inscription (coordonnées, validation email)
3. Le prospect a accepté les CGU/CGV de la Société
4. Le premier paiement a été effectué avec succès

La Société se réserve le droit de refuser une inscription qui ne respecterait pas ses critères d''acceptation (informations incomplètes, activité non conforme, etc.).

### 3.4 Tableau de suivi
L''Apporteur dispose d''un accès à un tableau de bord personnel sur la Plateforme lui permettant de suivre :
- Le nombre de clics sur son Lien de Parrainage
- Le nombre d''inscriptions validées
- Le statut de chaque client apporté
- Le calcul de ses commissions

## ARTICLE 4 - RÉMUNÉRATION

### 4.1 Principe de la commission
En contrepartie de chaque mise en relation ayant abouti à une inscription validée, l''Apporteur perçoit une commission calculée sur les paiements effectivement reçus par la Société de la part du client apporté.

### 4.2 Taux de commission
Le taux de commission est fixé à **25% HT** du montant de l''abonnement mensuel (hors taxes) payé par le client.

**Base de calcul :**
- Abonnement client : 49€ HT / mois
- Commission apporteur : 12,25€ HT / mois (soit 25%)

La commission est calculée sur le montant HT effectivement encaissé, après déduction de tout impayé, avoir ou remboursement.

### 4.3 Durée de validité de l''apport - LIMITATION TEMPORELLE ESSENTIELLE

**La commission est due uniquement pendant une durée maximale de 12 (douze) mois consécutifs à compter de la date de validation de l''inscription du client apporté** (ci-après la « **Période de Commission** »).

**Cette commission constitue une rémunération différée de la mise en relation initiale effectuée par l''Apporteur**. Elle n''est pas une commission récurrente sur la durée de vie du client, mais une modalité d''échelonnement du paiement de l''apport ponctuel.

**À l''issue de cette Période de Commission de 12 mois, aucune commission ne sera due à l''Apporteur, même si la relation commerciale entre la Société et le client apporté se poursuit.**

**Exemple concret :**
- Client apporté inscrit le 15 janvier 2026
- Premier paiement validé le 15 janvier 2026
- Commission due de janvier 2026 à décembre 2026 inclus (12 mois)
- À partir de janvier 2027 : plus aucune commission due sur ce client

### 4.4 Conditionnement au paiement effectif
**La commission n''est due que sur les paiements effectivement et définitivement encaissés par la Société.**

En conséquence :
- Si le client ne paie pas : aucune commission n''est due pour ce mois
- Si le client effectue un chargeback (contestation CB) : la commission correspondante est annulée ou déduite
- Si le client obtient un remboursement : la commission correspondante est annulée ou déduite

### 4.5 Résiliation anticipée par le client - CLAUSE ESSENTIELLE

**En cas de résiliation du contrat par le client avant l''expiration de la Période de Commission de 12 mois, quelle qu''en soit la raison, le versement de la commission cesse immédiatement à la date effective de résiliation.**

L''Apporteur ne peut prétendre à aucune indemnité, dommages et intérêts ou compensation pour la perte des commissions futures non encore acquises.

### 4.6 Non-utilisation du service
Si un client apporté s''inscrit mais n''utilise jamais activement la Plateforme et cesse ses paiements dans les 3 premiers mois, la Société se réserve le droit de considérer l''apport comme non qualifié et de cesser le versement de la commission, sans que l''Apporteur puisse prétendre à un quelconque dédommagement.

### 4.7 Plafonnement
Le montant total maximum de commission par client apporté est plafonné à **147€ HT** (soit 12 mois × 12,25€ HT), sauf modification ultérieure du tarif d''abonnement.

### 4.8 Absence de droit de suite
**L''Apporteur reconnaît et accepte expressément qu''il ne bénéficie d''aucun "droit de suite" au-delà de la Période de Commission de 12 mois.**

Après cette période, le client devient client exclusif de la Société, sans que l''Apporteur puisse revendiquer un quelconque droit, rémunération ou intérêt sur ce client.

## ARTICLE 5 - MODALITÉS DE PAIEMENT DES COMMISSIONS

### 5.1 Périodicité
Les commissions sont calculées et versées **mensuellement**, au cours du mois M+1 suivant le mois durant lequel les paiements ont été encaissés.

**Exemple :** Les commissions sur les paiements encaissés en janvier 2026 seront versées en février 2026.

### 5.2 Facturation
L''Apporteur est tenu d''émettre une facture conforme à la législation en vigueur pour chaque versement de commission.

**Si l''Apporteur est une personne physique non immatriculée**, il doit établir une note d''honoraires mentionnant :
- Ses nom, prénom et adresse
- La mention "Apporteur d''affaires - Revenus à déclarer"
- Le détail des apports et commissions
- La mention "TVA non applicable - article 293B du CGI" (si non assujetti)

**Si l''Apporteur est une personne morale ou un auto-entrepreneur**, il doit émettre une facture comportant toutes les mentions légales obligatoires (SIRET, TVA, etc.).

### 5.3 Virement
Le paiement des commissions s''effectue par virement bancaire sur le compte communiqué par l''Apporteur, dans un délai de 30 jours suivant réception de la facture conforme.

### 5.4 Relevé mensuel
La Société met à disposition de l''Apporteur un relevé mensuel détaillé indiquant :
- Le nombre de clients apportés actifs
- Le montant HT des abonnements encaissés
- Le montant de la commission due
- Le nombre de mois écoulés pour chaque client (pour suivi de la limite de 12 mois)

## ARTICLE 6 - OBLIGATIONS DE L''APPORTEUR

L''Apporteur s''engage à :

### 6.1 Loyauté
- Agir avec loyauté et bonne foi dans l''exécution de sa mission
- Présenter de manière exacte et non trompeuse l''offre de la Société
- Ne pas dénigrer la Société, ses services ou ses concurrents
- Ne pas faire de fausses promesses ou garanties non autorisées

### 6.2 Conformité légale
- Respecter la législation en vigueur, notamment en matière de démarchage, de protection des données personnelles (RGPD) et de concurrence
- Ne pas procéder à du démarchage abusif ou illégal
- Obtenir le consentement des prospects avant toute communication de leurs coordonnées

### 6.3 Données personnelles (RGPD)
L''Apporteur s''engage à :
- Ne collecter que les données strictement nécessaires (nom, prénom, email, téléphone du restaurateur)
- Informer les prospects de la transmission de leurs coordonnées à la Société
- Ne pas utiliser les données collectées à d''autres fins que la mise en relation
- Supprimer toute donnée personnelle après transmission du Lien de Parrainage

L''Apporteur garantit avoir obtenu le consentement libre, éclairé et spécifique des prospects pour la transmission de leurs coordonnées.

### 6.4 Non-concurrence pendant le contrat
Pendant la durée du présent contrat, l''Apporteur s''interdit d''apporter des clients à des sociétés proposant des services directement concurrents de la Plateforme dans le même secteur géographique.

**Cette clause ne constitue pas une obligation d''exclusivité** mais une simple obligation de loyauté limitée aux activités directement concurrentes.

### 6.5 Confidentialité
L''Apporteur s''engage à conserver confidentielles toutes les informations commerciales, techniques ou stratégiques dont il pourrait avoir connaissance dans le cadre de l''exécution du présent contrat.

Cette obligation subsiste pendant toute la durée du contrat et pendant 2 ans après sa cessation.

### 6.6 Image de marque
L''Apporteur s''engage à respecter l''image de marque de la Société et à ne pas utiliser son nom, sa marque ou son logo sans autorisation écrite préalable, sauf dans le cadre strict de sa mission d''apporteur.

## ARTICLE 7 - OBLIGATIONS DE LA SOCIÉTÉ

La Société s''engage à :

### 7.1 Fourniture du lien de parrainage
Mettre à disposition de l''Apporteur un Lien de Parrainage fonctionnel et un accès au tableau de bord de suivi.

### 7.2 Documentation commerciale
Fournir à l''Apporteur les documents et supports de présentation nécessaires à l''accomplissement de sa mission (plaquettes, documentation technique, grille tarifaire).

### 7.3 Traçabilité et transparence
Assurer la traçabilité des inscriptions via le Lien de Parrainage et mettre à jour le tableau de bord de l''Apporteur.

### 7.4 Paiement des commissions
Verser les commissions dues dans les délais convenus, sous réserve de réception d''une facture conforme.

### 7.5 Information
Informer l''Apporteur de toute modification substantielle de l''offre commerciale, des tarifs ou des conditions d''utilisation de la Plateforme.

## ARTICLE 8 - DURÉE DU CONTRAT

### 8.1 Durée initiale
Le présent contrat est conclu pour une **durée indéterminée** à compter de sa signature.

### 8.2 Période de Commission individuelle
**Il est rappelé que la durée de versement de la commission pour chaque client apporté est limitée à 12 mois**, conformément à l''article 4.3, quelle que soit la durée du présent contrat.

## ARTICLE 9 - RÉSILIATION

### 9.1 Résiliation libre
Chaque Partie peut résilier le présent contrat à tout moment, sans motif, moyennant un préavis de **30 (trente) jours calendaires**.

La résiliation doit être notifiée par lettre recommandée avec accusé de réception ou par email avec accusé de réception à l''adresse :
- Pour la Société : contact@kaiserco.fr
- Pour l''Apporteur : [EMAIL APPORTEUR]

### 9.2 Résiliation pour manquement
En cas de manquement grave de l''une des Parties à ses obligations contractuelles, l''autre Partie pourra résilier le contrat de plein droit, sans préavis ni indemnité, 15 jours après l''envoi d''une mise en demeure restée sans effet.

### 9.3 Effets de la résiliation
À la date effective de résiliation du contrat :

**Concernant les commissions en cours :**
- Les commissions déjà acquises et non encore versées seront payées conformément aux modalités habituelles
- **Les clients apportés avant la résiliation continuent de générer des commissions jusqu''à l''expiration de leur Période de Commission de 12 mois respective**

**Restitution :**
- L''Apporteur cesse toute utilisation du nom, de la marque et des supports commerciaux de la Société
- L''Apporteur détruit toutes les données personnelles de prospects en sa possession
- Le Lien de Parrainage est désactivé (aucune nouvelle inscription ne génèrera de commission)

### 9.4 Absence d''indemnité de rupture
**Les Parties reconnaissent expressément que l''Apporteur n''a droit à aucune indemnité de fin de contrat, indemnité de clientèle, indemnité compensatrice ou toute autre forme d''indemnisation en cas de résiliation du présent contrat, quelle qu''en soit la cause.**

Cette disposition est justifiée par la nature ponctuelle de la mission d''apporteur d''affaires, qui ne crée pas de droit à une indemnité de rupture contrairement au statut d''agent commercial.

## ARTICLE 10 - RESPONSABILITÉ

### 10.1 Responsabilité de l''Apporteur
L''Apporteur est seul responsable :
- Des méthodes de prospection qu''il emploie
- Du respect de la législation applicable (démarchage, RGPD, etc.)
- De ses déclarations fiscales et sociales
- De tout dommage causé à des tiers dans l''exercice de sa mission

L''Apporteur garantit la Société contre tout recours de tiers résultant d''un manquement de sa part à ses obligations légales ou contractuelles.

### 10.2 Responsabilité de la Société
La Société est responsable :
- Du bon fonctionnement de la Plateforme
- De l''exécution des contrats conclus avec les clients apportés
- Du paiement des commissions dues conformément au présent contrat

La Société ne saurait être tenue responsable :
- De la résiliation anticipée d''un contrat par un client apporté
- Du non-paiement par un client apporté
- De l''utilisation ou non-utilisation de la Plateforme par le client

### 10.3 Limitation de responsabilité
En tout état de cause, la responsabilité de chaque Partie ne pourra excéder le montant total des commissions versées au cours des 12 derniers mois.

## ARTICLE 11 - ASSURANCE

Chaque Partie s''engage à souscrire et maintenir en vigueur pendant toute la durée du contrat une assurance responsabilité civile professionnelle couvrant les dommages pouvant résulter de son activité.

Sur demande, chaque Partie fournira à l''autre une attestation d''assurance en cours de validité.

## ARTICLE 12 - INTUITU PERSONAE

Le présent contrat est conclu intuitu personae. L''Apporteur ne peut en aucun cas céder, transférer ou sous-traiter ses droits et obligations sans l''accord écrit préalable de la Société.

## ARTICLE 13 - INDÉPENDANCE DES CLAUSES

Si une ou plusieurs stipulations du présent contrat sont tenues pour non valides ou déclarées telles en application d''une loi, d''un règlement ou à la suite d''une décision définitive d''une juridiction compétente, les autres stipulations garderont toute leur force et leur portée.

Les Parties s''efforceront alors de remplacer la clause invalidée par une clause valide correspondant à l''esprit et à l''objectif du présent contrat.

## ARTICLE 14 - MODIFICATION DU CONTRAT

Toute modification du présent contrat devra faire l''objet d''un avenant signé par les deux Parties.

Toutefois, la Société se réserve le droit de modifier unilatéralement :
- Le taux de commission (à la baisse comme à la hausse)
- Les modalités de calcul de la commission
- Les conditions d''éligibilité des apports

sous réserve d''en informer l''Apporteur par écrit (email) avec un préavis de 30 jours.

En cas de modification défavorable, l''Apporteur dispose d''un droit de résiliation sans préavis dans les 30 jours suivant la notification.

## ARTICLE 15 - PROTECTION DES DONNÉES PERSONNELLES

### 15.1 Responsabilités respectives
Dans le cadre du présent contrat, chaque Partie agit en tant que **responsable de traitement autonome** pour les données personnelles qu''elle collecte et traite.

### 15.2 Engagements de l''Apporteur (RGPD)
L''Apporteur s''engage à :
- Ne collecter que les données strictement nécessaires à la mise en relation
- Informer les prospects de la finalité de la collecte et de la transmission à la Société
- Obtenir le consentement explicite des prospects
- Ne pas constituer de fichier client permanent
- Supprimer les données après transmission du Lien de Parrainage
- Respecter les droits des personnes (accès, rectification, suppression)

### 15.3 Engagements de la Société
La Société traite les données d''inscription des clients conformément à sa Politique de Confidentialité et aux dispositions du RGPD.

### 15.4 Notification de violation
En cas de violation de données personnelles, la Partie concernée s''engage à en informer l''autre Partie dans les 48 heures.

## ARTICLE 16 - CONFIDENTIALITÉ

Les informations échangées entre les Parties dans le cadre du présent contrat sont confidentielles.

Chaque Partie s''interdit de divulguer à des tiers, sans l''accord écrit préalable de l''autre Partie :
- Les termes du présent contrat (notamment les taux de commission)
- Les informations commerciales, techniques ou stratégiques
- Les résultats et performances

Cette obligation subsiste pendant toute la durée du contrat et pendant 2 ans après sa cessation, quelle qu''en soit la cause.

**Exceptions :** Cette obligation ne s''applique pas aux informations publiques, aux obligations légales de divulgation, ou aux informations déjà connues de la Partie réceptrice.

## ARTICLE 17 - FORCE MAJEURE

Aucune des Parties ne sera tenue responsable d''un retard ou d''une inexécution de ses obligations résultant d''un cas de force majeure tel que défini par l''article 1218 du Code civil.

Si le cas de force majeure perdure au-delà de 60 jours, chaque Partie pourra résilier le contrat de plein droit, sans indemnité, par lettre recommandée avec accusé de réception.

## ARTICLE 18 - CONVENTION DE PREUVE

Les Parties conviennent que les registres informatisés de la Société (logs de connexion, enregistrements des inscriptions via Lien de Parrainage, historique des paiements) font foi entre elles et constituent une preuve recevable des apports réalisés et des commissions dues.

## ARTICLE 19 - NOTIFICATIONS

Toute notification au titre du présent contrat devra être effectuée :
- Par email avec accusé de réception
- Ou par lettre recommandée avec accusé de réception

Aux adresses suivantes :

**Pour la Société :**
Email : contact@kaiserco.fr
Adresse postale : 61 RUE DE LYON, 75012 PARIS

**Pour l''Apporteur :**
Email : [EMAIL APPORTEUR]
Adresse postale : [ADRESSE APPORTEUR]

Toute modification d''adresse devra être notifiée à l''autre Partie par lettre recommandée avec AR dans les 15 jours.

## ARTICLE 20 - DROIT APPLICABLE ET RÈGLEMENT DES LITIGES

### 20.1 Droit applicable
Le présent contrat est soumis au droit français.

### 20.2 Règlement amiable
En cas de différend relatif à l''interprétation ou à l''exécution du présent contrat, les Parties s''engagent à rechercher une solution amiable avant toute action judiciaire.

### 20.3 Juridiction compétente
À défaut de règlement amiable dans un délai de 30 jours suivant la notification du différend, compétence expresse est attribuée aux **Tribunaux compétents de Paris**, nonobstant pluralité de défendeurs ou appel en garantie, même en cas de procédure d''urgence ou de procédure conservatoire.

---

## FAIT EN DEUX EXEMPLAIRES ORIGINAUX

**Fait à [VILLE], le [DATE]**

**Pour la Société**
KAISER JOHANN (KAISER CO)

**KAISER JOHANN**
Chef d''entreprise

Signature :

---

**Pour l''Apporteur**

**[NOM PRÉNOM ou RAISON SOCIALE]**

Signature :

*(Précédée de la mention manuscrite "Lu et approuvé, bon pour accord")*

---

## ANNEXE 1 - INFORMATIONS APPORTEUR (à compléter)

**Coordonnées bancaires pour virement des commissions :**
- Titulaire du compte : 
- IBAN : 
- BIC/SWIFT : 

**Informations fiscales et sociales :**
- Numéro SIRET (si applicable) : 
- Numéro de TVA intracommunautaire (si applicable) : 
- Régime fiscal : ☐ Micro-entreprise  ☐ Entreprise individuelle  ☐ Société  ☐ Particulier
- Assujetti à TVA : ☐ Oui  ☐ Non

**Assurance responsabilité civile professionnelle :**
- Compagnie d''assurance : 
- Numéro de contrat : 
- Date d''échéance : 

**Lien de Parrainage attribué :**
https://app.vraisavis.fr/register?ref=[CODE_UNIQUE]

---

**L''Apporteur certifie l''exactitude des informations ci-dessus.**

**Date :** 
**Signature :**',
    true,
    NOW(),
    NOW()
);
