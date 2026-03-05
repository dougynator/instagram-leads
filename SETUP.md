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
- `INSTAGRAM_SESSION_COOKIE` - (Optional) single Instagram `sessionid` value
- `INSTAGRAM_COOKIE_HEADER` - (Recommended) full browser cookie header (`sessionid`, `csrftoken`, `ds_user_id`, ...)
- `INSTAGRAM_SESSION_COOKIES` - (Optional) multiple cookie candidates (newline separated) for automatic rotation
- `ALLOW_MOCK_DATA` - Optional fallback toggle (`false` by default; set `true` for demo data)

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

The scraper attempts to use Instagram's web API.

- With `ALLOW_MOCK_DATA=false` (recommended for production): the scan will fail/mark item errors when live Instagram data is unavailable, so fake leads are never mixed into real results.
- With `ALLOW_MOCK_DATA=true` (demo/testing): it can fall back to realistic mock data so the UI remains fully functional even if Instagram blocks requests.

To improve scraping success:
1. Set `INSTAGRAM_COOKIE_HEADER` (preferred) or `INSTAGRAM_SESSION_COOKIE` in your `.env.local`
2. To get the full cookie header: log into Instagram, open DevTools > Network, open any request to `instagram.com`, copy the `cookie` request header
3. Paste the full header value (not including the word `cookie:`)
4. If you only use `INSTAGRAM_SESSION_COOKIE`, paste just the `sessionid` value

When multiple cookies are configured, the scanner automatically validates and rotates them, using the first valid one for discovery/scraping.

**Important:** Never commit session cookies to version control.

## Features
- Upload CSV of Instagram usernames
- Configure filters (followers, engagement, keywords, contact info, etc.)
- Score leads 0-100 with configurable weights
- Export results to CSV
- Per-client filter presets
- Real-time scan progress with cancel support
