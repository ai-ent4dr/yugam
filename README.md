# YUGMA AI — "Where two journeys meet"

Yugma AI is a full-stack relationship compatibility and traditional reading platform for two people. It pairs a deterministic software compatibility and numerology calculation engine with server-side Google Gemini AI multimodal analysis (for traditional Jataka/Kundli chart documents and palmistry-style observations), backed by Supabase PostgreSQL, Auth, and private Storage.

---

## 1. Technology Architecture

- **Framework**: Next.js (App Router, Server Components & Route Handlers)
- **AI Engine**: Google official Gemini JavaScript SDK (`@google/genai`) running strictly server-side
- **Database**: Supabase PostgreSQL with comprehensive Row Level Security (RLS)
- **Authentication**: Supabase Auth (email & password, session cookies)
- **Storage**: Supabase Storage private bucket (`user-uploads`) with temporary signed URLs for authorized inspection
- **Calculations**: Software-first deterministic compatibility and Pythagorean numerology arithmetic
- **Safety & Ethics**: Strictly zero beauty scoring, zero facial profiling, zero health diagnoses, and clear cultural reflection disclaimers

---

## 2. Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node 22)
- npm 9+

### Steps
1. Navigate to the project directory:
   ```powershell
   cd c:\Users\adarsh\Downloads\milanmatch-ai-mvp\milanmatch-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file:
   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Populate `.env.local` with your credentials:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   GEMINI_MODEL=gemini-2.5-flash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FREE_ANALYSIS_LIMIT=20
   ADMIN_EMAILS=admin@example.com
   STORAGE_BUCKET=user-uploads
   MAX_UPLOAD_BYTES=5000000
   APP_URL=http://localhost:3000
   ```

5. Launch local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 3. Google Gemini AI Setup

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and generate a new key.
3. Add it to `.env.local` as `GEMINI_API_KEY`.
4. Set `GEMINI_MODEL=gemini-2.5-flash` (recommended for low latency, multimodal PDF/image capabilities, and free-tier allowance).
5. **Security Notice**: Never commit `.env.local` or prefix this key with `NEXT_PUBLIC_`. The key is accessed solely on the server inside `lib/ai/gemini.ts`.
6. **Quota Resilience**: If the free-tier quota is reached, the application automatically falls back to rich deterministic calculations and graceful interpretive messaging without crashing.

---

## 4. Supabase Setup Guide

1. **Create Project**: Go to [Supabase](https://supabase.com) and create a new project.
2. **Execute Database Schema**:
   - In your Supabase dashboard, open the **SQL Editor**.
   - Copy the contents of `supabase/schema.sql` and run the script.
   - This creates all necessary tables (`profiles`, `analyses`, `analysis_people`, `uploads`, `compatibility_results`, `jataka_readings`, `numerology_readings`, `palm_readings`, `future_readings`, `consents`, `usage_limits`, `admin_users`, `audit_logs`), sets up foreign keys, indexes, and activates Row Level Security (RLS) policies.
3. **Create Private Storage Bucket**:
   - Go to **Storage** in your Supabase dashboard.
   - Click **New Bucket**.
   - Name: `user-uploads`.
   - **Crucial**: Ensure the bucket is set to **Private** (do NOT toggle Public).
   - Storage access policies included in `supabase/schema.sql` will protect the bucket.
4. **Configure Authentication**:
   - Under **Authentication** → **Providers**, ensure **Email** is enabled.
   - Under **URL Configuration**, add `http://localhost:3000` and your production Vercel domain to **Redirect URLs**.
5. **Initial Administrator Setup**:
   - Register an account via `/signup` with your desired admin email (e.g., `admin@example.com`).
   - Add this email to `ADMIN_EMAILS` in `.env.local` and your Vercel Environment Variables.
   - (Optional database backing): In the Supabase SQL editor, insert the user's UUID into `public.admin_users`:
     ```sql
     insert into public.admin_users (user_id) values ('your-auth-user-uuid');
     ```
   - Test access by visiting `/admin`.

---

## 5. Vercel Production Deployment

1. Push this repository to a private GitHub repository:
   ```bash
   git add .
   git commit -m "Complete YUGMA AI full-stack release"
   git push origin main
   ```
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Project Settings** → **Environment Variables**, add:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-2.5-flash`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FREE_ANALYSIS_LIMIT` (`20`)
   - `ADMIN_EMAILS` (`your-admin@example.com`)
   - `STORAGE_BUCKET` (`user-uploads`)
   - `MAX_UPLOAD_BYTES` (`5000000`)
   - `APP_URL` (`https://your-domain.vercel.app`)
4. Click **Deploy**.
5. Verify live routes:
   - Landing page: `/`
   - Standalone Jataka Reader: `/jataka-reader`
   - Authentication: `/signup` & `/login`
   - User Account & Reading History: `/account` & `/history`
   - User Data Controls: `/data-controls`
   - Authorized Admin Dashboard: `/admin`

---

## 6. Security & Privacy Architecture

- **Private Storage**: All uploads (profile photos, hand images, Jataka documents) reside in a private bucket. File inspection happens exclusively via short-lived (15-minute) signed URLs created on the server.
- **Server-Side API Key Secrecy**: Neither `GEMINI_API_KEY` nor `SUPABASE_SERVICE_ROLE_KEY` is ever bundled or transmitted to the client.
- **Strict Data Sovereignty**: Users can export full machine-readable JSON archives or permanently purge media files and analyses via `/data-controls`.
- **Admin Audit Trail**: Admin views of user profiles, analyses, and uploads are logged in `public.audit_logs`.
