#!/usr/bin/env python3
"""
build.py — mycalcu.in build engine v2
======================================
Reads /data/calculators.json exclusively.
No content hardcoded in this file — all content lives in the JSON.

Changes from v1:
- All content (about, formula, example, inputs) now comes from JSON
- {{YEAR}} token auto-populated from calculator entry
- {{PREFILL_*}} tokens populated from prefill{} block in JSON
- related_slugs auto-resolves to full related card HTML
- Category-aware: used for related suggestions and index grouping
- Sitemap supports index mode for future scale
- CONTENT dict removed entirely

Usage:
    python build.py                    # build all
    python build.py --slug loan-emi-calculator
    python build.py --list             # list all slugs
"""

import json, os, re, sys, argparse
from datetime import date

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT         = os.path.dirname(os.path.abspath(__file__))
SHARED_DIR   = os.path.join(ROOT, "shared")
TEMPLATE_DIR = os.path.join(ROOT, "templates")
CALCS_DIR    = os.path.join(ROOT, "calculators")
DATA_FILE    = os.path.join(ROOT, "data", "calculators.json")
SITEMAP_PATH = os.path.join(ROOT, "sitemap.xml")
TEMPLATE     = os.path.join(TEMPLATE_DIR, "calculator-template.html")
BASE_URL     = "https://mycalcu.in"
TODAY        = date.today().isoformat()
BUILD_YEAR   = str(date.today().year)

# ── Shared component loader ────────────────────────────────────────────────────
def load_shared(filename):
    with open(os.path.join(SHARED_DIR, filename), "r", encoding="utf-8") as f:
        return f.read().strip()

# ── Related cards HTML ─────────────────────────────────────────────────────────
def build_related_html(related_slugs, all_calcs):
    """Resolve slug list to full related card HTML using data from JSON."""
    lookup = {c["slug"]: c for c in all_calcs}
    cards  = []
    for slug in related_slugs:
        c = lookup.get(slug)
        if not c:
            continue
        category_label = c.get("category", "Calculator").title()
        cards.append(
            f'<a href="/calculators/{slug}" class="related-card">\n'
            f'  <span class="related-card__label">{category_label}</span>\n'
            f'  <span class="related-card__name">{c["h1_title"]}</span>\n'
            f'  <span class="related-card__desc">{c["subtitle"]}</span>\n'
            f'</a>'
        )
    return "\n".join(cards)

# ── FAQ HTML ───────────────────────────────────────────────────────────────────
def build_faq_html(faqs):
    items = []
    for i, faq in enumerate(faqs):
        items.append(
            f'<div class="faq-item" role="listitem">\n'
            f'  <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-{i}">\n'
            f'    {faq["q"]}\n'
            f'    <span class="faq-icon" aria-hidden="true">+</span>\n'
            f'  </button>\n'
            f'  <div class="faq-answer" id="faq-answer-{i}" role="region">\n'
            f'    <p>{faq["a"]}</p>\n'
            f'  </div>\n'
            f'</div>'
        )
    return "\n".join(items)

# ── FAQ JSON-LD ────────────────────────────────────────────────────────────────
def build_faq_schema(faqs):
    entities = [
        {"@type": "Question", "name": f["q"],
         "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
        for f in faqs
    ]
    return json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entities
    }, indent=2, ensure_ascii=False)

# ── Token replacement ──────────────────────────────────────────────────────────
def apply_tokens(text, tokens):
    for key, value in tokens.items():
        text = text.replace("{{" + key + "}}", str(value))
    return text

# ── Prefill token extraction ───────────────────────────────────────────────────
def prefill_tokens(prefill):
    """Convert prefill dict keys to PREFILL_* uppercase tokens."""
    return {
        "PREFILL_" + k.upper(): v
        for k, v in prefill.items()
    }

# ── Shared component injection ─────────────────────────────────────────────────
def inject_shared(html):
    html = html.replace("<!-- INJECT:navbar -->",  load_shared("navbar.html"))
    html = html.replace("<!-- INJECT:footer -->",  load_shared("footer.html"))
    html = html.replace("<!-- INJECT:header -->",  load_shared("header.html"))
    return html

