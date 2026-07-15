# Saad Digital Website

This repository contains the static website for Saad Digital, an independent app studio creating useful mobile apps for everyday life.

Live site: <https://saaddigital.co.za/>

## Main files

- `index.html` - homepage, apps, about and contact sections
- `styles.css` - shared visual design system and responsive layout
- `script.js` - mobile navigation, footer year and reveal animations
- `privacy.html` - general website privacy policy
- `terms.html` - general website and app-studio terms
- `support.html` - support guidance and troubleshooting
- `404.html` - GitHub Pages fallback page
- `robots.txt` and `sitemap.xml` - search engine indexing files
- `app-ads.txt` - app advertising verification file
- `favicon.svg` - site icon
- `CNAME` - custom domain for GitHub Pages

## GitHub Pages deployment

The site is designed to deploy directly from the repository root on the `main` branch. It does not need a backend, database, framework, build command, package install or environment file.

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

You can preview the site with any static server from the repository root, for example:

```bash
python -m http.server 8080
```

Then open:

```txt
http://localhost:8080/
```

VS Code Live Server or another simple static file server will also work.
