# YUGMA AI

Where two journeys meet. YUGMA combines a deterministic compatibility estimate with clearly-labelled Jataka-style, numerology-style and palmistry-style cultural interpretations. These are not scientific predictions.

## Local development

```powershell
cd C:\Users\adarsh\Downloads\milanmatch-ai-mvp\milanmatch-ai
npm install
Copy-Item .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`.

## Required environment variables

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FREE_ANALYSIS_LIMIT=5
ADMIN_EMAILS=admin@example.com
STORAGE_BUCKET=user-uploads
MAX_UPLOAD_BYTES=2000000
APP_URL=http://localhost:3000
```

Create a Gemini API key in Google AI Studio and put it only in `.env.local` or Vercel environment variables. Do not use a `NEXT_PUBLIC_` Gemini key or commit a key to Git.

## Supabase setup

1. Create a project and execute `supabase/schema.sql` in its SQL Editor.
2. Create a **private** Storage bucket named `user-uploads`; then run the included storage policies from the schema.
3. Configure Auth email/password and add localhost plus the deployed domain as redirect URLs.
4. Create your owner account, set its email in `ADMIN_EMAILS`, then optionally insert its Auth UUID into `public.admin_users` for database-backed authorization.

## Deploy to Vercel

Push the project to a private GitHub repository, import it into Vercel, and add every required variable above under Project Settings → Environment Variables. Deploy, then test `/`, `/signup`, `/login`, and `/admin` with a configured Supabase project.

## Security notes

Uploads are limited to JPG, PNG and WEBP with server-side MIME/size checks and private storage. The service role and Gemini key are server-only. The bundled in-memory rate limiter is suitable for development only; replace it with a shared Redis/Upstash limiter before multi-instance production deployment. Anonymous session cleanup/retention must be scheduled by the deployment operator; it is not automatic.
