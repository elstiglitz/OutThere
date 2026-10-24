-- OutThere schema. Paste into the Supabase SQL editor and run once.

create table spots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null,
  type        text not null default 'hike',        -- hike | bivouac, later surf | dive
  status      text not null default 'visited',     -- visited | wishlist (UI comes in v1.1)
  lat         double precision not null,
  lng         double precision not null,
  description text not null default '',
  details     jsonb not null default '{}'::jsonb,  -- type-specific fields (distance, wind exposure, swell...)
  created_at  timestamptz not null default now()
);

create table photos (
  id         uuid primary key default gen_random_uuid(),
  spot_id    uuid not null references spots on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  path       text not null,                        -- path inside the 'photos' storage bucket
  caption    text not null default '',
  taken_at   timestamptz,
  created_at timestamptz not null default now()
);

create index on spots (user_id);
create index on photos (spot_id);

-- Row-level security: every row belongs to one user and only they can touch it.
alter table spots  enable row level security;
alter table photos enable row level security;

create policy "own spots"  on spots  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own photos" on photos for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private photo bucket. Files live under <user_id>/<spot_id>/<file>.
insert into storage.buckets (id, name, public) values ('photos', 'photos', false);

create policy "own photo files" on storage.objects for all
  using      (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
