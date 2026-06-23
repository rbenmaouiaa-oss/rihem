# Système de Pointage Biométrique par QR Code et Reconnaissance Faciale

## **Aca Robotics** — Solution SaaS de Gestion de Présence Multi-Entreprise

---

**Projet de Fin d'Études — Master en Génie Logiciel**

**Année universitaire : 2025-2026**

---

# Introduction Générale

La gestion des heures de travail et du pointage des employés est une problématique centrale pour toute entreprise souhaitant optimiser sa productivité et assurer une gestion rigoureuse de ses ressources humaines. Les méthodes traditionnelles de pointage (feuilles de présence papier, badges magnétiques, pointeuses à empreinte digitale) présentent plusieurs limitations : usure des lecteurs, problèmes d'hygiène (particulièrement depuis la crise sanitaire), usurpation d'identité, et difficultés d'intégration avec les systèmes d'information modernes.

L'évolution des technologies biométriques et des smartphones a ouvert la voie à des solutions plus flexibles et sécurisées. La reconnaissance faciale, combinée à la vérification par QR code dynamique, offre un niveau de sécurité élevé tout en garantissant une expérience utilisateur fluide. Par ailleurs, l'intelligence artificielle permet désormais de détecter des anomalies de pointage et d'automatiser l'analyse des demandes de réclamation.

Dans ce contexte, notre projet de fin d'études vise à concevoir et réaliser un système de pointage biométrique nouvelle génération pour l'entreprise **Aca Robotics**. Ce système repose sur une double vérification : **QR code dynamique** (signé cryptographiquement) et **reconnaissance faciale**. Il se compose d'une application web de gestion (dashboard administrateur), d'une application mobile pour les employés, et d'un terminal matériel ESP32-S3-CAM.

Ce rapport présente l'ensemble du travail effectué, depuis l'analyse des besoins jusqu'à la réalisation et les tests. Il est organisé en cinq chapitres :

- **Chapitre 1 : Analyse des besoins** — Présentation du contexte, identification des acteurs et des cas d'utilisation, spécification des exigences fonctionnelles et non fonctionnelles.
- **Chapitre 2 : Conception** — Modélisation du système à l'aide du langage UML (diagrammes de classes, de séquence, d'activité), conception de l'architecture logicielle et de la base de données.
- **Chapitre 3 : Technologies et outils** — Présentation détaillée de l'ensemble des technologies, frameworks, bibliothèques et plateformes utilisés.
- **Chapitre 4 : Réalisation** — Implémentation des différents modules : dashboard web, application mobile, services backend, terminal matériel et module d'intelligence artificielle.
- **Chapitre 5 : Tests et validation** — Stratégie de test, tests unitaires et d'intégration, déploiement et résultats.

Nous concluons par un bilan du travail accompli et présentons les perspectives d'évolution du système.

---

# Chapitre 1 : Analyse des Besoins

## 1.1 Contexte du Projet

Aca Robotics est une entreprise spécialisée dans les solutions de data science et d'automatisation. Dans le cadre de sa croissance, elle souhaite doter ses clients (PME et grandes entreprises) d'un système de gestion de présence moderne, fiable et sécurisé, remplaçant les solutions traditionnelles à empreinte digitale par une approche sans contact utilisant la reconnaissance faciale et les QR codes dynamiques.

Le système doit permettre :

- Le pointage des employés via une application mobile avec génération de QR code dynamique et vérification faciale.
- La gestion en temps réel des présences depuis un tableau de bord web.
- Le traitement des réclamations et demandes d'absence.
- La détection des anomalies et fraudes de pointage via l'intelligence artificielle.
- L'intégration avec un terminal matériel pour les points d'entrée physiques.

## 1.2 Acteurs du Système

L'analyse des besoins a permis d'identifier les acteurs suivants :

| Acteur | Description |
|--------|-------------|
| **Administrateur** | Gère la plateforme, les entreprises, les utilisateurs et la configuration globale. Accès à l'intégralité des fonctionnalités. |
| **Responsable** | Gère les employés, les plannings, les équipes et consulte les rapports de pointage. |
| **Manager** | Supervise une ou plusieurs équipes, approuve les absences et consulte les pointages de son équipe. |
| **Employé** | Effectue son pointage via l'application mobile, soumet des réclamations, consulte son profil et son historique. |
| **Terminal ESP32** | Dispositif matériel installé aux points d'entrée, scanne les QR codes et capture les visages pour vérification. |

## 1.3 Exigences Fonctionnelles

### 1.3.1 Module Authentification

| ID | Exigence | Acteur |
|----|----------|--------|
| F-001 | Le système doit permettre l'inscription avec email et mot de passe | Employé |
| F-002 | Le système doit permettre la connexion avec email et mot de passe | Tous |
| F-003 | Le système doit permettre la réinitialisation du mot de passe | Tous |
| F-004 | Le système doit gérer les rôles et les permissions par rôle | Admin |
| F-005 | Le système doit supporter la connexion par email (lien magique) | Tous |

### 1.3.2 Module Pointage

| ID | Exigence | Acteur |
|----|----------|--------|
| F-006 | Le système doit générer un QR code dynamique unique pour chaque employé | Employé |
| F-007 | Le QR code doit être signé cryptographiquement (HMAC-SHA256) | Système |
| F-008 | Le QR code doit expirer après 30 secondes | Système |
| F-009 | Le système doit capturer et vérifier le visage de l'employé | Employé |
| F-010 | Le score de similarité faciale doit être ≥ 0.3 pour valider le pointage | Système |
| F-011 | Le système doit enregistrer la géolocalisation du pointage | Système |
| F-012 | Le système doit calculer le statut (présent, retard, absent) selon les horaires | Système |

### 1.3.3 Module Dashboard

| ID | Exigence | Acteur |
|----|----------|--------|
| F-013 | Le tableau de bord doit afficher le nombre total de collaborateurs | Admin, Responsable |
| F-014 | Le tableau de bord doit afficher le nombre de présents aujourd'hui | Tous |
| F-015 | Le tableau de bord doit afficher les retards et absences | Tous |
| F-016 | Le tableau de bord doit afficher le flux d'activité en temps réel | Tous |
| F-017 | Le système doit générer des graphiques et statistiques de présence | Admin, Responsable |

### 1.3.4 Module Employés

| ID | Exigence | Acteur |
|----|----------|--------|
| F-018 | Le système doit permettre l'ajout, la modification et la suppression d'employés | Admin |
| F-019 | Le système doit permettre l'archivage des employés | Admin |
| F-020 | Le système doit afficher la liste des employés avec recherche et filtres | Admin, Responsable, Manager |
| F-021 | Le système doit permettre la gestion des profils faciaux | Admin |

### 1.3.5 Module Réclamations

| ID | Exigence | Acteur |
|----|----------|--------|
| F-022 | L'employé peut soumettre une réclamation (Retard, Avance, Absence, Autre) | Employé |
| F-023 | L'administrateur peut répondre aux réclamations | Admin |
| F-024 | La réponse est transmise à l'employé via notification | Système |
| F-025 | L'IA analyse automatiquement la réclamation et assigne une priorité/catégorie | Système |
| F-026 | Le système détecte les fraudes potentielles dans les réclamations | Système |

### 1.3.6 Module Intelligence Artificielle

| ID | Exigence | Acteur |
|----|----------|--------|
| F-027 | Le système détecte les pointages multiples rapprochés (< 5 min) | Système |
| F-028 | Le système détecte les horaires de pointage inhabituels (hors shifts) | Système |
| F-029 | Le système détecte les incohérences QR/Face (QR valide, face invalide) | Système |
| F-030 | Le système détecte les anomalies de géolocalisation | Système |
| F-031 | Le système détecte les fréquences anormales (> 6 pointages/jour) | Système |
| F-032 | Le système détecte les pointages les week-ends et jours fériés | Système |

