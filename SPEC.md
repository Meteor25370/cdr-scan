# Spécification fonctionnelle et technique

## Objectif

`cdr-scan` doit permettre d'analyser rapidement des CDR/EDR SmartMS et de transformer un flux brut volumineux en diagnostic lisible:

- comprendre la volumétrie,
- corréler les événements en sessions,
- identifier les sessions en échec ou anormales,
- lire les KPI/QoS sans effort,
- accéder aux données brutes décodées quand un diagnostic exige le détail.

## Entrées supportées

Formats acceptés par l'interface:

- `.tgz`,
- `.tar`,
- `.gz`,
- `.cdr`,
- `.edr`.

Les lignes CDR/EDR sont au format pipe-delimited.

Structure logique attendue:

1. nombre de champs principaux,
2. bloc principal,
3. nombre de champs groupe,
4. bloc groupe,
5. nombre de paramètres,
6. bloc paramètres.

Le type CDR/EDR est inféré par le nombre de paramètres et mappé sur:

- `CDR_PARAM_FIELDS`,
- `EDR_PARAM_FIELDS`.

## Modèle événement

Chaque événement parsé doit exposer au minimum:

- identifiant technique,
- nom événement,
- catégorie,
- icône,
- date,
- champs groupe (`g1_msisdn`, `g2_org_id`),
- `session_id` si présent,
- paramètres typés,
- ligne brute,
- identifiant interne unique.

Les événements inconnus doivent rester visibles avec un nom générique afin de ne pas masquer de données.

## Corrélation session

Une session est construite à partir de `session_id`.

Exceptions:

- les événements `Register` et `ApplicationEnd` sans session ne doivent pas générer des pseudo-sessions massives.

Agrégats session:

- `startTime`,
- `endTime`,
- `duration`,
- `status`,
- `dominantCategory`,
- `eventType`,
- `eventCount`,
- `caller`,
- `callee`,
- `org`,
- `media_type`,
- `is_emergency`,
- `reason`,
- `termination_side`,
- KPI/QoS agrégés.

Règles de statut:

- si des CDR portent `status`, la majorité `OK` donne une session `OK`, sinon `NOK`;
- sans CDR, la présence d'un événement de fin donne `OK`;
- sinon `in-progress` ou `unknown` selon le contexte.

Règles de durée:

- pour un appel avec un seul CDR, utiliser la durée CDR;
- pour les sessions multi-CDR ou groupe, utiliser l'écart timestamp entre premier et dernier événement.

## Agrégation KPI/QoS

Les métriques sont agrégées sur tous les CDR d'une session:

- moyenne des champs `_avg`,
- minimum des champs `_min`,
- maximum des champs `_max`,
- somme des champs `_beyond`,
- moyenne des champs `_computed`.

Champs KPI:

- `kpi1_*`,
- `kpi2_*`,
- `kpi3_*`,
- `kpi4_*`.

Champs QoS:

- `packet_loss_*`,
- `int_jitter_*`,
- `rtt_*`.

## Seuils et couleurs

Les seuils sont centralisés dans `METRIC_THRESHOLDS`.

États visuels:

- OK: `metric-tone-ok`,
- warning: `metric-tone-warn`,
- critique: `metric-tone-bad`,
- indisponible: `metric-tone-muted`.

KPI:

- `KPI1 <= 300 ms`,
- `KPI2 <= 1000 ms`,
- `KPI3 <= 300 ms`,
- `KPI4 <= 150 ms`, puis warning jusqu'à `350 ms`.

QoS:

- `RTT <= 150 ms`, warning jusqu'à `300 ms`,
- `Jitter <= 30 ms`, warning jusqu'à `60 ms`,
- `Packet loss <= 1 %`, warning jusqu'à `3 %`.

Les valeurs dépassant le warning sont critiques.

## Dashboard

Le dashboard doit afficher:

- événements totaux,
- sessions totales,
- taux de succès,
- urgences,
- distribution par catégorie,
- distribution de statut,
- distribution des durées,
- timeline horaire.

Les graphiques doivent être recalculés après chaque import.

