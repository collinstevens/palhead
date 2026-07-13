const fs = require("fs");
const path = require("path");

const CATALOG_SOURCES = ["wiki-gg", "game8", "paldb"];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeKeyPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function skillKey(name, pal) {
  return `${normalizeKeyPart(name)}||${normalizeKeyPart(pal)}`;
}

function normalizeDescription(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function sameText(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return normalizeDescription(a).toLowerCase() === normalizeDescription(b).toLowerCase();
}

function escapeMd(s) {
  return String(s || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function truncate(s, n = 140) {
  const t = String(s || "");
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

function loadCatalogs(sourcesDir) {
  const catalogs = {};
  for (const id of CATALOG_SOURCES) {
    const doc = loadJson(path.join(sourcesDir, `${id}.json`));
    catalogs[id] = (doc.skills || []).filter((s) => s && s.name && s.pal);
  }
  return catalogs;
}

function buildIndex(catalogs) {
  const byKey = new Map();
  const byPal = new Map();

  for (const sourceId of CATALOG_SOURCES) {
    for (const s of catalogs[sourceId]) {
      const key = skillKey(s.name, s.pal);
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          name: s.name,
          pal: s.pal,
          sources: {},
        });
      }
      const row = byKey.get(key);
      row.sources[sourceId] = {
        name: s.name,
        pal: s.pal,
        no: s.no ?? null,
        type: s.type ?? null,
        description: s.description || null,
      };

      const palKey = normalizeKeyPart(s.pal);
      if (!byPal.has(palKey)) {
        byPal.set(palKey, { pal: s.pal, bySource: {} });
      }
      const palRow = byPal.get(palKey);
      if (!palRow.bySource[sourceId]) palRow.bySource[sourceId] = [];
      palRow.bySource[sourceId].push({
        name: s.name,
        description: s.description || null,
        no: s.no ?? null,
      });
    }
  }

  return { byKey, byPal };
}

function classifyCoverage(presentIn) {
  const missing = CATALOG_SOURCES.filter((id) => !presentIn.includes(id));
  if (presentIn.length === 1) return "only_one_source";
  if (missing.length === 1) return "missing_one_source";
  if (missing.length > 1) return "partial_coverage";
  return "full_coverage";
}

function buildReport(catalogs) {
  const { byKey, byPal } = buildIndex(catalogs);
  const generatedAt = new Date().toISOString();

  const descriptionMismatches = [];
  const coverageGaps = [];
  const nameConflicts = [];

  for (const row of byKey.values()) {
    const presentIn = CATALOG_SOURCES.filter((id) => row.sources[id]);
    const missingFrom = CATALOG_SOURCES.filter((id) => !row.sources[id]);

    if (missingFrom.length) {
      coverageGaps.push({
        key: row.key,
        name: row.name,
        pal: row.pal,
        presentIn,
        missingFrom,
        kind: classifyCoverage(presentIn),
        descriptions: Object.fromEntries(
          presentIn.map((id) => [id, row.sources[id].description])
        ),
      });
    }

    const withDesc = presentIn
      .map((id) => ({ sourceId: id, description: row.sources[id].description }))
      .filter((d) => d.description);
    if (withDesc.length >= 2) {
      const baseline = withDesc[0].description;
      if (withDesc.some((d) => !sameText(d.description, baseline))) {
        const unique = [];
        for (const d of withDesc) {
          if (!unique.some((u) => sameText(u, d.description))) unique.push(d.description);
        }
        descriptionMismatches.push({
          key: row.key,
          name: row.name,
          pal: row.pal,
          presentIn,
          uniqueDescriptionCount: unique.length,
          descriptions: Object.fromEntries(
            presentIn.map((id) => [id, row.sources[id].description || null])
          ),
        });
      }
    }
  }

  for (const palRow of byPal.values()) {
    const sourcesWithSkills = CATALOG_SOURCES.filter(
      (id) => (palRow.bySource[id] || []).length
    );
    if (sourcesWithSkills.length < 2) continue;

    const nameSets = sourcesWithSkills.map((id) => ({
      sourceId: id,
      names: [
        ...new Set((palRow.bySource[id] || []).map((s) => s.name).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b)),
    }));

    const normalizedSets = nameSets.map((s) =>
      s.names.map((n) => normalizeKeyPart(n)).sort().join("||")
    );
    const allSame = normalizedSets.every((n) => n === normalizedSets[0]);
    if (!allSame) {
      nameConflicts.push({
        pal: palRow.pal,
        sources: Object.fromEntries(nameSets.map((s) => [s.sourceId, s.names])),
        note: "Same pal has different partner skill name set across sites",
      });
    }
  }

  descriptionMismatches.sort((a, b) => {
    const byPal = a.pal.localeCompare(b.pal);
    if (byPal) return byPal;
    return a.name.localeCompare(b.name);
  });
  coverageGaps.sort((a, b) => {
    const byPal = a.pal.localeCompare(b.pal);
    if (byPal) return byPal;
    return a.name.localeCompare(b.name);
  });
  nameConflicts.sort((a, b) => a.pal.localeCompare(b.pal));

  const onlyOne = coverageGaps.filter((g) => g.kind === "only_one_source");
  const onlyBySource = Object.fromEntries(
    CATALOG_SOURCES.map((id) => [
      id,
      onlyOne.filter((g) => g.presentIn[0] === id).length,
    ])
  );

  const severeDescription = descriptionMismatches.filter((m) => {
    const vals = Object.values(m.descriptions).filter(Boolean);
    if (vals.length < 2) return false;
    // heuristic: very different length or no shared 8-char token stem
    const tokens = vals.map((v) =>
      new Set(
        normalizeDescription(v)
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((t) => t.length >= 5)
      )
    );
    let shared = 0;
    for (const t of tokens[0]) {
      if (tokens.every((set) => set.has(t))) shared += 1;
    }
    return shared <= 1;
  });

  return {
    generatedAt,
    generator: "scripts/build-partner-skills-discrepancies.js",
    note:
      "Website-vs-website only. Not ground truth. In-game screenshots resolve these via corrections/ + checklist.",
    sourcesCompared: CATALOG_SOURCES,
    counts: Object.fromEntries(
      CATALOG_SOURCES.map((id) => [id, catalogs[id].length])
    ),
    summary: {
      descriptionMismatchCount: descriptionMismatches.length,
      coverageGapCount: coverageGaps.length,
      nameConflictPalCount: nameConflicts.length,
      onlyOneSourceCount: onlyOne.length,
      onlyOneSourceBySite: onlyBySource,
      severeDescriptionMismatchCount: severeDescription.length,
    },
    descriptionMismatches,
    coverageGaps,
    nameConflicts,
    severeDescriptionMismatches: severeDescription,
  };
}

function writeMarkdown(report, outPath) {
  const lines = [];
  lines.push("# Partner skills — cross-site discrepancies");
  lines.push("");
  lines.push(
    "Auto-generated from scraped catalogs (`wiki-gg`, `game8`, `paldb`). **Not in-game truth** — use this to prioritize Palpedia screenshots."
  );
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|--------|------:|");
  lines.push(
    `| Description text differs (same skill+pal) | ${report.summary.descriptionMismatchCount} |`
  );
  lines.push(
    `| Coverage gaps (missing from ≥1 catalog site) | ${report.summary.coverageGapCount} |`
  );
  lines.push(
    `| Pals with conflicting skill *names* across sites | ${report.summary.nameConflictPalCount} |`
  );
  lines.push(
    `| Skill+pal only on a single site | ${report.summary.onlyOneSourceCount} |`
  );
  lines.push(
    `| Severe description conflicts (little shared wording) | ${report.summary.severeDescriptionMismatchCount} |`
  );
  lines.push("");
  lines.push("Catalog sizes:");
  lines.push("");
  for (const id of report.sourcesCompared) {
    lines.push(`- **${id}**: ${report.counts[id]} skill+pal rows`);
  }
  lines.push("");
  lines.push(
    "Fandom is excluded from name/description compare (level tables only). See `sources/fandom.json`."
  );
  lines.push("");
  lines.push("Only-on-one-site breakdown:");
  lines.push("");
  for (const [id, n] of Object.entries(report.summary.onlyOneSourceBySite)) {
    lines.push(`- **${id} only**: ${n}`);
  }
  lines.push("");

  // --- Name conflicts ---
  lines.push("## 1. Same pal, different skill names");
  lines.push("");
  if (!report.nameConflicts.length) {
    lines.push("_None._");
  } else {
    lines.push(
      "These pals are listed with different partner skill name sets depending on the site. High priority for screenshots."
    );
    lines.push("");
    lines.push("| Pal | wiki-gg | game8 | paldb |");
    lines.push("|-----|---------|-------|-------|");
    for (const row of report.nameConflicts) {
      const cell = (id) =>
        escapeMd((row.sources[id] || []).join("; ") || "—");
      lines.push(
        `| ${escapeMd(row.pal)} | ${cell("wiki-gg")} | ${cell("game8")} | ${cell("paldb")} |`
      );
    }
  }
  lines.push("");

  // --- Severe description ---
  lines.push("## 2. Severe description mismatches");
  lines.push("");
  lines.push(
    "Same skill name + pal, but site texts share almost no wording (likely outdated rewrite, wrong skill, or heavy paraphrase). Prefer screenshot soon."
  );
  lines.push("");
  if (!report.severeDescriptionMismatches.length) {
    lines.push("_None._");
  } else {
    for (const m of report.severeDescriptionMismatches) {
      lines.push(`### ${m.pal} — ${m.name}`);
      lines.push("");
      for (const id of report.sourcesCompared) {
        if (!(id in m.descriptions) && m.descriptions[id] == null) {
          if (!m.presentIn.includes(id)) {
            lines.push(`- **${id}**: _missing_`);
            continue;
          }
        }
        if (!m.presentIn.includes(id)) {
          lines.push(`- **${id}**: _missing_`);
          continue;
        }
        lines.push(
          `- **${id}**: ${escapeMd(m.descriptions[id] || "_(no description)_")}`
        );
      }
      lines.push("");
    }
  }

  // --- All description mismatches (compact table) ---
  lines.push("## 3. All description mismatches");
  lines.push("");
  lines.push(
    `Every skill+pal where at least two sites have descriptions that are not identical after whitespace normalize. (${report.descriptionMismatches.length} rows)`
  );
  lines.push("");
  lines.push("| Pal | Skill | Sources disagree | wiki-gg | game8 | paldb |");
  lines.push("|-----|-------|------------------|---------|-------|-------|");
  for (const m of report.descriptionMismatches) {
    const present = m.presentIn.join(", ");
    const cell = (id) => {
      if (!m.presentIn.includes(id)) return "_missing_";
      const d = m.descriptions[id];
      if (!d) return "_(empty)_";
      return escapeMd(truncate(d, 100));
    };
    lines.push(
      `| ${escapeMd(m.pal)} | ${escapeMd(m.name)} | ${present} | ${cell("wiki-gg")} | ${cell("game8")} | ${cell("paldb")} |`
    );
  }
  lines.push("");

  // --- Coverage gaps ---
  lines.push("## 4. Coverage gaps");
  lines.push("");
  lines.push("Skill+pal pairs missing from one or more catalog sites.");
  lines.push("");

  const onlyOne = report.coverageGaps.filter((g) => g.kind === "only_one_source");
  const missingOne = report.coverageGaps.filter((g) => g.kind === "missing_one_source");

  lines.push("### 4a. Only on a single site");
  lines.push("");
  lines.push(`(${onlyOne.length} rows)`);
  lines.push("");
  lines.push("| Pal | Skill | Only on | Description (truncated) |");
  lines.push("|-----|-------|---------|-----------------------|");
  for (const g of onlyOne) {
    const src = g.presentIn[0];
    lines.push(
      `| ${escapeMd(g.pal)} | ${escapeMd(g.name)} | ${src} | ${escapeMd(truncate(g.descriptions[src] || "", 120))} |`
    );
  }
  lines.push("");

  lines.push("### 4b. Missing from exactly one site");
  lines.push("");
  lines.push(`(${missingOne.length} rows)`);
  lines.push("");
  lines.push("| Pal | Skill | Present on | Missing from |");
  lines.push("|-----|-------|------------|--------------|");
  for (const g of missingOne) {
    lines.push(
      `| ${escapeMd(g.pal)} | ${escapeMd(g.name)} | ${g.presentIn.join(", ")} | ${g.missingFrom.join(", ")} |`
    );
  }
  lines.push("");

  lines.push("## How to use");
  lines.push("");
  lines.push("1. Prefer section **1** and **2** when picking Palpedia screenshots.");
  lines.push("2. After a screenshot, archive it under `corrections/evidence/` (never delete).");
  lines.push("3. Record truth in `corrections/corrections.json` and mark the site wrong in `known-inaccuracies.json`.");
  lines.push("4. Update `checklist.json` for that pal.");
  lines.push("5. Rebuild: `npm run scrape-partner-skills` is not required for this report; run `npm run build-partner-discrepancies` after re-scraping sources.");
  lines.push("");
  lines.push("Machine-readable twin: `cross-source-diff.json`.");
  lines.push("");

  fs.writeFileSync(outPath, lines.join("\n"));
}

function main() {
  const root = path.join(__dirname, "..");
  const dir = path.join(root, "reference", "partner-skills");
  const sourcesDir = path.join(dir, "sources");
  const outDir = path.join(dir, "discrepancies");
  fs.mkdirSync(outDir, { recursive: true });

  const catalogs = loadCatalogs(sourcesDir);
  const report = buildReport(catalogs);

  const jsonPath = path.join(outDir, "cross-source-diff.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n");

  const mdPath = path.join(outDir, "DISCREPANCIES.md");
  writeMarkdown(report, mdPath);

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main();
