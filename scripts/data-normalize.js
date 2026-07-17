const fs = require("fs");
const path = require("path");
const {
  pathSegment,
  palHref,
  skillPartnerHref,
  skillPassiveHref,
  skillActiveHref,
  itemHref,
  itemsCategoryHref,
  recipesHref,
  structureHref,
} = require("../site/paths");
const { normalizeElements } = require("../site/elements");

const ITEM_CATEGORIES = [
  {
    key: "materials",
    vendor: "materials.json",
    listKey: "materials",
    type: "item_material",
    label: "Materials",
    blurb: "Crafting materials and intermediate goods.",
  },
  {
    key: "weapons",
    vendor: "weapons.json",
    listKey: "weapons",
    type: "item_weapon",
    label: "Weapons",
    blurb: "Ranged and melee weapons.",
  },
  {
    key: "armor",
    vendor: "armor.json",
    listKey: "armor",
    type: "item_armor",
    label: "Armor",
    blurb: "Body, head, and shield armor.",
  },
  {
    key: "accessories",
    vendor: "accessories.json",
    listKey: "accessories",
    type: "item_accessory",
    label: "Accessories",
    blurb: "Rings, glasses, and other accessories.",
  },
  {
    key: "consumables",
    vendor: "consumables.json",
    listKey: "consumables",
    type: "item_consumable",
    label: "Consumables",
    blurb: "Meds, food buffs, and throwables.",
  },
  {
    key: "ammo",
    vendor: "ammo.json",
    listKey: "ammo",
    type: "item_ammo",
    label: "Ammo",
    blurb: "Ammunition for weapons.",
  },
  {
    key: "ingredients",
    vendor: "ingredients.json",
    listKey: "ingredients",
    type: "item_ingredient",
    label: "Ingredients",
    blurb: "Cooking ingredients and prepared food.",
  },
  {
    key: "spheres",
    vendor: "spheres.json",
    listKey: "spheres",
    type: "item_sphere",
    label: "Spheres",
    blurb: "Capture spheres.",
  },
  {
    key: "sphere-modules",
    vendor: "sphere_modules.json",
    listKey: "sphere_modules",
    type: "item_sphere_module",
    label: "Sphere modules",
    blurb: "Sphere trajectory and capture modules.",
  },
  {
    key: "saddles",
    vendor: "saddles.json",
    listKey: "saddles",
    type: "item_saddle",
    label: "Saddles",
    blurb: "Pal gear and saddles.",
  },
  {
    key: "skill-fruits",
    vendor: "skill_fruits.json",
    listKey: "skill_fruits",
    type: "item_skill_fruit",
    label: "Skill fruits",
    blurb: "Fruits that teach active skills.",
  },
  {
    key: "schematics",
    vendor: "schematics.json",
    listKey: "schematics",
    type: "item_schematic",
    label: "Schematics",
    blurb: "Blueprints and schematics.",
  },
  {
    key: "key-items",
    vendor: "key_items.json",
    listKey: "key_items",
    type: "item_key",
    label: "Key items",
    blurb: "Quest tokens, keys, and special items.",
  },
];

function humanizeName(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/:{2,}/g, ": ")
    .replace(/\s+/g, " ")
    .trim();
}

function isJunkSlug(value) {
  if (value == null) return true;
  const s = String(value).trim();
  return !s || s === "-" || s === "—";
}

function parseMaterials(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((m) => {
        if (m == null) return null;
        if (typeof m === "string") {
          const slug = pathSegment(m);
          if (isJunkSlug(slug) || slug === "material" || slug === "key_items")
            return null;
          return { slug, name: humanizeName(m), quantity: null };
        }
        const slugRaw = m.slug || m.id || m.name;
        if (isJunkSlug(slugRaw)) return null;
        const slug = pathSegment(slugRaw);
        if (slug === "material" || slug === "key_items" || slug === "schematic")
          return null;
        return {
          slug,
          name: humanizeName(m.name || m.slug || slugRaw),
          quantity: m.quantity != null ? Number(m.quantity) || m.quantity : null,
        };
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,;]/)
      .map((part) => {
        const t = part.trim();
        if (!t) return null;
        const m = t.match(/^(.+?)\s*[x×]\s*(\d+)\s*$/i) || t.match(/^(\d+)\s*[x×]\s*(.+)$/i);
        if (m) {
          const a = m[1];
          const b = m[2];
          const qtyFirst = /^\d+$/.test(a);
          const name = humanizeName(qtyFirst ? b : a);
          const quantity = Number(qtyFirst ? a : b);
          return { slug: pathSegment(name), name, quantity };
        }
        return { slug: pathSegment(t), name: humanizeName(t), quantity: null };
      })
      .filter(Boolean);
  }
  return [];
}