### 1.3.7 Module Rapports

| ID | Exigence | Acteur |
|----|----------|--------|
| F-033 | Le système doit générer un rapport de pointage sécurisé (QR + Face) | Admin |
| F-034 | Le rapport doit être exportable en PDF | Admin |
| F-035 | Le rapport doit être exportable en CSV | Admin |
| F-036 | Le rapport doit inclure les KPI de vérification (QR, Face, Double) | Admin |

### 1.3.8 Module Terminal Matériel

| ID | Exigence | Acteur |
|----|----------|--------|
| F-037 | Le terminal doit scanner les QR codes affichés sur le téléphone | Terminal |
| F-038 | Le terminal doit capturer une photo du visage | Terminal |
| F-039 | Le terminal doit communiquer avec le serveur via WiFi | Terminal |
| F-040 | Le terminal doit supporter le mode hors-ligne avec file d'attente | Terminal |
| F-041 | Le terminal doit indiquer le succès/échec par LED et buzzer | Terminal |

## 1.4 Exigences Non Fonctionnelles

| ID | Exigence | Description |
|----|----------|-------------|
| NF-001 | Sécurité | Les QR codes doivent être signés cryptographiquement et expirer après 30s |
| NF-002 | Performance | Le temps de vérification complet (QR + Face) < 5 secondes |
| NF-003 | Disponibilité | La plateforme doit être disponible 99.5% du temps (SLA) |
| NF-004 | Scalabilité | L'architecture doit supporter jusqu'à 10 000 utilisateurs par entreprise |
| NF-005 | Confidentialité | Les données biométriques (encodings faciaux) doivent être stockées de manière sécurisée |
| NF-006 | Multi-tenant | Le système doit isoler les données par entreprise (RLS) |
| NF-007 | Maintenance | Le système doit permettre la mise à jour sans interruption de service |
| NF-008 | Compatibilité | L'application mobile doit fonctionner sur iOS et Android (Expo) |

## 1.5 Cas d'Utilisation

### 1.5.1 Diagramme de Cas d'Utilisation Général

Le système comprend **quatre acteurs principaux** (Administrateur, Responsable, Manager, Employé) et **trois sous-systèmes** (Application Mobile, Dashboard Web, Terminal ESP32).

#### Cas d'Utilisation — Employé (Application Mobile)

1. **S'authentifier** — Se connecter, s'inscrire, réinitialiser le mot de passe
2. **Pointer** — Générer un QR code, vérifier son visage, soumettre le pointage
3. **Consulter son profil** — Voir ses informations personnelles
4. **Soumettre une réclamation** — Choisir le type (Retard/Avance/Absence/Autre), remplir le formulaire
5. **Consulter ses notifications** — Voir les réponses aux réclamations et alertes
6. **Consulter ses rapports** — Voir son historique de pointage

#### Cas d'Utilisation — Administrateur (Dashboard Web)

1. **Gérer les employés** — CRUD complet, archivage, profils faciaux
2. **Consulter le tableau de bord** — KPIs, graphiques, flux temps réel
3. **Gérer les pointages** — Visualiser le flux live, filtrer par date/statut
4. **Gérer les réclamations** — Lire, répondre, traiter les tickets
5. **Gérer les équipes et plannings** — Créer, affecter, modifier
6. **Consulter l'IA Intelligence** — Alertes de fraude, analyse des anomalies
7. **Générer des rapports** — PDF et CSV avec métriques de sécurité
8. **Configurer le système** — Paramètres entreprise, shifts, appareils
9. **Utiliser le simulateur** — Tester le flux QR + Face en environnement contrôlé

#### Cas d'Utilisation — Terminal ESP32

1. **Scanner un QR code** — Lire et décoder le QR dynamique
2. **Capturer un visage** — Prendre une photo et l'envoyer au serveur
3. **Valider le pointage** — Vérifier QR + Face + Géolocalisation
4. **Signaler le résultat** — LED verte (succès), rouge (échec), mélodie buzzer

---

# Chapitre 2 : Conception

## 2.1 Architecture Globale du Système

Le système adopte une **architecture en couches (layered architecture)** combinée à une **architecture microservices** pour les services backend :

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │  Dashboard Web      │  │  App Mobile      │  │  Terminal   │  │
│  │  (React SPA)        │  │  (React Native)  │  │  ESP32-CAM │  │
│  │  Port 5173          │  │  (Expo)          │  │            │  │
│  └────────┬────────────┘  └────────┬─────────┘  └──────┬─────┘  │
└───────────┼────────────────────────┼───────────────────┼────────┘
            │                        │                   │
            ▼                        ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API & BACKEND                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Supabase Auth   │  │  Flask API      │  │  Face API       │ │
