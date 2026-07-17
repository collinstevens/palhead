const fs = require("fs");
const path = require("path");

const UA = "palhead-local-ref/1.0 (https://palhead.pages.dev)";

const SOURCES = {
  "wiki-gg": {
    id: "wiki-gg",
    label: "palworld.wiki.gg",
    url: "https://palworld.wiki.gg/wiki/Partner_Skills",
    kind: "skill_catalog",
  },
  game8: {
    id: "game8",
    label: "Game8",
    url: "https://game8.co/games/Palworld/archives/439665",
    kind: "skill_catalog",
  },
  fandom: {
    id: "fandom",
    label: "palworld.fandom.com",
    url: "https://palworld.fandom.com/wiki/Partner_Skills",
    kind: "level_tables",
  },
  paldb: {
    id: "paldb",
    label: "paldb.cc",
    url: "https://paldb.cc/en/Partner_Skill",
    kind: "skill_catalog",
  },
};

async function fetchText(url, accept = "text/html") {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: accept },
  });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

function decodeEntities(text) {
  return text
    .replace(/&#160;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripTags(html) {
  return decodeEntities(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyToNull(value) {
  const v = String(value || "").trim();
  return v || null;
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
    .replace(/\s*Technology\s*\d+\s*$/i, "")
    .trim();
}

function sameText(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return normalizeDescription(a).toLowerCase() === normalizeDescription(b).toLowerCase();
}

function splitPalNames(raw) {
  const cleaned = stripTags(raw)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\s*(?:\||\/|,|;|\s{2,})\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^weapon$/i.test(s));
}

function extractPalNamesFromCell(html) {
  const fromLinks = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => stripTags(m[1]))
    .map((t) => t.replace(/^Palworld\s*-\s*/i, "").trim())
    .filter(
      (t) => t && t.length < 60 && !/weapon$/i.test(t) && !/^partner skill/i.test(t)
    );
  if (fromLinks.length) {
    const uniq = [];
    for (const t of fromLinks) {
      if (!uniq.includes(t)) uniq.push(t);
    }
    return uniq;
  }

  const titles = [...html.matchAll(/title="([^"]+)"/gi)]
    .map((m) => decodeEntities(m[1]).trim())
    .filter((t) => t && !/palworld/i.test(t) && !/icon/i.test(t) && t.length < 60);
  if (titles.length) {
    const uniq = [];
    for (const t of titles) {
      if (!uniq.includes(t)) uniq.push(t);
    }
    return uniq;
  }
  return splitPalNames(html);
}

function parseHtmlTableRowsWithHtmlCells(html) {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  const results = [];
  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
    if (rows.length < 2) continue;
    const headers = [...rows[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) =>
      stripTags(m[1])
    );
    if (!headers.length) continue;
    const data = [];
    for (const row of rows.slice(1)) {
      const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => m[1]);
      if (!cells.length) continue;
      const obj = {};
      headers.forEach((h, i) => {
        obj[h || `col${i}`] = cells[i] ?? "";
      });
      data.push(obj);
    }
    if (data.length) results.push({ headers, rows: data });
  }
  return results;
}

function sortSkills(skills) {
  return skills.sort((a, b) => {
    const byName = String(a.name || "").localeCompare(String(b.name || ""));
    if (byName) return byName;
    return String(a.pal || "").localeCompare(String(b.pal || ""));
  });
}

function sourceEnvelope(sourceId, skills, extra = {}) {
  const meta = SOURCES[sourceId];
  return {
    provenance: {
      sourceId: meta.id,
      sourceLabel: meta.label,
      sourceUrl: meta.url,
      kind: meta.kind,
      scrapedAt: new Date().toISOString(),
      scraper: "scripts/scrape-partner-skills.js",
      note: "Scraped snapshot of paldb.cc only. Do not hand-edit. paldb.cc is the site source of truth.",
    },
    count: skills.length,
    ...extra,
    skills,
  };
}

