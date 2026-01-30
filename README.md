# Notable

AI Visibility Monitoring for Real Estate Agents

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/notable.git
cd notable
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Now open `.env.local` in a text editor and fill in your API keys:

```
# CLERK (from https://dashboard.clerk.com → API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# SUPABASE (from https://supabase.com/dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# OPENAI (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-xxx

# ANTHROPIC (from https://console.anthropic.com/settings/keys)
ANTHROPIC_API_KEY=sk-ant-xxx

# GOOGLE AI (from https://aistudio.google.com/app/apikey)
GOOGLE_AI_API_KEY=xxx

# STRIPE (from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### 4. Set Up the Database

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `supabase/schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd+Enter / Ctrl+Enter)

You should see "Success. No rows returned" - this means the tables were created.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
notable/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages (protected)
│   │   ├── sign-in/           # Clerk sign-in page
│   │   ├── sign-up/           # Clerk sign-up page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   ├── lib/                   # Utilities and integrations
│   │   ├── llm/              # LLM API integrations
│   │   ├── prompts/          # Prompt library
│   │   └── supabase.ts       # Database client
│   └── middleware.ts          # Clerk auth middleware
├── supabase/
│   └── schema.sql            # Database schema
├── .env.example              # Environment variables template
└── package.json
```

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New → Project**
4. Import your GitHub repository
5. Add all environment variables from `.env.local`
6. Click **Deploy**

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Payments**: Stripe
- **LLM APIs**: OpenAI, Anthropic, Google AI