# ── Build one calculator page ──────────────────────────────────────────────────
def build_calculator(calc, all_calcs):
    slug = calc["slug"]
    year = calc.get("year", BUILD_YEAR)
    print(f"  → Building: {slug}")

    with open(TEMPLATE, "r", encoding="utf-8") as f:
        template = f.read()

    # Base tokens
    tokens = {
        "YEAR":               year,
        "META_TITLE":         calc["meta_title"],
        "META_DESCRIPTION":   calc["meta_description"],
        "SLUG":               slug,
        "OG_TITLE":           calc["og_title"],
        "OG_DESCRIPTION":     calc["og_description"],
        "H1_TITLE":           calc["h1_title"],
        "SUBTITLE":           calc["subtitle"],
        "BREADCRUMB_NAME":    calc["breadcrumb_name"],
        "SCHEMA_NAME":        calc["h1_title"],
        "SCHEMA_CATEGORY":    calc["schema_category"],
        "SCHEMA_DESCRIPTION": calc["schema_description"],
        "RESULT_LABEL":       calc["result_label"],
        "JS_FILE":            calc["js_file"],
        "ABOUT_HEADING":      calc.get("about_heading", "About This Calculator"),
        "ABOUT_CONTENT_HTML": calc.get("about_html", ""),
        "FORMULA_HEADING":    calc.get("formula_heading", "How is this Calculated?"),
        "FORMULA_CONTENT_HTML": calc.get("formula_html", ""),
        "EXAMPLE_CONTENT_HTML": calc.get("example_html", ""),
        "CALCULATOR_INPUTS_HTML": calc.get("inputs_html", ""),
        "FAQ_HTML":           build_faq_html(calc.get("faqs", [])),
        "FAQ_SCHEMA_JSON":    build_faq_schema(calc.get("faqs", [])),
        "RELATED_HTML":       build_related_html(calc.get("related_slugs", []), all_calcs),
    }

    # Prefill tokens (PREFILL_CTC, PREFILL_LOAN_AMOUNT, etc.)
    tokens.update(prefill_tokens(calc.get("prefill", {})))

    # Apply all tokens (including {{YEAR}} inside content fields)
    html = apply_tokens(template, tokens)

    # Apply tokens again to catch {{YEAR}} inside content HTML
    html = apply_tokens(html, tokens)

    # Inject shared components
    html = inject_shared(html)

    # Write output
    out_dir = os.path.join(CALCS_DIR, slug)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"     ✓ Written → calculators/{slug}/index.html")

# ── Sitemap ────────────────────────────────────────────────────────────────────
def build_sitemap(calculators):
    print("  → Generating sitemap.xml")
    urls = [
        f"""  <url>
    <loc>{BASE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <lastmod>{TODAY}</lastmod>
  </url>""",
        f"""  <url>
    <loc>{BASE_URL}/calculators/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>{TODAY}</lastmod>
  </url>""",
    ]
    for calc in calculators:
        urls.append(
            f"""  <url>
    <loc>{BASE_URL}/calculators/{calc["slug"]}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <lastmod>{TODAY}</lastmod>
  </url>"""
        )
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "\n".join(urls)
    sitemap += "\n</urlset>\n"

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write(sitemap)
    print(f"     ✓ Written → sitemap.xml ({len(calculators)} calculator URLs)")

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Build mycalcu.in")
    parser.add_argument("--slug",  help="Build only one calculator by slug")
    parser.add_argument("--list",  action="store_true", help="List all slugs and exit")
    args = parser.parse_args()

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        all_calcs = json.load(f)

    if args.list:
        print(f"\n{len(all_calcs)} calculators in data/calculators.json:\n")
        for c in all_calcs:
            variant = f"  [variant of {c['variant_of']}]" if c.get("variant_of") else ""
            print(f"  {c['slug']}  ({c['category']}){variant}")
        return

    print(f"\n🔨 mycalcu.in build — {len(all_calcs)} calculators found\n")

    targets = [c for c in all_calcs if c["slug"] == args.slug] if args.slug else all_calcs

    if args.slug and not targets:
        print(f"❌ Slug '{args.slug}' not found in calculators.json")
        sys.exit(1)

    for calc in targets:
        build_calculator(calc, all_calcs)

    build_calculators_index(all_calcs)
    build_sitemap(all_calcs)
    print(f"\n✅ Done. {len(targets)} page(s) built.\n")