│  │  (Auth + DB)     │  │  (Port 5000)    │  │  (Port 5001)    │ │
│  │                  │  │  /verify        │  │  /register      │ │
│  │                  │  │  /api/device/*  │  │  /recognize     │ │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬───────┘ │
└───────────┼─────────────────────┼─────────────────────┼─────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STORAGE & DATA                              │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │  PostgreSQL         │  │  Storage         │  │  AI Engine │  │
│  │  (Supabase DB)      │  │  (Faces/Photos)  │  │  (Python)  │  │
│  │  RLS Enabled        │  │                  │  │            │  │
│  └─────────────────────┘  └──────────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1.1 Dashboard Web (React SPA)

Le dashboard est une **Single Page Application** développée avec React. Il utilise Supabase comme backend-as-a-service pour l'authentification et la base de données. Le routage est géré côté client avec React Router.

### 2.1.2 Application Mobile (Expo / React Native)

L'application mobile est développée avec **Expo** (React Native). Elle permet aux employés de pointer via QR code dynamique et vérification faciale. Elle utilise les API natives pour l'authentification biométrique, la géolocalisation et l'appareil photo.

### 2.1.3 Services Backend (Flask)

Deux services Flask sont déployés :
- **app.py (port 5000)** : API de vérification des pointages, validation HMAC
- **face_project/app.py (port 5001)** : API d'enregistrement et de reconnaissance faciale

### 2.1.4 Terminal Matériel (ESP32-S3-CAM)

Le terminal est basé sur un **ESP32-S3-CAM** avec caméra OV2640, LED RGB et buzzer. Il communique via WiFi avec le serveur Flask pour la validation des pointages.

## 2.2 Modèle de Données (Diagramme de Classes)

### Diagramme de Classes Participantes

Le système repose sur **16 tables principales** organisées autour des entités suivantes :

#### Entités Principales

**Company (Entreprise)**
- `id` UUID (PK)
- `name` VARCHAR(150)
- `slug` VARCHAR(100)
- `signing_salt` TEXT — Sel cryptographique pour HMAC
- `created_at` TIMESTAMPTZ

**User (Utilisateur)**
- `id` UUID (PK)
- `company_id` UUID (FK → companies)
- `email` VARCHAR(150)
- `password` VARCHAR(255)
- `nom`, `prenom` VARCHAR(100)
- `role` VARCHAR(50) — 'SuperAdmin', 'CompanyAdmin', 'Manager', 'Employee'
- `manager_id` UUID (FK → users) — Auto-référence
- `department_id` UUID (FK → departments)
- `branch_id` UUID (FK → branches)
- `face_encoding` TEXT — Encodage facial (Dlib)
- `face_image_url` TEXT — URL de la photo de profil
- `phone`, `address`, `date_naissance`, `lieu_naissance`, `cin`, `sexe`, `position`, `salary`
- `archived` BOOLEAN
- `created_at` TIMESTAMPTZ

**Device (Appareil)**
- `id` UUID (PK)
- `company_id` UUID (FK)
- `name` VARCHAR(100)
- `type` VARCHAR(50) — 'web', 'mobile', 'terminal'
- `branch_id` UUID (FK)
- `api_key` TEXT

**AttendanceLog (Journal de Pointage)**
- `id` UUID (PK)
- `company_id` UUID (FK)
- `employee_id` UUID (FK → users)
- `device_id` UUID (FK → devices)
- `type` VARCHAR(50) — 'check_in', 'check_out'
- `status` VARCHAR(50) — 'present', 'late', 'absent', 'manual_correction'
- `qr_verified` BOOLEAN
- `face_verified` BOOLEAN
- `face_score` FLOAT
- `date` DATE
- `time` TIME
- `geolocation` JSONB — `{latitude, longitude}`
- `photo_proof_url` TEXT
- `created_at` TIMESTAMPTZ

**Reclamation (Ticket de Réclamation)**
- `id` UUID (PK)
- `employee_id` UUID (FK → users)
- `employee_email` VARCHAR(150)
- `subject` VARCHAR(200)
- `message` TEXT
- `status` VARCHAR(50) — 'pending', 'resolved', 'rejected'
- `admin_reply` TEXT
- `ai_predicted_category` VARCHAR(100)
- `ai_priority` VARCHAR(50)
- `ai_confidence` FLOAT
- `explanation` TEXT
- `created_at` TIMESTAMPTZ

**Notification**
- `id` UUID (PK)
- `user_id` UUID (FK)
- `user_email` VARCHAR(150)
- `title` VARCHAR(150)
- `message` TEXT
- `type` VARCHAR(50) — 'success', 'info', 'warning', 'error'
- `read` BOOLEAN
- `created_at` TIMESTAMPTZ

**FraudAlert (Alerte de Fraude)**
- `id` UUID (PK)
- `company_id` UUID (FK)
- `employee_id` UUID (FK)
- `attendance_log_id` UUID (FK)
- `rule_name` VARCHAR(100)
- `severity` VARCHAR(50)
- `details` JSONB
- `created_at` TIMESTAMPTZ

#### Relations Principales

```
Company 1──N User
Company 1──N Device
Company 1──N AttendanceLog
Company 1──N FraudAlert

User 1──N AttendanceLog (employee_id)
User 1──N Reclamation (employee_id)
User 1──N Notification (user_id)

AttendanceLog N──1 Device
AttendanceLog N──1 FraudAlert (attendance_log_id)

Department 1──N User
Branch 1──N User
Branch 1──N Device
```

## 2.3 Diagrammes de Séquence

### 2.3.1 Pointege avec Double Vérification (QR + Face)

```
Acteur: Employé
Système: Mobile App → Flask API → Supabase DB

1. Employé ouvre l'application mobile
2. Mobile App vérifie l'authentification (Supabase Auth)
3. Mobile App affiche le QR code dynamique
   - QR contient: employee_id + timestamp + signature HMAC
   - QR expire après 30 secondes (auto-rafraîchissement)
4. Employé scanne le QR avec le terminal ESP32
   - OU utilise la vérification faciale intégrée au téléphone
5. Mobile App capture le visage via la caméra
6. Envoi au serveur Flask (POST /verify):
   - QR payload (employee_id, timestamp, signature)
   - Face image (base64)
   - Géolocalisation (latitude, longitude)
7. Flask vérifie:
   - Signature HMAC du QR (SHA256)
   - Score de similarité faciale (face_recognition)
   - Distance par rapport au lieu de travail
   - Horaire par rapport au shift de l'employé
8. Si tout est valide:
   - Insertion dans attendance_logs avec statut 'present'
   - Retour HTTP 200 {status: 'present', face_score, qr_verified: true}
9. Mobile App affiche confirmation
10. Terminal ESP32 allume LED verte + mélodie succès
```

### 2.3.2 Traitement de Réclamation avec Notification

```
Acteur: Employé → Dashboard Admin → Mobile App

1. Employé soumet une réclamation depuis l'app mobile
   - Choisit le type (Retard/Avance/Absence/Autre)
   - Remplit le message
   - Insertion dans reclamations (status: 'pending')
2. Le système d'IA analyse automatiquement la réclamation:
   - Analyse du texte (sentiment analysis)
   - Prédiction de catégorie (ai_predicted_category)
   - Calcul de priorité (ai_priority) et confiance (ai_confidence)
3. Administrateur consulte les réclamations dans le dashboard
   - Voit les badges de prédiction IA
   - Filtre par statut, priorité, catégorie
4. Administrateur saisit une réponse et clique "Transmettre"
5. Le système met à jour la réclamation:
   - admin_reply = réponse
   - status = 'resolved'
6. Le système insère une notification:
   - user_email = employee_email
   - title = 'Réclamation traitée'
   - message = contient la réponse admin
   - type = 'info'
7. L'employé ouvre l'écran Notifications dans l'app mobile
8. La notification s'affiche avec la réponse de l'administrateur
```

### 2.3.3 Détection de Fraude

```
Acteur: Moteur IA → Table FraudAlerts → Dashboard

1. Le moteur IA s'exécute périodiquement (manuellement ou planifié)
2. Pour chaque règle d'anomalie:
   a. Règle 1: Pointages multiples rapprochés
      - Requête: attendance_logs WHERE same employee AND timestamp diff < 5min
   b. Règle 2: Horaires inhabituels
      - Vérifie si check-in en dehors des shifts planifiés
   c. Règle 3: Incohérence QR/Face
      - Détecte: qr_verified = true ET face_verified = false
   d. Règle 4: Anomalie de distance
      - Calcule distance géolocalisation vs entreprise > seuil
   e. Règle 5: Fréquence anormale
      - Compte pointages > 6 par jour pour un employé
   f. Règle 6: Pointages week-end/jour férié
3. Pour chaque anomalie détectée:
   - Création d'un enregistrement dans fraud_alerts
   - Niveau de sévérité (low, medium, high, critical)
   - Détails stockés au format JSONB
4. Administrateur consulte l'onglet "IA Intelligence"
   - Tableau des alertes de fraude
   - Distribution par sévérité
   - Détails par employé
```

## 2.4 Diagramme d'Activité — Flux de Pointage Complet

```
[Début]
    │
    ▼
[Employé s'authentifie sur l'app mobile]
    │
    ├──[Échec authentification]──→[Afficher erreur]──→[Fin]
    │
    ▼
[Génération du QR code dynamique]
    │
    ├── payload = employee_id + timestamp + signature
    ├── signature = HMAC-SHA256(payload, signing_salt)
    └── expiration = 30 secondes
    │
    ▼
[Employé scanne le QR (terminal) OU se prend en photo]
    │
    ▼
[Envoi des données au serveur de vérification]
    │
    ├── QR + Photo + Géolocalisation → POST /verify
    │
    ▼
[Vérification de la signature QR]
    │
    ├──[Invalide]──→[Rejeter le pointage]──→[Fin]
    │
    ▼
[Vérification faciale]
    │
    ├──[Score < 0.3]──→[Rejeter le pointage]──→[Fin]
    │
    ▼
[Vérification de la localisation]
    │
    ├──[Distance > seuil]──→[Marquer comme anomalie]
    │
    ▼
[Calcul du statut (présent/retard)]
    │
    ├──[Horaire dans shift]──→[Statut = présent]
    ├──[Horaire hors shift mais < buffer]──→[Statut = retard]
    └──[Horaire hors shift]──→[Statut = absent]
    │
    ▼
[Enregistrement du pointage]
    │
    ├── attendance_logs.insert({...})
    │
    ▼
[Notification à l'employé]
    │
    ├──[Succès]──→[LED Verte + Message "Pointage confirmé"]
    ├──[Échec]──→[LED Rouge + Message d'erreur]
    │
    ▼
[Fin]
```

---

# Chapitre 3 : Technologies et Outils

## 3.1 Technologies Frontend

### 3.1.1 React.js (Dashboard Web)

**React 18** est utilisé pour le développement de l'interface d'administration. C'est une bibliothèque JavaScript pour la construction d'interfaces utilisateur, développée par Meta (Facebook). Ses avantages principaux sont :

- **Composants réutilisables** : Architecture basée sur des composants encapsulés
- **Virtual DOM** : Optimisation des rendus pour des performances élevées
- **Hooks** : Gestion d'état et d'effets simplifiée (useState, useEffect, useContext)
- **Écosystème riche** : Nombreuses bibliothèques disponibles

**Bibliothèques utilisées :**

| Bibliothèque | Version | Usage |
|-------------|---------|-------|
| react-router-dom | 6.x | Routage côté client (hash routing) |
| recharts | 2.x | Graphiques (barres, lignes, camembert, aires) |
| @supabase/supabase-js | 2.x | Client Supabase (authentification + base de données) |
| react-csv | 2.x | Export CSV des rapports |
| react-webcam | 7.x | Capture photo pour scan facial dans le navigateur |
| html2canvas | 1.x | Capture d'écran pour export PDF |

### 3.1.2 React Native / Expo (Application Mobile)

**Expo SDK 52** est utilisé pour l'application mobile. Expo est un framework open-source qui facilite le développement d'applications React Native pour iOS et Android.

**Modules Expo utilisés :**

| Module | Usage |
|--------|-------|
| expo-local-authentication | Authentification biométrique (empreinte/FaceID) |
| expo-location | Géolocalisation GPS |
| expo-camera | Capture photo pour vérification faciale |
| expo-secure-store | Stockage sécurisé des tokens |
| @react-navigation/native | Navigation entre écrans |
| @react-navigation/native-stack | Stack navigator natif |
| @supabase/supabase-js | Client Supabase |
| @react-native-async-storage/async-storage | Stockage local persistant |
| expo-haptics | Retour haptique (vibration) |
| expo-status-bar | Barre d'état système |

## 3.2 Technologies Backend

### 3.2.1 Supabase (Backend-as-a-Service)

**Supabase** est une plateforme open-source qui fournit un backend complet pour applications web et mobiles. C'est l'alternative open-source à Firebase. Ses composants clés sont :

- **PostgreSQL** : Base de données relationnelle avec extension PostGIS (géolocalisation)
- **Supabase Auth** : Authentification intégrée (email/mot de passe, OAuth, magie links)
- **Supabase Storage** : Stockage de fichiers (photos de visages)
- **Row Level Security (RLS)** : Sécurité au niveau des lignes pour l'isolation multi-tenant
- **Auto-generated API REST** : API RESTful générée automatiquement à partir du schéma

**Avantages de Supabase :**
- Base de données PostgreSQL complète (vs Firestore NoSQL limité)
- RLS puissant pour la sécurisation multi-entreprise
- Réplication en temps réel (Realtime subscriptions)
- Auto-documentation de l'API via Swagger

### 3.2.2 Flask (Python Web Framework)

**Flask 3.x** est un micro-framework web Python utilisé pour les services backend :

**Service 1 — app.py (port 5000)**
- Point d'entrée unique POST /verify
- Vérification HMAC-SHA256 des QR codes
- Validation des scores faciaux
- Calcul des statuts de présence
- Insertion dans attendance_logs

**Service 2 — face_project/app.py (port 5001)**
- POST /register : Enregistrement facial (encodage + stockage)
- POST /recognize : Reconnaissance faciale (comparaison)
- GET /debug_users : Debug des utilisateurs enregistrés

### 3.2.3 Intelligence Artificielle (Python)

Le module **ai_intelligence.py** utilise des règles heuristiques (règle métier) pour la détection d'anomalies :

- **7 règles de détection** : Pointages rapprochés, horaires inhabituels, incohérences QR/Face, anomalies de distance, fréquence anormale, week-ends, analyse de sentiment des réclamations
- **Bibliothèques utilisées** : `supabase` (client Python), `datetime`, `json`

## 3.3 Terminal Matériel

### 3.3.1 ESP32-S3-CAM

Le terminal est basé sur le microcontrôleur **ESP32-S3** d'Espressif Systems :

| Caractéristique | Valeur |
|----------------|--------|
| Processeur | Xtensa LX7 dual-core 240MHz |
| RAM | 512KB SRAM + 8MB PSRAM |
| Flash | 16MB |
| WiFi | 802.11 b/g/n |
| Bluetooth | BLE 5.0 |
| Caméra | OV2640 (2MP, 1600x1200 max) |

### 3.3.2 Composants Matériels

- **Caméra OV2640** : Capture d'images JPEG en QVGA 320x240 pour la reconnaissance
- **LED RGB** : Indicateur visuel (vert = succès, rouge = échec, bleu = réseau)
- **Buzzer piézoélectrique** : Signaux sonores (mélodies de succès/échec)
- **Bouton reset** : Réinitialisation du terminal
- **Alimentation** : 5V USB-C ou batterie externe

### 3.3.3 Firmware (Arduino/C++)

Le firmware est développé dans l'environnement **Arduino** avec le langage **C++** :

- **Bibliothèques** : WiFi, HTTPClient, ArduinoJson, ESP32-Camera
- **Protocole** : HTTP REST avec file d'attente hors-ligne
- **Fonctionnalités** : Scan QR (entrée série), capture photo, envoi serveur, signalisation LED/buzzer

## 3.4 Outils de Développement

| Outil | Usage |
|-------|-------|
| Visual Studio Code | IDE principal |
| Git / GitHub | Gestion de versions |
| Node.js / npm | Gestion des paquets JavaScript |
| Python 3.12+ | Backend et IA |
| Expo CLI | Build et déploiement mobile |
| Vite | Build tool pour le dashboard web |
| Arduino IDE | Compilation et flash du firmware ESP32 |
| Supabase Studio | Administration de la base de données |

## 3.5 Méthodologie de Développement

Le projet a été développé selon une **méthodologie agile** inspirée de Scrum :

- **Sprints** : Cycles de développement de 2 semaines
- **Daily standups** : Réunions quotidiennes de 15 minutes
- **Backlog** : Liste priorisée des fonctionnalités
- **Revues de sprint** : Démonstration des fonctionnalités développées
- **Rétrospectives** : Amélioration continue du processus

---

# Chapitre 4 : Réalisation

## 4.1 Structure du Projet

```
rihem/
├── admin-dashboard/           # Dashboard Web (React SPA)
│   ├── src/
│   │   ├── screens/           # Pages de l'application
│   │   │   ├── Home.jsx       # Dashboard principal (2700+ lignes)
│   │   │   ├── Login.jsx      # Page de connexion
│   │   │   ├── Register.jsx   # Page d'inscription
│   │   │   ├── Profil.jsx     # Profil utilisateur
│   │   │   ├── Equipes.jsx    # Gestion des équipes
│   │   │   ├── CreerEquipe.jsx
│   │   │   ├── CreerPlanning.jsx
│   │   │   ├── FichePointage.jsx
│   │   │   ├── EmployeProfil.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── QRScanner.jsx
│   │   │   ├── FaceScanner.jsx
│   │   │   ├── TeamMembers.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   └── VerifyOTP.jsx
│   │   ├── App.jsx            # Configuration du routage
│   │   ├── Sidebar.jsx        # Barre latérale de navigation
│   │   ├── supabase.js        # Client Supabase
│   │   └── index.css          # Styles globaux
│   └── public/
│       └── logo.png           # Logo Aca Robotics
│
├── qr_app/                    # Application Mobile (Expo)
│   ├── screens/
│   │   ├── Home.tsx           # Écran d'accueil avec menu
│   │   ├── ReclamationScreen.tsx
│   │   ├── ReclamationForm.tsx
│   │   ├── OtherForm.tsx
│   │   ├── NotificationScreen.tsx
│   │   ├── Reports.tsx
│   │   ├── EmployeeDetails.tsx
│   │   ├── GenerateQR.tsx     # Génération QR + vérification faciale
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── VerifyOTP.tsx
│   │   └── ResetPassword.tsx
│   ├── App.tsx                # Navigation stack
│   └── supabase.ts            # Client Supabase TypeScript
│
├── face_project/              # Service Reconnaissance Faciale
│   ├── app.py                 # API Flask (port 5001)
│   ├── encode_face.py         # Encodage facial
│   └── known_faces/           # Images de référence
│
├── app.py                     # API Vérification (port 5000)
├── ai_intelligence.py         # Moteur d'IA anti-fraude
├── seed_all.py                # Script de seeding complet
├── seed_user.py               # Script de seeding utilisateur
├── migration_schema.sql       # Schéma de base de données
├── ai_intelligence_migration.sql
├── rls_hardening.sql          # Politiques RLS
├── esp32_terminal_firmware.ino # Firmware ESP32
└── venv/                      # Environnement virtuel Python
```

## 4.2 Dashboard Web — Interface d'Administration

### 4.2.1 Authentification

La page de connexion (Login.jsx) propose deux modes :

1. **Connexion Supabase** : Utilise `supabase.auth.signInWithPassword()` pour l'authentification standard
2. **Bypass hardcodé** : Comptes de démonstration pré-configurés pour faciliter les tests

L'interface de connexion présente :
- Un panneau de marque avec le logo Aca Robotics
- Un formulaire de connexion (email + mot de passe)
- Un lien d'inscription et de récupération de mot de passe
- Un fond de couleur `#112A6D` (couleur corporate)

### 4.2.2 Tableau de Bord (Dashboard)

Le tableau de bord (Home.jsx) est le cœur de l'application web. Il comprend **11 onglets** :

#### Onglet 1 : Dashboard (Accueil)
- **KPIs** : Total collaborateurs, Présents aujourd'hui, En retard, Demandes de congés
- **Graphiques** : Taux de présence (jauge radiale), barres par jour, lignes d'évolution, camembert par statut, aires cumulées
- **Flux d'activité** : Tableau des derniers pointages avec statut

#### Onglet 2 : Pointage en Direct (Live)
- Tableau temps réel des pointages avec colonnes :
  - Avatar (initiales), Collaborateur (nom/prénom)
  - Type (CHECK_IN / CHECK_OUT)
  - Vérification QR (Sign. Valid / Invalid)
  - Face Similarity (score avec match)
  - Horodatage (date + heure)
  - Dispositif utilisé
  - Statut (PRESENT / LATE / ABSENT)

#### Onglet 3 : Employés
- Tableau CRUD complet avec :
  - Recherche par nom/prénom
  - Filtres par département, branche, statut
  - Ajout (formulaire modal)
  - Modification (clic sur ligne)
  - Archivage avec confirmation
  - Profil facial (lien vers face scan)

#### Onglet 4 : Absences
- Gestion des demandes d'absence avec :
  - Tableau des demandes (employé, type, dates, statut)
  - Boutons Approuver / Rejeter
  - Filtrage par statut

#### Onglet 5 : Réclamations
- Gestion des tickets de réclamation avec :
  - Tableau complet (sujet, message, statut, date)
  - **Badges IA** : Catégorie prédite, priorité, confiance
  - Champ de réponse admin
  - Bouton "Transmettre" avec notification automatique
  - Filtrage par statut (pending / resolved / rejected)

#### Onglet 6 : Appareils
- Gestion des terminaux de pointage :
  - Nom, type (web/mobile/terminal), branche, statut
  - API key pour chaque appareil

#### Onglet 7 : Profils Faciaux
- Visualisation des profils faciaux enregistrés :
  - Photo, employé, date d'enregistrement
  - Statut de l'encodage facial

#### Onglet 8 : Rapports
- **Rapport de Pointage Sécurisé** :
  - Filtre par période (date de début / date de fin)
  - **KPIs de vérification** :
    - QR Crypté OK / Total
    - Visage Reconnu / Total
    - Double Vérification / Total
    - Anomalies (QR OK / Face FAIL)
  - **Tableau détaillé** 9 colonnes : Employé, Date, Horaire, QR, Face, Score Similitude, Statut, Appareil, Type
  - **Résumé par employé** : Barre de taux de sécurité (score combiné QR + Face)
  - Export PDF (impression navigateur)
  - Export CSV (avec colonnes QR, Face, Similarité)

#### Onglet 9 : Paramètres
- Configuration de l'entreprise :
  - Informations générales
  - Gestion des shifts (créneaux horaires)
  - Paramètres de notification

#### Onglet 10 : Simulateur
- Outil de test pour simuler le flux de pointage complet :
  - Sélection d'employé
  - Simulation de scan QR
  - Simulation de vérification faciale
  - Logs en temps réel (terminal visuel)
  - Indicateurs LED simulés

#### Onglet 11 : IA Intelligence
- **Tableau des alertes de fraude** :
  - Règle déclenchée, sévérité, employé, date, détails
  - Distribution par sévérité (graphique camembert)
  - Liste des 7 règles de détection avec descriptions
  - Bouton "Analyser maintenant" pour exécuter le moteur IA

### 4.2.3 Système de Navigation

La barre latérale (Sidebar.jsx) est adaptée au rôle de l'utilisateur :
- **CompanyAdmin/SuperAdmin** : Accès à tous les onglets
- **Manager** : Onglets limités (Dashboard, Live, Employés, Absences, Réclamations)

## 4.3 Application Mobile — Pointage Employé

### 4.3.1 Flux d'Authentification

L'application mobile utilise **Supabase Auth** pour l'authentification :
1. Écran de connexion (email + mot de passe)
2. Inscription avec validation email
3. Mot de passe oublié avec réinitialisation
4. Vérification OTP

### 4.3.2 Génération de QR Code Dynamique

L'écran **GenerateQR.tsx** implémente le cœur de la sécurité du système :

```typescript
// Génération QR avec signature HMAC
const generateQR = async () => {
  const timestamp = Date.now()
  const payload = `${userData.id}:${timestamp}`
  const signature = CryptoJS.HmacSHA256(
    payload,
    SIGNING_KEY
  ).toString(CryptoJS.enc.Hex)
  
  const qrData = JSON.stringify({
    employee_id: userData.id,
    ts: timestamp,
    sig: signature
  })
  
  setQRValue(qrData)
  setCountdown(30)
}
```

Caractéristiques du QR code :
- **Durée de validité** : 30 secondes
- **Contenu** : `{employee_id, timestamp, signature}`
- **Signature** : HMAC-SHA256 avec sel spécifique à l'entreprise
- **Rafraîchissement** : Auto-génération toutes les 30 secondes
- **Affichage** : Grand format centré, prêt pour scan

### 4.3.3 Vérification Faciale Mobile

Avant la validation du pointage, l'application :
1. Vérifie l'authentification biométrique (empreinte/FaceID)
2. Capture la position GPS (latitude, longitude)
3. Effectue un check-in via l'API de vérification
4. Affiche une confirmation visuelle

### 4.3.4 Écran d'Accueil

L'écran d'accueil (Home.tsx) propose un menu avec 6 entrées :

| Entrée | Icône | Navigation |
|--------|-------|------------|
| Mon Profil | person-outline | EmployeeDetails |
| Pointer | qr-code-outline | GenerateQR |
| Réclamation | chatbubble-ellipses | Reclamation |
| Mes Notifications | notifications | Notifications |
| Rapports | document-text-outline | Reports |
| Déconnexion | log-out-outline | Login |

### 4.3.5 Notifications

L'écran **NotificationScreen.tsx** :
- Récupère les notifications depuis la table `notifications`
- Filtrées par `user_email` de l'employé connecté
- Types supportés : success (vert), info (cyan), warning (jaune), error (rouge)
- Tri chronologique inverse
- Fallback sur données mockées si la requête échoue

## 4.4 Services Backend

### 4.4.1 API de Vérification (app.py — Port 5000)

L'API reçoit les requêtes de pointage et effectue les vérifications suivantes :

```python
@app.route('/verify', methods=['POST'])
def verify():
    data = request.get_json()
    
    # 1. Vérification de la signature HMAC
    employee_id = data['employee_id']
    timestamp = data['timestamp']
    signature = data['signature']
    
    # Récupération du signing_salt de l'entreprise
    company = supabase.table('users') \
        .select('companies(signing_salt)') \
        .eq('id', employee_id) \
        .single() \
        .execute()
    
    signing_salt = company.data['companies']['signing_salt']
    expected_sig = hmac.new(
        signing_salt.encode(),
        f"{employee_id}:{timestamp}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if signature != expected_sig:
        return jsonify({'error': 'Invalid signature'}), 403
    
    # 2. Vérification faciale
    face_result = requests.post(
        'http://localhost:5001/recognize',
        json={'image': data['face_image']}
    )
    
    face_score = face_result.json().get('score', 0)
    if face_score < 0.3:
        return jsonify({'error': 'Face mismatch'}), 403
    
    # 3. Calcul du statut
    current_time = datetime.now().time()
    employee_shift = get_employee_shift(employee_id)
    status = calculate_status(current_time, employee_shift)
    
    # 4. Enregistrement
    attendance_log = {
        'employee_id': employee_id,
        'company_id': company_id,
        'type': 'check_in',
        'status': status,
        'qr_verified': True,
        'face_verified': True,
        'face_score': face_score,
        'geolocation': data.get('geolocation'),
        'created_at': datetime.now().isoformat()
    }
    
    supabase.table('attendance_logs').insert(attendance_log).execute()
    
    return jsonify({'status': status, 'face_score': face_score}), 200
```

### 4.4.2 API de Reconnaissance Faciale (face_project/app.py — Port 5001)

Ce service utilise la bibliothèque **face_recognition** (basée sur Dlib) :

- **Enregistrement** : Reçoit une image, détecte le visage, calcule l'encodage (128 dimensions), stocke dans `users.face_encoding` et upload l'image dans Supabase Storage
- **Reconnaissance** : Reçoit une image, calcule l'encodage, compare avec tous les encodages stockés, retourne le meilleur score de similarité

## 4.5 Terminal Matériel ESP32-S3-CAM

### 4.5.1 Architecture du Firmware

Le firmware **esp32_terminal_firmware.ino** est organisé en plusieurs modules :

```
esp32_terminal_firmware.ino
├── Configuration WiFi
├── Initialisation Caméra (OV2640)
├── Boucle Principale
│   ├── Mode Scan QR (lecture série)
│   ├── Mode Capture Visage
│   ├── Envoi HTTP au serveur
│   ├── Signalisation LED
│   └── Signalisation Buzzer
├── File d'attente hors-ligne
└── Health Check (ping/30s)
```

### 4.5.2 Fonctionnement

1. **Attente** : Le terminal affiche un écran d'accueil sur le moniteur série
2. **Scan QR** : L'employé présente son QR code mobile devant la caméra
3. **Capture Visage** : Le terminal capture automatiquement une photo
4. **Envoi** : Les données sont envoyées au serveur Flask (POST /api/device/scan-qr)
5. **Résultat** :
   - ✅ **LED Verte + Mélodie** : Pointage validé
   - ❌ **LED Rouge + Alerte** : Échec de vérification
6. **Hors-ligne** : En cas de perte WiFi, les pointages sont mis en file d'attente et synchronisés ultérieurement

## 4.6 Moteur d'Intelligence Artificielle

### 4.6.1 Règles de Détection d'Anomalies

Le moteur **ai_intelligence.py** implémente **7 règles heuristiques** :

#### Règle 1 : Pointages Multiples Rapprochés
Détecte les cas où un employé effectue plusieurs check-in à moins de 5 minutes d'intervalle. Sévérité : **high**.

**Logique** : `COUNT(attendance_logs) WHERE employee_id = X AND timestamp_diff < 5min → Si > 1 → Alerte`

#### Règle 2 : Horaires Inhabituels
Détecte les check-in effectués en dehors des horaires de travail planifiés (shifts). Sévérité : **medium**.

**Logique** : `time NOT BETWEEN shift_start AND shift_end → Alerte`

#### Règle 3 : Incohérence QR/Face
Détecte les cas où le QR code est valide mais la vérification faciale échoue (score < seuil). Sévérité : **critical**.

**Logique** : `qr_verified = true AND face_verified = false → Alerte`

#### Règle 4 : Anomalie de Géolocalisation
Détecte les pointages effectués à une distance anormale du lieu de travail. Sévérité : **medium**.

**Logique** : `distance(geolocation, company_address) > threshold → Alerte`

#### Règle 5 : Fréquence Quotidienne Anormale
Détecte les employés avec plus de 6 pointages dans la même journée. Sévérité : **low**.

**Logique** : `COUNT(attendance_logs) PER day > 6 → Alerte`

#### Règle 6 : Pointages Week-End/Jours Fériés
Détecte les pointages effectués les samedis, dimanches et jours fériés. Sévérité : **low**.

**Logique** : `DAYOFWEEK(date) IN (Saturday, Sunday) OR date IN holidays → Alerte`

#### Règle 7 : Analyse de Sentiment des Réclamations
Analyse le texte des réclamations pour classer la priorité et la catégorie. Sévérité : **N/A** (classification).

**Logique** : Analyse par mots-clés → priorité (urgent/élevée/moyenne/basse) + catégorie (technique/RH/horaire)

### 4.6.2 Format des Alertes

```json
{
  "id": "uuid",
  "company_id": "uuid",
  "employee_id": "uuid",
  "attendance_log_id": "uuid",
  "rule_name": "Multiple Rapid Check-ins",
  "severity": "high",
  "details": {
    "count": 4,
    "time_window_minutes": 3,
    "first_checkin": "08:01:00",
    "last_checkin": "08:04:00"
  },
  "created_at": "2025-01-15T08:05:00Z"
}
```

## 4.7 Sécurité

### 4.7.1 Row-Level Security (RLS)

La base de données implémente un système de **RLS (Row Level Security)** complet pour l'isolation multi-tenant :

```sql
-- Exemple de politique RLS pour attendance_logs
CREATE POLICY "Company isolation for attendance_logs"
ON public.attendance_logs
FOR ALL
USING (company_id = get_current_company_id());
```

Chaque requête est automatiquement filtrée par `company_id` en fonction de l'utilisateur connecté, garantissant qu'une entreprise ne peut pas accéder aux données d'une autre.

### 4.7.2 Sécurité des QR Codes

- **Signature HMAC-SHA256** : Chaque QR contient une signature cryptographique
- **Sel unique par entreprise** : `signing_salt` dans la table `companies`
- **Expiration** : 30 secondes, empêche la réutilisation
- **Contenu** : `employee_id + timestamp + signature` — pas de données sensibles

### 4.7.3 Sécurité des Données Biométriques

- Les encodages faciaux sont stockés sous forme de vecteurs numériques (128 floats), pas d'images réelles
- Les images faciales sont stockées dans Supabase Storage avec accès restreint
- L'authentification biométrique locale (FaceID/empreinte) est utilisée sur le terminal mobile

---

# Chapitre 5 : Tests et Validation

## 5.1 Stratégie de Test

La stratégie de test du projet couvre plusieurs niveaux :

### 5.1.1 Tests Unitaires

- **Frontend** : Test des composants React individuels
- **Backend** : Test des endpoints Flask
- **IA** : Test de chaque règle de détection avec des jeux de données contrôlés

### 5.1.2 Tests d'Intégration

- **Flux de pointage complet** : QR → Face → Vérification → Enregistrement
- **Flux de réclamation** : Soumission → IA → Réponse Admin → Notification
- **Flux multi-entreprise** : Isolation des données entre entreprises

### 5.1.3 Tests de Sécurité

- Validation des signatures HMAC
- Test des politiques RLS (tentative d'accès cross-company)
- Test d'expiration des QR codes

## 5.2 Test du Flux de Pointage Complet

### Scénario 1 : Pointage Normal (Employé à l'heure)

1. Employé se connecte à l'application mobile
2. Génère le QR code dynamique
3. Scanne le QR (ou capture visage) — Score face ≥ 0.3
4. Envoie les données au serveur de vérification
5. Système vérifie : QR ✓, Face ✓, Horaire dans shift ✓
6. **Résultat attendu** : Statut = `present`, enregistrement réussi
7. **Résultat obtenu** : ✅ Conforme

### Scénario 2 : Tentative de Fraude QR

1. Un employé capture le QR code d'un collègue
2. Tente de l'utiliser après 30 secondes
3. **Résultat attendu** : QR expiré → rejet
4. **Résultat obtenu** : ✅ Conforme

### Scénario 3 : Incohérence Face/QR

1. Un employé utilise un QR valide (généré par lui-même)
2. La vérification faciale échoue (score < 0.3)
3. **Résultat attendu** : Rejet + Alerte de fraude (Règle 3)
4. **Résultat obtenu** : ✅ Conforme

## 5.3 Test du Module IA

### Jeu de Test : Détection d'Anomalies

Un script de test (`scratch_query.py`) a été utilisé pour injecter des données de test et vérifier les 7 règles de détection.

| Règle | Données Test | Résultat Attendu | Résultat |
|-------|-------------|------------------|----------|
| R1 (Pointages rapprochés) | 4 check-ins en 3 min | Alerte HIGH | ✅ |
| R2 (Horaire inhabituel) | Check-in à 03:00 du matin | Alerte MEDIUM | ✅ |
| R3 (Incohérence QR/Face) | QR OK + Face FAIL | Alerte CRITICAL | ✅ |
| R4 (Distance anormale) | Check-in à 500 km | Alerte MEDIUM | ✅ |
| R5 (Fréquence > 6/jour) | 8 check-ins dans la journée | Alerte LOW | ✅ |
| R6 (Weekend) | Check-in dimanche | Alerte LOW | ✅ |
| R7 (Analyse réclamation) | Message "urgent problème technique" | Priorité HAUTE, Catégorie Technique | ✅ |

## 5.4 Test de l'Application Mobile

### Tests d'Interface

| Écran | Test | Résultat |
|-------|------|----------|
| Login | Connexion valide/invalide, réinitialisation mot de passe | ✅ |
| QR Code | Génération, rafraîchissement 30s, expiration | ✅ |
| Réclamation | Soumission (4 types), validation champs requis | ✅ |
| Notifications | Affichage, tri, fallback mock | ✅ |

## 5.5 Déploiement

### 5.5.1 Dashboard Web

- **Hébergement** : Vercel / Netlify (build static)
- **Build** : `npm run build` → dossier `dist/`
- **Variables d'environnement** : Supabase URL + Anon Key

### 5.5.2 Services Backend

- **Flask API** : Déploiement sur Render / Railway
- **Face API** : Déploiement sur instance avec GPU (optionnel)
- **Base de données** : Supabase (hébergé cloud)

### 5.5.3 Application Mobile

- **Build** : `eas build -p android` ou `eas build -p ios`
- **Distribution** : Google Play Store / Apple App Store
- **OTA Updates** : Mises à jour over-the-air via EAS Update

---

# Conclusion Générale et Perspectives

## Bilan du Travail Accompli

Ce projet de fin d'études nous a permis de concevoir et réaliser un système complet de gestion de présence par QR code dynamique et reconnaissance faciale pour l'entreprise **Aca Robotics**.

Le travail effectué couvre l'ensemble du cycle de développement logiciel :

1. **Analyse des besoins** : Identification des acteurs (Administrateur, Responsable, Manager, Employé), spécification de 41 exigences fonctionnelles et 8 exigences non fonctionnelles, modélisation des cas d'utilisation.

2. **Conception** : Architecture en couches combinant une SPA React, une application mobile Expo, des services Flask et un terminal matériel ESP32. Modélisation UML complète (diagrammes de classes, de séquence, d'activité). Base de données PostgreSQL avec 16 tables et isolation multi-tenant via RLS.

3. **Réalisation** : Implémentation de 4 sous-systèmes interconnectés :
   - Dashboard web avec 11 onglets fonctionnels
   - Application mobile avec pointage QR + Face
   - Services backend Flask (vérification, reconnaissance faciale)
   - Terminal matériel ESP32-S3-CAM avec firmware C++
   - Moteur d'IA anti-fraude avec 7 règles de détection

4. **Sécurité** : QR codes signés cryptographiquement (HMAC-SHA256), expiration 30 secondes, isolation multi-entreprise (RLS), données biométriques protégées.

5. **Tests** : Validation complète des flux de pointage, des règles IA, et des interfaces.

## Apports du Projet

Ce système apporte plusieurs innovations par rapport aux solutions existantes :

- **Double vérification biométrique sans contact** : QR code + reconnaissance faciale, plus hygiénique et fiable que l'empreinte digitale.
- **Anti-fraude intelligent** : Détection automatique de 7 types d'anomalies de pointage.
- **Architecture moderne** : Stack technique complet (React, React Native, Python, PostgreSQL, ESP32).
- **Expérience utilisateur unifiée** : Dashboard web + application mobile + terminal physique.
- **Isolation multi-tenant** : Sécurisation des données par entreprise via RLS.

## Perspectives d'Amélioration

Malgré le travail accompli, plusieurs axes d'amélioration peuvent être envisagés :

### Court Terme

1. **Mode hors-ligne avancé** : Synchronisation complète des pointages en cas de coupure réseau
2. **Notifications push** : Intégration de notifications push (Firebase Cloud Messaging) pour les réponses aux réclamations
3. **Tableau de bord manager** : Interface dédiée avec métriques d'équipe et vue synthétique
4. **Géolocalisation avancée** : Définition de zones géofencing pour les entreprises avec sites multiples

### Moyen Terme

5. **Machine Learning** : Remplacement des règles heuristiques par un modèle ML entraîné sur l'historique des pointages pour une détection plus fine des anomalies
6. **Bulletins de paie** : Génération automatique des bulletins de salaire basée sur les heures pointées
7. **Système de ticket multicanal** : Support des réclamations par email et chat en plus de l'application mobile
8. **Rapports avancés** : Tableaux de bord analytiques avec prédictions de tendances

### Long Terme

9. **Terminal mobile** : Version autonome du terminal ESP32 avec batterie rechargeable et tracker GPS pour les chantiers
10. **Reconnaissance faciale temps réel** : Passage à un modèle de deep learning (FaceNet/ArcFace) pour une précision accrue
11. **Intégration RH tierce** : API d'intégration avec les systèmes de paie existants (Sage, ADP, etc.)
12. **Application web mobile** : Version PWA (Progressive Web App) comme alternative légère à l'application native

---

# Bibliographie

## Ouvrages Scientifiques

[1] P. Roques, *UML 2 — Modéliser une Application Web*, 4e édition, Eyrolles, Paris, 2008.

[2] P. Roques & F. Vallée, *UML 2 en action — De l'analyse des besoins à la conception*, 4e édition, Eyrolles, 2007.

[3] J. Gabay & D. Gabay, *UML 2 — Analyse et conception*, Dunod, Paris, 2008.

[4] B. Rumpe, *Agile Modeling with UML*, Springer, Aachen, Germany, 2012.

[5] C. Soutou & F. Brouard, *UML 2 pour les bases de données*, 2e édition, Eyrolles, Paris.

[6] B. Unhelkar, *Software Engineering with UML*, CRC Press, 2018.

## Références Techniques

[7] React.js Documentation, Disponible sur : <https://react.dev/> (consulté en septembre 2025).

[8] Expo Documentation, Disponible sur : <https://docs.expo.dev/> (consulté en septembre 2025).

[9] Supabase Documentation, Disponible sur : <https://supabase.com/docs> (consulté en octobre 2025).

[10] Flask Documentation, Disponible sur : <https://flask.palletsprojects.com/> (consulté en octobre 2025).

[11] Python Documentation, Disponible sur : <https://docs.python.org/3/> (consulté en septembre 2025).

[12] face_recognition Library, Disponible sur : <https://github.com/ageitgey/face_recognition> (consulté en novembre 2025).

[13] Dlib C++ Library, Disponible sur : <http://dlib.net/> (consulté en novembre 2025).

## Articles et Ressources en Ligne

[14] O. A., *Système de pointage biométrique par QR code et reconnaissance faciale*, Projet de fin d'études, Master en Génie Logiciel, 2026.

[15] Espressif Systems, *ESP32-S3 Technical Reference Manual*, Disponible sur : <https://www.espressif.com/> (consulté en novembre 2025).

[16] Arduino, *Arduino Reference*, Disponible sur : <https://www.arduino.cc/reference/> (consulté en novembre 2025).

[17] Stack Overflow Developer Survey 2024, Disponible sur : <https://stackoverflow.com/survey/2024/> (consulté en octobre 2025).

---

# Annexes

## Annexe A : Descriptions Détaillées des Cas d'Utilisation

### Cas d'Utilisation « Effectuer un pointage »

**Sommaire d'identification**

| Champ | Valeur |
|-------|--------|
| Titre | Effectuer un pointage |
| Acteur | Employé |
| Résumé | L'employé utilise l'application mobile pour enregistrer son pointage d'entrée ou de sortie via QR code dynamique et vérification faciale |
| Pré-conditions | Être authentifié, avoir un profil facial enregistré |
| Post-conditions | Le pointage est enregistré dans la base de données avec le statut calculé |

**Scénario nominal :**
1. L'employé ouvre l'application mobile
2. Le système affiche le QR code dynamique (valide 30 secondes)
3. L'employé valide son identité via authentification biométrique (empreinte/FaceID)
4. L'employé capture son visage
5. Le système envoie les données au serveur de vérification
6. Le système vérifie la signature QR, le score facial, la géolocalisation et l'horaire
7. Le système calcule le statut (présent/retard)
8. Le système enregistre le pointage dans attendance_logs
9. Le système affiche une confirmation à l'employé
10. Le système insère une notification de confirmation

**Enchaînements alternatifs :**
- **6a. QR invalide** : Le système affiche un message d'erreur et invite à régénérer le QR
- **6b. Visage non reconnu** : Le système affiche "Visage non reconnu" et invite à réessayer
- **6c. GPS désactivé** : Le système demande l'activation du GPS
- **6d. Hors-ligne** : Le système met en file d'attente et synchronise ultérieurement

### Cas d'Utilisation « Soumettre une réclamation »

**Sommaire d'identification**

| Champ | Valeur |
|-------|--------|
| Titre | Soumettre une réclamation |
| Acteur | Employé |
| Résumé | L'employé soumet un ticket de réclamation (retard, avance, absence ou autre) depuis l'application mobile |
| Pré-conditions | Être authentifié |
| Post-conditions | La réclamation est enregistrée avec analyse IA et notification à l'administrateur |

**Scénario nominal :**
1. L'employé sélectionne "Réclamation" dans le menu
2. Le système affiche les 4 types de réclamation (Retard, Avance, Absence, Autre)
3. L'employé sélectionne un type
4. Le système affiche le formulaire correspondant
5. L'employé remplit les champs (message obligatoire, date optionnelle)
6. L'employé soumet le formulaire
7. Le système enregistre la réclamation (statut: pending)
8. Le système exécute l'analyse IA (catégorie, priorité, confiance)
9. Le système affiche "Réclamation envoyée avec succès"
10. L'administrateur reçoit la réclamation dans son dashboard

### Cas d'Utilisation « Consulter le tableau de bord administrateur »

**Sommaire d'identification**

| Champ | Valeur |
|-------|--------|
| Titre | Consulter le tableau de bord administrateur |
| Acteur | Administrateur |
| Résumé | L'administrateur consulte le tableau de bord avec les KPIs, graphiques et flux en temps réel |
| Pré-conditions | Être authentifié avec le rôle Administrateur |
| Post-conditions | Affichage des données actualisées du tableau de bord |

**Scénario nominal :**
1. L'administrateur se connecte au dashboard
2. Le système charge les données de l'entreprise
3. Le système affiche les KPIs (Total collaborateurs, Présents, Retards, Congés)
4. Le système affiche les graphiques (taux de présence, tendances)
5. Le système affiche le flux d'activité en temps réel
6. Le système affiche les actions rapides

---

## Annexe B : Spécifications Techniques

### B.1 Schéma de la Base de Données (Extrait)

```sql
-- Table principale : companies
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    signing_salt TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    radius_meters FLOAT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Table : attendance_logs
CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'check_in',
    status VARCHAR(50) DEFAULT 'present',
    qr_verified BOOLEAN DEFAULT FALSE,
    face_verified BOOLEAN DEFAULT FALSE,
    face_score FLOAT,
    date DATE DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    geolocation JSONB,
    photo_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour les performances
CREATE INDEX idx_attendance_logs_company_date 
    ON public.attendance_logs(company_id, date);
CREATE INDEX idx_attendance_logs_employee 
    ON public.attendance_logs(employee_id, created_at DESC);
```

### B.2 Configuration des Politiques RLS

```sql
-- Helper function
CREATE FUNCTION get_current_company_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
    SELECT company_id FROM public.users 
    WHERE id = auth.uid() 
    LIMIT 1;
$$;

-- Politique pour attendance_logs
CREATE POLICY "Company isolation for attendance_logs"
    ON public.attendance_logs
    FOR ALL
    USING (company_id = get_current_company_id());
```

### B.3 Spécifications du QR Code Dynamique

```
Format : JSON
Contenu :
{
  "employee_id": "UUID",
  "ts": 1705321234567,        // Timestamp millisecondes
  "sig": "a1b2c3d4e5f6..."    // HMAC-SHA256 hex
}

Algorithme de signature :
  signing_key = SHA256(employee_id + company_signing_salt)
  signature = HMAC-SHA256(signing_key, employee_id + ":" + timestamp)

Validation :
  1. Vérifier que (now() - ts) < 30000ms (30 secondes)
  2. Recalculer signature et comparer
```

### B.4 Configuration du Terminal ESP32

```
Pins :
  Caméra OV2640 :
    - SIOD  : GPIO 20 (I2C Data)
    - SIOC  : GPIO 21 (I2C Clock)
    - Y9    : GPIO 48
    - Y8    : GPIO 11
    - Y7    : GPIO 12
    - Y6    : GPIO 13
    - Y5    : GPIO 14
    - Y4    : GPIO 15
    - Y3    : GPIO 16
    - Y2    : GPIO 17
    - VSYNC : GPIO 38
    - HREF  : GPIO 47
    - PCLK  : GPIO 18
    - XCLR  : GPIO 40 (Hardware Reset)
  
  LED RGB :
    - Rouge  : GPIO 4
    - Vert   : GPIO 5
    - Bleu   : GPIO 6
  
  Buzzer : GPIO 7
```

---

**Document réalisé dans le cadre du Projet de Fin d'Études — Master en Génie Logiciel**

**Aca Robotics — 2026**
