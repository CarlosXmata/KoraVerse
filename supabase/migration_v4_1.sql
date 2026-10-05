-- KORAVERSE 4.1 — Premium Polish & Social Expansion
-- Ejecutar UNA VEZ después de schema.sql + migration_v4.sql.
-- No elimina ni reinicia datos existentes.

alter table public.koraverse_profiles
  add column if not exists theme_id text not null default 'nebula',
  add column if not exists language text not null default 'es',
  add column if not exists settings jsonb not null default '{}'::jsonb;

-- Bucket público de dibujos. Los dibujos son imágenes pequeñas generadas por Sketch Pad.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'koraverse-sketches',
  'koraverse-sketches',
  true,
  2097152,
  array['image/webp','image/png','image/jpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- KORAVERSE aún funciona sin Supabase Auth. Por eso el navegador usa el rol anon.
-- El bucket solo admite imágenes y tiene un límite de 2 MB por archivo.
do $$ begin
  create policy "koraverse_sketches_read"
  on storage.objects for select to anon
  using (bucket_id = 'koraverse-sketches');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "koraverse_sketches_insert"
  on storage.objects for insert to anon
  with check (bucket_id = 'koraverse-sketches');
exception when duplicate_object then null; end $$;

-- Índice adicional para que el historial de actividad del perfil cargue rápido.
create index if not exists idx_koraverse_activity_player_category_time
  on public.koraverse_activity(player_key, category, created_at desc);
