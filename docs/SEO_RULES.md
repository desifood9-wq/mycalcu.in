# SEO Rules — mycalcu.in

## Canonical Tag (Required on Every Page)

```html
<link rel="canonical" href="https://mycalcu.in/calculators/{slug}">
```

The slug must exactly match the folder name under /calculators/.
Never use trailing slashes in canonical URLs.

## Title Tag Rules

- Must be unique per page
- Format: `{Calculator Name} - Free Online Calculator | mycalcu.in`
- Max 60 characters recommended
- Must contain the primary keyword naturally

## Meta Description Rules

- Must be unique per page
- 140–160 characters
- Must describe what the calculator does and what result the user gets
- Include one natural keyword mention

## Open Graph Tags (Required)

```html
<meta property="og:title" content="{Calculator Name} | mycalcu.in">
<meta property="og:description" content="{calculator description}">
<meta property="og:url" content="https://mycalcu.in/calculators/{slug}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="mycalcu.in">
```

## Structured Data (Required — JSON-LD)

Use WebApplication schema for all calculator pages:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "{Calculator Name}",
  "url": "https://mycalcu.in/calculators/{slug}",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "All",
  "description": "{calculator description}",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  }
}
```

Additionally, wrap the FAQ section with FAQPage schema:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer}"
      }
    }
  ]
}
```

## Heading Hierarchy Rules

- Exactly ONE `<h1>` per page (calculator name)
- Section titles use `<h2>`
- Sub-sections use `<h3>`
- Never skip heading levels

## Internal Linking Rules

- Each calculator page must link to at least 3 related calculators
- Use descriptive anchor text (never "click here")
- Related calculators section must use `<nav aria-label="Related calculators">`

## Content Requirements

- 500–800 words of explanatory content per page
- Must include: formula, example, explanation
- No thin pages (calculator UI alone is not sufficient)
- All example numbers must be factually accurate

## AI Search Readiness

For AI search engines (Google AI Overviews, ChatGPT search, Perplexity):

- State the formula explicitly and clearly
- Show a step-by-step worked example
- Use clear section labels (`<h2>` headings)
- Avoid hiding content in tabs or JavaScript-only reveals
- All content must be in static HTML (not loaded after JS execution)

## Sitemap Rules

- All calculator pages must appear in /sitemap.xml
- Format: standard XML sitemap
- `<changefreq>monthly</changefreq>`
- `<priority>0.8</priority>` for calculator pages
- `<priority>1.0</priority>` for homepage
- Regenerate sitemap every time a new calculator is added (build.py handles this)

## Robots

```
User-agent: *
Allow: /
Sitemap: https://mycalcu.in/sitemap.xml
```

## URL Rules (NEVER CHANGE)

- Lowercase only
- Hyphens as separators (no underscores)
- No category segments in URL
- No trailing slashes
- Pattern: /calculators/{slug}
