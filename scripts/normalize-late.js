module.exports = function normalizeLate(ctx) {
  const {
    fs,
    path,
    root,
    outDir,
    builtAt,
    catalog,
    importMeta,
    validation,
    structuresDoc,
    technologiesDoc,
    loadVendor,
    writeJson,
    pathSegment,
    structureHref,
    techHref,
    worldHref,
    worldListHref,
    palHref,
    itemHref,
    itemsCategoryHref,
    recipesHref,
    humanizeName,
    isJunkSlug,
    parseMaterials,
    parseWorkstations,
    normalizeElements,
    resolveItemSlug,
    itemsBySlug,
    itemsOut,
    itemsByCategory,
    ITEM_CATEGORIES,
    recipesOut,
    dropsDoc,
    partnerSkills,
    activeSkills,
    palsOut,
    palsBySlug,
    palPathSet,
    partnerBySlug,
    passiveBySlug,
    activeBySlug,
    partnerSkills: _ps,
    searchEntries,
    relations,
  } = ctx;

  function linkMaterials(rawMats) {
    return parseMaterials(rawMats).map((m) => {
      const resolved = resolveItemSlug(m.slug) || resolveItemSlug(m.name);
      return {
        slug: resolved || m.slug,
        name: resolved ? itemsBySlug[resolved].name : m.name,
        quantity: m.quantity,
        path: resolved ? itemsBySlug[resolved].path : null,
      };
    });
  }

  function linkDrops(rawDrops) {
    if (!Array.isArray(rawDrops)) return [];
    return rawDrops
      .map((d) => {
        const slugRaw = d.slug || d.item_slug || d.name;
        if (isJunkSlug(slugRaw)) return null;
        const resolved = resolveItemSlug(slugRaw);
        return {
          slug: resolved || pathSegment(slugRaw),
          name: humanizeName(d.name || d.item_name || slugRaw),
          path: resolved ? itemsBySlug[resolved].path : null,
          quantity: d.quantity != null ? String(d.quantity) : null,
          rate: d.rate != null ? d.rate : null,
        };
      })
      .filter(Boolean);
  }

  const structures = [];
  const structuresBySlug = {};
  for (const raw of structuresDoc?.structures || []) {
    const slug = raw.slug || raw.id || raw.name;
    if (!slug || isJunkSlug(slug)) continue;
    const pathSeg = pathSegment(slug);
    const href = structureHref(pathSeg);
    const name = humanizeName(raw.name || slug);
    const materials = linkMaterials(raw.recipe_materials || raw.materials);
    const compact = {
      id: raw.id || slug,
      slug: pathSeg,
      path: href,
      name,
      category: raw.category || null,
      category_label: humanizeName(raw.category_label || raw.category || ""),
      worker_max: raw.worker_max ?? null,
      hp: raw.hp ?? null,
      defense: raw.defense ?? null,
      type_a: raw.type_a || null,
      type_b: raw.type_b || null,
    };
    structures.push(compact);
    structuresBySlug[pathSeg] = {
      ...compact,
      description:
        raw.description && !isJunkSlug(raw.description)
          ? String(raw.description)
          : null,
      materials,
      build_times: Array.isArray(raw.build_times) ? raw.build_times : [],
      source_url: raw.source_url || null,
      code: raw.code || null,
    };
    searchEntries.push({
      name,
      type: "structure",
      slug: pathSeg,
      path: href,
      elements: null,
      icon: null,
      rank: raw.rank ?? null,
    });
  }
  structures.sort((a, b) => a.name.localeCompare(b.name));

  const technologies = [];
  const technologiesBySlug = {};
  for (const raw of technologiesDoc?.technologies || technologiesDoc?.items || []) {
    const nameRaw = raw.name || raw.id || raw.technology;
    if (!nameRaw || isJunkSlug(nameRaw)) continue;
    const pathSeg = pathSegment(raw.slug || nameRaw);
    const href = techHref(pathSeg);
    const name = humanizeName(nameRaw);
    const level = raw.level ?? raw.player_level ?? null;
    const pointsRaw = raw.points ?? raw.tech_points ?? null;
    const points =
      pointsRaw == null
        ? null
        : Number(String(pointsRaw).replace(/[^\d.-]/g, "")) || pointsRaw;
    const tech = {
      id: raw.id || nameRaw,
      slug: pathSeg,
      path: href,
      name,
      level: level != null ? Number(level) || level : null,
      points,
      category: raw.category || null,
      source_url: raw.source_url || null,
    };
    technologies.push(tech);
    technologiesBySlug[pathSeg] = tech;
    searchEntries.push({
      name,
      type: "tech",
      slug: pathSeg,
      path: href,
      elements: null,
      icon: null,
      rank: tech.level,
    });
  }
  technologies.sort((a, b) => {
    const la = a.level == null ? 999 : Number(a.level);
    const lb = b.level == null ? 999 : Number(b.level);
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name);
  });

  const workStationsDoc = loadVendor("work_stations.json");
  const workStations = [];
  for (const raw of workStationsDoc?.work_stations || []) {
    const slug = raw.slug || raw.id || raw.name;
    if (!slug || isJunkSlug(slug)) continue;
    const pathSeg = pathSegment(slug);
    const struct = structuresBySlug[pathSeg];
    workStations.push({
      id: raw.id || slug,
      slug: pathSeg,
      path: struct ? struct.path : structureHref(pathSeg),
      name: humanizeName(raw.name || slug),
      category: raw.category || null,
      worker_max: raw.worker_max ?? null,
      materials: linkMaterials(raw.recipe_materials || raw.materials),
      structure_known: !!struct,
    });
  }
  workStations.sort((a, b) => a.name.localeCompare(b.name));

  const workSuitDoc = loadVendor("work_suitabilities.json");
  const workSuitabilities = [];
  for (const raw of workSuitDoc?.work_suitabilities || []) {
    const name = raw.name || raw.slug || raw.id;
    if (!name) continue;
    const pals = (raw.pals_by_level || []).map((p) => {
      const seg = pathSegment(p.slug || p.name);
      const pal = palsBySlug[seg];
      return {
        slug: seg,
        name: humanizeName(p.name || p.slug),
        level: p.level ?? null,
        path: pal ? pal.path : palPathSet.has(seg) ? palHref(seg) : null,
      };
    });
    workSuitabilities.push({
      id: raw.id || name,
      slug: pathSegment(raw.slug || name),
      name: humanizeName(name),
      code: raw.code || null,
      level_power: Array.isArray(raw.level_power) ? raw.level_power : [],
      pals_by_level: pals,
      pal_count: pals.length,
    });
  }

  const sanDoc = loadVendor("san.json");
  const sanRaw = sanDoc?.san || workSuitDoc?.san || null;
  const sanData = sanRaw
    ? {
        name: sanRaw.name || "SAN",
        thresholds: Array.isArray(sanRaw.thresholds) ? sanRaw.thresholds : [],
        sicknesses: Array.isArray(sanRaw.sicknesses) ? sanRaw.sicknesses : [],
        source_url: sanRaw.source_url || null,
      }
    : null;

  function normalizeWorldList(list, kind, typeLabel) {
    const out = [];
    const bySlug = {};
    for (const raw of list || []) {
      const slugRaw = raw.slug || raw.id || raw.name;
      if (!slugRaw || isJunkSlug(slugRaw)) continue;
      const pathSeg = pathSegment(slugRaw);
      const href = worldHref(kind, pathSeg);
      const name = humanizeName(raw.name || slugRaw);
      const elements = normalizeElements(raw.elements || raw.element);
      const drops = linkDrops(raw.drops);
      const compact = {
        id: raw.id || slugRaw,
        slug: pathSeg,
        path: href,
        name,
        kind,
        type: typeLabel,
        elements,
        level: raw.level != null ? String(raw.level) : null,
        hp: raw.hp != null ? String(raw.hp) : null,
        drop_count: drops.length,
        location: raw.location || raw.field_name || raw.region || null,
      };
      bySlug[pathSeg] = {
        ...compact,
        drops,
        badges: raw.badges || null,
        comment: raw.comment || null,
        inventory: Array.isArray(raw.inventory)
          ? raw.inventory.slice(0, 80).map((row) => {
              const itemSlug = row.item_slug || row.item || row.slug;
              const resolved = resolveItemSlug(itemSlug);
              return {
                name: humanizeName(row.item || row.name || itemSlug || "—"),
                price: row.price != null ? String(row.price) : null,
                path: resolved ? itemsBySlug[resolved].path : null,
              };
            })
          : [],
        pals: Array.isArray(raw.pals)
          ? raw.pals.slice(0, 60).map((p) => {
              const seg = pathSegment(p.slug || p.name);
              const pal = palsBySlug[seg];
              return {
                name: humanizeName(p.name || p.slug),
                slug: seg,
                weight: p.weight ?? null,
                path: pal ? pal.path : null,
              };
            })
          : [],
        layer_counts: raw.layer_counts || null,
        source_url: raw.source_url || null,
      };
      out.push(compact);
      searchEntries.push({
        name,
        type: typeLabel,
        slug: pathSeg,
        path: href,
        elements,
        icon: null,
        rank: null,
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return { list: out, bySlug };
  }

  const worldKinds = [
    { key: "alphas", vendor: "alpha_pals.json", listKey: "alpha_pals", label: "Alpha pals", type: "world_alpha", blurb: "Alpha / field boss pals and their drops." },
    { key: "tower-bosses", vendor: "tower_bosses.json", listKey: "tower_bosses", label: "Tower bosses", type: "world_tower_boss", blurb: "Tower syndicate bosses." },
    { key: "raids", vendor: "raids.json", listKey: "raids", label: "Raids", type: "world_raid", blurb: "Raid bosses and scaling notes." },
    { key: "rampaging", vendor: "rampaging_pals.json", listKey: "rampaging_pals", label: "Rampaging pals", type: "world_rampaging", blurb: "Rampaging / predator encounters." },
    { key: "merchants", vendor: "merchants.json", listKey: "merchants", label: "Merchants", type: "world_merchant", blurb: "Shops and merchant inventories." },
    { key: "treasure", vendor: "treasure_boxes.json", listKey: "treasure_regions", label: "Treasure boxes", type: "world_treasure", blurb: "Treasure regions and box loot tables." },
    { key: "eggs", vendor: "eggs.json", listKey: "eggs", label: "Eggs", type: "world_egg", blurb: "Wild egg types and possible pals." },
    { key: "caged", vendor: "caged_pals.json", listKey: "caged_pals", label: "Caged pals", type: "world_caged", blurb: "Caged pal spawns by field." },
    { key: "fishing", vendor: "fishing.json", listKey: "fishing_zones", label: "Fishing", type: "world_fishing", blurb: "Fishing zones and catch tables." },
    { key: "enemy-camps", vendor: "enemy_camps.json", listKey: "enemy_camps", label: "Enemy camps", type: "world_camp", blurb: "Enemy camp loot tables." },
    { key: "maps", vendor: "maps.json", listKey: "maps", label: "Maps", type: "world_map", blurb: "Map layers and POI counts (list-first)." },
  ];

  const worldData = {};
  const worldHub = [];
  for (const wk of worldKinds) {
    const doc = loadVendor(wk.vendor);
    const { list, bySlug } = normalizeWorldList(doc?.[wk.listKey] || [], wk.key, wk.type);
    worldData[wk.key] = { meta: wk, list, bySlug };
    worldHub.push({
      key: wk.key,
      label: wk.label,
      blurb: wk.blurb,
      path: worldListHref(wk.key),
      count: list.length,
    });
  }

  const mapPoisDoc = loadVendor("map_pois.json");
  const mapPois = (mapPoisDoc?.map_pois || []).map((p) => ({
    map: p.map || null,
    category: p.category || null,
    count: p.count ?? null,
  }));

  const dropRows = [];
  const bySource = dropsDoc?.by_source || {};
  for (const [sourceType, rows] of Object.entries(bySource)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const itemResolved = resolveItemSlug(row.item_slug || row.item_name);
      dropRows.push({
        source_type: row.source_type || sourceType,
        source_slug: row.source_slug || null,
        source_name: humanizeName(row.source_name || row.source_slug || sourceType),
        item_slug: itemResolved || pathSegment(row.item_slug || row.item_name || ""),
        item_name: humanizeName(row.item_name || row.item_slug || "—"),
        item_path: itemResolved ? itemsBySlug[itemResolved].path : null,
        quantity: row.quantity != null ? String(row.quantity) : null,
        rate: row.rate != null ? row.rate : null,
      });
    }
  }

  const breedingDoc = loadVendor("breeding.json");
  const breedingPals = (breedingDoc?.pals || [])
    .map((p) => {
      const seg = pathSegment(p.slug || p.name || p.code);
      const pal = palsBySlug[seg];
      return {
        slug: seg,
        name: humanizeName(p.name || p.label || p.slug || seg),
        code: p.code || null,
        combi_rank: p.combi_rank ?? pal?.stats?.combi_rank ?? null,
        male_probability: p.male_probability ?? null,
        elements: normalizeElements(p.elements),
        path: pal ? pal.path : null,
        is_dex: pal ? !!pal.is_dex : false,
        deck: pal?.deck ?? null,
        icon: pal?.icon || null,
        work: pal?.work || {},
        partner_skill_name: pal?.partner_skill_name || null,
      };
    })
    .filter((p) => p.combi_rank != null)
    .sort((a, b) => (a.combi_rank ?? 9999) - (b.combi_rank ?? 9999));

  const baseTips = partnerSkills
    .filter((s) => {
      const d = (s.description || "").toLowerCase();
      return (
        d.includes("work suitability") ||
        d.includes("+1") ||
        d.includes("while in base") ||
        d.includes("base camp") ||
        (s.category || "").toLowerCase().includes("base")
      );
    })
    .map((s) => ({
      name: s.name,
      path: s.path,
      description: s.description,
      owners: s.owner_count,
      category: s.category,
    }));

  let statusEffects = null;
  const statusPath = path.join(root, "reference", "status-effects", "status_effects.json");
  if (fs.existsSync(statusPath)) {
    try {
      statusEffects = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    } catch (_) {
      statusEffects = null;
    }
  }

  const patchNotesDoc = loadVendor("patch_notes.json");
  const versionsDoc = loadVendor("versions.json");
  const tipsDoc = loadVendor("tips.json");
  const newsItems = [];
  for (const raw of patchNotesDoc?.patch_notes || []) {
    const name = raw.name || raw.slug || raw.id;
    if (!name) continue;
    newsItems.push({
      id: raw.id || name,
      slug: pathSegment(name),
      title: String(name),
      kind: "patch_notes",
      bullets: Array.isArray(raw.bullets) ? raw.bullets.slice(0, 12) : [],
      paragraphs: Array.isArray(raw.paragraphs) ? raw.paragraphs : [],
      source_url: raw.source_url || null,
    });
  }
  for (const raw of versionsDoc?.versions || versionsDoc?.content_updates || []) {
    const name = raw.name || raw.slug || raw.id;
    if (!name) continue;
    if (newsItems.some((n) => n.title === String(name))) continue;
    const bullets = Array.isArray(raw.bullets) ? raw.bullets : [];
    if (!bullets.length && !(raw.paragraphs || []).length) continue;
    newsItems.push({
      id: raw.id || name,
      slug: pathSegment(name),
      title: String(name),
      kind: raw.kind || "version",
      bullets: bullets.slice(0, 12),
      paragraphs: Array.isArray(raw.paragraphs) ? raw.paragraphs : [],
      source_url: raw.source_url || null,
    });
  }
  newsItems.sort((a, b) => b.title.localeCompare(a.title));

  const tipsList = (tipsDoc?.tips || []).map((t) => ({
    id: t.id || t.slug,
    name: humanizeName(t.name || t.slug || t.id),
    bullets: Array.isArray(t.bullets) ? t.bullets : [],
  }));

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
    skill_passive: ctx.passiveSkills ? ctx.passiveSkills.length : 0,
    skill_active: activeSkills.length,
    items: itemsOut.length,
    recipes: recipesOut.length,
    item_categories: itemCategoryCounts,
    structure: structures.length,
    tech: technologies.length,
    work_stations: workStations.length,
    work_suitabilities: workSuitabilities.length,
    breeding_pals: breedingPals.length,
    drop_rows: dropRows.length,
    news: newsItems.length,
    base_tips: baseTips.length,
    search_entries: searchEntries.length,
  };
  for (const cat of ITEM_CATEGORIES) counts[cat.type] = itemsByCategory[cat.key].length;
  for (const wh of worldHub) counts["world_" + wh.key.replace(/-/g, "_")] = wh.count;

  // fix skill counts from arrays on ctx
  counts.skill_passive = (ctx.passiveSkills || []).length;

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
    world_sections: worldHub,
    sample_pal_path: palsBySlug.anubis ? palHref("Anubis") : palsOut[0]?.path || null,
    routing: "nested",
    default_pal_list_filter: "dex",
    vendor_policy: "import-latest-publish",
    phase: 8,
  };

  const manifest = {
    built_at: builtAt,
    phase: 8,
    source: {
      generated_at: catalog.generated_at || importMeta?.generated_at || null,
      tool_version: catalog.tool_version || importMeta?.tool_version || null,
      table_count: catalog.table_count ?? tables.length,
      import_meta: importMeta,
      validation_status: validation?.status || null,
    },
    tables,
    counts,
  };

  writeJson(path.join(outDir, "manifest.json"), manifest);
  writeJson(path.join(outDir, "site-meta.json"), siteMeta);
  writeJson(path.join(outDir, "search-index.json"), {
    built_at: builtAt,
    schema: { fields: ["name", "type", "slug", "path", "elements", "icon", "rank"] },
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
  writeJson(path.join(outDir, "skills-partner.json"), { count: partnerSkills.length, skills: partnerSkills });
  writeJson(path.join(outDir, "skills-partner-by-slug.json"), partnerBySlug);
  writeJson(path.join(outDir, "skills-passive.json"), { count: (ctx.passiveSkills || []).length, skills: ctx.passiveSkills || [] });
  writeJson(path.join(outDir, "skills-passive-by-slug.json"), ctx.passiveBySlug || passiveBySlug);
  writeJson(path.join(outDir, "skills-active.json"), { count: activeSkills.length, skills: activeSkills });
  writeJson(path.join(outDir, "skills-active-by-slug.json"), activeBySlug);
  writeJson(path.join(outDir, "items.json"), { built_at: builtAt, count: itemsOut.length, items: itemsOut });
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
    categories: [...new Set(structures.map((s) => s.category).filter(Boolean))].sort(),
    structures,
  });
  writeJson(path.join(outDir, "structures-by-slug.json"), structuresBySlug);
  writeJson(path.join(outDir, "technologies.json"), { count: technologies.length, technologies });
  writeJson(path.join(outDir, "technologies-by-slug.json"), technologiesBySlug);
  writeJson(path.join(outDir, "work-stations.json"), { count: workStations.length, work_stations: workStations });
  writeJson(path.join(outDir, "work-suitabilities.json"), {
    count: workSuitabilities.length,
    work_suitabilities: workSuitabilities,
  });
  writeJson(path.join(outDir, "san.json"), sanData);
  writeJson(path.join(outDir, "world-hub.json"), { sections: worldHub });
  for (const [key, data] of Object.entries(worldData)) {
    writeJson(path.join(outDir, "world-" + key + ".json"), {
      key,
      label: data.meta.label,
      blurb: data.meta.blurb,
      count: data.list.length,
      entities: data.list,
    });
    writeJson(path.join(outDir, "world-" + key + "-by-slug.json"), data.bySlug);
  }
  writeJson(path.join(outDir, "map-pois.json"), { count: mapPois.length, pois: mapPois });
  writeJson(path.join(outDir, "drops-browser.json"), { count: dropRows.length, rows: dropRows });
  writeJson(path.join(outDir, "breeding.json"), {
    count: breedingPals.length,
    note: breedingDoc?.note || "No full parent×parent matrix offline. CombiRank heuristic only.",
    pals: breedingPals,
  });
  writeJson(path.join(outDir, "base-tips.json"), { count: baseTips.length, tips: baseTips });
  writeJson(path.join(outDir, "news.json"), { count: newsItems.length, items: newsItems });
  writeJson(path.join(outDir, "tips.json"), { count: tipsList.length, tips: tipsList });
  if (statusEffects) writeJson(path.join(outDir, "status-effects.json"), statusEffects);

  console.log("Normalized →", outDir);
  console.log("counts:", JSON.stringify(counts));
  console.log("site-meta:", siteMeta.data_version, "validate:", siteMeta.validation_status);
};