function parseWorkstations(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((w) => {
        if (w == null) return null;
        if (typeof w === "string") {
          if (isJunkSlug(w)) return null;
          return { slug: pathSegment(w), name: humanizeName(w) };
        }
        const slugRaw = w.slug || w.id || w.name;
        if (isJunkSlug(slugRaw)) return null;
        return {
          slug: pathSegment(slugRaw),
          name: humanizeName(w.name || w.slug || slugRaw),
        };
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => !isJunkSlug(s))
      .map((s) => ({ slug: pathSegment(s), name: humanizeName(s) }));
  }
  return [];
}

const root = path.join(__dirname, "..");
const vendorDir = path.join(root, "data", "vendor");
const outDir = path.join(root, "data", "normalized");
const iconsDir = path.join(root, "icons");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadVendor(name) {
  const p = path.join(vendorDir, name);
  if (!fs.existsSync(p)) return null;
  return readJson(p);
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function splitOwners(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildIconIndex() {
  const byCode = new Map();
  if (!fs.existsSync(iconsDir)) return byCode;
  for (const file of fs.readdirSync(iconsDir)) {
    const m = file.match(/^T_(.+)_icon_normal\.webp$/i);
    if (!m) continue;
    byCode.set(m[1], file);
  }
  return byCode;
}

function resolveIcon(iconIndex, code, slug) {
  if (code && iconIndex.has(code)) return iconIndex.get(code);
  if (slug && iconIndex.has(slug)) return iconIndex.get(slug);
  if (code && iconIndex.has(code.replace(/_/g, ""))) return iconIndex.get(code.replace(/_/g, ""));
  return null;
}

function statRange(stats, key) {
  if (!stats || stats[key] == null) return null;
  const v = stats[key];
  if (typeof v === "object" && v !== null) {
    return {
      min: v.min ?? null,
      max: v.max ?? null,
      raw: v.raw ?? null,
    };
  }
  return { min: v, max: v, raw: String(v) };
}

if (!fs.existsSync(path.join(vendorDir, "catalog.json"))) {
  fail(
    "No vendor data. Run: npm run data:import\nExpected data/vendor/catalog.json from a paldb publish bundle."
  );
}

const catalog = loadVendor("catalog.json");
const validation = loadVendor("validation.json");
const importMeta = loadVendor("import-meta.json");
const palsDoc = loadVendor("pals.json");
const partnerDoc = loadVendor("partner_skills.json");
const passiveDoc = loadVendor("passive_skills.json");
const activeDoc = loadVendor("active_skills.json");
const structuresDoc = loadVendor("structures.json");
const technologiesDoc = loadVendor("technologies.json");

if (!palsDoc || !Array.isArray(palsDoc.pals)) {
  fail("data/vendor/pals.json missing or invalid");
}

const iconIndex = buildIconIndex();
const builtAt = new Date().toISOString();

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, ".gitkeep"), "");

const relations = {
  pal_to_partner_skill: [],
  partner_skill_to_pals: {},
  passive_skill_to_pals: {},
  pal_to_passive_skills: [],
};

const searchEntries = [];
const palsOut = [];
const palsBySlug = {};
const usedPalPathSegs = new Set();

