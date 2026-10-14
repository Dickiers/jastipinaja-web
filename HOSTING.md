# Hosting and source control

GitHub stores the source repository. Firebase Hosting serves the public website.
The Firebase project is `jastipinaja-cn` (display name: Jastipinaja).
The deployed address is https://jastipinaja-cn.web.app.
See [HOSTINGER-DNS.md](HOSTINGER-DNS.md) for the custom-domain migration steps.

## Build and test locally

```powershell
node tools/build-hosting.cjs
firebase emulators:start --only hosting --project jastipinaja-cn
```

The deployment folder is `hosting-public/`. The build copies only the seven HTML
pages, their styles and scripts, and the five website image folders. Repository
metadata, local verification tools, configuration, and unused uploads are excluded.
Generated files and Firebase caches are ignored by Git.

## Deploy

After selecting the Firebase project:

```powershell
firebase deploy --only hosting --project jastipinaja-cn
```

Firebase runs the build automatically before deploying. `cleanUrls` preserves
extensionless links such as `/checkout` and `/testimoni`. This is a multipage
website, so missing URLs must return 404 rather than being rewritten to the home page.

HTML, CSS, and JavaScript revalidate with the server. Images are cached in browsers
for one day. Firebase Hosting manages HTTPS and CDN delivery.

## Migration order

1. Deploy and test the Firebase-provided address.
2. Add `jastipinajacn.com` in Firebase Hosting and apply its DNS instructions at
   the domain provider. Preserve unrelated email and verification records.
3. Verify HTTPS and all public pages on the custom domain.
4. Disable GitHub Pages and make the GitHub repository private.

`CNAME` belongs to the old GitHub Pages setup and is not included in Firebase
deployments. Keep it until the custom domain migration is complete.

Firebase Spark Hosting currently includes 10 GB storage and 10 GB monthly data
transfer. Monitor Hosting usage, particularly for the photo gallery. Backend
services such as Cloud Run require separate billing setup.

References: [Firebase Hosting configuration](https://firebase.google.com/docs/hosting/full-config),
[Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing).