## Onglet Événements

Exigences:

- tableau paginé,
- recherche texte,
- tri par colonne,
- statut affiché sous forme de badge,
- accès popup données brutes événement,
- conservation de la ligne brute.

## Onglet Sessions

Exigences:

- tableau paginé,
- recherche texte,
- filtre statut,
- tri par colonne,
- colonne `Évts` triable placée dans la cellule expand,
- chevron expand pour afficher les événements de la session,
- chargement lazy du détail expand,
- bouton `Brut` qui ouvre les données brutes session.

La colonne `Évts` doit trier sur `eventCount`.

## Onglet Qualité & KPIs

Exigences:

- cartes d'agrégats KPI/QoS,
- graphiques KPI,
- graphique QoS,
- tableau compact utilisant la largeur disponible,
- tri sur `Temps`, `Événement`, `Cat.`, `Évts`, KPI et QoS,
- recherche incluant session, type événement, date et catégorie.

Le tableau doit limiter le scroll horizontal par:

- table layout fixe,
- colonnes en pourcentage,
- libellés courts,
- valeurs complètes en tooltip quand elles sont tronquées.

## Popup détail session

Exigences:

- occuper la largeur popup disponible,
- afficher résumé session,
- afficher informations d'appel,
- afficher KPI/QoS colorés,
- afficher timeline des événements,
- garder les métadonnées en ligne autant que possible.

## Popup données brutes

Exigences générales:

- afficher la ligne brute,
- afficher les champs décodés,
- organiser les champs par sections métier,
- mettre les champs importants en évidence,
- garder les détails secondaires disponibles mais moins dominants.

Sections attendues:

- `Contexte événement`,
- `Qui / où`,
- `Quand / média`,
- `Issue de l'appel`,
- `SMS`,
- `Localisation`,
- `KPI MCPTT`,
- `Qualité réseau`,
- `Autres paramètres`.

### Rendu KPI MCPTT brut

La section doit afficher une ligne par KPI:

- `KPI1`,
- `KPI2`,
- `KPI3`,
- `KPI4`.

Chaque ligne doit afficher, si disponible:

- `moy.`,
- `min`,
- `max`,
- `comp.`,
- `hors`.

### Rendu Qualité réseau brut

La section doit afficher une ligne par métrique:

- `Jitter`,
- `RTT`,
- `Packet loss`.

Chaque ligne doit afficher, si disponible:

- `moy.`,
- `min`,
- `max`.

Les colonnes non disponibles peuvent rester vides pour conserver l'alignement.

## Tri

Règles générales:

- clic sur un en-tête triable: tri ascendant;
- second clic sur le même en-tête: tri descendant;
- changement de tri: retour à la page 1;
- tri numérique pour les nombres;
- tri date pour les objets `Date`;
- tri texte insensible à la casse.

## Pagination

La taille de page est définie par `TABLE_PAGE_SIZE`.

Les tableaux événements, sessions et KPI doivent afficher:

- plage courante,
- total,
- boutons page précédente/suivante.

## Performance

Contraintes:

- éviter de pré-rendre les gros détails de session;
- construire le contenu expand uniquement au premier dépliage;
- limiter l'affichage brut session à `MAX_RAW_EVENTS`;
- disposer les graphiques avant de les recréer.

## Non-objectifs

L'application ne fait pas:

- stockage serveur,
- authentification,
- modification des fichiers source,
- envoi réseau des CDR/EDR importés,
- analyse probabiliste ou ML.

## Critères d'acceptation rapides

Après import d'un fichier valide:

- les onglets se remplissent,
- les sessions sont corrélées,
- le tri `Évts` fonctionne dans `Sessions`,
- le tri `Évts` fonctionne dans `Qualité & KPIs`,
- les valeurs KPI/QoS sont colorées,
- les détails bruts affichent KPI1 à KPI4 sur quatre lignes,
- les détails bruts affichent Jitter, RTT et Packet loss sur trois lignes,
- les popups utilisent la largeur disponible,
- le bouton `Brut` n'ouvre pas la ligne principale par propagation.

