# VAULT — TCG Collection Tracker

## Deploy in 30 minutes (no coding experience needed)

---

### Step 1 — Get your free API keys (15 mins)

**Pokémon TCG API** (card images + data)
1. Go to https://dev.pokemontcg.io/
2. Click "Sign Up" → confirm email
3. Copy your API key

**eBay API** (real sold listings — our main differentiator)
1. Go to https://developer.ebay.com/
2. Click "Join" → create account
3. Go to "My Account" → "Application Access Keys"
4. Create a new app → copy "App ID (Client ID)" and "Cert ID (Client Secret)"

**Supabase** (your database — stores collections)
1. Go to https://supabase.com → "Start your project"
2. Create a new project (choose a region close to you)
3. Wait ~2 mins for it to spin up
4. Go to Settings → API → copy "Project URL" and "anon public" key and "service_role" key
5. Go to SQL Editor → paste the entire contents of `supabase-schema.sql` → Run

---

### Step 2 — Deploy to Vercel (5 mins)

1. Go to https://github.com → create account if needed
2. Create a new repository called "vault-tcg"
3. Upload all these files to the repository
4. Go to https://vercel.com → "Add New Project"
5. Import your GitHub repository
6. Before clicking Deploy, click "Environment Variables" and add:

```
POKEMON_TCG_API_KEY     = (your pokemontcg.io key)
EBAY_CLIENT_ID          = (your ebay App ID)
EBAY_CLIENT_SECRET      = (your ebay Cert ID)
NEXT_PUBLIC_SUPABASE_URL       = (your supabase project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY  = (your supabase anon key)
SUPABASE_SERVICE_KEY           = (your supabase service key)
```

7. Click Deploy → in ~2 mins you'll have a live URL like `vault-tcg.vercel.app`

---

### Step 3 — Run locally for development (optional)

```bash
# Install Node.js from nodejs.org first
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
# Open http://localhost:3000
```

---

### What works out of the box
- ✅ Dashboard with portfolio value + chart
- ✅ Collection list (grid + list view, sort, filter)
- ✅ Card detail with eBay sold listings
- ✅ Scan flow with variant disambiguation
- ✅ Browse + search with real Pokémon TCG data
- ✅ All data persists in Supabase (or localStorage as fallback)

### What's coming next
- [ ] User accounts (login/signup)
- [ ] Price history tracking (store prices daily)
- [ ] Push alerts when your card hits a target price
- [ ] Mobile app wrapper (Capacitor or React Native)
- [ ] Multi-user / share collection

---

### Troubleshooting

**"Cards not loading"** → Check POKEMON_TCG_API_KEY is set in Vercel env vars

**"eBay data not showing"** → App shows mock data until eBay keys are added, this is fine

**"Collection not saving between sessions"** → Supabase not configured; app is using localStorage (works for one browser only). Add Supabase keys to fix.

**Any other issue** → Check Vercel → your project → "Deployments" → click the latest → "Functions" to see error logs
