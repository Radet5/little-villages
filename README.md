# little-villages

A procedural medieval village generator, rendered in the browser with PIXI.js. Give it a seed string and it lays out wards, subdivides them into building lots, derives a street network from the lot edges, and turns villagers loose to walk it.

Click anywhere on the map to drop a new ward site — the village regenerates around it and every villager re-routes from wherever they were standing.

## How a village gets built

1. **Seeded points** — a string seed drives xmur3/mulberry32 PRNGs, so the same seed always produces the same village.
2. **Wards** — a Delaunay/Voronoi mesh over those points, clipped to the village bounds. Each Voronoi cell becomes a ward, named from three seeded word lists (so you get "Amber Meadow" rather than "Ward 3").
3. **Lots** — each ward polygon is recursively subdivided until every piece falls under a target area. Split orientation comes from an **oriented minimum bounding box** (rotating calipers), so lots follow the ward's actual shape instead of being cut along the world axes. Sutherland–Hodgman handles the clipping.
4. **Streets** — lot boundaries become street segments. Subdivision produces duplicate and collinear edges along shared boundaries, so overlapping segments are detected and merged back into single streets.
5. **Graph** — unique street corners become intersection nodes, assembled into an adjacency matrix of the walkable network.
6. **Villagers** — each one picks a destination and walks the graph, pathing with Dijkstra plus an optional distance-to-goal heuristic (A*-ish) when node positions are available. Age affects speed: children move faster, the old move slower. Sprites and walk animations are chosen by age and gender presentation.

## Stack

TypeScript · PIXI.js 7 · Vite · [@thi.ng](https://thi.ng) geom / geom-voronoi / geom-clip-poly / adjacency / vectors

## Run

```sh
yarn install
yarn dev
```

Seed, population and village dimensions are constants at the top of `src/main.ts`.

## State

A generator and a simulation of walking, not a game yet. `villagerPersonalityData.ts` holds a cast of villagers with traits, professions and skill levels, but nothing reads it — the intent was for professions to drive where a villager goes and why, and that layer is not built.

## Credits

The oriented-minimum-bounding-box implementation is adapted from [David Geier's rotating calipers write-up](https://geidav.wordpress.com/2014/01/23/computing-oriented-minimum-bounding-boxes-in-2d/).
