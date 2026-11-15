# Prospect demo pages

Builds a personalised 3D demo page for one outreach prospect: a packing line with their product type, their company name, checks matched to their likely problems, a savings range they can adjust, and a pre-filled form that asks for a trial plan.

This folder is outside `site/`, so nothing here is published. The output is a single HTML file to review first.

## Build a page

```
python3 build.py companies/floridia-cheese.json out/floridia-cheese.html
```

1. Copy `companies/floridia-cheese.json` to `companies/<slug>.json` (slug: lower case, hyphens, e.g. `bega-dairy`).
2. Change the fields below for the new company.
3. Run the build and open the HTML file in a browser to check it.

Packaging supported today: **tubs** (ricotta, dips, yoghurt, cream cheese, spreads). Bottles use the bottling line page instead. Jars, bags and trays need a new variant first.

## Fields

| Field | What it is | Example |
|---|---|---|
| slug | File and future URL name | floridia-cheese |
| pageTitle | Browser tab name, 2 to 4 words | Floridia Ricotta Line |
| company, short | Full and short company name | Floridia Cheese, Floridia |
| site | Suburb and state of the plant | Thomastown, VIC |
| productName | Product shown on the line screen | Fresh ricotta 375 g |
| productShort | Product word used in the headline | ricotta |
| formProduct | Pre-filled product in the form | Ricotta tubs, 375 g |
| labelTop, labelMain, labelSize | Words on the generic tub label (capitals, no apostrophes) | FRESH, RICOTTA, 375 g |
| wrongTop, wrongMain | Label of a different product of theirs, for the wrong-label example | FRESH, MASCARPONE |
| code, codeWrong | Expected printed code, and the same code with one wrong digit | USE BY 03 DEC 26 L319 |
| lid, label, labelInk, wrongLabel | Colours for the generic lid and labels (hex). Close to their category, never their actual artwork | #2E7D5B |
| preparedOn, preparedBy, contact | Date, sender and sender email | 15 November 2026 |
| heroLede, lidLede, labelLede, codeLede, objectLede | One or two sentences each, specific to their products | see Floridia file |
| visitLine | First trial step | Call and visit to Thomastown |
| est | Our guesses for the savings range: tubs a day, production days, QC hours a week, hourly rate, recall cost, recalls in 5 years, retailer penalties a year, cost per faulty tub | see Floridia file |

## Rules for every page

- Their name, product type and location only. No logos, label artwork or photos of theirs.
- Facts must come from their own website or public sources. Everything else is labelled as our guess.
- Never mention ADTTech, China, Suzhou or partner companies. No em dashes. Amounts in AUD.
- Keep `<meta name="robots" content="noindex, nofollow">` so prospect pages stay out of search results.

## Going live on vantorytech.com (not done yet)

The site's security rules block outside scripts and inline scripts, so a page needs three changes before it can go under `site/for/<slug>/`: the three.js file copied into `site/assets/`, the page script moved into a file under `site/assets/`, and the form wired to the enquiry pipeline with `page: for/<slug>`. Until then, review and share pages as previews.
