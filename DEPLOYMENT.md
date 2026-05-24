# Production Connection & Deployment Guide — Toolate

This guide explains how to connect the Toolate codebase to your production backend services, integrate third-party APIs from your side, and deploy the application to hosting providers like Vercel.

---

## 🔑 1. What to Integrate from Your Side

To run the application in production, you need to sign up for the following free/paid services and collect their credentials to add to your environment settings:

### A. Database (PostgreSQL)
* **What it is**: Production database storage replacing the local SQLite (`dev.db`).
* **Recommended Host**: **Supabase** (Free tier PostgreSQL database).
* **Steps**:
  1. Create a project on [Supabase](https://supabase.com).
  2. Go to **Project Settings > Database > Connection string** and copy the URI (choose Transaction mode connection pool or Direct connection).
  3. Put it as `DATABASE_URL` in your production environment.

### B. Image Uploads Storage (Supabase Buckets)
* **What it is**: Storage for property/room images uploaded by users.
* **Steps**:
  1. In your Supabase project dashboard, navigate to **Storage > Create Bucket**. Name it exactly `listings` (or configure it in your storage client setup).
  2. Set the bucket privacy toggle to **Public** so uploaded files can be viewed.
  3. Obtain the API Keys from **Settings > API**:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (secret key used by backend upload route).

### C. Temporary OTP & Rate Limiter (Upstash Redis)
* **What it is**: In-memory data store for storing verification codes (OTPs) and enforcing API request rate limits.
* **Steps**:
  1. Go to [Upstash Console](https://upstash.com) and create a Redis database.
  2. Scroll down to the REST API section and copy:
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

### D. Email Delivery for OTP Verification (Resend)
* **What it is**: Email engine for dispatching login and registration OTP codes.
* **Steps**:
  1. Sign up on [Resend](https://resend.com) (free tier sends up to 3,000 emails/month).
  2. Go to **API Keys > Create API Key** and copy the token as `RESEND_API_KEY`.
  3. *(Optional)* Add and verify your custom domain in Resend to send emails from your own domain (e.g. `no-reply@yourdomain.com`).

### E. Security Firewall (Google reCAPTCHA v3)
* **What it is**: Shield against automated spam bots during signups.
* **Steps**:
  1. Register your site domain on [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin) choosing **reCAPTCHA v3**.
  2. Copy and set:
     - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
     - `RECAPTCHA_SECRET_KEY`

### F. Google OAuth Single-Sign-On (Optional)
* **What it is**: Allows users to log in with a single click using their Google accounts.
* **Steps**:
  1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
  2. Configure the OAuth Consent Screen and set authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`.
  3. Obtain `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## ⚡ 2. Connecting to Backend & Migrating

When preparing for deployment, switch from SQLite to PostgreSQL.

1. **Update schema.prisma Provider**:
   Change your database provider block in [schema.prisma](file:///C:/Users/Rahul/.gemini/antigravity-ide/scratch/toolate/prisma/schema.prisma) to look like:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Execute Database Sync**:
   To push the initial table schemas (User, Listing, Review, Feedback, Settings) to your production database:
   ```bash
   npx prisma db push
   ```
3. **Database Seed (Optional)**:
   Add default administrator settings to your database:
   ```bash
   npx prisma db seed
   ```

---

## 🚀 3. Deployment Process (Vercel)

Vercel is the recommended hosting platform for Next.js applications:

### Step 1: Push Code to GitHub
Push your local code repository to a private or public GitHub repository.

### Step 2: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New > Project** and import your repository.

### Step 3: Configure Environment Variables
Expand the **Environment Variables** section in the Vercel dashboard and copy all keys from your `.env` settings:
* `DATABASE_URL`
* `NEXTAUTH_SECRET` (generate a secure random 32-character string)
* `NEXTAUTH_URL` (set to `https://your-custom-app.vercel.app` or your domain)
* `UPSTASH_REDIS_REST_URL`
* `UPSTASH_REDIS_REST_TOKEN`
* `RESEND_API_KEY`
* `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
* `RECAPTCHA_SECRET_KEY`
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`

### Step 4: Build and Deploy
1. Click **Deploy**. Vercel will automatically build the Next.js production bundle, optimize static files, and launch your site.
2. In the Vercel dashboard, under **Settings > Functions**, choose your server region close to your target audience.
