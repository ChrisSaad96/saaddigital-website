# Mivaro shared-reminder website setup

## Current status

- Hosting: static GitHub Pages from the repository root
- Canonical share format: `https://saaddigital.co.za/r/?c=<opaque-capability>`
- Legacy share format: `https://saaddigital.co.za/r/<opaque-capability>`
- Capability contract: base64url, 22–64 characters
- Apple Team ID: `2KUFTU8CCC`
- Apple application identifier: `2KUFTU8CCC.com.saaddigital.mivaro`
- AASA: ready at `/.well-known/apple-app-site-association`, scoped only to `/r/` and `/r/*`
- Android package: `com.saaddigital.mivaro`
- Google Play App Signing SHA-256: pending
- Live `/.well-known/assetlinks.json`: intentionally not published
- Mivaro App Store URL: live (`https://apps.apple.com/us/app/mivaro/id6802352751`)
- Mivaro Google Play URL: live (`https://play.google.com/store/apps/details?id=com.saaddigital.mivaro`)
- Shared-reminder resolver: none configured for this website

The root `.nojekyll` marker ensures GitHub Pages publishes the `.well-known` directory instead of excluding it as a dot-prefixed directory.

## Canonical and legacy GitHub Pages behavior

The canonical `/r/?c=<capability>` URL loads the real `/r/index.html` static page directly with HTTP 200. New Mivaro shares should use this format and do not depend on 404 recovery.

GitHub Pages cannot map the legacy `/r/<capability>` path to `/r/index.html` with a server-side wildcard. Without the app, GitHub Pages initially responds with its custom 404 document. The custom 404 script checks only legacy paths matching `/r/<base64url capability>` with a 22–64 character capability. A match is replaced client-side with `/r/?c=<capability>`. Unrelated and malformed paths remain on the normal Saad Digital 404 page.

The canonical query URL receives the generic Mivaro rich-preview metadata from an HTTP 200 page. For legacy path links, the initial unknown-path response remains HTTP 404, so link-preview crawlers that do not execute JavaScript may show the generic 404 preview instead. Reliable HTTP 200 wildcard fallback for legacy paths would require routing support beyond GitHub Pages.

## Store and post-install flow

The verified public store URLs are configured in `MIVARO_STORE_URLS` in `r/shared-reminder.js`. On iPhone/iPad only the App Store action is shown; on Android only Google Play is shown; desktop shows both actions.

There is no automatic deferred deep linking. The honest recovery flow is:

1. Open the canonical shared link and reach the HTTP 200 fallback page.
2. Install Mivaro from the App Store or Google Play action.
3. Return to the original browser tab.
4. Select **Open in Mivaro**.
5. The browser opens `mivaro://r/<opaque-capability>` so Mivaro can present its review flow.

The fallback does not resolve the capability or display reminder content. It does not send the capability to analytics, advertising, remote logs or other third parties.

## Android asset-links template — do not publish yet

After obtaining the production fingerprint from Google Play Console, replace the placeholder below and publish the resulting valid JSON at `/.well-known/assetlinks.json`:

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.saaddigital.mivaro",
      "sha256_cert_fingerprints": [
        "OWNER_ACTION_REQUIRED_PLAY_SIGNING_SHA256"
      ]
    }
  }
]
```

Use the Play App Signing certificate SHA-256 shown by Google Play Console, not an assumed local or upload certificate.

## Owner checklist

1. Review and deploy these static website changes.
2. Confirm the live AASA URL returns the raw JSON with HTTP 200, no redirect and an appropriate JSON content type.
3. Validate the live AASA through Apple's associated-domain tooling/CDN and test on a signed iOS build.
4. Obtain the Google Play App Signing SHA-256 from Play Console.
5. Replace the Android placeholder locally, publish the final `/.well-known/assetlinks.json`, and recheck App Link verification.
6. Test installed and not-installed flows on physical iOS and Android devices.
7. Decide whether the legacy-link initial-404/rich-preview limitation is acceptable or warrants hosting with wildcard rewrites.
