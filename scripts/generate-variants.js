const fs = require('fs');
const path = require('path');

function parseSimpleYAML(text) {
  const result = {};
  const lines = text.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!line.startsWith(' ')) {
      const key = line.replace(':','').trim();
      current = key;
      result[current] = {};
    } else if (current) {
      const m = line.trim().split(':');
      if (m.length >= 2) {
        const zone = m[0].trim();
        const arr = m.slice(1).join(':').trim();
        const values = arr.replace(/^\[|\]$/g,'').split(/\s*,\s*/);
        result[current][zone] = values;
      }
    }
  }
  return result;
}

const familiesPath = path.join(__dirname, '..', 'palettes', 'families.json');
const zoneMapPath = path.join(__dirname, '..', 'palettes', 'zone_palette_map.yaml');
const schemaMapPath = path.join(__dirname, '..', 'palettes', 'emoji_schemas.json');
const emojiDataPath = path.join(__dirname, '..', 'emoji-data.json');

const families = JSON.parse(fs.readFileSync(familiesPath, 'utf8'));
const zoneMap = parseSimpleYAML(fs.readFileSync(zoneMapPath, 'utf8'));
const emojiSchemas = JSON.parse(fs.readFileSync(schemaMapPath, 'utf8'));
const emojiData = JSON.parse(fs.readFileSync(emojiDataPath, 'utf8'));

const emojiByImage = {};
emojiData.forEach(e => {
  const key = e.image.replace('.png', '').toLowerCase();
  emojiByImage[key] = e;
});

function deduceSchema(code) {
  if (emojiSchemas[code]) return emojiSchemas[code];
  const entry = emojiByImage[code];
  if (!entry) return 'default';
  const sub = entry.subcategory || '';
  if (sub === 'animal-bird') return 'bird_body';
  if (sub === 'plant-flower' || sub === 'plant-other') return 'plant';
  if (sub.startsWith('transport-')) return 'vehicle';
  if (sub === 'animal-mammal' || sub === 'monkey-face' || sub === 'cat-face') return 'mammal_head';
  return 'default';
}

// union of all zones across schemas so CSV has consistent columns
const allZones = new Set();
Object.values(zoneMap).forEach(schema => {
  Object.keys(schema).forEach(z => allZones.add(z));
});
const zones = Array.from(allZones);

const svgDir = path.join(__dirname, '..', 'assets', 'svg');
const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg')).sort();

const variants = 5;

let csvLines = [];
const header = ['emoji','variant'].concat(zones).join(',');
csvLines.push(header);

for (const file of files) {
  const codepoint = path.basename(file, '.svg');
  const schemaName = deduceSchema(codepoint);
  const schema = zoneMap[schemaName] || zoneMap['default'];
  for (let i = 0; i < variants; i++) {
    const row = [codepoint, i + 1];
    for (const zone of zones) {
      const familiesSeq = schema[zone];
      const familyName = familiesSeq ? familiesSeq[i] : null;
      const family = familyName ? families[familyName] : null;
      const color = family ? family[i] : '';
      row.push(color);
    }
    csvLines.push(row.join(','));
  }
}

const outPath = path.join(__dirname, '..', 'twemoji_zone_variants.csv');
fs.writeFileSync(outPath, csvLines.join('\n'));
console.log('Wrote', outPath, 'with', csvLines.length-1, 'rows');
