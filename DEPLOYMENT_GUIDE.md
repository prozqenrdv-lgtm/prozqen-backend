# 🚀 PROZQEN PHASE 2 - GUIDE DE DÉPLOIEMENT COMPLET

**Date:** Mai 2026  
**Status:** Phase 2 MVP - Prêt pour déploiement  
**Stack:** Node.js + Express + PostgreSQL + Claude API  

---

## 📋 TABLE DES MATIÈRES

1. [Préparation (5 min)](#préparation)
2. [Supabase Setup (5 min)](#supabase-setup)
3. [Railway Setup (10 min)](#railway-setup)
4. [Configuration des variables d'environnement (5 min)](#configuration-env)
5. [Déploiement (2 min)](#déploiement)
6. [Tests de l'API (10 min)](#tests)
7. [Troubleshooting](#troubleshooting)

---

## 🛠️ Préparation

### Avoir prêt
- [x] Clé API Claude (`sk-ant-xxxxx`)
- [ ] Compte GitHub (gratuit)
- [ ] Compte Supabase (gratuit)
- [ ] Compte Railway (gratuit)
- [ ] Clés Stripe (optionnel pour phase 2)

### Vérifier que vous avez tout
```bash
# Node.js 18+
node --version

# Git
git --version

# Vous êtes dans le dossier /home/claude/prozqen-backend/
ls package.json
```

---

## 🗄️ SUPABASE SETUP (PostgreSQL gratuit)

### Étape 1 : Créer compte Supabase
```
1. Allez sur https://supabase.com
2. Cliquez "Sign Up"
3. Connectez-vous avec GitHub (le plus rapide)
4. Créez une nouvelle organisation
```

### Étape 2 : Créer un projet
```
1. Dashboard → "New Project"
2. Name: "prozqen-dev"
3. Database Password: créez un mot de passe FORT
4. Region: "Europe (Frankfurt)" (le plus proche de vous)
5. Cliquez "Create new project"
⏳ Attendre 5-10 minutes que le projet se crée
```

### Étape 3 : Récupérer DATABASE_URL
```
1. Allez dans Settings → Database
2. Copier la "Connection string"
3. Format: postgresql://postgres:PASSWORD@HOST:5432/postgres
4. Gardez-le pour plus tard ✅
```

### Étape 4 : Tester la connexion
```bash
# Installer psql (PostgreSQL client)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client
# Windows: https://www.postgresql.org/download/windows/

# Tester la connexion
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"

# Vous devez voir le prompt: postgres=>
# Tapez: \q pour quitter
```

---

## 🚀 RAILWAY SETUP (Hébergement gratuit)

### Étape 1 : Créer compte Railway
```
1. Allez sur https://railway.app
2. "Sign Up"
3. Connectez-vous avec GitHub
4. Autorisez Railway
```

### Étape 2 : Créer un projet
```
1. Dashboard → "Create New Project"
2. Sélectionnez "Blank Project"
3. Name: "PROZQEN"
```

### Étape 3 : Connecter votre code
```
1. Dans Railway, cliquez "+ New"
2. Sélectionnez "GitHub Repo"
3. Connectez votre compte GitHub
4. Sélectionnez votre repo prozqen-backend
5. Cliquez "Deploy"
```

---

## ⚙️ Configuration des Variables d'Environnement

### Étape 1 : Créer `.env.local` localement
```bash
# Dans /home/claude/prozqen-backend/
cp .env.example .env.local

# Éditez .env.local avec ces valeurs:
```

### Étape 2 : Remplir `.env.local`
```env
# SERVER
PORT=3000
NODE_ENV=production

# DATABASE (de Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres

# ANTHROPIC (votre clé)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# JWT
JWT_SECRET=générez-un-secret-aléatoire-complexe
JWT_EXPIRY=7d

# STRIPE (optionnel pour phase 1)
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# EMAIL (optionnel)
RESEND_API_KEY=re_xxxxx
ADMIN_EMAIL=admin@prozqen.fr

# FRONTEND
FRONTEND_URL=http://localhost:3000
FRONTEND_PROD_URL=https://prozqen.vercel.app

# LOG
LOG_LEVEL=info
```

### Étape 3 : Ajouter les variables à Railway
```
1. Dans Railway: Project → Settings → Variables
2. Cliquez "Add Variable"
3. Copiez/collez CHAQUE ligne de votre .env.local
4. Cliquez "Deploy"
```

---

## 📦 Déploiement

### Étape 1 : Initialiser Git (si pas encore fait)
```bash
cd /home/claude/prozqen-backend/

git init
git add .
git commit -m "Initial commit: Phase 2 MVP"
git branch -M main
```

### Étape 2 : Push vers GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/prozqen-backend.git
git push -u origin main
```

### Étape 3 : Railway auto-déploie
```
✅ Railway verra votre push
✅ Exécutera npm install
✅ Exécutera npm start (ou node server.js)
✅ Votre API sera live en 2-3 minutes
```

### Étape 4 : Vérifier le déploiement
```bash
# Railway vous donne une URL genre:
# https://prozqen-production-xxxxx.up.railway.app

# Testez-la:
curl https://prozqen-production-xxxxx.up.railway.app/health

# Vous devez voir:
# {"status":"ok","timestamp":"2026-05-07T...","uptime":123.456}
```

---

## 🧪 Tests de l'API

### Test 1 : Health Check
```bash
curl https://your-railway-url/health

# Réponse attendue:
# {"status":"ok","timestamp":"...","uptime":...}
```

### Test 2 : Signup
```bash
curl -X POST https://your-railway-url/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "plan": "BASIC"
  }'

# Réponse attendue:
# {"success":true,"user":{"id":"uuid","email":"test@example.com","plan":"BASIC"},"token":"eyJhbGc..."}
```

### Test 3 : Login
```bash
curl -X POST https://your-railway-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Copiez le token pour les tests suivants
TOKEN="eyJhbGc..."
```

### Test 4 : Get User
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://your-railway-url/auth/me

# Réponse attendue:
# {"success":true,"user":{"id":"uuid","email":"test@example.com",...}}
```

### Test 5 : Run Agent Pipeline
```bash
curl -X POST https://your-railway-url/agents/run-pipeline \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agents": ["prospect-finder"],
    "criteria": {
      "city": "Paris",
      "property_type": "Apartement",
      "budget": "500000"
    },
    "userContext": {
      "company_name": "Mon Agence",
      "agency_type": "Immobilier"
    }
  }'

# Réponse attendue:
# {"success":true,"pipeline":"full","summary":{"totalTokens":50,"totalCost":0.0008...},"results":[...]}
```

---

## 📊 Vérifier les Logs

### Railway Logs
```
1. Railway Dashboard → Your Project
2. Cliquez sur le service "prozqen"
3. Cliquez "Logs"
4. Vous voyez les logs en temps réel
```

### CLI Railway
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Voir les logs
railway logs

# Voir les variables
railway variables
```

---

## 🔧 Troubleshooting

### Erreur : `DATABASE_URL not found`
```
❌ Problème: Variable d'environnement non configurée
✅ Solution:
1. Allez dans Railway → Settings → Variables
2. Vérifiez que DATABASE_URL est présent
3. Redéployez: git push
```

### Erreur : `ANTHROPIC_API_KEY is invalid`
```
❌ Problème: Clé API Claude incorrecte ou expirée
✅ Solution:
1. Allez sur https://console.anthropic.com/account/keys
2. Créez une nouvelle clé
3. Mettez-la à jour dans Railway variables
4. Redéployez
```

### Erreur : `Connection refused on port 5432`
```
❌ Problème: Supabase database non accessible
✅ Solution:
1. Vérifiez que DATABASE_URL est correct
2. Vérifiez que le password n'a pas de caractères spéciaux mal échappés
3. Testez avec psql: psql "YOUR_DATABASE_URL"
```

### API très lente
```
❌ Problème: Railway tier gratuit limité (5 requêtes/sec)
✅ Solution:
1. Attendez quelques secondes entre les appels
2. Ou: Upgrader vers Railway paid ($5/mois)
```

---

## ✅ CHECKLIST POST-DÉPLOIEMENT

- [ ] Railway affiche "Healthy" ✅
- [ ] `/health` retourne 200 OK ✅
- [ ] Signup fonctionne ✅
- [ ] Login fonctionne et retourne un token ✅
- [ ] Agent pipeline fonctionne ✅
- [ ] Logs dans Railway visibles ✅
- [ ] DATABASE_URL correct ✅
- [ ] ANTHROPIC_API_KEY fonctionnelle ✅
- [ ] Pas d'erreurs 500 ✅

---

## 🎉 VOUS ÊTES LIVE!

**Votre API est maintenant accessible à :**
```
https://your-railway-url
```

### Prochaines étapes (Phase 2.5)

1. **Frontend React** (pour tester l'API)
2. **Dashboard utilisateur** (voir les prospects, résultats agents)
3. **Intégrations** (LinkedIn, Email, CRM)
4. **Production release** (passer Stripe en LIVE)

---

## 📞 Support

Si vous avez des erreurs :

1. **Vérifiez les logs** : Railway → Logs
2. **Testez localement** : `npm run dev`
3. **Vérifiez les variables** : Railway → Variables
4. **Redéployez** : `git push` (si vous changez le code)

---

**Vous avez réussi! 🚀 PROZQEN phase 2 est LIVE!**
