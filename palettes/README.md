# Palette System

This folder contains the data used by `scripts/generate-variants.js` to build colour variants for every emoji.

- **families.json** – lists named colour families. Each family provides five swatches, one for each generated variant.
- **zone_palette_map.yaml** – maps schema zone names to a sequence of families. The nth family supplies the colour for variant n.
- **emoji_schemas.json** – optional per-emoji overrides. Most emojis are automatically classified using `emoji-data.json`.

Run `node scripts/generate-variants.js` to create `twemoji_zone_variants.csv`.