for (const raw of palsDoc.pals) {
  const slug = raw.slug || raw.id || raw.name;
  if (!slug) continue;
  const code = raw.identity?.Code || raw.id || null;
  const zukan = raw.identity?.ZukanIndex;
  const deck =
    zukan != null && zukan !== "" && !Number.isNaN(Number(zukan))
      ? Number(zukan)
      : null;
  const isPal = raw.flags?.is_pal !== false;
  const isDex = isPal && deck != null && deck > 0;
  const elements = normalizeElements(raw.elements);
  const icon = resolveIcon(iconIndex, code, slug);
  let pathSeg = pathSegment(slug);
  if (usedPalPathSegs.has(pathSeg)) {
    const alt = pathSegment(code || raw.id || slug + "-2");
    pathSeg = usedPalPathSegs.has(alt) ? pathSeg + "-2" : alt;
  }
  usedPalPathSegs.add(pathSeg);
  const href = "/pal/" + pathSeg + "/";
  const partnerName = raw.partner_skill?.name || null;

  const work = {};
  if (raw.work_suitability && typeof raw.work_suitability === "object") {
    for (const [k, v] of Object.entries(raw.work_suitability)) {
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) work[k] = n;
    }
  }

  const compact = {
    id: raw.id || code || slug,
    slug,
    path_segment: pathSeg,
    path: href,
    name: (raw.name || slug).replace(/_/g, " "),
    code,
    deck,
    is_pal: isPal,
    is_dex: isDex,
    elements,
    icon,
    size: raw.size || null,
    food_amount: raw.food_amount ?? null,
    rarity: raw.stats?.Rarity ?? null,
    partner_skill_name: partnerName,
    work,
  };

  const detail = {
    ...compact,
    source_url: raw.source_url || null,
    identity: raw.identity || null,
    stats: {
      health: statRange(raw.stats, "Health"),
      attack: statRange(raw.stats, "Attack"),
      defense: statRange(raw.stats, "Defense"),
      melee_attack: raw.stats?.MeleeAttack ?? null,
      support: raw.stats?.Support ?? null,
      combi_rank: raw.stats?.CombiRank ?? null,
      work_speed: raw.stats?.WorkSpeed ?? null,
      rarity: raw.stats?.Rarity ?? null,
    },
    movement: raw.movement || null,
    partner_skill: raw.partner_skill || null,
    passive_skills: Array.isArray(raw.passive_skills) ? raw.passive_skills : [],
    male_probability: raw.male_probability ?? null,
    capture_rate_correct: raw.capture_rate_correct ?? null,
    best_work_suitability: raw.best_work_suitability || null,
    flags: raw.flags || null,
  };

  palsOut.push(compact);
  palsBySlug[pathSeg] = detail;

  if (partnerName) {
    relations.pal_to_partner_skill.push({
      pal_slug: pathSeg,
      skill_name: partnerName,
    });
  }
  if (detail.passive_skills.length) {
    relations.pal_to_passive_skills.push({
      pal_slug: pathSeg,
      passive_ids: detail.passive_skills,
    });
  }

  searchEntries.push({
    name: compact.name,
    type: "pal",
    slug: pathSeg,
    path: href,
    elements: compact.elements,
    icon: compact.icon,
    rank: compact.deck,
  });
}

palsOut.sort((a, b) => {
  const ad = a.deck != null && a.deck > 0 ? a.deck : 99999;
  const bd = b.deck != null && b.deck > 0 ? b.deck : 99999;
  if (ad !== bd) return ad - bd;
  return a.name.localeCompare(b.name);
});

const palPathSet = new Set(palsOut.map((p) => p.path_segment));
const partnerOwners = new Map();

function addPartnerOwner(skillSeg, palSeg) {
  if (!skillSeg || !palSeg || !palPathSet.has(palSeg)) return;
  if (!partnerOwners.has(skillSeg)) partnerOwners.set(skillSeg, new Set());
  partnerOwners.get(skillSeg).add(palSeg);
}

for (const pal of palsOut) {
  if (!pal.partner_skill_name) continue;
  addPartnerOwner(pathSegment(pal.partner_skill_name), pal.path_segment);
}

const partnerSkills = [];
const partnerBySlug = {};
for (const raw of partnerDoc?.skills || []) {
  const name = raw.name || raw.id;
  if (!name || name === "-") continue;
  const pathSeg = pathSegment(name);
  const owners = splitOwners(raw.owner_slugs || raw.owner_pals).map(pathSegment);
  for (const o of owners) addPartnerOwner(pathSeg, o);
  const ownerList = [...(partnerOwners.get(pathSeg) || [])].sort();
  const href = skillPartnerHref(name);
  const skill = {
    id: raw.id || name,
    slug: pathSeg,
    path: href,
    name,
    description: raw.description || null,
    level_shown: raw.level_shown ?? null,
    category: raw.category || null,
    owner_slugs: ownerList,
    owner_count: ownerList.length,
    source_url: raw.source_url || "https://paldb.cc/en/Partner_Skill",
  };
  partnerSkills.push(skill);
  partnerBySlug[pathSeg] = skill;
  relations.partner_skill_to_pals[pathSeg] = ownerList;
  searchEntries.push({
    name,
    type: "skill_partner",
    slug: pathSeg,
    path: href,
    elements: null,
    icon: null,
    rank: ownerList.length || null,
  });
}

