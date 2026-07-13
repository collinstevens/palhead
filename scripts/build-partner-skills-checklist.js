const fs = require("fs");
const path = require("path");

function slug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function padDeck(d) {
  if (d == null || d === "") return null;
  const s = String(d);
  if (/^\d+$/.test(s)) return s.padStart(3, "0");
  const m = s.match(/^(\d+)([A-Za-z]*)$/);
  if (m) return m[1].padStart(3, "0") + m[2].toUpperCase();
  return s;
}

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function countStats(pals) {
  const stats = {
    total: pals.length,
    pending: 0,
    partial: 0,
    verified: 0,
    skipped: 0,
    withScrapedSkill: 0,
    withoutScrapedSkill: 0,
    withEvidence: 0,
  };
  for (const p of pals) {
    stats[p.status] = (stats[p.status] || 0) + 1;
    if (p.partnerSkills?.length) stats.withScrapedSkill += 1;
    else stats.withoutScrapedSkill += 1;
    if (p.evidence?.length) stats.withEvidence += 1;
  }
  return stats;
}

function writeMarkdown(checklist, outPath) {
  const lines = [];
  lines.push("# Partner skills — Palpedia verification checklist");
  lines.push("");
  lines.push(
    "Track in-game Palpedia screenshots for every pal. **Progress source of truth:** `checklist.json`. This markdown is regenerated for reading."
  );
  lines.push("");
  lines.push("## Screenshot policy");
  lines.push("");
  lines.push("- **Preserve every screenshot forever** under `corrections/evidence/`.");
  lines.push("- Never delete, overwrite, or replace prior evidence files.");
  lines.push("- Naming: `{deckNo}-{pal-slug}--{skill-slug}--{YYYYMMDD-HHmmss}.ext`");
  lines.push("- If retaken, keep the old file and add a new one.");
  lines.push("- Agents must save any user-provided image into `evidence/` before doing other work.");
  lines.push("");
  lines.push("## Progress");
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("|--------|------:|");
  for (const key of ["pending", "partial", "verified", "skipped"]) {
    lines.push(`| ${key} | ${checklist.stats[key] || 0} |`);
  }
  lines.push(`| **total** | **${checklist.stats.total}** |`);
  lines.push(`| with evidence files | ${checklist.stats.withEvidence || 0} |`);
  lines.push("");
  lines.push(`Updated: ${checklist.generatedAt}`);
  lines.push("");
  lines.push("## Checklist");
  lines.push("");
  lines.push("| Done | # | Pal | Scraped partner skill(s) | Evidence |");
  lines.push("|:----:|---:|-----|--------------------------|----------|");

  for (const p of checklist.pals) {
    const mark =
      p.status === "verified"
        ? "[x]"
        : p.status === "partial"
          ? "[-]"
          : p.status === "skipped"
            ? "[~]"
            : "[ ]";
    const skills =
      (p.partnerSkills || [])
        .map((s) => s.name)
        .filter(Boolean)
        .join("; ")
        .replace(/\|/g, "/") || "—";
    const ev = (p.evidence || [])
      .map((e) => (typeof e === "string" ? e : e.file))
      .filter(Boolean)
      .map((f) => path.basename(f))
      .join(", ");
    lines.push(
      `| ${mark} | ${p.deckNo || ""} | ${p.pal} | ${skills} | ${ev} |`
    );
  }

  lines.push("");
  lines.push("## Legend");
  lines.push("");
  lines.push("- `[ ]` pending · `[-]` partial · `[x]` verified · `[~]` skipped");
  lines.push("- Scraped skill names are website hints, not ground truth.");
  lines.push("- Next pending pals are those still marked pending with no evidence.");
  lines.push("");

  fs.writeFileSync(outPath, lines.join("\n"));
}

