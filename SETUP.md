# IG Lead Scanner - Setup Guide

## Quick Start (Local Development)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)
- `INSTAGRAM_SESSION_COOKIE` - (Optional) Instagram session cookie for authenticated scraping

> **Note:** The app works without Supabase configured! It falls back to an in-memory store for local development/testing. Data won't persist across restarts in this mode.

### 3. Set up Supabase (optional for local dev)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the contents of `db/schema.sql`
4. Copy your project URL and keys to `.env.local`

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

## Instagram Scraping

The scraper attempts to use Instagram's web API. If Instagram blocks the request (rate limiting, requires login, etc.), it automatically falls back to realistic mock data so the UI remains fully functional.

To improve scraping success:
1. Set `INSTAGRAM_SESSION_COOKIE` in your `.env.local`
2. To get the cookie: log into Instagram in your browser, open DevTools > Application > Cookies > `sessionid`
3. Copy just the value (not the key)

**Important:** Never commit session cookies to version control.

## Features
- Upload CSV of Instagram usernames
- Configure filters (followers, engagement, keywords, contact info, etc.)
- Score leads 0-100 with configurable weights
- Export results to CSV
- Per-client filter presets
- Real-time scan progress with cancel support