for (const [skillSeg, owners] of partnerOwners.entries()) {
  if (partnerBySlug[skillSeg]) continue;
  const ownerList = [...owners].sort();
  const name = skillSeg.replace(/_/g, " ");
  const href = "/skills/partner/" + skillSeg + "/";
  const skill = {
    id: skillSeg,
    slug: skillSeg,
    path: href,
    name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
    description: null,
    level_shown: null,
    category: null,
    owner_slugs: ownerList,
    owner_count: ownerList.length,
    source_url: null,
  };
  partnerSkills.push(skill);
  partnerBySlug[skillSeg] = skill;
  relations.partner_skill_to_pals[skillSeg] = ownerList;
}

partnerSkills.sort((a, b) => a.name.localeCompare(b.name));

const passiveSkills = [];
const passiveBySlug = {};
const passiveByCode = {};
const passiveOwners = new Map();

for (const raw of passiveDoc?.skills || []) {
  const name = raw.name || raw.id;
  if (!name) continue;
  const pathSeg = pathSegment(name);
  const href = skillPassiveHref(name);
  const skill = {
    id: raw.id || name,
    slug: pathSeg,
    path: href,
    name,
    rank: raw.rank ?? null,
    weight: raw.weight ?? null,
    modifiers: raw.modifiers || null,
    description: raw.description || null,
    owner_slugs: [],
    owner_count: 0,
    source_url: raw.source_url || "https://paldb.cc/en/Passive_Skills",
  };
  passiveSkills.push(skill);
  passiveBySlug[pathSeg] = skill;
  passiveByCode[String(raw.id || name)] = skill;
  passiveByCode[pathSeg] = skill;
  searchEntries.push({
    name,
    type: "skill_passive",
    slug: pathSeg,
    path: href,
    elements: null,
    icon: null,
    rank: raw.rank ?? null,
  });
}

for (const pal of palsOut) {
  const detail = palsBySlug[pal.path_segment];
  const ids = detail?.passive_skills || [];
  for (const id of ids) {
    const skill =
      passiveByCode[id] ||
      passiveByCode[pathSegment(id)] ||
      passiveBySlug[pathSegment(id)];
    if (!skill) continue;
    if (!passiveOwners.has(skill.slug)) passiveOwners.set(skill.slug, new Set());
    passiveOwners.get(skill.slug).add(pal.path_segment);
  }
}

for (const skill of passiveSkills) {
  const owners = [...(passiveOwners.get(skill.slug) || [])].sort();
  skill.owner_slugs = owners;
  skill.owner_count = owners.length;
  relations.passive_skill_to_pals = relations.passive_skill_to_pals || {};
  relations.passive_skill_to_pals[skill.slug] = owners;
}

passiveSkills.sort((a, b) => {
  const ra = a.rank == null ? 999 : a.rank;
  const rb = b.rank == null ? 999 : b.rank;
  if (ra !== rb) return ra - rb;
  return a.name.localeCompare(b.name);
});

const activeSkills = [];
const activeBySlug = {};
for (const raw of activeDoc?.skills || []) {
  const slug = raw.slug || raw.id || raw.name;
  if (!slug) continue;
  const pathSeg = pathSegment(slug);
  const href = skillActiveHref(slug);
  const elements = normalizeElements(raw.element);
  const skill = {
    id: raw.id || slug,
    slug: pathSeg,
    path: href,
    name: raw.name || slug,
    element: elements[0] || null,
    elements,
    power: raw.power ?? raw.display_power ?? null,
    cool_time: raw.cool_time ?? null,
    min_range: raw.min_range ?? null,
    max_range: raw.max_range ?? null,
    category: raw.category || null,
    aggregate_status: raw.aggregate_status || null,
    aggregate_value: raw.aggregate_value ?? null,
    strength: raw.strength || null,
    description: raw.description || null,
    skill_fruit_slug: raw.skill_fruit_slug
      ? pathSegment(raw.skill_fruit_slug)
      : null,
    skill_fruit_raw: raw.skill_fruit_slug || null,
    will_not_inherit: !!raw.will_not_inherit,
    source_url: raw.source_url || null,
    code: raw.code || null,
  };
  activeSkills.push(skill);
  activeBySlug[pathSeg] = skill;
  searchEntries.push({
    name: raw.name || slug,
    type: "skill_active",
    slug: pathSeg,
    path: href,
    elements,
    icon: null,
    rank: raw.power ?? null,
  });
}