function main() {
  const root = path.join(__dirname, "..");
  const outDir = path.join(root, "reference", "partner-skills");
  const checklistPath = path.join(outDir, "checklist.json");
  const mdPath = path.join(outDir, "CHECKLIST.md");
  const data = JSON.parse(fs.readFileSync(path.join(root, "pals_data.json"), "utf8"));
  const resolved = loadJson(path.join(outDir, "resolved.json"), { skills: [] });
  const existing = loadJson(checklistPath, { pals: [] });
  const prevByPal = new Map((existing.pals || []).map((p) => [p.pal, p]));

  const skillsByPal = new Map();
  for (const s of resolved.skills || []) {
    if (!s.pal) continue;
    if (!skillsByPal.has(s.pal)) skillsByPal.set(s.pal, []);
    skillsByPal.get(s.pal).push({
      name: s.name,
      descriptionScraped: s.description || null,
      sources: s.sources || [],
    });
  }

  const byName = new Map();
  for (const p of data.pals) {
    byName.set(p.n, {
      pal: p.n,
      id: p.id,
      deckNo: padDeck(p.d),
      deckSort: Number(p.d) || 9999,
      elements: p.e || [],
      img: p.img || null,
      inPalsData: true,
      partnerSkills: skillsByPal.get(p.n) || [],
      status: "pending",
      verifiedAt: null,
      verifiedFields: [],
      evidence: [],
      correctionIds: [],
      notes: null,
    });
  }

  for (const [pal, skills] of skillsByPal) {
    if (byName.has(pal)) {
      byName.get(pal).partnerSkills = skills;
      continue;
    }
    const no = (resolved.skills || []).find((s) => s.pal === pal && s.no)?.no;
    byName.set(pal, {
      pal,
      id: null,
      deckNo: padDeck(no),
      deckSort:
        no && /^\d+/.test(String(no))
          ? Number(String(no).match(/^\d+/)[0])
          : 9000,
      elements: [],
      img: null,
      inPalsData: false,
      partnerSkills: skills,
      status: "pending",
      verifiedAt: null,
      verifiedFields: [],
      evidence: [],
      correctionIds: [],
      notes: null,
    });
  }

  const pals = [...byName.values()]
    .map((row) => {
      const prev = prevByPal.get(row.pal);
      if (!prev) return row;
      return {
        ...row,
        status: prev.status || row.status,
        verifiedAt: prev.verifiedAt ?? null,
        verifiedFields: prev.verifiedFields || [],
        evidence: prev.evidence || [],
        correctionIds: prev.correctionIds || [],
        notes: prev.notes ?? null,
      };
    })
    .sort((a, b) => {
      if (a.deckSort !== b.deckSort) return a.deckSort - b.deckSort;
      return a.pal.localeCompare(b.pal);
    });

  const checklist = {
    schemaVersion: 1,
    purpose:
      "Track in-game Palpedia partner-skill verification progress. One row per pal. Screenshots are permanent evidence.",
    screenshotPolicy: {
      preserveForever: true,
      neverDelete: true,
      neverOverwrite: true,
      directory: "reference/partner-skills/corrections/evidence/",
      naming: "{deckNo}-{pal-slug}--{skill-slug}--{YYYYMMDD-HHmmss}[--n].{ext}",
      note: "Every user-provided screenshot must be saved under evidence/ with a unique filename. Do not replace or remove prior screenshots; add new files if retaken.",
    },
    statusValues: {
      pending: "No in-game screenshot yet",
      partial: "Some fields verified or evidence saved but incomplete",
      verified: "Partner skill text confirmed from in-game Palpedia screenshot",
      skipped: "Intentionally skipped (note required)",
    },
    generatedAt: new Date().toISOString(),
    generator: "scripts/build-partner-skills-checklist.js",
    stats: countStats(pals),
    pals,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(checklistPath, JSON.stringify(checklist, null, 2) + "\n");
  writeMarkdown(checklist, mdPath);
  console.log(
    `Wrote ${checklistPath} (${checklist.stats.total} pals; verified=${checklist.stats.verified}, pending=${checklist.stats.pending})`
  );
  console.log(`Wrote ${mdPath}`);
}

main();
