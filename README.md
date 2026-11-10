# Saad Digital Website

This repository contains the static website for Saad Digital, an independent digital product studio designing, developing and publishing apps and games.

Live site: <https://saaddigital.co.za/>

## Main files

- `index.html` - homepage, Products (Apps and Games), studio and contact sections; the existing `#apps` anchor is retained
- `styles.css` - shared visual design system and responsive layout
- `script.js` - mobile navigation, footer year and reveal animations
- `privacy.html` - Saad Digital website privacy policy
- `terms.html` - Saad Digital website terms of use
- `mivaro-privacy.html` and `mivaro-terms.html` - Mivaro-specific legal pages
- `mivaro/delete-account/index.html` - public Mivaro account-deletion instructions
- `r/index.html` and `r/shared-reminder.js` - privacy-first Mivaro shared-reminder fallback
- `.well-known/apple-app-site-association` - iOS Universal Link domain association
- `MIVARO_SHARED_REMINDER_WEB_SETUP.md` - shared-link deployment and owner handoff
- `splitmate-privacy.html` and `splitmate-terms.html` - SplitMate AI-specific legal pages
- `sortbound-privacy.html` and `sortbound-terms.html` - pre-release Sortbound-specific legal pages
- `support.html` - shared support hub for Mivaro, SplitMate AI and Sortbound
- `assets/` - original Mivaro and SplitMate icons, copied without recolouring
- `scripts/preview.mjs` - dependency-free local preview server (Node.js 22+)
- `scripts/check.mjs` and `scripts/check-browser.mjs` - static and browser validation
- `SORTBOUND_WEBSITE_REVIEW.md` - implementation evidence and publisher/release review items
- `404.html` - GitHub Pages fallback page
- `robots.txt` and `sitemap.xml` - search engine indexing files
- `app-ads.txt` - app advertising verification file
- `favicon.svg` - site icon
- `CNAME` - custom domain for GitHub Pages

## GitHub Pages deployment

The site is designed to deploy directly from the repository root on the `main` branch. It does not need a backend, database, framework, build command, package install or environment file.

The root `.nojekyll` file is intentional. It ensures GitHub Pages publishes the `.well-known` association directory unchanged.

In GitHub:

1. Open the repository settings.
2. Go to **Pages**.
3. Set the source to deploy from the `main` branch root.
4. Confirm the custom domain is `saaddigital.co.za`.
5. Wait for GitHub Pages to publish the site.

## Updating content

Edit the HTML files directly for copy changes, update `styles.css` for design changes and update `script.js` only for lightweight browser interactions. Keep internal links rooted at `/` so they work correctly on the custom domain.

## app-ads.txt publisher ID

The current `app-ads.txt` file contains an AdMob publisher line. If it is ever replaced with the placeholder below, replace `pub-REPLACE_WITH_REAL_PUBLISHER_ID` with the real Google AdMob publisher ID before verification:

```txt
google.com, pub-REPLACE_WITH_REAL_PUBLISHER_ID, DIRECT, f08c47fec0942fa0
```

The public verification path is:

<https://saaddigital.co.za/app-ads.txt>

## Security note

Do not commit secret keys, private API keys, `.env` files, service-account files or unpublished credentials to this repository. Public verification IDs such as an app advertising publisher line are not secret keys, but they should still be reviewed before publishing.

## Local preview

Run from the repository root with Node.js 22 or later:

```bash
node scripts/preview.mjs
```

Then open:

```txt
http://127.0.0.1:8080/
```

Use `node scripts/preview.mjs 8081` if port 8080 is occupied. Press Ctrl+C to stop. This server reproduces the site's custom 404 response for legacy shared-link checks and binds only to the local computer. It is a local tool and does not change GitHub Pages hosting.

## Validation

There is no production build step: the tracked HTML, CSS and assets are the production files. No framework or dependency installation is required.

```powershell
node scripts/check.mjs
node --check script.js
node --check r/shared-reminder.js
node --check scripts/preview.mjs
node --check scripts/check.mjs
node --check scripts/check-browser.mjs
node scripts/check-browser.mjs
git diff --check
```

The browser check uses an installed Chrome or Edge in a new temporary test profile. Set `CHROME_PATH` if it is installed elsewhere. It starts and stops its own local preview server, checks all 13 HTML pages at 1920, 1440, 1024, 768, 390 and 320 pixels, validates the mobile menu and Mivaro sharing behaviour, and writes review screenshots to the temporary directory it prints. It does not use or clear personal browser storage. Store links must also be checked against their public listings when content changes.
