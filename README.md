# GeoGuessr-Style Map Prototype

Front-end prototype focused on interactive map navigation and guess placement.

## Tech Stack

- React + Vite
- Leaflet + React Leaflet
- OpenStreetMap tiles

## Implemented Features

- Interactive world map with pan and zoom
- Click anywhere to place a guess marker
- Click another location to move the marker
- Stored guess coordinates in app state (`lat`, `lng`)
- `Confirm Guess` button (front-end only)
- `Reset Marker` button
- Responsive layout for laptop and smaller screens
- Animated custom marker for visual feedback

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Scope Notes

- No authentication
- No rounds/gameplay loop
- No scoring
- No backend integration
