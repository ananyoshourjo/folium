# Folium

Folium is a lightweight browser-based workspace for inspecting datasets created through AI-assisted research. Pair it with Codex: describe the data you need there, then review the resulting CSV in Folium.

Folium currently opens and displays local CSV files. The AI agent handles the research and enrichment; Folium is where you inspect the resulting data.

## Inspect your CSV

- Hover over a column header and click its filter icon for conditions, value selection, and sorting. Column filters combine with AND; conditions within a column can use AND/OR groups.
- Compare values as text, numbers, ISO dates, or booleans. Sort by several columns while preserving original row numbers.
- Recognize header icons automatically, choose another icon, and add custom header synonyms. Preferences persist in the same browser.
- Preview image links, view color swatches, and read formatted dates without changing the source values.

All controls affect the displayed view only. Folium does not write back to your CSV.

## Verify and release

Run `npm test`, `npm run lint`, `npm run release:check`, and `npm run build`.
Use `npm run release:version -- 0.2.0` to synchronize manifest and lockfile versions.
Release tags use `vPHASE.MAJOR.MINOR`; feature updates increment MAJOR, fixes increment MINOR, and PHASE changes only for lifecycle transitions.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
