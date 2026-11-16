-- Guides move from code into the database (editable in /admin), and the
-- auto-content pipeline: a topic queue + per-post state, and a settings row.

-- ---------------------------------------------------------------------------
-- Guides (/guides/[slug]) — trilingual articles
-- ---------------------------------------------------------------------------
create table public.guides (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            jsonb not null,                       -- L10n
  meta_title       jsonb not null default '{}'::jsonb,   -- L10n
  meta_description jsonb not null default '{}'::jsonb,   -- L10n
  lead             jsonb not null default '{}'::jsonb,   -- L10n
  image_alt        jsonb not null default '{}'::jsonb,   -- L10n
  summary          jsonb not null default '{}'::jsonb,   -- L10n<string[]>, the "In short" box
  body             jsonb not null default '{}'::jsonb,   -- L10n, Markdown subset (see src/components/guide/guide-body.tsx)
  faqs             jsonb not null default '[]'::jsonb,   -- [{ q: L10n, a: L10n }]
  image_path       text,
  image_width      int,
  image_height     int,
  product_slugs    text[] not null default '{}',
  category_slugs   text[] not null default '{}',         -- category pages (and their products) link back here
  recipe_slugs     text[] not null default '{}',
  related_slugs    text[] not null default '{}',
  about            text[] not null default '{}',         -- schema.org Article.about
  source           text not null default 'manual' check (source in ('manual', 'auto')),
  is_published     boolean not null default true,
  published_at     date not null default current_date,
  sort             int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger guides_updated before update on public.guides for each row execute function public.set_updated_at();

alter table public.guides enable row level security;
create policy "public read guides" on public.guides for select to anon, authenticated using (is_published);

-- Recipes written by the pipeline are marked so the admin can tell them apart.
alter table public.recipes add column source text not null default 'manual' check (source in ('manual', 'auto'));

-- ---------------------------------------------------------------------------
-- Auto content: one row per planned / written / published post
-- ---------------------------------------------------------------------------
create table public.auto_posts (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('recipe', 'guide')),
  keyword      text not null,                 -- normalised English primary keyword; one post per keyword
  topic        jsonb not null,                -- { title, angle, keywords: L10n, product_slugs[] }
  status       text not null default 'planned'
               check (status in ('planned', 'writing', 'imaging', 'publishing', 'published', 'rejected', 'failed')),
  content      jsonb,                         -- the generated recipe/guide row, held until its image is ready
  review       jsonb,                         -- reviewer verdict + issues
  kie_task_id  text,
  slug         text,
  attempts     int not null default 0,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz,
  constraint auto_posts_keyword_unique unique (keyword)
);
create index auto_posts_queue on public.auto_posts (kind, status, created_at);
create trigger auto_posts_updated before update on public.auto_posts for each row execute function public.set_updated_at();

-- Service role only: no policies on purpose.
alter table public.auto_posts enable row level security;

create table public.auto_settings (
  id         int primary key default 1 check (id = 1),
  enabled    boolean not null default true,
  -- what each daily cron slot writes (slot 0, 1, 2 …)
  slots      text[] not null default '{recipe,recipe,guide}',
  updated_at timestamptz not null default now()
);
insert into public.auto_settings (id) values (1) on conflict (id) do nothing;
create trigger auto_settings_updated before update on public.auto_settings for each row execute function public.set_updated_at();
alter table public.auto_settings enable row level security;

-- Atomically take the oldest planned topic of a kind, so two runs never write the same post.
create or replace function public.claim_auto_post(p_kind text)
returns setof public.auto_posts
language sql
as $$
  update public.auto_posts
     set status = 'writing', attempts = attempts + 1, error = null
   where id = (
     select id from public.auto_posts
      where kind = p_kind and status = 'planned'
      order by created_at
      limit 1
      for update skip locked
   )
  returning *;
$$;
revoke execute on function public.claim_auto_post(text) from public, anon, authenticated;
