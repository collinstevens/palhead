const fs = require("fs");
const path = require("path");

const UA = "palhead-local-ref/1.0 (https://palhead.pages.dev)";

const WORK_NAMES = [
  "Kindling",
  "Watering",
  "Planting",
  "Generating Electricity",
  "Handiwork",
  "Gathering",
  "Lumbering",
  "Mining",
  "Medicine Production",
  "Cooling",
  "Transporting",
  "Farming",
];

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
    .replace(/<br\s*\/?>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyToNull(value) {
  const v = String(value || "").trim();
  return v || null;
}

function parseHtmlTables(html) {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  const results = [];
  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
    if (!rows.length) continue;
    const headers = [...rows[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) =>
      stripTags(m[1])
    );
    if (!headers.length) continue;
    const data = [];
    for (const row of rows.slice(1)) {
      const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) =>
        stripTags(m[1])
      );
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

function cleanPassiveRow(row) {
  const name = stripTags(row["Passive Skill Name"] || row.Name || "");
  const rankRaw = String(row.Rank || "").replace(/[^\d-]/g, "");
  const rank = rankRaw === "" ? null : Number(rankRaw);
  const fixedOn = stripTags(row.Pal || "")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .trim();
  return {
    name,
    rank: Number.isFinite(rank) ? rank : null,
    description: stripTags(row.Description || ""),
    attack: emptyToNull(stripTags(row.Attack || "")),
    defense: emptyToNull(stripTags(row.Defense || "")),
    movementSpeed: emptyToNull(stripTags(row["Movement Speed"] || "")),
    workSpeed: emptyToNull(stripTags(row["Work Speed"] || "")),
    sanityDrain: emptyToNull(stripTags(row["Sanity Drain"] || "")),
    hungerDrain: emptyToNull(stripTags(row["Hunger Drain"] || "")),
    other: emptyToNull(stripTags(row.Other || "")),
    fixedOn: fixedOn || null,
  };
}

function parseWikitextWorkDefs(wikitext) {
  const defs = [];
  for (const rawLine of wikitext.split("\n")) {
    const m = rawLine.match(/^\s*\*\s*\{\{I\|([^}|]+)(?:\|[^}]*)?\}\}\s*:\s*(.+)\s*$/i);
    if (!m) continue;
    const name = m[1].trim();
    const description = m[2]
      .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2")
      .replace(/'{2,}/g, "")
      .trim();
    if (WORK_NAMES.includes(name) && !defs.find((d) => d.name === name)) {
      defs.push({ name, description });
    }
  }
  return defs;
}

async function scrapePassiveSkills() {
  const j = await fetchJson(
    "https://palworld.wiki.gg/api.php?action=parse&page=Passive_Skills/List&prop=text&formatversion=2&format=json"
  );
  const html = j.parse.text;
  const tables = parseHtmlTables(html).sort((a, b) => b.rows.length - a.rows.length);
  const main = tables[0];
  if (!main) throw new Error("No passive skills table found");

  const skills = main.rows
    .map(cleanPassiveRow)
    .filter((s) => s.name && s.name !== "Test");
  skills.sort((a, b) => a.name.localeCompare(b.name));

  return {
    source: "https://palworld.wiki.gg/wiki/Passive_Skills/List",
    scrapedAt: new Date().toISOString(),
    count: skills.length,
    skills,
  };
}

async function scrapeWorkSuitability() {
  const j = await fetchJson(
    "https://palworld.fandom.com/api.php?action=parse&page=Work_Suitability&prop=wikitext&formatversion=2&format=json"
  );
  const wikitext = j.parse.wikitext;
  const wtDefs = parseWikitextWorkDefs(wikitext);
  const byName = Object.fromEntries(wtDefs.map((d) => [d.name, d.description]));

  const suitabilities = WORK_NAMES.map((name) => ({
    name,
    description: byName[name] || "",
  }));

  const missing = suitabilities.filter((s) => !s.description).map((s) => s.name);
  if (missing.length) {
    throw new Error(`Missing work suitability definitions: ${missing.join(", ")}`);
  }

  return {
    source: "https://palworld.fandom.com/wiki/Work_Suitability",
    scrapedAt: new Date().toISOString(),
    notes: {
      naturalRange: "0 (lowest) to 4 (highest)",
      boost: "Pal Essence Condenser can increase a Work Suitability by one level",
      orderInPalsData: WORK_NAMES,
    },
    suitabilities,
    workPriority: {
      summary:
        "Lower priority values = higher priority. Critical tasks (attack/defense) first; specialized tasks (medicine, cooling) last.",
      levels: [
        { priority: 1, tasks: "Attack and Defense" },
        { priority: 2, tasks: "Reviving characters and extinguishing fires" },
        { priority: 3, tasks: "Construction" },
        { priority: "4-5", tasks: "Grazing and electricity generation" },
        { priority: "6-8", tasks: "Smelting, cooking, and harvesting" },
        { priority: "9-10", tasks: "Transporting, planting, and watering" },
        { priority: "10+", tasks: "Medicine production and cooling" },
      ],
    },
    tips: [
      "Enhance suitabilities with Pal Essence Condenser",
      "Match pals to high-priority tasks",
      "Plan for specialized tasks (Cooling, Medicine Production)",
      "Monitor Gathering and Transporting for resource flow",
      "Use Monitor Stand to allow/disallow certain work",
      "Pal Labor Research Laboratory research improves task speed and costs",
    ],
  };
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
    .filter((t) => t && t.length < 60 && !/weapon$/i.test(t) && !/^partner skill/i.test(t));
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

async function scrapePartnerSkillsWiki() {
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
      const palCell =
        row["Pal(s)"] || row.Pal || row.Species || row.Pals || row["Pal"] || "";
      const pals = extractPalNamesFromCell(palCell);
      const no = emptyToNull(stripTags(row["No."] || row.No || row["#"] || ""));
      const type = emptyToNull(stripTags(row["Skill Type"] || row.Type || ""));
      const description = stripTags(row.Description || "");
      if (!pals.length) {
        skills.push({
          name,
          pal: null,
          no,
          type,
          description,
          source: "wiki.gg",
        });
        continue;
      }
      for (const pal of pals) {
        skills.push({
          name,
          pal,
          no: pals.length === 1 ? no : null,
          type,
          description,
          source: "wiki.gg",
        });
      }
      if (pals.length === 1 && no) {
        skills[skills.length - 1].no = no;
      }
    }
  }
  return skills;
}