async function scrapeWikiGg() {
  const j = await fetchJson(
    "https://palworld.wiki.gg/api.php?action=parse&page=Partner_Skills&prop=text&formatversion=2&format=json"
  );
  const tables = parseHtmlTableRowsWithHtmlCells(j.parse.text);
  const skills = [];
  for (const table of tables) {
    const headers = table.headers.map((h) => h.toLowerCase());
    const hasSkill = headers.some((h) => h.includes("skill"));
    const hasPal = headers.some((h) => h.includes("pal") || h.includes("species"));
    if (!hasSkill || !hasPal) continue;

    for (const row of table.rows) {
      const name = stripTags(row["Skill Name"] || row.Name || "");
      if (!name || /^skill name$/i.test(name)) continue;
      const palCell = row["Pal(s)"] || row.Pal || row.Species || row.Pals || row["Pal"] || "";
      const pals = extractPalNamesFromCell(palCell);
      const no = emptyToNull(stripTags(row["No."] || row.No || row["#"] || ""));
      const type = emptyToNull(stripTags(row["Skill Type"] || row.Type || ""));
      const description = emptyToNull(normalizeDescription(stripTags(row.Description || "")));

      if (!pals.length) {
        skills.push({ name, pal: null, no, type, description });
        continue;
      }
      for (const pal of pals) {
        skills.push({
          name,
          pal,
          no: pals.length === 1 ? no : null,
          type,
          description,
        });
      }
    }
  }
  return sourceEnvelope("wiki-gg", sortSkills(skills));
}

async function scrapeGame8() {
  const html = await fetchText("https://game8.co/games/Palworld/archives/439665");
  const tables = parseHtmlTableRowsWithHtmlCells(html);
  const skills = [];
  for (const table of tables) {
    const headers = table.headers.map((h) => h.toLowerCase());
    if (!headers.includes("partner skill") || !headers.includes("pal")) continue;
    if (table.rows.length < 5) continue;

    for (const row of table.rows) {
      const name = stripTags(row["Partner Skill"] || "");
      if (!name || /^partner skill$/i.test(name) || /^jump to/i.test(name)) continue;
      const description = emptyToNull(normalizeDescription(stripTags(row.Description || "")));
      const pals = extractPalNamesFromCell(row.Pal || "");
      if (!pals.length) {
        skills.push({ name, pal: null, no: null, type: null, description });
        continue;
      }
      for (const pal of pals) {
        skills.push({ name, pal, no: null, type: null, description });
      }
    }
  }
  return sourceEnvelope("game8", sortSkills(skills));
}

