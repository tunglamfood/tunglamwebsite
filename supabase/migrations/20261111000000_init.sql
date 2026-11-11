-- Tung Lam Food — initial schema
-- Multilingual text fields are jsonb objects: {"en": "...", "ms": "...", "zh": "..."}

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------------
create table public.brands (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  tagline          jsonb not null default '{}'::jsonb,
  description      jsonb not null default '{}'::jsonb,
  logo_path        text,
  meta_title       jsonb not null default '{}'::jsonb,
  meta_description jsonb not null default '{}'::jsonb,
  sort             int  not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories (2 levels: series -> product line)
-- ---------------------------------------------------------------------------
create table public.categories (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  parent_id        uuid references public.categories(id) on delete set null,
  name             jsonb not null,
  tagline          jsonb not null default '{}'::jsonb,
  intro            jsonb not null default '{}'::jsonb,
  faqs             jsonb not null default '[]'::jsonb,
  image_path       text,
  meta_title       jsonb not null default '{}'::jsonb,
  meta_description jsonb not null default '{}'::jsonb,
  legacy_ids       int[] not null default '{}',
  sort             int  not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index categories_parent_idx on public.categories(parent_id);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             jsonb not null,
  short            jsonb not null default '{}'::jsonb,
  description      jsonb not null default '{}'::jsonb,
  highlights       jsonb not null default '{}'::jsonb,   -- {"en": [..], "ms": [..], "zh": [..]}
  serving_ideas    jsonb not null default '{}'::jsonb,
  brand_id         uuid references public.brands(id) on delete set null,
  category_id      uuid references public.categories(id) on delete set null,
  net_weight       text,
  images           jsonb not null default '[]'::jsonb,   -- [{"path": "...", "width": 1000, "height": 1333, "alt": {...}}]
  is_featured      boolean not null default false,
  is_published     boolean not null default true,
  meta_title       jsonb not null default '{}'::jsonb,
  meta_description jsonb not null default '{}'::jsonb,
  legacy_id        int unique,
  legacy_slug      text,
  sort             int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_brand_idx on public.products(brand_id);

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            jsonb not null,
  excerpt          jsonb not null default '{}'::jsonb,
  intro            jsonb not null default '{}'::jsonb,
  image_path       text,
  image_width      int,
  image_height     int,
  prep_minutes     int,
  cook_minutes     int,
  servings         int,
  difficulty       text,
  cuisine          jsonb not null default '{}'::jsonb,
  course           jsonb not null default '{}'::jsonb,
  ingredients      jsonb not null default '[]'::jsonb,
  steps            jsonb not null default '[]'::jsonb,
  tips             jsonb not null default '{}'::jsonb,
  keywords         jsonb not null default '{}'::jsonb,
  product_slugs    text[] not null default '{}',
  is_published     boolean not null default true,
  published_at     date not null default current_date,
  meta_title       jsonb not null default '{}'::jsonb,
  meta_description jsonb not null default '{}'::jsonb,
  legacy_id        int unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FAQs
-- ---------------------------------------------------------------------------
create table public.faqs (
  id         uuid primary key default gen_random_uuid(),
  grp        text not null default 'products',
  question   jsonb not null,
  answer     jsonb not null,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Inquiries (contact / wholesale / product / career). Written server-side only.
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('general','wholesale','product','career')),
  name          text not null check (char_length(name) between 1 and 120),
  email         text check (email is null or char_length(email) <= 200),
  phone         text check (phone is null or char_length(phone) <= 40),
  company       text check (company is null or char_length(company) <= 160),
  message       text check (message is null or char_length(message) <= 4000),
  product_slug  text,
  locale        text,
  page_url      text,
  user_agent    text,
  status        text not null default 'new' check (status in ('new','in_progress','closed','spam')),
  created_at    timestamptz not null default now()
);
create index inquiries_created_idx on public.inquiries(created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger brands_updated     before update on public.brands     for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated   before update on public.products   for each row execute function public.set_updated_at();
create trigger recipes_updated    before update on public.recipes    for each row execute function public.set_updated_at();
create trigger faqs_updated       before update on public.faqs       for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public (anon) can read published catalog content. Nobody but the service
-- role can write. Inquiries have no anon policies at all (server action only).
-- ---------------------------------------------------------------------------
alter table public.brands     enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.recipes    enable row level security;
alter table public.faqs       enable row level security;
alter table public.inquiries  enable row level security;

create policy "public read brands"     on public.brands     for select to anon, authenticated using (true);
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "public read products"   on public.products   for select to anon, authenticated using (is_published);
create policy "public read recipes"    on public.recipes    for select to anon, authenticated using (is_published);
create policy "public read faqs"       on public.faqs       for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage: public "media" bucket for product / recipe / site imagery
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp','image/png','image/jpeg','image/avif','image/svg+xml'])
on conflict (id) do nothing;
