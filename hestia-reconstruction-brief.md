# HestiaVis Reconstruction Brief

## Project Goal

Reconstruct a functional geo-reading interface for Herodotus's Histories, based on the now-defunct HestiaVis/GapVis project. This is not a pixel-perfect recreation but a functional equivalent that preserves the core scholarly utility: reading ancient text with interactive place visualization.

## Background

HestiaVis was an adaptation of GapVis (Google Ancient Places Visualization), a Backbone.js application for geo-reading classical texts. The original is dead (OU server shutdown, Google Maps API changes). Source code exists at:

- **GapVis original**: https://github.com/nrabinowitz/gapvis (BSD license)
- **HESTIA fork with API spec**: https://github.com/enridaga/gapvis (includes full JSON API documentation in README)
- **Hellespont fork**: https://github.com/karen-sch/gapvis (documents backend reconnection)

Do NOT try to resurrect the Backbone.js codebase. Build fresh with modern tooling.

## Architecture: Three Views

The original had three interconnected views. Preserve this structure:

### 1. Summary View (Index)
- List of books with place density indicators
- Small overview map showing all places mentioned in selected book
- Click book → opens Reading View for that book

### 2. Reading View (Core Interface)
- **Split panel**: Text on left, map on right
- **Text panel**: 
  - Book/chapter navigation
  - Place names highlighted and clickable
  - Current chapter clearly indicated
- **Map panel**:
  - Interactive map with place markers
  - Clicking marker highlights all occurrences in visible text
  - Clicking place name in text pans map to location
- **"Memory" feature** (important): Show places from the *previous N chapters* (originally ~10) with decreasing opacity. Most recent = full opacity, older = increasingly transparent. This gives a sense of Herodotus's geographic narrative arc—where he's been, where he's going.

### 3. Place Detail View
- Accessed by clicking "more info" on a place (or double-click)
- Shows:
  - Place name and description
  - All occurrences in the text (book.chapter references, clickable)
  - Link to Pleiades gazetteer entry
  - Coordinates
  - Optionally: co-occurrence list (other places mentioned in same chapters)

## Technical Stack

### Mapping
- **Use Leaflet.js** (not Google Maps—avoids API key complexity)
- Recommended tile layers:
  - Esri NatGeo: `https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}` (antiquarian aesthetic)
  - OpenStreetMap: standard fallback
  - Stamen Terrain: good for topography
- Center: approximately 38°N, 28°E (Aegean/Anatolia focus)
- Zoom range: 3-12

### Frontend
- **React** (recommended) or vanilla JS
- No heavy frameworks needed—this is fundamentally a text viewer with a map
- Client-side routing for deep links to specific books/chapters/places
- Responsive: should work on tablet, though desktop is primary

### Data
- **Static JSON files** served alongside the app (no backend needed)
- Structure follows GapVis conventions (see Data Format below)
- Can be hosted on GitHub Pages, Netlify, or any static host

## Data Format

The application expects these JSON structures:

### books.json
```json
{
  "books": [
    {
      "id": 1,
      "title": "Book I: Clio",
      "chapterCount": 216,
      "placeCount": 847
    }
  ]
}
```

### book-{id}.json (one per book)
```json
{
  "id": 1,
  "title": "Book I: Clio",
  "chapters": [
    {
      "id": 1,
      "text": "This is the display of the inquiry...",
      "places": [
        {
          "name": "Halicarnassus",
          "startOffset": 42,
          "endOffset": 55,
          "placeId": "599588"
        }
      ]
    }
  ]
}
```

### places.json
```json
{
  "places": {
    "599588": {
      "id": "599588",
      "name": "Halicarnassus",
      "lat": 37.0379,
      "lng": 27.4241,
      "pleiadesUri": "https://pleiades.stoa.org/places/599588",
      "description": "Birthplace of Herodotus, in Caria",
      "occurrences": [
        {"book": 1, "chapter": 1},
        {"book": 7, "chapter": 99}
      ]
    }
  }
}
```

**Note on place IDs**: Use Pleiades IDs where available. For places without Pleiades entries (some ethnonyms, mythological places), use a prefixed ID like `hestia-ionians`.

## Data Sources

The annotation data may come from:

1. **Recogito export** (most likely): https://recogito.pelagios.org/document/tjrrsqn4dwmgep contains what appears to be the HESTIA Herodotus annotations (~9,115 annotations). Export as CSV or JSON, then transform.

2. **Fresh NER + reconciliation**: If Recogito data is incomplete, run NER on Perseus Herodotus TEI-XML using spaCy or similar, then reconcile against Pleiades.

3. **User-provided data**: The project owner (Leif) may supply preprocessed JSON or PostGIS exports.

**Text source**: Perseus Digital Library Herodotus (CC-licensed). TEI-XML at https://github.com/PerseusDL/canonical-greekLit

## UI/UX Guidelines

### Visual Style
- Scholarly but not stuffy
- Warm palette: cream/parchment backgrounds (#f7f3eb), terracotta accents (#c45a3b), dark brown text (#2c2417)
- Serif typography for text (Crimson Text, Palatino, or similar)
- Sans-serif for UI chrome (kept minimal)

### Interactions
- Hover states: place names highlight on hover, corresponding marker pulses/enlarges
- Click states: selected place stays highlighted in both text and map
- Map tooltips: show place name on marker hover
- Smooth pan/zoom on map when selecting places

### The "Memory" Effect (Important)
When viewing chapter N, also display markers for chapters N-1 through N-10 with opacity gradient:
- Chapter N: opacity 1.0 (full)
- Chapter N-1: opacity 0.9
- Chapter N-2: opacity 0.8
- ...
- Chapter N-10: opacity 0.1

Use a different marker style (smaller, or outline-only) for "memory" places vs current-chapter places. This is the distinctive feature that made HestiaVis useful for understanding Herodotus's geographic imagination.

## Deployment

- Static site deployment (GitHub Pages, Netlify, Vercel)
- No server-side requirements
- Single-page application with client-side routing
- Deep links should work: `/book/1/chapter/46` or `/place/599588`

## Out of Scope (for initial version)

- Network co-occurrence visualization (was in original but complex)
- Timeline view
- Search functionality
- Multiple text support (just Herodotus for now)
- User annotations
- Mobile-optimized view

## Files to Generate

1. `index.html` - entry point
2. `src/App.jsx` - main React component with routing
3. `src/components/SummaryView.jsx` - book index view
4. `src/components/ReadingView.jsx` - main text+map interface
5. `src/components/PlaceDetailView.jsx` - individual place view
6. `src/components/Map.jsx` - Leaflet map component
7. `src/components/TextPanel.jsx` - text display with place highlighting
8. `src/data/` - JSON data files (or fetch from separate data directory)
9. `package.json` - dependencies (react, react-router-dom, leaflet, react-leaflet)
10. `vite.config.js` - build configuration
11. Basic CSS/styles

## Reference Screenshots

The original interface can be viewed via Wayback Machine (non-functional but shows layout):
https://web.archive.org/web/20150328003817/http://www2.open.ac.uk/openlearn/hestia/index.html

## Key Insight

The scholarly value is in the **bidirectional linking** between text and space, and the **temporal-geographic narrative** shown by the memory effect. The visualization makes visible how Herodotus moves through geographic space as he moves through narrative time. This is what makes it more than just a gazetteer lookup tool.