# ── Build /calculators/index.html ─────────────────────────────────────────────
def build_calculators_index(all_calcs):
    """
    Generates /calculators/index.html — the hub page.
    Groups calculators by category, shows base calculators prominently,
    lists variants underneath each base. Auto-built from calculators.json.
    """
    print("  → Building: calculators/index.html")

    from collections import defaultdict, OrderedDict

    CATEGORY_META = {
        "salary": {
            "label": "Salary Calculators",
            "icon": "💼",
            "desc": "Find your exact take-home pay, compare tax regimes, and plan your finances."
        },
        "loans": {
            "label": "Loan & EMI Calculators",
            "icon": "🏦",
            "desc": "Calculate monthly EMIs, total interest, and plan your loan repayments."
        },
        "fuel": {
            "label": "Fuel & Vehicle Calculators",
            "icon": "⛽",
            "desc": "Know your exact running cost per kilometre for any vehicle and fuel type."
        },
    }

    # Group: base calculators first, then variants under their parent
    groups = defaultdict(lambda: {"base": [], "variants": []})
    slug_map = {c["slug"]: c for c in all_calcs}

    for c in all_calcs:
        cat = c.get("category", "other")
        if not c.get("variant_of"):
            groups[cat]["base"].append(c)
        else:
            groups[cat]["variants"].append(c)

    # Build category sections HTML
    sections_html = ""
    total_count = len(all_calcs)

    for cat, meta in CATEGORY_META.items():
        if cat not in groups:
            continue
        base_items = groups[cat]["base"]
        variant_items = groups[cat]["variants"]
        if not base_items:
            continue

        cards_html = ""
        for b in base_items:
            # Variants belonging to this base
            b_variants = [v for v in variant_items if v.get("variant_of") == b["slug"]]
            variant_links = ""
            if b_variants:
                links = " · ".join(
                    f'<a href="/calculators/{v["slug"]}">{v["h1_title"]}</a>'
                    for v in b_variants
                )
                variant_links = f'<div class="calc-index-card__variants"><span>Also: </span>{links}</div>'

            cards_html += f"""
<a href="/calculators/{b['slug']}" class="calc-index-card" data-search="{b['category']} {b['slug'].replace('-',' ')} {b['h1_title'].lower()}">
  <div class="calc-index-card__top">
    <div class="calc-index-card__icon" aria-hidden="true">{meta['icon']}</div>
    <div>
      <div class="calc-index-card__name">{b['h1_title']}</div>
      <div class="calc-index-card__desc">{b['subtitle']}</div>
    </div>
  </div>
  {variant_links}
  <div class="calc-index-card__cta">
    Calculate →
  </div>
</a>"""

        sections_html += f"""
<section class="calc-index-section" aria-labelledby="cat-{cat}">
  <div class="calc-index-section__header">
    <span class="calc-index-section__icon" aria-hidden="true">{meta['icon']}</span>
    <div>
      <h2 id="cat-{cat}" class="calc-index-section__title">{meta['label']}</h2>
      <p class="calc-index-section__desc">{meta['desc']}</p>
    </div>
  </div>
  <div class="calc-index-grid">
    {cards_html}
  </div>
</section>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Free Online Calculators for India | mycalcu.in</title>
  <meta name="description" content="Browse {total_count}+ free online calculators for salary, EMI, fuel cost, and more. Built for India. No sign-up required.">
  <link rel="canonical" href="https://mycalcu.in/calculators/">
  <meta property="og:title" content="All Calculators | mycalcu.in">
  <meta property="og:description" content="Free online calculators for salary, loan EMI, fuel cost, and more — built for India.">
  <meta property="og:url" content="https://mycalcu.in/calculators/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="mycalcu.in">
  <meta name="robots" content="index, follow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
  <link rel="icon" type="image/png" href="/assets/icons/favicon.png">
  <link rel="shortcut icon" href="/assets/icons/favicon.ico">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="/assets/css/main.css">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "All Calculators — mycalcu.in",
    "url": "https://mycalcu.in/calculators/",
    "description": "Free online calculators for salary, loan EMI, fuel cost and more — built for India.",
    "hasPart": [{', '.join(f'{{"@type":"WebApplication","name":"{c["h1_title"]}","url":"https://mycalcu.in/calculators/{c["slug"]}"}}' for c in all_calcs)}]
  }}
  </script>
</head>
<body>

<!-- NAVBAR -->
<nav class="navbar" role="navigation" aria-label="Main navigation">
  <div class="navbar__inner">
    <a href="/" class="navbar__logo" aria-label="mycalcu.in home">
      <div class="navbar__logo-mark" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <text x="10" y="15" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="15" fill="white">M</text>
        </svg>
      </div>
      <span class="navbar__logo-text">MyCalcu<em>.in</em></span>
    </a>
    <button class="navbar__toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="navbar-links" onclick="var n=document.getElementById('navbar-links');var o=n.classList.toggle('open');this.setAttribute('aria-expanded',o);">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      </svg>
    </button>
    <ul class="navbar__links" id="navbar-links" role="list">
      <li><a href="/">Home</a></li>
      <li><a href="/calculators/" class="active">Calculators</a></li>
      <li><a href="/guides/">Guides</a></li>
    </ul>
  </div>
</nav>

<!-- Breadcrumb -->
<div class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <span class="breadcrumb__sep" aria-hidden="true">›</span>
  <span aria-current="page">Calculators</span>
</div>

<main id="main-content">

  <!-- Page Header -->
  <header class="page-header">
    <p class="page-header__pill">Free · No sign-up · {total_count} calculators</p>
    <h1>All Calculators</h1>
    <p class="page-header__sub">Salary, loans, fuel costs — clear answers for everyday Indian money decisions.</p>

    <!-- Search -->
    <div class="calc-index-search" role="search">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" class="calc-index-search__icon">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.75"/>
        <path d="M13 13l3 3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
      </svg>
      <input type="search" id="calc-search" placeholder="Search calculators…" aria-label="Search calculators" autocomplete="off">
    </div>
  </header>

  <!-- Calculator Sections -->
  <div class="calc-index-body container--wide">
    {sections_html}

    <!-- No results -->
    <p id="no-results" class="no-results-msg" hidden>
      No calculators found. <a href="/calculators/">Clear search</a>
    </p>
  </div>

</main>

<!-- FOOTER -->
<footer class="footer" role="contentinfo">
  <div class="footer__inner">
    <div class="footer__brand">
      <div class="footer__logo">
        <div class="footer__logo-mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <text x="10" y="15" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="15" fill="white">M</text>
          </svg>
        </div>
        <span class="footer__logo-text">MyCalcu<em>.in</em></span>
      </div>
      <p class="footer__tagline">Fast, accurate, and friendly calculators for everyday money decisions — built for India.</p>
    </div>
    <div class="footer__col">
      <h4>Calculators</h4>
      <ul>
        <li><a href="/calculators/salary-in-hand-calculator">Salary Calculator</a></li>
        <li><a href="/calculators/loan-emi-calculator">EMI Calculator</a></li>
        <li><a href="/calculators/fuel-cost-per-km-calculator">Fuel Cost Calculator</a></li>
      </ul>
    </div>
    <div class="footer__col">
      <h4>Site</h4>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/sitemap.xml">Sitemap</a></li>
      </ul>
    </div>
  </div>
  <div class="footer__bottom">
    <span>&copy; 2025 mycalcu.in &mdash; All calculators are for informational purposes only.</span>
    <span>Made with care for India 🇮🇳</span>
  </div>
</footer>

<script>
(function () {{
  var input  = document.getElementById('calc-search');
  var cards  = document.querySelectorAll('.calc-index-card');
  var sections = document.querySelectorAll('.calc-index-section');
  var noRes  = document.getElementById('no-results');
  if (!input) return;
  input.addEventListener('input', function () {{
    var q = this.value.trim().toLowerCase();
    var totalVisible = 0;
    sections.forEach(function (sec) {{
      var secVisible = 0;
      sec.querySelectorAll('.calc-index-card').forEach(function (card) {{
        var text = (card.dataset.search + ' ' + card.textContent).toLowerCase();
        var show = !q || text.includes(q);
        card.style.display = show ? '' : 'none';
        if (show) {{ secVisible++; totalVisible++; }}
      }});
      sec.style.display = secVisible > 0 ? '' : 'none';
    }});
    noRes.hidden = !(q && totalVisible === 0);
  }});
}}());
</script>

</body>
</html>"""

    out_dir = os.path.join(CALCS_DIR)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"     ✓ Written → calculators/index.html")


if __name__ == "__main__":
    main()
