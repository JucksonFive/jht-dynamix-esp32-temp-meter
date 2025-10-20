## Homepage (Marketing / Landing Site)

Static marketing / landing site for the JHT Dynamix temperature meter platform. Built with:

- Vite + React + TypeScript
- Tailwind CSS
- Simple i18n (fi / en) via local TypeScript locale files
- Deployed to S3 + CloudFront via the central CDK app in `backend/cdk`

The CDK deployment expects a production build to exist at `homepage/dist` (relative to the CDK stack code it uses `../../homepage/dist`).

---

## Contents
1. Features & Structure
2. Local Development
3. Building for Production
4. Deployment (CDK, domains, certificates)
5. Environment Variables
6. i18n Implementation
7. Adding / Updating Content
8. Troubleshooting (Certificate / CloudFront / Caching)
9. Possible Improvements / Next Steps

---

## 1. Features & Structure

Key components (see `src/components`):

- `Hero.tsx` – top section & primary call‑to‑action
- `Features.tsx` – product feature highlights
- `MediaCarousel.tsx` – looping short video / media elements (sources in `public/media`)
- `Footer.tsx`

Routing is minimal: a root page in `src/pages/App.tsx` consumed by `src/main.tsx`.

### Directory snapshot
```
homepage/
	src/
		components/        # UI sections
		locales/           # i18n (en.ts, fi.ts)
		pages/             # App.tsx entry page
		index.css          # global styles (Tailwind layers)
	public/              # static assets copied as‑is
	tailwind.config.js
	tsconfig.json
	package.json
```

---

## 2. Local Development

Install dependencies (repository uses a pnpm workspace):

```bash
pnpm install
```

Start dev server (hot reload):
```bash
pnpm dev
```

The site will typically be at: http://localhost:5173 (Vite default – check terminal output).

Type checking (on demand):
```bash
pnpm typecheck
```

Lint (if configured globally):
```bash
pnpm lint
```

---

## 3. Building for Production

Create an optimized bundle:
```bash
pnpm build
```

Output goes to `dist/`. CDK will deploy the contents of this folder to the S3 bucket defined by `HomepageHostingStack`.

Quick local preview of the built output (optional):
```bash
pnpm preview
```

---

## 4. Deployment (CDK, Domains, Certificates)

Deployment is orchestrated from the root CDK app (`backend/cdk`). Two CloudFront distributions exist conceptually:

- Dashboard (application subdomain – e.g. `app.example.com`)
- Homepage (apex/root – e.g. `example.com`)

### Critical Certificate Requirement
CloudFront requires the ACM certificate (must be in `us-east-1`) to include **every** CNAME you assign to the distribution.

Current `CertStack` (if unchanged) only sets `domainName: siteDomain` (the subdomain) and does NOT automatically add the apex root. If you deploy `HomepageHostingStack` using the apex domain but the certificate lacks that SAN, you will get:

> The certificate that is attached to your distribution doesn't cover the alternate domain name (CNAME)...

### Fix / Best Practice
Issue a single certificate covering:

- Subdomain (dashboard) – e.g. `app.example.com`
- Apex root – `example.com`
- Optional wildcard – `*.example.com` (future flexibility; does *not* cover apex)

If you reverted earlier code, re‑add something like this to `backend/cdk/bin/backend.ts` when constructing `CertStack`:

```ts
const additionalDomains = [domainName, `*.${domainName}`];
new CertStack(app, "CertStack", {
	env: { account, region: "us-east-1" },
	domainName,        // hosted zone root, e.g. example.com
	siteDomain,        // subdomain, e.g. app.example.com
	additionalDomains, // include apex + wildcard
});
```

Then the homepage stack should pass `siteDomain: domainName` (already done) so the distribution’s `domainNames` align with a covered SAN.

### Deployment Steps (after certificate adjustment)
```bash
cd backend/cdk

# (Optional) Only synth to verify templates
cdk synth

# Deploy certificate first (wait until ISSUED)
cdk deploy CertStack

# Deploy hosting
cdk deploy HomepageHostingStack

# Or deploy multiple stacks together once the cert is validated
cdk deploy CertStack HomepageHostingStack DashboardHostingStack
```