activeSkills.sort((a, b) => {
  const pa = a.power == null ? -1 : a.power;
  const pb = b.power == null ? -1 : b.power;
  if (pa !== pb) return pb - pa;
  return a.name.localeCompare(b.name);
});

const itemsOut = [];
const itemsBySlug = {};
const itemsByCategory = {};
const usedItemPathSegs = new Set();
const itemAliasToSlug = new Map();

function registerItemAlias(alias, pathSeg) {
  if (!alias || isJunkSlug(alias)) return;
  const key = pathSegment(alias);
  if (!key || itemAliasToSlug.has(key)) return;
  itemAliasToSlug.set(key, pathSeg);
}

for (const cat of ITEM_CATEGORIES) {
  itemsByCategory[cat.key] = [];
  const doc = loadVendor(cat.vendor);
  const list = doc?.[cat.listKey] || [];
  for (const raw of list) {
    let slugRaw = raw.slug;
    if (isJunkSlug(slugRaw)) slugRaw = raw.code || raw.id || raw.name;
    if (isJunkSlug(slugRaw)) continue;

    let pathSeg = pathSegment(slugRaw);
    if (usedItemPathSegs.has(pathSeg)) {
      const alt = pathSegment(pathSeg + "-" + cat.key);
      if (usedItemPathSegs.has(alt)) continue;
      pathSeg = alt;
    }
    usedItemPathSegs.add(pathSeg);

    let name = raw.name;
    if (isJunkSlug(name)) name = raw.code || raw.id || slugRaw;
    name = humanizeName(name);

    const href = itemHref(pathSeg);
    const materials = parseMaterials(raw.recipe_materials || raw.materials);
    const workstations = parseWorkstations(raw.workstations);
    const rarity = raw.rarity || raw.rarity_label || null;
    const description =
      raw.description && !isJunkSlug(raw.description)
        ? String(raw.description).trim()
        : null;

    const compact = {
      id: raw.id || raw.code || pathSeg,
      slug: pathSeg,
      path: href,
      name,
      code: raw.code || raw.id || null,
      category: cat.key,
      category_label: cat.label,
      type: cat.type,
      rarity,
      rank: raw.rank ?? null,
      weight: raw.weight ?? null,
      max_stack: raw.max_stack_count ?? raw.max_stack ?? null,
      type_a: raw.type_a || null,
      type_b: raw.type_b || null,
      has_recipe: materials.length > 0 || workstations.length > 0,
    };

    const detail = {
      ...compact,
      description,
      materials,
      workstations,
      craft_times: Array.isArray(raw.craft_times) ? raw.craft_times : [],
      source_url: raw.source_url || null,
      recipes_as_product: [],
      used_in: [],
      dropped_by: [],
    };

    itemsOut.push(compact);
    itemsBySlug[pathSeg] = detail;
    itemsByCategory[cat.key].push(compact);

    registerItemAlias(raw.slug, pathSeg);
    registerItemAlias(raw.code, pathSeg);
    registerItemAlias(raw.id, pathSeg);
    registerItemAlias(raw.name, pathSeg);
    registerItemAlias(pathSeg, pathSeg);

    searchEntries.push({
      name,
      type: cat.type,
      slug: pathSeg,
      path: href,
      elements: null,
      icon: null,
      rank: raw.rank ?? null,
    });
  }
  itemsByCategory[cat.key].sort((a, b) => a.name.localeCompare(b.name));
}

itemsOut.sort((a, b) => a.name.localeCompare(b.name));

function resolveItemSlug(ref) {
  if (!ref || isJunkSlug(ref)) return null;
  const key = pathSegment(ref);
  if (itemsBySlug[key]) return key;
  return itemAliasToSlug.get(key) || null;
}

