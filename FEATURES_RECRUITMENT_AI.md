# 🤖 Module Recrutement IA — Documentation des fonctionnalités

Ce document explique **ce qui a été ajouté** au système Rihem (gestion RH /
présence) et **comment chaque fonctionnalité marche**, de l'interface jusqu'à
l'intelligence artificielle.

> En résumé : on a branché un moteur d'IA (**Groq / Llama 3.3**) sur le système
> RH pour automatiser le **recrutement** — lire les CV, les classer, les comparer
> à des offres, générer des questions d'entretien — plus quelques bonus RH.

---

## 1. Vue d'ensemble (le chemin d'une requête)

```
┌────────────────┐   1. upload CV    ┌──────────────────┐   3. prompt    ┌──────────┐
│  Dashboard      │ ───────────────▶ │  Flask API        │ ────────────▶ │  Groq    │
│  (React)        │                   │  /api/ai/*        │                │  Llama   │
│  Recrutement    │ ◀─────────────── │  recruitment_api  │ ◀──────────── │  3.3 70B │
└────────────────┘   5. résultat     └──────────────────┘   4. JSON      └──────────┘
                                              │
                                              │ 2 & 6. lecture / écriture
                                              ▼
                                       ┌──────────────┐
                                       │  Supabase     │  (PostgreSQL)
                                       │  job_offers   │
                                       │  candidates   │
                                       │  cv_analyses  │
                                       └──────────────┘
```

1. L'admin importe un CV (PDF/DOCX/TXT) dans le dashboard.
2. Le serveur Flask extrait le **texte** du fichier.
3. Il envoie ce texte à **Groq** avec un *prompt* qui demande une réponse en JSON.
4. Groq renvoie des **données structurées** (compétences, score, catégorie…).
5. Le dashboard affiche le résultat (jauges, cartes, recommandations).
6. Tout est **sauvegardé** dans Supabase pour l'historique et le classement.

---

## 2. Les fichiers ajoutés

| Fichier | Rôle |
|---------|------|
| **`llm_engine.py`** | Le « cerveau ». Toutes les fonctions IA qui parlent à Groq. |
| **`recruitment_api.py`** | Les routes HTTP `/api/ai/*` (Flask Blueprint) + sauvegarde DB. |
| **`recruitment_migration.sql`** | Crée les tables `job_offers`, `candidates`, `cv_analyses`. |
| **`ai_features_migration.sql`** | Ajoute les colonnes IA (sentiment, réponse, entretien). |
| **`supabase_ai_setup.sql`** | **Tout-en-un** : à exécuter une fois dans Supabase. |
| **`admin-dashboard/.../RecrutementPanel.jsx`** | L'interface (onglet « Recrutement IA »). |
| **`admin-dashboard/.../recruitmentService.js`** | Le client qui appelle l'API depuis React. |
| **`requirements.txt` / `.env.example`** | Dépendances Python & variables d'environnement. |

Modifiés : `app.py` (charge le module IA), `ai_intelligence.py` (réclamations
boostées à l'IA), `AdministrateurDashboard.jsx` (ajoute l'onglet dans le menu).

---

## 3. Les fonctionnalités, une par une

### 🟦 Fonctionnalité 1 — Analyse de CV (CV Analyser)
**Ce qu'elle fait :** lit un CV brut et en extrait des informations structurées.

**Comment :** la fonction `analyze_cv(texte)` dans `llm_engine.py` envoie le CV à
Groq avec un *prompt* qui impose un format JSON précis. Le modèle renvoie :

- nom, email, téléphone, localisation, titre actuel, années d'expérience
- **résumé** du profil (2-3 phrases)
- liste de **compétences**, langues, formations, expériences, certifications
- **points forts** et **red flags** (trous, incohérences)
- un **score de qualité du CV** sur 100

**Où le voir :** après l'import, le bloc « Dernière analyse » + la jauge
« Qualité CV ».

---

### 🟦 Fonctionnalité 2 — Classification de CV (CV Classifier)
**Ce qu'elle fait :** range automatiquement le candidat dans une catégorie.

**Comment :** `classify_cv(texte)` demande à Groq de renvoyer :
- **catégorie métier** (ex. « Développement Logiciel », « Marketing »…)
- **département** RH suggéré
- **niveau de séniorité** (Junior / Confirmé / Senior / Lead…)
- un **score de confiance**

**Où le voir :** les étiquettes (tags) sur la carte du candidat et dans le résultat.

---

### 🟦 Fonctionnalité 3 — Matching CV ↔ Offre (le bouton « Comparer »)
**Ce qu'elle fait :** mesure à quel point un candidat correspond à une offre.

