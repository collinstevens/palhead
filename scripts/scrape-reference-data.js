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

async function main() {
  const root = path.join(__dirname, "..");
  const outDir = path.join(root, "reference");
  fs.mkdirSync(outDir, { recursive: true });

  const passive = await scrapePassiveSkills();
  const work = await scrapeWorkSuitability();

  const passivePath = path.join(outDir, "passive_skills.json");
  const workPath = path.join(outDir, "work_suitability.json");
  fs.writeFileSync(passivePath, JSON.stringify(passive, null, 2) + "\n");
  fs.writeFileSync(workPath, JSON.stringify(work, null, 2) + "\n");

  console.log(`Wrote ${passivePath} (${passive.count} skills)`);
  console.log(`Wrote ${workPath} (${work.suitabilities.length} suitabilities)`);
  const missing = work.suitabilities.filter((s) => !s.description).map((s) => s.name);
  if (missing.length) console.warn("Missing work descriptions:", missing.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
