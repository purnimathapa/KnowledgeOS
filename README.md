# KnowledgeOS

Study workspace built with Next.js: organize subjects, upload PDFs, and generate summaries, quizzes, flashcards, and Q&A with Gemini.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (Auth, Postgres, Storage)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (`AIza…`)

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in .env.local (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable / anon key (Settings → API) |
| `GEMINI_API_KEY` | Yes | Google AI Studio key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev signup | Service role key; used by `/api/auth/register` to confirm users without email rate limits. **Server only.** |
| `GEMINI_MODEL` | No | Default `gemini-2.0-flash`. Try `gemini-2.0-flash-lite` if you hit free-tier 429s. |

## Supabase setup

1. **Auth** — Email provider enabled. For local dev, set `SUPABASE_SERVICE_ROLE_KEY` so signup uses the register API route instead of flooding confirmation emails.

2. **Storage** — Create a private bucket named `documents`. RLS policies should allow authenticated users to read/write objects under their `user_id` prefix (match your app’s upload paths).

3. **Database** — Tables used by the app:

   - `subjects` — `user_id`, `name`, `color`
   - `documents` — `subject_id`, `user_id`, `file_name`, **`storage_path`**, `status`, `extracted_text`
   - `summaries`, `qa_history`, `quizzes`, `flashcards` — tied to `document_id` and `user_id`

   Enable RLS on all tables so rows are scoped to `auth.uid()`.

   Apply your schema via the Supabase SQL editor or migrations in the dashboard; this repo does not ship SQL migration files yet.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |

## Troubleshooting

- **Signup / login loops** — Check Supabase URL and publishable key; ensure middleware cookies work (same site, HTTPS in production).
- **Upload errors** — Confirm the `documents` bucket exists and inserts use `storage_path`, not `file_path`.
- **Gemini 429** — Wait, use a lighter `GEMINI_MODEL`, or enable billing in Google AI Studio.
- **Server error / missing chunk (`./276.js`)** — Clear the build cache: `rm -rf .next && npm run dev`.

## License

Private project unless otherwise noted.