**Comment :** `match_cv_to_job(cv, titre, description)` compare le CV à l'offre et
renvoie :
- un **score de matching** sur 100
- une **recommandation** (Fortement recommandé / Recommandé / À considérer / Non)
- les **compétences qui correspondent** ✓ et celles **qui manquent** ✗
- une synthèse pour le recruteur

**Deux façons de l'utiliser :**
1. À l'import : choisir une offre dans le menu déroulant **avant** d'importer le CV.
2. Après coup : ouvrir un candidat → zone **« 🎯 Comparer à une offre »** →
   choisir l'offre → bouton **🔍 Comparer**.

---

### 🟩 Bonus 4 — Réclamations intelligentes (Smart Reclamation AI)
**Ce qu'elle fait :** analyse les réclamations des employés.

**Comment :** `classify_reclamation(objet, message)` renvoie la **priorité**, la
**catégorie**, le **sentiment**, un **résumé** et même un **brouillon de réponse RH**.
Le script existant `ai_intelligence.py` a été mis à niveau : il utilise l'IA si la
clé Groq est présente, sinon il retombe sur l'ancien système de mots-clés.

---

### 🟩 Bonus 5 — Générateur de questions d'entretien
**Ce qu'elle fait :** propose des questions d'entretien sur mesure.

**Comment :** `generate_interview_questions(cv, titre, description)` génère des
questions **techniques**, sur le **parcours**, **comportementales**, des points
**à clarifier** et des **conseils** pour le recruteur.

**Où le voir :** ouvrir un candidat → bouton **🎤 Générer** dans le modal.

---

### 🟩 Bonus 6 — Synthèse RH (HR Insights)
**Ce qu'elle fait :** transforme les statistiques de présence et de fraude en un
**rapport en langage naturel** (constats, risques, recommandations).
> Note : retiré de l'interface à la demande, mais l'API
> `GET /api/ai/insights/summary` reste disponible.

---

## 4. Les routes de l'API (`/api/ai/*`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/ai/health` | Vérifie que l'IA répond. |
| GET | `/api/ai/jobs?company_id=` | Liste les offres. |
| POST | `/api/ai/jobs` | Crée une offre. |
| POST | `/api/ai/cv/analyze` | Importe un CV → analyse + classification (+ matching). |
| GET | `/api/ai/candidates?company_id=` | Liste classée des candidats. |
| GET | `/api/ai/candidates/<id>` | Détail complet d'un candidat. |
| POST | `/api/ai/cv/match` | Compare un candidat à une offre (bouton Comparer). |
| POST | `/api/ai/interview/generate` | Génère les questions d'entretien. |
| POST | `/api/ai/reclamation/classify` | Analyse une réclamation. |
| POST | `/api/ai/reclamation/analyze-all` | Analyse en lot les réclamations. |
| GET | `/api/ai/insights/summary` | Rapport RH IA. |

---

## 5. Les tables de base de données

- **`job_offers`** — les postes ouverts (titre, description, séniorité, lieu…).
- **`candidates`** — un candidat par CV importé : infos extraites, `cv_text`,
  `job_category`, `seniority_level`, `overall_score`, `match_score`, `status`.
- **`cv_analyses`** — l'historique complet : le JSON brut de l'analyse, de la
  classification, du matching et des questions d'entretien.

---

## 6. Détails techniques importants

- **Groq / Llama 3.3 :** moteur d'inférence très rapide, compatible OpenAI.
  Le modèle est configurable via `GROQ_MODEL` dans `.env`
  (`llama-3.3-70b-versatile` pour la qualité, `llama-3.1-8b-instant` pour la vitesse).
- **Parsing JSON robuste :** le modèle enveloppe parfois le JSON dans du texte.
  `llm_engine.py` essaie d'abord un mode tolérant, extrait le bloc JSON même s'il
  y a du texte autour, et garde le mode strict en secours. → plus de plantage.
- **Nettoyage des caractères :** les CV (surtout PDF) contiennent parfois des
  octets nuls ` ` que PostgreSQL refuse. Le serveur les supprime avant
  d'enregistrer (`_clean_text` / `_deep_clean`).
- **Sécurité :** la clé Groq vit dans `.env` (ignoré par git, jamais publié).

---

## 7. Comment tester rapidement
1. `python app.py` → message `🤖 AI recruitment module loaded`.
2. `cd admin-dashboard && npm run dev`.
3. Dashboard → menu **Recrutement IA → 🤖 Analyse CV (IA)**.
4. Créer une offre, importer un CV, ouvrir le candidat, cliquer **Comparer** et **Générer**.

> Pour l'installation complète (clé, dépendances, migration SQL), voir
> [`RECRUITMENT_AI.md`](RECRUITMENT_AI.md).
