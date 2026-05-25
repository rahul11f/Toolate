# Toolate - Premium Listing Platform (100% Free Tier Stack)

### 🚀 Live Demo: [https://toolate-rahul11fs-projects.vercel.app](https://toolate-rahul11fs-projects.vercel.app)

Toolate is a production-grade property listing directory for houses, flats, PGs, and commercial shops. It is built completely using **free tier API services that require no credit card information**.

## Technical Stack
- **Framework**: Next.js 14/15 (App Router, React 19)
- **Styling**: Tailwind CSS v4, Responsive, Curated Harmonies
- **Database**: Supabase PostgreSQL / Neon.tech
- **ORM**: Prisma ORM
- **Object Storage**: Supabase Storage (listings bucket)
- **Authentication**: NextAuth.js (Email/Password + Google OAuth)
- **Map & Geocoding**: Leaflet Map + OpenStreetMap tiles + Nominatim geocoding proxy
- **Anti-Bot & Rate Limits**: Google reCAPTCHA v3 + Upstash Redis
- **Notifications & Mailers**: React Hot Toast + Resend Email API
- **PWA**: Workbox-cached offline capabilities (`@ducanh2912/next-pwa`)

---

## Environment Configuration

Create a `.env` file in the root folder of the project. A template has been provided in `.env.example`:

```env
# 1. Supabase/Neon PostgreSQL Database connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?schema=public"

# 2. NextAuth secret configuration (generate using 'openssl rand -base64 32')
NEXTAUTH_SECRET="some-long-random-string-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# 3. Google OAuth keys (obtain from Google Cloud Console under APIs & Credentials)
GOOGLE_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# 4. Resend API Key (for OTP emails, free accounts receive 3000 emails/month)
RESEND_API_KEY="re_your_resend_api_key"

# 5. Upstash Redis (REST credentials from console, free tier gives 10k requests/day)
UPSTASH_REDIS_REST_URL="https://your-database-name.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_token"

# 6. reCAPTCHA v3 Keys (from Google admin console)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your_recaptcha_site_key"
RECAPTCHA_SECRET_KEY="your_recaptcha_secret_key"

# 7. Supabase client keys (for file uploads to Storage bucket)
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# 8. Google AdSense Publisher ID
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID="pub-1234567890123456"
```

---

## Setup Steps

### Step 1: Database Setup
1. Sign up for [Supabase](https://supabase.com) (100% free, no credit card required).
2. Create a new database project and copy the connection string into the `DATABASE_URL` key inside `.env`.
3. In the Supabase Sidebar, go to **Storage**, click **New Bucket**, name it `listings`, and toggle the **Public bucket** switch.
4. Set the **Service Role Key** and **Anon Key** in your `.env`.

### Step 2: Rate Limiting & OTP Setup (Upstash & Resend)
1. Create a free account at [Upstash](https://upstash.com) and create a Redis database. Copy the REST URL and Token to your `.env` variables.
2. Sign up at [Resend](https://resend.com), generate an API Key, and set `RESEND_API_KEY`.
   *(Note: Local testing is supported. If `RESEND_API_KEY` is omitted, OTP codes are logged directly to the command console).*

### Step 3: Run Database Migrations and Seed Admin
Initialize your PostgreSQL database tables using Prisma ORM and seed the default admin account:
```bash
# Push schema migrations to the database
npx prisma db push

# Seed the admin credentials
npx prisma db seed
```
**Admin Credentials:**
- **Email:** `admin@toolate.com`
- **Password:** `Admin@123`

---

## Local Development

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing PWA Features
1. Progressive Web App caching is disabled in development by default (configured in `next.config.ts`).
2. To test PWA offline caching and trigger the "Install App" prompt, run a production build locally:
   ```bash
   npm run build
   npm run start
   ```
3. Open Chrome DevTools, navigate to the **Application** tab, and select **Service Workers** or **Manifest** to audit install prompts.

---

## Deployment (Vercel)

Deploy to Vercel in seconds for free:
1. Initialize a Git repository, commit the files, and push to GitHub.
2. Link your repository in [Vercel](https://vercel.com).
3. Under Project Settings, insert all environment variables.
4. Set the **Build Command** to:
   ```bash
   npx prisma generate && next build
   ```
5. Click **Deploy**.
