# ruthgyeul.xyz — portfolio site

Personal portfolio for Jaeah Lee, built with **Next.js (App Router)** and
self-hosted as a long-lived Node server (`next start`) at **ruthgyeul.xyz**.

This lives inside the `Ruthgyeul/Ruthgyeul` GitHub profile repo, under `web/`.
The profile `README.md` and `mainheader.png` at the repo root are unrelated to
this site and are left untouched.

## Why this stack

- **Next.js server build** — run as a persistent Node process behind a reverse
  proxy, managed by systemd (`DefaultWeb.service`). Every page is statically
  prerendered at build time, so the server mostly serves cached HTML.
- **Availability** — systemd keeps the service up (`Restart=always`); putting
  Cloudflare in front adds edge caching + DDoS protection.
- **Scalability** — prerendered pages are cheap to serve; the process can be
  replicated behind the proxy, and a CDN absorbs read traffic.
- **Sustainability** — all content lives in one file (`src/lib/content.ts`), so
  updating the portfolio never requires touching layout code. The font is
  self-hosted (no Google Fonts CDN dependency at runtime), and security headers
  are set in `next.config.ts`.

## Local development

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (.next)
npm run start      # run the production server (next start) on $PORT (default 3000)
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
│   │   ├── not-found.tsx     # 404 page
│   │   ├── error.tsx         # client error boundary → 500 screen
│   │   ├── sitemap.ts        # /sitemap.xml
│   │   └── globals.css
│   ├── components/           # BootScreen, CommandPalette, TerminalBar, …
│   └── lib/
│       ├── content.ts        # ← EDIT THIS to change any site copy/data (KO/EN)
│       └── theme.ts          # color tokens
├── next.config.ts            # server config + security headers
└── public/                   # favicon.svg, robots.txt
```

### Updating content

Everything shown on the page — bio, skills, tools, awards, experience,
education, links — is defined in [`src/lib/content.ts`](src/lib/content.ts) as
bilingual (`{ ko, en }`) data. Add an award or a job by appending to the relevant
array; no component changes needed.

## Deploying (self-hosted)

The site runs on the server as a systemd service. The unit
(`/etc/systemd/system/DefaultWeb.service`) runs `npm run start` from the app
directory:

```ini
[Service]
Type=exec
User=ruthgyeul
WorkingDirectory=/home/ruthgyeul/Web/DefaultWeb/web
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3
```

> **Important:** `next start` needs a **server build**, not a static export.
> `npm run build` must run and produce `.next/` before `npm run start`.

### Update the deployed site

From the app directory on the server (`/home/ruthgyeul/Web/DefaultWeb/web`):

```bash
git pull
npm ci
npm run build
sudo systemctl restart DefaultWeb
```

Check it came up cleanly:

```bash
sudo systemctl status DefaultWeb
sudo journalctl -u DefaultWeb.service -n 50 --no-pager
```

The process listens on `PORT` (3000). Front it with your reverse proxy
(nginx / Cloudflare) terminating TLS for `ruthgyeul.xyz` and proxying to
`127.0.0.1:3000`. Only expose the proxy publicly — port 3000 does not need to be
opened in the firewall.

### CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) lints, typechecks and
builds `web/` on every push/PR that touches it, so `main` always builds. It does
not deploy — deployment happens on the server with the steps above.
