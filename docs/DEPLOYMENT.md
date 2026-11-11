# Deploying the site

This covers getting tunglamfood.my live on Vercel and moving away from the old tunglamfood.com site.

## 1. Vercel project

The repository already contains `vercel.json`, which sets `"regions": ["sin1"]`. That puts the serverless functions in Singapore, in the same region as the Supabase database (`ap-southeast-1`).

1. Import the GitHub repository `tunglamfood/tunglamwebsite` in Vercel. The framework (Next.js) is detected automatically.
2. Go to **Settings → Environment Variables** and add the following for the Production and Preview environments:

| Key | Notes |
| --- | --- |
| `SUPABASE_URL` | `https://jaahhhsqibexywsnpnla.supabase.co` |
| `SUPABASE_ANON_KEY` | Public, read-only key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret, used on the server only |
| `NEXT_PUBLIC_SITE_URL` | `https://tunglamfood.my` |
| `REVALIDATE_SECRET` | A long random string |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional |

3. Check that **Settings → Functions → Region** shows Singapore (`sin1`).
4. In **Analytics** and **Speed Insights**, click Enable. The tracking code is already in the site.

Preview deployments automatically serve a `robots.txt` that blocks indexing. Only the production deployment is indexable.

## 2. Domain: tunglamfood.my (DNS at Exabytes)

1. In Vercel, open **Settings → Domains** and add `tunglamfood.my` and `www.tunglamfood.my`. Set `www` to redirect to the apex domain.
2. In the Exabytes client area, open **Domains → tunglamfood.my → Manage DNS** and add these two records:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

   Remove any existing A or AAAA records for `@`. Vercel shows the exact values to use on the Domains screen, so confirm against that.
3. Wait for DNS to propagate. This usually takes minutes but can take up to 24 hours. Vercel issues the SSL certificate automatically.

## 3. Moving off the old domain (tunglamfood.com)

Running two live sites with the same content splits ranking signals between them. Once tunglamfood.my is live and checked:

- **Best option:** point tunglamfood.com at Vercel as well, by adding it as a domain on the same project. Then all old NEWPAGES URLs 301-redirect to their new pages. Those redirects are already built: `src/data/legacy-redirects.json` covers 44 products, 27 categories, 12 recipes and the static pages.
- **Before the NEWPAGES contract ends,** ask NEWPAGES to add 301 redirects from tunglamfood.com to tunglamfood.my.
- **Email:** `sales@tunglamfood.com` still depends on the .com domain's MX records. If you move the .com DNS, keep those MX records.

## 4. After launch

- **Google Search Console:** add tunglamfood.my as a Domain property and submit `https://tunglamfood.my/sitemap.xml`. If the .com moves too, use the **Change of Address** tool.
- **Bing Webmaster Tools:** import the site from Search Console.
- **Google Business Profile:** set the website link to `https://tunglamfood.my`.
- **Content edits:** after editing content in Supabase, call `POST /api/revalidate` with the secret. You can also set this up as a Supabase Database Webhook so it happens automatically.
