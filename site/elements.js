const ELEMENT_MAP = {
  earth: "Ground",
  ground: "Ground",
  leaf: "Grass",
  grass: "Grass",
  electricity: "Electric",
  electric: "Electric",
  normal: "Neutral",
  neutral: "Neutral",
  water: "Water",
  fire: "Fire",
  ice: "Ice",
  dark: "Dark",
  dragon: "Dragon",
};

function normalizeElement(el) {
  if (el == null || el === "") return null;
  const key = String(el).trim().toLowerCase();
  return ELEMENT_MAP[key] || String(el).trim();
}

function normalizeElements(input) {
  if (input == null) return [];
  let list = input;
  if (typeof input === "string") {
    list = input.split(/[\s,/|]+/).filter(Boolean);
  }
  if (!Array.isArray(list)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const n = normalizeElement(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

module.exports = { normalizeElement, normalizeElements, ELEMENT_MAP };
