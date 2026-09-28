# Job Match Analyzer — Vercel Edition

> RAG + LLaMA 3 powered job match analyzer. Deployed on Vercel, LLM by Groq (free).

**Live demo:** _your-project.vercel.app_ (after deploy)

## Setup

### 1. Get a free Groq API key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (no credit card needed)
3. Create an API key

### 2. Local development

```bash
cd job-match-analyzer-vercel
npm install

# Copy env file and add your key
cp .env.local.example .env.local
# Edit .env.local → set GROQ_API_KEY=gsk_...

npm run dev
```

Open **http://localhost:3000** → click **Index Resume** → paste JD → **Analyze Match**

### 3. Deploy to Vercel

```bash
# Install Vercel CLI (once)
npm i -g vercel

# Deploy
vercel

# When prompted:
#   Set up and deploy? → Y
#   Which scope? → your account
#   Link to existing project? → N
#   Project name → job-match-analyzer
#   Directory → ./  (current dir)
#   Override settings? → N

# Add your env var
vercel env add GROQ_API_KEY
# Paste your Groq key when prompted

# Re-deploy with env var
vercel --prod
```

Your app is live at `https://job-match-analyzer-<hash>.vercel.app` 🎉

## Architecture

```
Vercel (Next.js 14 App Router)
├── src/app/page.tsx              ← Client UI
├── src/app/api/ingest/route.ts   ← POST /api/ingest
├── src/app/api/analyze/route.ts  ← POST /api/analyze
└── src/lib/
    ├── vectorStore.ts   ← In-process cosine similarity store
    ├── groqClient.ts    ← Groq SDK (LLaMA 3 embeddings + chat)
    ├── ingest.ts        ← Phase 1 RAG: chunk → embed → store
    ├── retriever.ts     ← Phase 2 RAG: embed JD → similarity search
    └── analyzer.ts      ← Phase 3 RAG: context + LLM → JSON output
```

## Note on in-memory store

The vector store resets on cold starts (Vercel serverless). Just click
**Index Resume** again — it takes ~5 seconds. For production, swap
`vectorStore.ts` with [Upstash Redis](https://upstash.com) vector store.