const recipesDoc = loadVendor("recipes.json");
const recipesOut = [];
const recipeIdSet = new Set();

for (const raw of recipesDoc?.recipes || []) {
  const productSlugRaw =
    raw.product_slug && !isJunkSlug(raw.product_slug)
      ? raw.product_slug
      : raw.product_code || raw.id;
  if (isJunkSlug(productSlugRaw)) continue;

  const materials = parseMaterials(raw.materials);
  const workstations = parseWorkstations(raw.workstations);
  if (!materials.length && !workstations.length) {
    const productOnly = resolveItemSlug(productSlugRaw);
    if (!productOnly) continue;
  }

  const productResolved = resolveItemSlug(productSlugRaw);
  const productPathSeg = productResolved || pathSegment(productSlugRaw);
  const productName = humanizeName(
    raw.product_name && !isJunkSlug(raw.product_name)
      ? raw.product_name
      : productSlugRaw
  );

  const recipeId =
    pathSegment(
      (raw.id || raw.product_code || productPathSeg) +
        "-" +
        (workstations[0]?.slug || "craft")
    ) +
    (recipeIdSet.has(
      pathSegment((raw.id || productPathSeg) + "-" + (workstations[0]?.slug || "craft"))
    )
      ? "-" + recipesOut.length
      : "");
  const rid = recipeIdSet.has(recipeId) ? recipeId + "-" + recipesOut.length : recipeId;
  recipeIdSet.add(rid);

  const materialLinks = materials.map((m) => {
    const resolved = resolveItemSlug(m.slug) || resolveItemSlug(m.name);
    return {
      slug: resolved || m.slug,
      name: resolved ? itemsBySlug[resolved].name : m.name,
      quantity: m.quantity,
      path: resolved ? itemsBySlug[resolved].path : null,
      known: !!resolved,
    };
  });

  const recipe = {
    id: rid,
    product_slug: productPathSeg,
    product_name: productResolved
      ? itemsBySlug[productResolved].name
      : productName,
    product_path: productResolved ? itemsBySlug[productResolved].path : null,
    product_known: !!productResolved,
    product_code: raw.product_code || raw.id || null,
    category: raw.category || null,
    materials: materialLinks,
    workstations,
    craft_times: Array.isArray(raw.craft_times) ? raw.craft_times : [],
    material_count: materialLinks.length,
    workstation_labels: workstations.map((w) => w.name).join(", "),
  };
  recipesOut.push(recipe);

  if (productResolved) {
    itemsBySlug[productResolved].recipes_as_product.push({
      id: rid,
      materials: materialLinks,
      workstations,
      craft_times: recipe.craft_times,
    });
  }

  for (const m of materialLinks) {
    if (!m.known || !itemsBySlug[m.slug]) continue;
    itemsBySlug[m.slug].used_in.push({
      product_slug: productPathSeg,
      product_name: recipe.product_name,
      product_path: recipe.product_path,
      quantity: m.quantity,
      workstations,
    });
  }
}

recipesOut.sort((a, b) => a.product_name.localeCompare(b.product_name));

const dropsDoc = loadVendor("drops.json");
const dropByItem = dropsDoc?.by_item || {};
for (const [itemKey, rows] of Object.entries(dropByItem)) {
  if (!Array.isArray(rows) || !rows.length) continue;
  if (String(itemKey).startsWith("_characterName")) continue;
  const resolved = resolveItemSlug(itemKey);
  if (!resolved || !itemsBySlug[resolved]) continue;
  const mapped = rows
    .map((row) => ({
      source_type: row.source_type || null,
      source_slug: row.source_slug || null,
      source_name: humanizeName(row.source_name || row.source_slug || "Unknown"),
      quantity: row.quantity != null ? String(row.quantity) : null,
      rate: row.rate != null ? row.rate : null,
    }))
    .slice(0, 40);
  itemsBySlug[resolved].dropped_by = mapped;
  itemsBySlug[resolved].drop_count = rows.length;
}

