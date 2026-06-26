# Deviso — Générateur de devis IA pour freelances

> Devis professionnel en 30 secondes grâce à l'IA. Conçu pour les freelances et indépendants français.

---

## Stack technique

- **Next.js 15** (App Router) — fullstack React
- **Supabase** — base de données PostgreSQL + auth + temps réel
- **OpenAI GPT-4o** — génération des devis en langage naturel
- **Tailwind CSS** — styles
- **TypeScript** — typage fort

---

## Setup en 5 minutes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer un projet Supabase

1. Va sur [app.supabase.com](https://app.supabase.com) et crée un projet
2. Dans **SQL Editor**, colle et exécute le contenu de `supabase/schema.sql`
3. Dans **Settings → API**, récupère :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Créer une clé OpenAI

1. Va sur [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crée une nouvelle clé et copie-la

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Puis remplis le fichier `.env.local` avec tes clés.

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) 🚀

---

## Structure du projet

```
deviso/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Styles globaux
│   ├── (auth)/
│   │   ├── login/page.tsx          # Connexion
│   │   └── signup/page.tsx         # Inscription
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + auth guard
│   │   ├── dashboard/page.tsx      # Tableau de bord
│   │   └── proposals/
│   │       ├── page.tsx            # Liste des devis
│   │       ├── new/page.tsx        # Création (flow 3 étapes)
│   │       └── [id]/page.tsx       # Détail + partage
│   ├── api/
│   │   └── proposals/
│   │       ├── route.ts            # GET liste / POST créer
│   │       ├── [id]/route.ts       # GET / PATCH / DELETE
│   │       └── generate/route.ts   # POST génération IA
│   └── auth/callback/route.ts      # OAuth callback Supabase
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Client navigateur
│   │   └── server.ts               # Client serveur
│   └── openai.ts                   # Prompt + génération
├── types/index.ts                  # Types TypeScript
├── middleware.ts                   # Auth guard sur les routes
└── supabase/schema.sql             # Schéma DB à exécuter
```

---

## Features MVP

- ✅ Landing page avec pricing
- ✅ Auth email/password (Supabase)
- ✅ Génération de devis par IA (brief naturel → JSON structuré)
- ✅ Éditeur de lignes de devis
- ✅ Calcul automatique HT/TVA/TTC
- ✅ Sauvegarde en base de données
- ✅ Lien de partage unique par devis
- ✅ Suivi statut (brouillon, envoyé, consulté, signé)
- ✅ Dashboard avec stats
- ✅ Impression / PDF natif navigateur

## Prochaines features

- [ ] Signature électronique client (DocuSeal)
- [ ] Relances automatiques par email (Resend)
- [ ] Upload logo + personnalisation couleurs
- [ ] Stripe billing (plan Pro)
- [ ] Page publique client `/p/[token]`
- [ ] Templates de devis par secteur
- [ ] Export PDF serveur (Puppeteer)

---

## Déploiement

```bash
# Vercel (recommandé)
npx vercel --prod

# Variables d'env à ajouter dans le dashboard Vercel :
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# OPENAI_API_KEY
# NEXT_PUBLIC_APP_URL (ton domaine de prod)
```

---

## Changer le nom "Deviso"

Cherche et remplace `Deviso` dans :
- `app/layout.tsx` (metadata)
- `app/page.tsx` (landing)
- `app/(dashboard)/layout.tsx` (sidebar)
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `.env.local` → `NEXT_PUBLIC_APP_NAME`
