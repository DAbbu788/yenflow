# YenFlow — Deploy Guide
# Zero cost · ~20 minutes · Supabase + Vercel

---

## Step 1 — Supabase (database + auth)

1. Go to https://supabase.com → sign up (free)
2. Click **New Project** → name it `yenflow` → set a strong DB password → choose region closest to Japan (e.g. Tokyo)
3. Wait ~2 minutes for the project to provision
4. Go to **SQL Editor** (left sidebar) → **New query**
5. Paste the entire contents of `supabase/schema.sql` → click **Run**
   - You should see "Success" with no errors
6. Go to **Project Settings** → **API**
   - Copy **Project URL** (looks like `https://xxxx.supabase.co`)
   - Copy **anon public** key (long JWT string)
7. In **Authentication** → **URL Configuration**:
   - Add your Vercel URL to **Redirect URLs** after you deploy (e.g. `https://yenflow.vercel.app/**`)

---

## Step 2 — Local setup

```bash
# In your project folder
npm install

# Copy env file and fill in your keys
cp .env.example .env.local
# Edit .env.local:
#   VITE_SUPABASE_URL=https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key

# Run locally
npm run dev
# → http://localhost:5173
```

Test it: register an account, check that categories appear automatically.

---

## Step 3 — GitHub

```bash
git init
git add .
git commit -m "Initial YenFlow commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/yenflow.git
git push -u origin main
```

---

## Step 4 — Vercel (hosting)

1. Go to https://vercel.com → sign up with GitHub (free)
2. Click **Add New Project** → import your `yenflow` repo
3. Framework preset: **Vite** (auto-detected)
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **Deploy** → wait ~1 minute
6. Your app is live at `https://yenflow-xxxx.vercel.app`

---

## Step 5 — Supabase redirect URL

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, click **Add URL**
3. Add: `https://your-vercel-url.vercel.app/**`
4. Save

---

## Step 6 — Keepalive ping (prevents Supabase free tier pause)

Supabase pauses inactive projects after 1 week on free tier.
Set up a free cron to ping your project every 3 days:

1. Go to https://cron-job.org → sign up (free)
2. Create a new cron job:
   - URL: `https://xxxx.supabase.co/rest/v1/profiles?select=id&limit=1`
   - Headers: `apikey: your-anon-key`
   - Schedule: Every 3 days
3. Save → enable

That's it. Your project will never pause.

---

## Future deploys

Every `git push` to `main` auto-deploys via Vercel. No action needed.

---

## Phase 2 checklist (friends + split expenses)

When you're ready to build the friends feature, these tables already exist
in your database (created by schema.sql):
- `friendships`       — friend requests and connections
- `group_expenses`    — shared expense with total amount
- `group_splits`      — each person's share of a group expense
- `peer_transactions` — direct borrow / payback between two users

The RLS policies are already in place. You just need to build the UI.

---

## File reference

```
yenflow/
├── supabase/schema.sql       ← Run once in Supabase SQL Editor
├── .env.example              ← Copy to .env.local, fill in keys
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── lib/supabase.js
    ├── context/AuthContext.jsx
    ├── hooks/useCategories.js
    ├── components/
    │   ├── Layout.jsx
    │   ├── Navbar.jsx
    │   ├── Modal.jsx
    │   ├── StatCard.jsx
    │   └── CategoryManager.jsx
    └── pages/
        ├── AuthPage.jsx        ← Register + Login
        ├── Dashboard.jsx       ← Annual charts + KPIs
        ├── Expenses.jsx        ← Log + filter expenses
        ├── IncomePage.jsx      ← Monthly income entries
        ├── Remittance.jsx      ← ¥→₹ transfer tracker
        ├── BudgetGrid.jsx      ← 12-month budget grid per year
        ├── MonthlyPlanner.jsx  ← Month-by-month budget vs actual
        └── Settings.jsx        ← Profile, categories, defaults
```