for (const item of Object.values(itemsBySlug)) {
  item.used_in_count = item.used_in.length;
  item.recipe_count = item.recipes_as_product.length;
  if (item.used_in.length > 30) {
    item.used_in = item.used_in.slice(0, 30);
  }
  item.materials = (item.materials || []).map((m) => {
    const resolved = resolveItemSlug(m.slug) || resolveItemSlug(m.name);
    return {
      slug: resolved || m.slug,
      name: resolved ? itemsBySlug[resolved].name : m.name,
      quantity: m.quantity,
      path: resolved ? itemsBySlug[resolved].path : null,
      known: !!resolved,
    };
  });
  if (!item.recipes_as_product.length && (item.materials.length || item.workstations.length)) {
    item.recipes_as_product.push({
      id: item.slug + "-inline",
      materials: item.materials,
      workstations: item.workstations,
      craft_times: item.craft_times || [],
    });
    item.recipe_count = 1;
  }
}

relations.item_used_in = {};
relations.item_recipes = {};
relations.item_drops = {};
for (const item of Object.values(itemsBySlug)) {
  if (item.used_in.length)
    relations.item_used_in[item.slug] = item.used_in.map((u) => u.product_slug);
  if (item.recipes_as_product.length)
    relations.item_recipes[item.slug] = item.recipes_as_product.length;
  if (item.dropped_by.length)
    relations.item_drops[item.slug] = item.dropped_by.length;
}

for (const skill of activeSkills) {
  if (!skill.skill_fruit_raw) continue;
  const resolved =
    resolveItemSlug(skill.skill_fruit_raw) ||
    resolveItemSlug(skill.skill_fruit_slug);
  if (resolved) {
    skill.skill_fruit_slug = resolved;
    skill.skill_fruit_path = itemsBySlug[resolved].path;
    skill.skill_fruit_name = itemsBySlug[resolved].name;
  }
}

const structures = [];
for (const raw of structuresDoc?.structures || []) {
  const slug = raw.slug || raw.id || raw.name;
  if (!slug) continue;
  const pathSeg = pathSegment(slug);
  const href = structureHref(slug);
  const name = humanizeName(raw.name || slug);
  structures.push({
    id: raw.id || slug,
    slug: pathSeg,
    path: href,
    name,
    category: raw.category || null,
    description: raw.description || null,
  });
  searchEntries.push({
    name,
    type: "structure",
    slug: pathSeg,
    path: href,
    elements: null,
    icon: null,
    rank: null,
  });
}

const technologies = [];
for (const raw of technologiesDoc?.technologies || technologiesDoc?.items || []) {
  const name = raw.name || raw.id || raw.technology;
  if (!name) continue;
  const pathSeg = pathSegment(name);
  technologies.push({
    id: raw.id || name,
    slug: pathSeg,
    name: humanizeName(name),
    level: raw.level ?? raw.player_level ?? null,
    points: raw.points ?? null,
    category: raw.category || null,
  });
  searchEntries.push({
    name: humanizeName(name),
    type: "tech",
    slug: pathSeg,
    path: "/tech/",
    elements: null,
    icon: null,
    rank: raw.level ?? raw.player_level ?? null,
  });
}

searchEntries.sort((a, b) => a.name.localeCompare(b.name));

const tables = (catalog.tables || []).map((t) => ({
  file: t.file,
  count: t.count,
  bytes: t.bytes,
}));

const itemCategoryCounts = {};
for (const cat of ITEM_CATEGORIES) {
  itemCategoryCounts[cat.key] = itemsByCategory[cat.key].length;
}

const counts = {
  pals: palsOut.length,
  pals_dex: palsOut.filter((p) => p.is_dex).length,
  skill_partner: partnerSkills.length,
  skill_passive: passiveSkills.length,
  skill_active: activeSkills.length,
  items: itemsOut.length,
  recipes: recipesOut.length,
  item_categories: itemCategoryCounts,
  structure: structures.length,
  tech: technologies.length,
  search_entries: searchEntries.length,
};

for (const cat of ITEM_CATEGORIES) {
  counts[cat.type] = itemsByCategory[cat.key].length;
}

