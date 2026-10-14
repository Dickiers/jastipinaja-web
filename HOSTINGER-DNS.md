# Connect jastipinajacn.com to Firebase Hosting

The website is deployed at https://jastipinaja-cn.web.app.
Firebase project: `jastipinaja-cn`.

## 1. Prepare the custom domain in Firebase

1. Open https://console.firebase.google.com/project/jastipinaja-cn/hosting.
2. Select **Add custom domain** and enter `jastipinajacn.com`.
3. Keep this domain serving the website itself, rather than redirecting it.
4. Choose **Advanced setup** for migration from the existing GitHub Pages site.
   This prepares domain ownership and HTTPS before switching website traffic.
5. Copy the exact DNS records Firebase asks you to add. These may include an
   ownership TXT record, an `_acme-challenge` TXT record, and CAA records if
   existing certificate restrictions require them.

## 2. Add the verification records at Hostinger

1. Sign in to Hostinger hPanel.
2. Open **Domains → Domain portfolio → Manage** next to `jastipinajacn.com`.
3. Open **DNS / Nameservers → DNS records**.
4. Add each verification record supplied by Firebase:
   - **Type:** the type Firebase specifies, normally TXT.
   - **Name:** `@` for the root domain, or the specified subdomain label such as
     `_acme-challenge`.
   - **Value:** copy exactly from Firebase.
   - **TTL:** use the default unless Firebase instructs otherwise.
5. Leave the existing website A records in place during this preparation step.
6. Return to Firebase and complete verification. Allow DNS propagation and HTTPS
   certificate preparation to finish before directing traffic to Firebase.

Keep the ownership TXT record after migration: Firebase uses it for ownership
and certificate renewal. Challenge values are supplied by Firebase and must not
be guessed or copied from another project.

## 3. Switch website traffic

After Firebase's Advanced setup tells you the domain is ready:

1. Return to Hostinger's DNS records page.
2. Replace the root (`@`) GitHub Pages A records below with the A/AAAA records
   specified by Firebase's **Direct to Hosting** step:

   | Existing GitHub Pages record | Old value |
   | --- | --- |
   | A, `@` | `185.199.108.153` |
   | A, `@` | `185.199.109.153` |
   | A, `@` | `185.199.110.153` |
   | A, `@` | `185.199.111.153` |

3. Use the exact destination addresses shown by Firebase. Its commonly
   documented IPv4 address is `199.36.158.100`, but the wizard is the authority
   for this domain's required records.
4. Remove conflicting root-domain A/AAAA or CNAME records that still point to
   GitHub or another website host. Keep any records explicitly requested by
   Firebase.
5. Keep Hostinger nameservers and unrelated records, including MX, email SPF,
   DKIM, DMARC, and other domain verification records. Do not reset the DNS zone.
6. Return to Firebase and wait until the domain status is **Connected**.

For `www.jastipinajacn.com`, add it separately in Firebase if you want it to work.
Set it to redirect to `jastipinajacn.com` and follow its own DNS instructions.

## 4. Confirm the move

Open https://jastipinajacn.com and check the home page, service pages, contact
form, and photo gallery. Firebase says DNS/certificate changes can take up to
24 hours; different visitors may briefly reach different hosts during propagation.

Tell Codex when the records are updated so it can independently check DNS,
HTTPS, and the website before disabling GitHub Pages or changing repo visibility.

## 5. Finish GitHub source control

Git push access is verified for `Dickiers/jastipinaja-web`. A local commit stores
the redesign, documentation images, and Firebase configuration.

Repository administration needs GitHub CLI authentication. GitHub CLI is
installed. In PowerShell, sign in with:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' auth login --hostname github.com --git-protocol https --web
```

Sign in as `Dickiers` through GitHub's browser flow; do not paste tokens or
passwords into the chat. After domain verification, Codex can disable GitHub
Pages, make the repository private, and push the saved source changes.

References:
- [Firebase custom domain migration](https://firebase.google.com/docs/hosting/custom-domain)
- [Hostinger DNS management](https://www.hostinger.com/support/1583249-how-to-manage-dns-records-at-hostinger/)
