# PSEO Plan — mycalcu.in

## Strategy Overview

Programmatic SEO (PSEO) means generating many pages from a single template
and a data config file. Each page targets a specific search query variant.

## Calculator Families

A calculator family is a group of related calculators that share logic
but target different search intents or user segments.

### Family: Salary Calculators

| Slug | Target Query |
|------|-------------|
| salary-in-hand-calculator | salary in hand calculator |
| salary-in-hand-calculator-india | salary in hand calculator india |
| salary-in-hand-calculator-10-lpa | 10 lpa in hand salary |
| salary-in-hand-calculator-15-lpa | 15 lpa in hand salary |
| salary-in-hand-calculator-new-tax-regime | salary calculator new tax regime 2024 |
| salary-in-hand-calculator-old-tax-regime | salary calculator old tax regime |

### Family: Loan / EMI Calculators

| Slug | Target Query |
|------|-------------|
| loan-emi-calculator | loan emi calculator |
| home-loan-emi-calculator | home loan emi calculator |
| personal-loan-emi-calculator | personal loan emi calculator |
| car-loan-emi-calculator | car loan emi calculator |
| education-loan-emi-calculator | education loan emi calculator |

### Family: Fuel / Vehicle Cost Calculators

| Slug | Target Query |
|------|-------------|
| fuel-cost-per-km-calculator | fuel cost per km calculator |
| petrol-cost-calculator | petrol cost calculator india |
| diesel-cost-calculator | diesel cost calculator |
| ev-running-cost-calculator | ev running cost calculator india |

## Data-Driven Generation

Each calculator is defined in `/data/calculators.json`.
The build script reads this file and generates one HTML page per entry.

Required fields per calculator entry:

```json
{
  "slug": "loan-emi-calculator",
  "title": "Loan EMI Calculator",
  "description": "Calculate your monthly loan EMI instantly...",
  "category": "finance",
  "related": ["salary-in-hand-calculator", "fuel-cost-per-km-calculator"],
  "schema_category": "FinanceApplication",
  "faqs": [...],
  "formula": "EMI = P × r × (1+r)^n / ((1+r)^n - 1)",
  "example": {...}
}
```

## Phase Rollout

### Phase 1 (Current)
Validate architecture with 3 calculators:
- salary-in-hand-calculator
- fuel-cost-per-km-calculator
- loan-emi-calculator

### Phase 2
Expand to full calculator families (20–30 pages).
Validate PSEO ranking results.

### Phase 3
Scale to 100+ pages across all families.
Add guide pages (/guides/{slug}) to support calculators.

### Phase 4
Scale to 1,000+ pages.
Add sitemap index (/sitemap-calculators.xml, /sitemap-guides.xml).

## SEO Differentiation Per Family Page

Each page in a family must have:
- Unique H1 (not just slug-ified text)
- Unique meta description
- Unique introductory paragraph (first 100 words)
- Pre-filled example values relevant to the page's variant
- Unique FAQ questions (at least 2 unique per variant)

Common sections (formula explanation, general FAQ) may be shared
but must be contextually adapted per variant.
