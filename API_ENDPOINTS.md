# 📡 PROZQEN API - RÉFÉRENCE COMPLÈTE DES ENDPOINTS

**Base URL (Production):** `https://your-railway-url`  
**Base URL (Développement):** `http://localhost:3000`

---

## 🔐 AUTHENTIFICATION

### POST /auth/signup
**Créer un compte**

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "plan": "BASIC"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "BASIC",
    "tokensLimit": 1000
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
**Se connecter**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### GET /auth/me
**Récupérer les infos utilisateur**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/auth/me
```

**Réponse:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "BASIC",
    "tokens_remaining": 950,
    "tokens_limit": 1000,
    "created_at": "2026-05-07T10:00:00Z"
  }
}
```

---

## 🤖 AGENTS IA

### POST /agents/run-pipeline
**Exécuter les agents IA en pipeline**

```bash
curl -X POST http://localhost:3000/agents/run-pipeline \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agents": ["prospect-finder", "message-generator"],
    "prospects": [
      {
        "id": "uuid",
        "name": "Jean Dupont",
        "email": "jean@example.com",
        "job_title": "Directeur",
        "company": "Acme Corp"
      }
    ],
    "criteria": {
      "city": "Paris",
      "property_type": "Apartment",
      "budget": 500000
    },
    "userContext": {
      "company_name": "Mon Agence",
      "average_deal_value": 50000
    },
    "stage": "full"
  }'
```

**Agents disponibles:**
- `prospect-finder` (TOUS) - Identifier les prospects
- `message-generator` (TOUS) - Générer des messages perso
- `followup-automation` (TOUS) - Automatiser les relances
- `deal-analyzer` (PRO) - Analyser les opportunités
- `crm-sync` (PRO) - Syncer avec CRM
- `performance-optimizer` (PRO) - Optimiser les campagnes

### GET /agents/history
**Historique des exécutions d'agents**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/agents/history?limit=20&offset=0
```

### GET /agents/stats
**Statistiques d'utilisation des agents**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/agents/stats
```

---

## 👥 PROSPECTS

### GET /prospects
**Lister tous les prospects**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/prospects?limit=50&offset=0&status=NEW&search=dupont
```

### POST /prospects
**Créer un prospect**

```bash
curl -X POST http://localhost:3000/prospects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "phone": "+33612345678",
    "linkedin_url": "https://linkedin.com/in/jeandupont",
    "company": "Acme Corp",
    "job_title": "CEO",
    "city": "Paris"
  }'
```

### GET /prospects/:id
**Récupérer un prospect**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/prospects/uuid-du-prospect
```

### PUT /prospects/:id
**Mettre à jour un prospect**

```bash
curl -X PUT http://localhost:3000/prospects/uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONTACTED",
    "notes": "A appelé hier"
  }'
```

### DELETE /prospects/:id
**Supprimer un prospect**

```bash
curl -X DELETE http://localhost:3000/prospects/uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /prospects/import
**Importer des prospects en masse**

```bash
curl -X POST http://localhost:3000/prospects/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prospects": [
      {"name": "Person 1", "email": "p1@example.com", "city": "Paris"},
      {"name": "Person 2", "email": "p2@example.com", "city": "Lyon"}
    ]
  }'
```

---

## 💰 TOKENS

### GET /tokens/balance
**Voir le solde de tokens**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/tokens/balance
```

**Réponse:**
```json
{
  "success": true,
  "balance": {
    "remaining": 950,
    "limit": 1000,
    "used": 50,
    "percentageUsed": 5.0,
    "resetDate": "2026-06-07T00:00:00Z",
    "plan": "BASIC"
  }
}
```

### GET /tokens/history
**Historique de consommation des tokens**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/tokens/history?limit=50&offset=0
```

### GET /tokens/usage-by-agent
**Consommation par agent IA**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/tokens/usage-by-agent
```

### POST /tokens/reset (DEV ONLY)
**Réinitialiser les tokens (développement seulement)**

```bash
curl -X POST http://localhost:3000/tokens/reset \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔗 CONNECTEURS

### POST /connectors/linkedin/sync
**Synchroniser LinkedIn**

```bash
curl -X POST http://localhost:3000/connectors/linkedin/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profile_url": "https://linkedin.com/in/username"}'
```

### POST /connectors/email/send
**Envoyer une campagne email**

```bash
curl -X POST http://localhost:3000/connectors/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prospect_ids": ["uuid1", "uuid2"],
    "subject": "Opportunité immobilière",
    "body": "Bonjour..."
  }'
```

### POST /connectors/sheets/sync
**Syncer avec Google Sheets**

```bash
curl -X POST http://localhost:3000/connectors/sheets/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheet_id": "1a2b3c4d5e6f",
    "range": "Sheet1!A1:Z1000"
  }'
```

### POST /connectors/crm/sync
**Syncer avec CRM (Pipedrive, HubSpot, Zendesk)**

```bash
curl -X POST http://localhost:3000/connectors/crm/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crm_type": "pipedrive",
    "api_key": "your-pipedrive-api-key"
  }'
```

---

## 💬 CHAT (Support 24/7)

### POST /chat/message
**Envoyer un message au chatbot IA**

```bash
curl -X POST http://localhost:3000/chat/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Comment utiliser le prospect finder?",
    "conversationId": "optional-conv-id"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "conversationId": "conv_uuid",
  "response": "Le Prospect Finder est un agent IA qui...",
  "tokens": {"used": 150}
}
```

### GET /chat/conversations
**Lister les conversations**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/chat/conversations
```

---

## 📊 ANALYTICS

### GET /analytics/dashboard
**Tableau de bord complet**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/analytics/dashboard
```

**Réponse:**
```json
{
  "success": true,
  "dashboard": {
    "user": {
      "plan": "BASIC",
      "tokensRemaining": 950,
      "percentageUsed": "5.0"
    },
    "prospects": {
      "byStatus": {"NEW": 15, "CONTACTED": 8, "CLOSED": 3},
      "total": 26
    },
    "agents": {
      "totalExecutions": 42,
      "totalSuccessful": 39
    },
    "performance": {
      "conversionRate": 11.54,
      "tokensCostThisMonth": 0.75
    }
  }
}
```

### GET /analytics/conversions
**Données de conversion (30 derniers jours)**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/analytics/conversions
```

### GET /analytics/roi
**Calcul du ROI**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/analytics/roi
```

---

## 🪝 WEBHOOKS

### POST /webhook/stripe
**Webhooks Stripe** (automatique)

```
Stripe envoie automatiquement les événements:
- charge.succeeded
- charge.failed
- customer.subscription.updated
```

### POST /webhook/calendly
**Webhooks Calendly** (automatique)

```
Calendly envoie automatiquement les événements de RDV
```

---

## 🏥 HEALTH CHECK

### GET /health
**Vérifier que l'API fonctionne**

```bash
curl http://localhost:3000/health
```

**Réponse:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-07T10:30:45Z",
  "uptime": 3600.5
}
```

---

## 📝 CODES DE STATUT

| Code | Signification |
|------|---------------|
| 200 | ✅ Succès |
| 201 | ✅ Ressource créée |
| 400 | ❌ Requête invalide |
| 401 | ❌ Pas authentifié |
| 403 | ❌ Accès refusé |
| 404 | ❌ Ressource non trouvée |
| 500 | ❌ Erreur serveur |

---

## 🔑 AUTHENTIFICATION

Tous les endpoints (sauf signup/login/health) nécessitent un JWT dans le header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Le token est retourné lors du signup/login et expire après 7 jours.

---

**📌 Dernière mise à jour:** Mai 2026  
**Version API:** 1.0.0
