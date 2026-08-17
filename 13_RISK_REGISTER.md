# 13 — Risk Register

| Risk | Severity | Probability | Mitigation | Kill threshold |
|---|---|---:|---|---|
| Makeup VTO cannot map exact retail product | High | Medium | Use curated shade/look mapping and label honestly | If visual proof is misleading, use category-level curated demo products |
| Skin signals interpreted medically | High | Medium | Non-diagnostic labels, claims tests, disclaimers | Any UI says “diagnosed” or predicts breakout |
| Product evidence incomplete | Medium | High | Evidence completeness + abstention | Unknown silently treated favorable |
| Live provider latency breaks demo | High | Medium | Honest replay Judge Mode + Live button | Demo requires live call to succeed |
| API units exhausted | High | Medium | caching, replay, bounded live tests | uncontrolled repeated calls |
| LLM hallucinates reason | High | Medium | deterministic reason codes | free-form LLM is source of truth |
| UI becomes dashboard clutter | Medium | Medium | one-screen-one-decision design | >5 competing metrics on main screen |
| Product scope expands | High | High | PRD non-goals and kill list | skincare routine/social/storefront added |
| Judge sees generic skin recommender | High | Medium | repeat “skin changes ranking before VTO” | first 20 seconds do not demonstrate mechanism |
| Unsafe retailer ROI claim | Medium | Medium | measured prototype metrics only | unverified conversion/return uplift shown |
| Image privacy weakness | High | Low/Med | TTL/delete/no logs | raw faces appear in logs |
| Third-party product scraping instability | Medium | High | curated catalog | critical demo depends on scrape |
