---
title: Configuration
parent: Terrains
grand_parent: Simulation Environments
nav_order: 2
layout: home
---

# Terrain Configuration

A terrain is described by a JSON config. Give this config to the `terrain` field of
an [environment spec](../../getting-started/defining-an-environment), inline or as a
path to a file. The full schema is below. Only `terrain_name` and `grid` are
required.

```jsonc
{
  // Required. The output XML is written as terrain/<terrain_name>.xml.
  "terrain_name": "string",

  // Required. Grid dimensions and per-tile size in meters.
  "grid": {
    "rows": 3,
    "cols": 3,
    "tile_size": [8.0, 8.0]
  },

  // Optional. Connector strip between tiles. width = 0 disables connectors.
  "border": {
    "width": 0.5,
    "match_mode": "min"  // "min" | "max" | "mean"
  },

  // Optional. "diverse" (per-tile colors), "uniform" (single color from
  // terrain_style.xml), or "custom" (per-type overrides in `palette`).
  "palette_preset": "diverse",

  // Optional. Used by "custom", or to override individual colors in "diverse"
  // mode. Keys are tile type names (or "connector").
  "palette": {
    "stairs": [0.3, 0.5, 0.85, 1.0]
  },

  // Optional. Bind a 2D texture to the uniform-mode material.
  "texture": {
    "file": "CONCRETE.png",            // relative to the project root
    "name": "terrain_concrete",
    "repeat": [0.5, 0.5],
    "texuniform": true
  },

  // Explicit per-cell placements. Combine with `randomization` to fill the
  // rest of the grid.
  "tiles": [
    { "row": 0, "col": 0, "type": "flat", "params": { "height": 0.0 } }
  ],

  // Optional. Sampling spec for any cell not covered by `tiles`.
  "randomization": {
    "seed": 42,
    "weights": { "flat": 0.5, "stairs": 0.3, "rough": 0.2 },
    "param_ranges": {
      "stairs":  { "n_steps": [4, 10], "axis": ["x", "y"] },
      "rough":   { "vertical_relief": [0.3, 1.0] }
    }
  }
}
```

See [Tile Types](tile-types) for every tile `type` and its `params`.
