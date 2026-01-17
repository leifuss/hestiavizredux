# HestiaViz

A geo-reading interface for Herodotus's Histories, reconstructed from the original HESTIA/GapVis project.

## Overview

HestiaViz provides an interactive reading experience for Herodotus's *Histories*, linking the text with an interactive map. As you read through the narrative, place names are highlighted and shown on the map, allowing you to follow Herodotus's geographic imagination.

### Key Features

- **Three Views**: Summary (book index), Reading (text + map), and Place Detail
- **Bidirectional Linking**: Click places in text to see them on the map, click markers to highlight in text
- **Geographic Memory**: Shows places from previous chapters with decreasing opacity, visualizing the narrative's geographic arc
- **641 Places**: From the HESTIA Recogito annotations, linked to Pleiades gazetteer
- **9,115+ Annotations**: Comprehensive place references across all 9 books

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Data Sources

- **Text**: Godley translation from Perseus Digital Library, extracted from Recogito TEI-XML
- **Annotations**: HESTIA project annotations via Recogito (https://recogito.pelagios.org/document/tjrrsqn4dwmgep)
- **Gazetteer**: Pleiades (https://pleiades.stoa.org) and GeoNames

## Technical Stack

- React 19
- React Router (HashRouter for static hosting)
- Leaflet / React-Leaflet for maps
- Vite for build tooling
- Esri NatGeo World Map tiles (antiquarian aesthetic)

## Deployment

The built `dist/` folder can be deployed to any static host:

- GitHub Pages
- Netlify
- Vercel
- Any web server

## Project Structure

```
hestia-viz/
├── public/data/           # JSON data files
│   ├── books.json         # Book index
│   ├── book-{n}.json      # Place references by chapter
│   ├── book-{n}-text.json # Full text with inline place markers
│   └── places.json        # Gazetteer with coordinates
├── src/
│   ├── App.jsx            # Main app with routing
│   ├── components/
│   │   ├── SummaryView.jsx    # Book index with overview map
│   │   ├── ReadingView.jsx    # Main reading interface
│   │   ├── TextPanel.jsx      # Text display with place highlighting
│   │   ├── MapPanel.jsx       # Leaflet map with memory feature
│   │   └── PlaceDetailView.jsx # Individual place details
│   ├── index.css          # Scholarly warm palette styles
│   └── main.jsx           # Entry point
└── scripts/
    ├── transform-data.py  # Convert Recogito CSV to app JSON
    └── extract-text.py    # Extract text from TEI-XML
```

## The Memory Feature

The distinctive feature of HestiaViz is the "geographic memory" visualization. When reading chapter N, the map shows:

- **Current chapter places**: Full opacity, terracotta markers
- **Previous 10 chapters**: Decreasing opacity (0.9 → 0.1), blue-green markers

This visualization shows Herodotus's narrative movement through geographic space, making visible patterns like:
- Clustering of action in specific regions
- Transitions between geographic areas
- The "mental map" a reader builds while following the narrative

## Credits

- Original HESTIA project: Elton Barker, Stefan Bouzarovski, Christopher Pelling, Leif Isaksen
- GapVis: Nick Rabinowitz
- Annotations: HESTIA/Pelagios
- Text: Perseus Digital Library (Godley translation)

## License

Code: MIT
Data: See original HESTIA/Recogito/Perseus licenses
