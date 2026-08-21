# My Progress

Mobile-first private progress tracker for GitHub Pages + Supabase.

## Before publishing
1. Put your Supabase Project URL and Publishable key in `config.js`.
2. In Supabase, add a UNIQUE constraint on `daily_checkins(user_id, date)` so one daily row can be updated rather than duplicated.
3. Push the files to the `main` branch.
4. Enable GitHub Pages: Settings → Pages → Deploy from a branch → `main` → `/ (root)`.

Never use the Supabase Secret key in `config.js`.
