# CDR/EDR Analyzer

Application web statique pour analyser des fichiers CDR/EDR StreamWIDE SmartMS.

L'outil charge une archive ou un fichier CDR/EDR, parse les événements pipe-delimited, reconstruit les sessions, affiche les indicateurs de qualité et donne accès aux données brutes décodées.

## Lancement

Depuis le dossier du projet:

```bash
node server.js
```

Par défaut le serveur écoute sur:

```text
http://127.0.0.1:8089
```

Le serveur accepte aussi les variables:

```bash
HOST=127.0.0.1 PORT=8089 node server.js
```

En production locale, le service systemd fourni lance:

```text
/usr/bin/node /home/egarcia/cdr-scan/server.js
```

Le chemin public prévu par les proxies est:

```text
/cdr-scan/
```

## Fichiers principaux

- `index.html`: application complète, UI, parsing, corrélation, graphiques et modales.
- `server.js`: serveur HTTP statique minimal.
- `cdr-scan.service`: unité systemd.
- `Caddyfile`: exemple de reverse proxy vers `127.0.0.1:8089`.
- `SW_SmartMS44_CDR_EDR.pdf`: référence locale des formats CDR/EDR SmartMS.
- `SPEC.md`: spécification fonctionnelle et technique complète.

## Spécifications incluses

La spécification détaillée est disponible dans [`SPEC.md`](./SPEC.md).

Elle couvre:

- formats d'entrée,
- modèle événement,
- corrélation des sessions,
- agrégation KPI/QoS,
- seuils et couleurs,
- fonctionnement des onglets,
- popups de détails,
- organisation des champs bruts,
- tri, pagination et critères d'acceptation.

## Parcours utilisateur

1. Ouvrir l'application.
2. Importer un fichier `.tgz`, `.tar`, `.gz`, `.cdr` ou `.edr`.
3. Consulter le dashboard de synthèse.
4. Explorer les événements unitaires.
5. Explorer les sessions corrélées.
6. Consulter la page `Qualité & KPIs`.
7. Ouvrir les détails ou les données brutes pour diagnostiquer une session.

## Onglets

### Dashboard

Vue de synthèse:

- nombre d'événements,
- nombre de sessions,
- taux de succès,
- volume d'urgences,
- répartition par catégorie,
- statut des sessions,
- durée des appels,
- timeline horaire.

### Événements

Liste paginée des événements CDR/EDR.

Fonctions:

- recherche texte,
- tri par colonne,
- statut,
- durée,
- session,
- accès aux données brutes événement.

### Sessions

Vue orientée corrélation.

Fonctions:

- recherche session/appelant/appelé/catégorie,
- filtre par statut,
- tri par colonne,
- tri par nombre d'événements via la colonne `Évts` placée à côté du chevron,
- dépliage d'une session pour voir ses événements,
- accès aux détails session,
- accès aux données brutes session.

### Qualité & KPIs

Vue orientée diagnostic performance.

Contenu:

- cartes KPI/QoS agrégées,
- graphiques KPI,
- graphique QoS,
- tableau compact et triable.

Colonnes triables importantes:

- `Temps`,
- `Événement`,
- `Cat.`,
- `Évts`,
- `KPI1` à `KPI4`,
- `RTT`,
- `Jitter`,
- `Loss`.

## Détails et données brutes

Les popups de détails utilisent la largeur disponible pour permettre une lecture rapide.

Les champs décodés des données brutes sont organisés par sections métier:

- `Contexte événement`,
- `Qui / où`,
- `Quand / média`,
- `Issue de l'appel`,
- `SMS`,
- `Localisation`,
- `KPI MCPTT`,
- `Qualité réseau`,
- `Autres paramètres`.

Les sections `KPI MCPTT` et `Qualité réseau` sont synthétisées en lignes:

- une ligne par KPI: `KPI1`, `KPI2`, `KPI3`, `KPI4`,
- une ligne par métrique QoS: `Jitter`, `RTT`, `Packet loss`,
- colonnes: `moy.`, `min`, `max`, `comp.`, `hors` quand disponible.

## Seuils qualité

Les valeurs sont colorées selon les seuils configurés dans `METRIC_THRESHOLDS`.

KPI MCPTT:

- `KPI1`: OK si `<= 300 ms`,
- `KPI2`: OK si `<= 1000 ms`,
- `KPI3`: OK si `<= 300 ms`,
- `KPI4`: OK si `<= 150 ms`, warning si `<= 350 ms`, critique au-delà.

QoS:

- `RTT`: OK si `<= 150 ms`, warning si `<= 300 ms`, critique au-delà,
- `Jitter`: OK si `<= 30 ms`, warning si `<= 60 ms`, critique au-delà,
- `Packet loss`: OK si `<= 1 %`, warning si `<= 3 %`, critique au-delà.

Les seuils KPI sont alignés sur les exigences MCPTT de type 3GPP/ETSI TS 22.179. Les seuils QoS sont des seuils voix temps réel usuels.

## Notes d'exploitation

Endpoint de santé:

```text
/health
```

Réponse attendue:

```json
{
  "status": "ok",
  "service": "cdr-scan",
  "timestamp": "..."
}
```

Le serveur renvoie `Cache-Control: no-store` pour éviter de servir une ancienne version de l'application pendant les itérations.
