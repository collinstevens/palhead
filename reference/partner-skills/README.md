# Partner skills (paldb.cc)

**Source of truth:** [paldb.cc Partner Skill](https://paldb.cc/en/Partner_Skill)

The live site builds partner-skills from `sources/paldb.json` only.

## Layout

```text
partner-skills/
  README.md
  sources/
    paldb.json    ← scraped snapshot used by build.js
```

## Refresh

```bash
npm run scrape-partner-skills
npm run build
```

## Policy

- No multi-site scrapes, discrepancy reports, Palpedia checklists, or correction overlays.
- Re-scrape overwrites `sources/paldb.json`. Do not hand-edit that file.
