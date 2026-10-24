# OutThere

A personal map of outdoor spots (hikes, bivouacs, later surf and dive). Click a pin to see photos and notes.

Stack: Vite, React, TypeScript, MapLibre GL (Esri World Topo tiles), Supabase.

## Setup
1. Create a project at https://supabase.com.
2. SQL editor: paste and run `supabase/schema.sql`.
3. Authentication > Users > Add user (your email and a password). Then turn off "Allow new users to sign up" in Authentication settings.
4. Copy `.env.example` to `.env` and fill in the project URL and anon key (Project settings > API).
5. `npm install && npm run dev`

## Layout
- `src/lib/spots.ts` all database and storage calls
- `src/components/` map, side panel, new-spot form, login
- `supabase/schema.sql` tables, row-level security, private photo bucket
- `design/basemaps.html` the basemap comparison
