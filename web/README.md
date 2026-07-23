# ruthgyeul.xyz — portfolio site

Personal portfolio for Jaeah Lee, built with **Next.js (App Router)** and shipped
as a **fully static export** hosted on **Cloudflare Pages**.

This lives inside the `Ruthgyeul/Ruthgyeul` GitHub profile repo, under `web/`.
The profile `README.md` and `mainheader.png` at the repo root are unrelated to
this site and are left untouched.

## Why this stack

- **Static export (`output: "export"`)** — the whole site is HTML/CSS/JS with no
  server. All interactivity (boot animation, live clock, typing effect, ⌘K
  command palette, KO/EN toggle, cursor spotlight) runs client-side.
- **Availability** — served from Cloudflare's global edge; there is no origin to
  go down.
- **Scalability** — static assets on a CDN absorb any amount of traffic.
- **Sustainability** — no runtime infrastructure to patch or pay for. All content
  lives in one file (`src/lib/content.ts`), so updating the portfolio never
  requires touching layout code. The font is self-hosted (no Google Fonts CDN
  dependency at runtime).

## Local development

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build + static export to ./out
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

## Project layout

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # <html>, metadata/SEO, self-hosted font
│   │   ├── page.tsx          # the dashboard (all client interactivity)
│   │   ├── not-found.tsx     # 404 (exported as 404.html)
│   │   ├── error.tsx         # client error boundary → 500 screen
│   │   ├── sitemap.ts        # /sitemap.xml
│   │   └── globals.css
│   ├── components/           # BootScreen, CommandPalette, TerminalBar, …
│   └── lib/
│       ├── content.ts        # ← EDIT THIS to change any site copy/data (KO/EN)
│       └── theme.ts          # color tokens
└── public/                   # favicon.svg, _headers, robots.txt
```

### Updating content

Everything shown on the page — bio, skills, tools, awards, experience,
education, links — is defined in [`src/lib/content.ts`](src/lib/content.ts) as
bilingual (`{ ko, en }`) data. Add an award or a job by appending to the relevant
array; no component changes needed.

## Deploying to Cloudflare Pages

### Option A — Git integration (recommended)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `Ruthgyeul/Ruthgyeul` repo.
3. Build settings:
   - **Root directory:** `web`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Environment variable:** `NODE_VERSION = 22`
4. In the Pages project → **Custom domains**, add `ruthgyeul.xyz` (and
   `www.ruthgyeul.xyz` if desired). If the domain's DNS is already on Cloudflare,
   the records are created automatically.

Every push to `main` then rebuilds and deploys; pull requests get preview URLs.

### Option B — GitHub Actions (in-repo CI)

A workflow is provided at
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). It builds `web/`
and deploys `out/` to Cloudflare Pages via Wrangler. It needs two repo secrets:

- `CLOUDFLARE_API_TOKEN` — a token with the *Cloudflare Pages: Edit* permission.
- `CLOUDFLARE_ACCOUNT_ID` — your account ID.

Create the Pages project once (named `ruthgyeul`) before the first run, either in
the dashboard or with `npx wrangler pages project create ruthgyeul`.