const siteMeta = {
  built_at: builtAt,
  data_version:
    (catalog.generated_at || importMeta?.generated_at || "").slice(0, 10) ||
    "unknown",
  generated_at: catalog.generated_at || importMeta?.generated_at || null,
  imported_at: importMeta?.imported_at || null,
  source_path: importMeta?.source_path || null,
  source_name: importMeta?.source_name || null,
  source_resolution: importMeta?.source_resolution || null,
  tool_version: catalog.tool_version || importMeta?.tool_version || null,
  table_count: catalog.table_count ?? tables.length,
  validation_status: validation?.status || "unknown",
  validation_summary: validation?.summary || null,
  counts,
  item_categories: ITEM_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    blurb: c.blurb,
    type: c.type,
    path: itemsCategoryHref(c.key),
    count: itemsByCategory[c.key].length,
  })),
  sample_pal_path: palsBySlug.anubis ? palHref("Anubis") : palsOut[0]?.path || null,
  routing: "nested",
  default_pal_list_filter: "dex",
  vendor_policy: "import-latest-publish",
};

const manifest = {
  built_at: builtAt,
  phase: 4,
  source: {
    generated_at: catalog.generated_at || importMeta?.generated_at || null,
    tool_version: catalog.tool_version || importMeta?.tool_version || null,
    table_count: catalog.table_count ?? tables.length,
    import_meta: importMeta,
    validation_status: validation?.status || null,
  },
  tables,
  counts,
  outputs: [
    "manifest.json",
    "site-meta.json",
    "search-index.json",
    "relations.json",
    "pals.json",
    "pals-by-slug.json",
    "skills-partner.json",
    "skills-partner-by-slug.json",
    "skills-passive.json",
    "skills-passive-by-slug.json",
    "skills-active.json",
    "skills-active-by-slug.json",
    "items.json",
    "items-by-slug.json",
    "items-categories.json",
    "recipes.json",
    "structures.json",
    "technologies.json",
  ],
};

writeJson(path.join(outDir, "manifest.json"), manifest);
writeJson(path.join(outDir, "site-meta.json"), siteMeta);
writeJson(path.join(outDir, "search-index.json"), {
  built_at: builtAt,
  schema: {
    fields: ["name", "type", "slug", "path", "elements", "icon", "rank"],
  },
  count: searchEntries.length,
  entries: searchEntries,
});
writeJson(path.join(outDir, "relations.json"), relations);
writeJson(path.join(outDir, "pals.json"), {
  built_at: builtAt,
  count: palsOut.length,
  dex_count: counts.pals_dex,
  default_filter: "dex",
  pals: palsOut,
});
writeJson(path.join(outDir, "pals-by-slug.json"), palsBySlug);
writeJson(path.join(outDir, "skills-partner.json"), {
  count: partnerSkills.length,
  skills: partnerSkills,
});
writeJson(path.join(outDir, "skills-partner-by-slug.json"), partnerBySlug);
writeJson(path.join(outDir, "skills-passive.json"), {
  count: passiveSkills.length,
  skills: passiveSkills,
});
writeJson(path.join(outDir, "skills-passive-by-slug.json"), passiveBySlug);
writeJson(path.join(outDir, "skills-active.json"), {
  count: activeSkills.length,
  skills: activeSkills,
});
writeJson(path.join(outDir, "skills-active-by-slug.json"), activeBySlug);
writeJson(path.join(outDir, "items.json"), {
  built_at: builtAt,
  count: itemsOut.length,
  items: itemsOut,
});
writeJson(path.join(outDir, "items-by-slug.json"), itemsBySlug);
writeJson(path.join(outDir, "items-categories.json"), {
  categories: ITEM_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    blurb: c.blurb,
    type: c.type,
    path: itemsCategoryHref(c.key),
    count: itemsByCategory[c.key].length,
    items: itemsByCategory[c.key],
  })),
});
for (const cat of ITEM_CATEGORIES) {
  writeJson(path.join(outDir, "items-" + cat.key + ".json"), {
    category: cat.key,
    label: cat.label,
    blurb: cat.blurb,
    count: itemsByCategory[cat.key].length,
    items: itemsByCategory[cat.key],
  });
}
writeJson(path.join(outDir, "recipes.json"), {
  built_at: builtAt,
  count: recipesOut.length,
  path: recipesHref(),
  recipes: recipesOut,
});
writeJson(path.join(outDir, "structures.json"), {
  count: structures.length,
  structures,
});
writeJson(path.join(outDir, "technologies.json"), {
  count: technologies.length,
  technologies,
});

console.log("Normalized →", outDir);
console.log("counts:", JSON.stringify(counts));
console.log(
  "site-meta:",
  siteMeta.data_version,
  "validate:",
  siteMeta.validation_status
);
