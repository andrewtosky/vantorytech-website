# vantorytech.com

The Vantory Technologies website. It is a plain static site with no build step. Everything the website serves lives in `site/`: the HTML pages, `_headers`, `robots.txt`, `sitemap.xml` and `site/assets/`. Files outside `site/` (this README, `.gitignore`) are never published.

## How changes go live

Netlify publishes `main` automatically. Anything merged into `main` is live on vantorytech.com within a minute.

1. Make your change on a new branch, not on `main`.
2. Open a pull request. Netlify adds a Deploy Preview link to the pull request. Check it on desktop and phone.
3. When it looks right, merge the pull request. That publishes the live site.

Each merge into `main` is a production deploy and uses Netlify credits, so group changes into one pull request where you can. Previews don't use credits.

If something breaks after a merge, Netlify keeps every earlier version: in Netlify, open Deploys, pick the last good deploy and choose "Publish deploy". Then fix the problem in a new pull request.

## Things that will break the site if changed carelessly

- **The inline `<script>` at the bottom of each page.** `site/_headers` only allows it by its exact SHA-256 hash. Changing even one character in that script blocks it (the menu, videos and contact form stop working) unless the hash in `_headers` is updated to match. Put new code in a file under `site/assets/` instead.
- **`site/_headers`** holds the site's security rules (Content-Security-Policy and others). Any new outside script, font or service must be added there, or the browser will block it.
- **`site/assets/plausible-init.js`** and the Plausible script tag in each page's `<head>` run the visitor analytics. Don't add a second copy.
- **The contact forms** (`index.html`, `contact.html`, `plan.html` and the demo pages in `site/for/`) send to Vantory's own enquiries script in Google Apps Script, which emails each enquiry to Vantory and saves it in the enquiries sheet. No outside form service is used. The script's web app URL is in `assets/enquiry-plus.js` and in each demo page script; it is public by design. `assets/enquiry-plus.js` also checks the fields and shows the messages, and it stops the old inline form code from running. Keep the field IDs (`f-name`, `f-company`, `f-email`, `f-process`, `f-consent`) as they are. Only `enquiries@vantorytech.com` is shown on the site.

## Who can publish

Ryan and Andrew can both merge pull requests and publish the site. Whoever merges checks the Deploy Preview on desktop and phone first. GitHub notifies the other person when a pull request is opened or merged.

## Changes made with Claude

Ryan and Andrew may use Claude to prepare changes. Claude always works on a new branch and opens a pull request. It merges only when Ryan or Andrew asks it to in that conversation, after the Deploy Preview has been checked.

## Commit messages

This repository is public, so keep commit messages and pull request descriptions short and factual, for example "Update Solutions page wording".

Copyright Vantory Technologies. All rights reserved.