function extractIorP(token) {
  const m = String(token || "").match(/\{\{\s*(?:i|p|I|P)\s*\|\s*([^}|]+)/);
  return m ? m[1].trim() : stripTags(token).trim();
}

function parseFandomWikitext(wikitext) {
  const sections = [];
  const lines = wikitext.split("\n");
  let current = null;
  let inTable = false;
  let headers = [];
  let pendingPal = null;
  let rowValues = [];

  function flushRow() {
    if (!current || !pendingPal) {
      pendingPal = null;
      rowValues = [];
      return;
    }
    const levels = {};
    const extras = [];
    let levelIdx = 1;
    let seenNumber = false;
    for (const v of rowValues) {
      if (v === "" || v == null) {
        if (seenNumber) {
          levels[`lv${levelIdx}`] = null;
          levelIdx += 1;
        }
        continue;
      }
      if (/^\d+(\.\d+)?$/.test(v)) {
        seenNumber = true;
        levels[`lv${levelIdx}`] = Number(v);
        levelIdx += 1;
      } else {
        extras.push(v);
      }
    }
    current.entries.push({
      pal: pendingPal,
      levels,
      extras,
    });
    pendingPal = null;
    rowValues = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    const h2 = line.match(/^==\s*(.+?)\s*==$/);
    const h3 = line.match(/^===\s*(.+?)\s*===$/);
    if (h2 || h3) {
      if (inTable) flushRow();
      inTable = false;
      headers = [];
      current = {
        title: (h2 || h3)[1].replace(/'{2,}/g, "").trim(),
        level: h2 ? 2 : 3,
        caption: null,
        notes: [],
        entries: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) continue;

    if (line.startsWith("{|")) {
      inTable = true;
      pendingPal = null;
      rowValues = [];
      continue;
    }
    if (line === "|}") {
      flushRow();
      inTable = false;
      continue;
    }
    if (!inTable) {
      if (line.startsWith("|+") ) {
        current.caption = line.slice(2).replace(/'{2,}/g, "").replace(/<\/?[^>]+>/g, "").trim();
      } else if (line.startsWith("*") || line.startsWith("<sup>") || line.startsWith(":")) {
        const note = line
          .replace(/^\*+\s*/, "")
          .replace(/\{\{[^}]+\}\}/g, (m) => extractIorP(m) || m)
          .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
          .replace(/'{2,}/g, "")
          .replace(/<[^>]+>/g, "")
          .trim();
        if (note) current.notes.push(note);
      }
      continue;
    }

    const palEntry = line.match(/\{\{PalListEntry\+?\|([^}|]+)/i);
    if (palEntry) {
      flushRow();
      pendingPal = palEntry[1].trim();
      rowValues = [];
      continue;
    }

    if (line.startsWith("!")) continue;
    if (line === "|") continue;

    if (line.startsWith("|")) {
      const cells = line.replace(/^\|/, "").split("||").map((c) => c.trim());
      for (const cell of cells) {
        if (/^colspan=/i.test(cell) || /^rowspan=/i.test(cell)) continue;
        const cleaned = cell
          .replace(/\{\{[^}]+\}\}/g, (m) => extractIorP(m))
          .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
          .replace(/'{2,}/g, "")
          .replace(/<[^>]+>/g, "")
          .trim();
        rowValues.push(cleaned);
      }
    }
  }
  if (inTable) flushRow();

  return sections.filter((s) => s.entries.length || s.notes.length);
}

async function scrapeFandom() {
  const j = await fetchJson(
    "https://palworld.fandom.com/api.php?action=parse&page=Partner_Skills&prop=wikitext&formatversion=2&format=json"
  );
  const sections = parseFandomWikitext(j.parse.wikitext);
  const entryCount = sections.reduce((n, s) => n + s.entries.length, 0);

  return {
    provenance: {
      sourceId: SOURCES.fandom.id,
      sourceLabel: SOURCES.fandom.label,
      sourceUrl: SOURCES.fandom.url,
      kind: SOURCES.fandom.kind,
      scrapedAt: new Date().toISOString(),
      scraper: "scripts/scrape-partner-skills.js",
      note:
        "Fandom Partner Skills page is quantitative level tables (mount speed, attack boosts, carry weight, etc.), not a skill-name catalog. Skill names are usually absent. Unused: site SoT is paldb.cc only.",
    },
    count: entryCount,
    sectionCount: sections.length,
    sections,
    skills: sections.flatMap((section) =>
      section.entries.map((e) => ({
        name: null,
        pal: e.pal,
        section: section.title,
        caption: section.caption,
        levels: e.levels,
        extras: e.extras,
        description: null,
      }))
    ),
  };
}

function parsePaldbCards(html) {
  const tabBlocks = [];
  const tabRe = /data-bs-target="#([^"]+)"[^>]*>\s*([^<]+?)\s*<\/button>/gi;
  const tabs = [...html.matchAll(tabRe)].map((m) => ({
    id: m[1],
    label: stripTags(m[2]),
  }));

  for (const tab of tabs) {
    const start = html.indexOf(`id="${tab.id}"`);
    if (start < 0) continue;
    const nextStarts = tabs
      .map((t) => ({ t, idx: html.indexOf(`id="${t.id}"`) }))
      .filter((x) => x.idx > start)
      .sort((a, b) => a.idx - b.idx);
    const end = nextStarts.length ? nextStarts[0].idx : html.length;
    tabBlocks.push({ ...tab, html: html.slice(start, end) });
  }

  if (!tabBlocks.length) {
    tabBlocks.push({ id: "all", label: "all", html });
  }

  const skills = [];
  const seen = new Set();

  for (const tab of tabBlocks) {
    const cards = [
      ...tab.html.matchAll(/class="card itemPopup"([\s\S]*?)(?=class="card itemPopup"|$)/gi),
    ];
    for (const cardMatch of cards) {
      const card = cardMatch[1] || cardMatch[0];
      const palMatch = card.match(
        /<a[^>]*class="itemname"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
      );
      if (!palMatch) continue;
      const pal = stripTags(palMatch[2]);
      if (!pal || pal.length > 60) continue;

      const noMatch = card.match(/text-white-50[^>]*>\s*#\s*([0-9A-Za-z]+)/i);
      const no = noMatch ? noMatch[1] : null;

      const skillMatch = card.match(
        /border-left:\s*solid\s*white[^>]*>\s*<span[^>]*class="ms-2"[^>]*>([\s\S]*?)<\/span>\s*(Lv\.\s*\d+)?/i
      ) || card.match(
        /border-left:\s*solid\s*white[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>\s*(Lv\.\s*\d+)?/i
      );
      const name = skillMatch ? stripTags(skillMatch[1]) : null;
      if (!name || name === "-") continue;

      const partnerIdx = card.search(/Partner Skill/i);
      const afterPartner = partnerIdx >= 0 ? card.slice(partnerIdx) : card;
      const descBlocks = [
        ...afterPartner.matchAll(/class="flex-grow-1 ms-2">([\s\S]*?)<\/div>/gi),
      ];
      let description = null;
      for (const block of descBlocks) {
        const text = emptyToNull(normalizeDescription(stripTags(block[1])));
        if (!text) continue;
        if (new RegExp(`^${pal}\\b`, "i").test(text) && text.length < 40) continue;
        if (/^#[0-9A-Za-z]+$/.test(text)) continue;
        description = text;
      }

      const elements = [
        ...card.matchAll(
          /background-image:\s*url\([^)]*element[^)]*\)[^>]*>\s*<span[^>]*>\s*([^<]+)\s*<\/span>/gi
        ),
      ].map((m) => stripTags(m[1]));

      const key = `${skillKey(name, pal)}||${tab.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      skills.push({
        name,
        pal,
        no,
        type: null,
        elements: elements.length ? elements : null,
        description,
        paldbTab: tab.label.replace(/\s*\/\d+\s*$/, "").trim() || tab.id,
      });
    }
  }

  const byPalSkill = new Map();
  for (const s of skills) {
    const k = skillKey(s.name, s.pal);
    const existing = byPalSkill.get(k);
    if (!existing) {
      byPalSkill.set(k, {
        name: s.name,
        pal: s.pal,
        no: s.no,
        type: s.type,
        elements: s.elements,
        description: s.description,
        paldbTabs: [s.paldbTab],
      });
    } else if (!existing.paldbTabs.includes(s.paldbTab)) {
      existing.paldbTabs.push(s.paldbTab);
    }
  }

  return sortSkills([...byPalSkill.values()]);
}

async function scrapePaldb() {
  const html = await fetchText("https://paldb.cc/en/Partner_Skill");
  const skills = parsePaldbCards(html);
  return sourceEnvelope("paldb", skills, {
    notes: {
      pageTabs: "Page groups cards under Partner Skill / Player / Utility tabs; entries are deduped by skill+pal with paldbTabs listing membership.",
    },
  });
}

function catalogSkills(sourceDoc) {
  if (!sourceDoc || !Array.isArray(sourceDoc.skills)) return [];
  return sourceDoc.skills.filter((s) => s && s.name);
}

function loadJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function applyCorrections(resolvedSkills, correctionsDoc) {
  const entries = correctionsDoc.entries || [];
  if (!entries.length) return { skills: resolvedSkills, applied: [] };

  const applied = [];
  const skills = resolvedSkills.map((s) => ({ ...s }));

  for (const correction of entries) {
    if (correction.status && correction.status !== "active") continue;
    const match = correction.match || {};
    const idxs = [];
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      const palOk =
        !match.pal || normalizeKeyPart(s.pal) === normalizeKeyPart(match.pal);
      const nameOk =
        !match.skillName ||
        !match.name ||
        normalizeKeyPart(s.name) === normalizeKeyPart(match.skillName || match.name);
      const nameOk2 =
        !match.skillName && !match.name
          ? true
          : normalizeKeyPart(s.name) ===
            normalizeKeyPart(match.skillName || match.name);
      if (palOk && nameOk2) idxs.push(i);
    }

    if (!idxs.length && correction.fields && (match.pal || match.skillName || match.name)) {
      const created = {
        name: correction.fields.name || match.skillName || match.name || null,
        pal: match.pal || null,
        no: correction.fields.no ?? null,
        type: correction.fields.type ?? null,
        description: correction.fields.description ?? null,
        sources: ["correction"],
        corrected: true,
        correctionId: correction.id,
      };
      skills.push(created);
      applied.push({ correctionId: correction.id, action: "insert", key: skillKey(created.name, created.pal) });
      continue;
    }

    for (const i of idxs) {
      const before = { ...skills[i] };
      const fields = correction.fields || {};
      for (const [field, value] of Object.entries(fields)) {
        if (value !== undefined) skills[i][field] = value;
      }
      skills[i].corrected = true;
      skills[i].correctionId = correction.id;
      if (!Array.isArray(skills[i].sources)) skills[i].sources = [];
      if (!skills[i].sources.includes("correction")) skills[i].sources.push("correction");
      applied.push({
        correctionId: correction.id,
        action: "update",
        key: skillKey(skills[i].name, skills[i].pal),
        before,
        after: { ...skills[i] },
      });
    }
  }

  return { skills: sortSkills(skills), applied };
}

function mergeCatalogs(sourceDocs) {
  const preference = ["paldb", "game8", "wiki-gg"];
  const byKey = new Map();

  for (const sourceId of preference) {
    for (const s of catalogSkills(sourceDocs[sourceId])) {
      const key = skillKey(s.name, s.pal);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          name: s.name,
          pal: s.pal,
          no: s.no ?? null,
          type: s.type ?? null,
          description: s.description ?? null,
          elements: s.elements ?? null,
          sources: [sourceId],
          perSource: {
            [sourceId]: {
              name: s.name,
              pal: s.pal,
              no: s.no ?? null,
              type: s.type ?? null,
              description: s.description ?? null,
            },
          },
        });
        continue;
      }
      if (!existing.sources.includes(sourceId)) existing.sources.push(sourceId);
      existing.perSource[sourceId] = {
        name: s.name,
        pal: s.pal,
        no: s.no ?? null,
        type: s.type ?? null,
        description: s.description ?? null,
      };
      if (existing.no == null && s.no != null) existing.no = s.no;
      if (existing.type == null && s.type != null) existing.type = s.type;
      if (existing.description == null && s.description) existing.description = s.description;
      if (existing.elements == null && s.elements) existing.elements = s.elements;
    }
  }

  return sortSkills([...byKey.values()]);
}

function ensureScaffold(dir) {
  fs.mkdirSync(path.join(dir, "sources"), { recursive: true });
}

async function main() {
  const root = path.join(__dirname, "..");
  const outDir = path.join(root, "reference", "partner-skills");
  ensureScaffold(outDir);

  console.log("Scraping paldb.cc (source of truth)...");
  const paldb = await scrapePaldb();
  const filePath = path.join(outDir, "sources", "paldb.json");
  fs.writeFileSync(filePath, JSON.stringify(paldb, null, 2) + "\n");
  console.log(`Wrote ${filePath} (${paldb.count} entries)`);

  const legacyPath = path.join(root, "reference", "partner_skills.json");
  fs.writeFileSync(
    legacyPath,
    JSON.stringify(
      {
        deprecated: true,
        movedTo: "reference/partner-skills/sources/paldb.json",
        see: [
          "reference/partner-skills/README.md",
          "reference/partner-skills/sources/paldb.json",
          "reference/PROVENANCE.md",
        ],
        note: "Partner skills ship from paldb.cc only. Use sources/paldb.json.",
        migratedAt: new Date().toISOString(),
      },
      null,
      2
    ) + "\n"
  );
  console.log(`Wrote deprecation stub ${legacyPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
