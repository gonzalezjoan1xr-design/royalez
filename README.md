# Royal Markets

React + Vite + Supabase trading app. Every `.jsx` has a matching `.css`.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and add your Supabase URL + anon key
3. Run `supabase/schema.sql` in the Supabase SQL editor
4. `npm run dev`

## Deploy (Vercel)
Import the repo, add the same two env vars, deploy. `vercel.json` handles SPA routing.

## Notes
- Prices: Binance public API (no key). Spot is a simulated Volatility 10 tick feed.
- Deposit/withdraw are placeholders until you connect a payment provider.