### DNS Validation
`CertStack` uses DNS validation; it will auto‑create validation records if your hosted zone is in Route53. Wait until the certificate status is `ISSUED` before reattempting failed CloudFront stack deploys.

### Cache Invalidation on Content Update
The CDK `BucketDeployment` includes `distributionPaths: ["/*"]`, triggering a full invalidation on each deploy. For large scale, consider a more granular path list.

---

## 5. Environment Variables (Consumed by CDK)

Defined in `.env` at repository root (loaded by `dotenv` in `backend/cdk/bin/backend.ts`):

| Variable | Purpose |
|----------|---------|
| `DOMAIN_NAME` | Apex domain (example.com) |
| `SUBDOMAIN` | Dashboard subdomain (e.g. `app`) |
| `AWS_REGION` | Primary deployment region for stacks other than certificate |
| `SKIP_CERTIFICATE_CREATION` | Set to `true` to reuse an existing cert (must supply its ARN another way) |

If you want the homepage only (apex) you still need the certificate in `us-east-1` covering the apex domain.

---

## 6. i18n Implementation

Simple pattern – locale bundles in `src/locales/*.ts` exporting flat objects. An `I18nProvider` selects language (default: `fi` or `en`). To add a language:
1. Create `xx.ts` with translated keys.
2. Export in `index.ts`.
3. Extend selection logic in `I18nProvider.tsx` (e.g. browser language sniffing or UI toggle).

No runtime JSON loading required; builds are tree‑shaken.

---

## 7. Adding / Updating Content

- Media: place videos in `public/media/` (already referenced by carousel).
- Sections: create a new component in `src/components`, import into `pages/App.tsx`.
- Styles: prefer Tailwind utility classes; global overrides in `index.css`.
- SEO: Update root `index.html` (meta tags, Open Graph, etc.). Consider adding a sitemap and robots directives if expanding.

---

## 8. Troubleshooting

### Certificate / CNAME mismatch (CloudFront CREATE_FAILED)
Cause: Certificate in `us-east-1` does not include apex or subdomain you assigned. Fix by re‑issuing certificate with needed SANs and redeploy distribution.

### Stuck in ROLLBACK / Rate limiting
If a distribution failed due to cert mismatch, fix cert then re‑run `cdk deploy HomepageHostingStack`. No need to manually delete partial resources unless stack is stuck – then use the AWS Console or `cdk destroy HomepageHostingStack`.

### Content not updating
Full invalidation is already configured, but browser caching may still hold onto assets. Hard refresh or test in an incognito session. You can force a manual invalidation in the CloudFront console if necessary.

### 403 / 404 showing the SPA instead of errors
Intentional: Custom error responses map 403 & 404 -> `index.html` to support single-page app style navigation (even though this is a mostly static site).

### Build folder missing during deploy
Run `pnpm build` in `homepage/` before `cdk deploy`, or the `BucketDeployment` will fail because the asset path is empty.

### Need to disable homepage deployment temporarily
Set `SKIP_CERTIFICATE_CREATION=true` AND/OR remove the conditional block instantiating `HomepageHostingStack` in `backend/cdk/bin/backend.ts`.

---

## 9. Possible Improvements / Next Steps

- Add analytics (e.g. Plausible or a lightweight script) – ensure CSP headers updated.
- Accessibility audit (axe, Lighthouse) & add alt text where missing.
- Add dark mode toggle (extend Tailwind config).
- Implement a language selector UI component.
- Pre-render critical above‑the‑fold content or add `<link rel="preload">` hints for hero media.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` |
| Build | `pnpm build` |
| Preview build | `pnpm preview` |
| Deploy certificate | `cdk deploy CertStack` |
| Deploy homepage | `cdk deploy HomepageHostingStack` |

---

Feel free to request automated checks or an updated deployment script if the workflow evolves.