async function scrapePartnerSkillsGame8() {
  const r = await fetch("https://game8.co/games/Palworld/archives/439665", {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!r.ok) throw new Error(`${r.status} game8 partner skills`);
  const html = await r.text();
  const tables = parseHtmlTableRowsWithHtmlCells(html);
  const skills = [];
  for (const table of tables) {
    const headers = table.headers.map((h) => h.toLowerCase());
    if (!headers.includes("partner skill") || !headers.includes("pal")) continue;
    if (table.rows.length < 5) continue;

    for (const row of table.rows) {
      const name = stripTags(row["Partner Skill"] || "");
      if (!name || /^partner skill$/i.test(name) || /^jump to/i.test(name)) continue;
      const description = stripTags(row.Description || "");
      const pals = extractPalNamesFromCell(row.Pal || "");
      if (!pals.length) {
        skills.push({
          name,
          pal: null,
          no: null,
          type: null,
          description,
          source: "game8",
        });
        continue;
      }
      for (const pal of pals) {
        skills.push({
          name,
          pal,
          no: null,
          type: null,
          description,
          source: "game8",
        });
      }
    }
  }
  return skills;
}

function skillKey(skill) {
  return `${(skill.name || "").toLowerCase()}||${(skill.pal || "").toLowerCase()}`;
}

function sameText(a, b) {
  if (!a || !b) return false;
  return a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();
}

function mergePartnerSkills(wikiSkills, game8Skills) {
  const byKey = new Map();

  for (const s of game8Skills) {
    byKey.set(skillKey(s), {
      name: s.name,
      pal: s.pal,
      no: null,
      type: null,
      description: s.description || null,
      descriptionWiki: null,
      sources: ["game8"],
    });
  }

  for (const s of wikiSkills) {
    const key = skillKey(s);
    const existing = byKey.get(key);
    if (existing) {
      if (s.no && !existing.no) existing.no = s.no;
      if (s.type && !existing.type) existing.type = s.type;
      if (s.description && !sameText(s.description, existing.description)) {
        existing.descriptionWiki = s.description;
      }
      if (!existing.description) existing.description = s.description || null;
      if (!existing.sources.includes("wiki.gg")) existing.sources.push("wiki.gg");
      continue;
    }
    byKey.set(key, {
      name: s.name,
      pal: s.pal,
      no: s.no,
      type: s.type,
      description: s.description || null,
      descriptionWiki: null,
      sources: ["wiki.gg"],
    });
  }

  const skills = [...byKey.values()];
  skills.sort((a, b) => {
    const byName = a.name.localeCompare(b.name);
    if (byName) return byName;
    return String(a.pal || "").localeCompare(String(b.pal || ""));
  });

  return skills;
}

async function scrapePartnerSkills() {
  const [wikiSkills, game8Skills] = await Promise.all([
    scrapePartnerSkillsWiki(),
    scrapePartnerSkillsGame8(),
  ]);
  const skills = mergePartnerSkills(wikiSkills, game8Skills);

  return {
    primarySource: "https://game8.co/games/Palworld/archives/439665",
    sources: [
      "https://game8.co/games/Palworld/archives/439665",
      "https://palworld.wiki.gg/wiki/Partner_Skills",
    ],
    scrapedAt: new Date().toISOString(),
    notes: {
      condensation: "Pal Condensation raises Partner Skill level and effectiveness",
      gear: "Some skills need Pal Gear (saddles/gloves) unlocked via Technology + Pal Gear Workbench",
      structure:
        "One entry per skill+pal pair. game8 is primary for descriptions; wiki.gg supplies deck no/type and descriptionWiki when it differs",
    },
    count: skills.length,
    game8Count: game8Skills.length,
    wikiCount: wikiSkills.length,
    skills,
  };
}

async function main() {
  const root = path.join(__dirname, "..");
  const outDir = path.join(root, "reference");
  fs.mkdirSync(outDir, { recursive: true });

  const passive = await scrapePassiveSkills();
  const work = await scrapeWorkSuitability();
  const partner = await scrapePartnerSkills();

  const passivePath = path.join(outDir, "passive_skills.json");
  const workPath = path.join(outDir, "work_suitability.json");
  const partnerPath = path.join(outDir, "partner_skills.json");
  fs.writeFileSync(passivePath, JSON.stringify(passive, null, 2) + "\n");
  fs.writeFileSync(workPath, JSON.stringify(work, null, 2) + "\n");
  fs.writeFileSync(partnerPath, JSON.stringify(partner, null, 2) + "\n");

  console.log(`Wrote ${passivePath} (${passive.count} skills)`);
  console.log(`Wrote ${workPath} (${work.suitabilities.length} suitabilities)`);
  console.log(
    `Wrote ${partnerPath} (${partner.count} skill+pal entries; wiki=${partner.wikiCount}, game8=${partner.game8Count})`
  );
  const missing = work.suitabilities.filter((s) => !s.description).map((s) => s.name);
  if (missing.length) console.warn("Missing work descriptions:", missing.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
