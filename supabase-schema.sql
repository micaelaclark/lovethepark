-- Run this in your Supabase SQL editor
-- Migration: run this to add multiple reflections support:
--   create table reflections (
--     id uuid primary key default gen_random_uuid(),
--     park_id uuid references parks(id) on delete cascade,
--     text text not null,
--     created_at timestamptz default now()
--   );
--   alter table reflections enable row level security;
--   create policy "Allow all" on reflections for all using (true);

create table parks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  neighborhood text,
  visited boolean default false,
  visited_at timestamptz,
  reflection text,
  created_at timestamptz default now()
);

-- Storage bucket for park photos
insert into storage.buckets (id, name, public) values ('park-photos', 'park-photos', true);

-- Allow all operations (personal app, no auth needed)
create policy "Public read" on storage.objects for select using (bucket_id = 'park-photos');
create policy "Public upload" on storage.objects for insert with check (bucket_id = 'park-photos');
create policy "Public delete" on storage.objects for delete using (bucket_id = 'park-photos');

alter table parks enable row level security;
create policy "Allow all" on parks for all using (true);

-- Seed Boston parks
insert into parks (name, neighborhood) values
  ('Boston Common', 'Downtown'),
  ('Public Garden', 'Downtown'),
  ('Christopher Columbus Waterfront Park', 'North End'),
  ('Paul Revere Mall (the Prado)', 'North End'),
  ('Copley Square', 'Back Bay'),
  ('Charles River Esplanade', 'Back Bay'),
  ('Fenway Victory Gardens', 'Fenway'),
  ('Back Bay Fens', 'Fenway'),
  ('Franklin Park', 'Roxbury/Jamaica Plain'),
  ('Arnold Arboretum', 'Jamaica Plain'),
  ('Jamaica Pond', 'Jamaica Plain'),
  ('Olmsted Park', 'Jamaica Plain'),
  ('Riverway Park', 'Mission Hill'),
  ('Castle Island', 'South Boston'),
  ('Carson Beach', 'South Boston'),
  ('Marine Park', 'South Boston'),
  ('Moakley Park', 'South Boston'),
  ('Pleasure Bay', 'South Boston'),
  ('LoPresti Park', 'East Boston'),
  ('Piers Park', 'East Boston'),
  ('Bremen Street Park', 'East Boston'),
  ('Constitution Beach', 'East Boston'),
  ('Belle Isle Marsh', 'East Boston'),
  ('Ronan Park', 'Dorchester'),
  ('Doherty Park', 'Dorchester'),
  ('Harambee Park', 'Dorchester'),
  ('Malibu Beach', 'Dorchester'),
  ('Tenean Beach', 'Dorchester'),
  ('Columbia Point', 'Dorchester'),
  ('Ryan Playground', 'Charlestown'),
  ('Doherty-Gibson Playground', 'Charlestown'),
  ('Charlestown City Square Park', 'Charlestown'),
  ('Titus Sparrow Park', 'South End'),
  ('Peters Park', 'South End'),
  ('Southwest Corridor Park', 'South End/Jamaica Plain'),
  ('Ramler Park', 'South End'),
  ('Puopolo Park', 'North End'),
  ('Langone Park', 'North End'),
  ('Millennium Park', 'West Roxbury'),
  ('Billings Field', 'West Roxbury'),
  ('Allandale Farm', 'West Roxbury'),
  ('George Wright Golf Course Area', 'Hyde Park'),
  ('Stony Brook Reservation', 'Hyde Park'),
  ('Harborview Park', 'Hyde Park'),
  ('Truman Parkway', 'Hyde Park'),
  ('Minton Hall Playground', 'Allston'),
  ('Ringer Park', 'Allston'),
  ('Smith Field', 'Brighton'),
  ('Chandler Pond', 'Brighton'),
  ('Christian Herter Park', 'Brighton');
