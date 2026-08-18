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
path to a file. The full schema is below.

`terrain_name` and `grid` are required, and so is at least one of `tiles` or
`randomization`: a grid with no way to fill its cells is rejected.

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

  // Optional. Keys are tile type names (or "connector"). "custom" requires an
  // entry for every placed type; "diverse" takes them as overrides. Under
  // "uniform", use the single key "uniform" instead, since one shared color
  // cannot take per-type entries.
  "palette": {
    "stairs": [0.3, 0.5, 0.85, 1.0]
  },

  // Optional, and "uniform" mode only. Bind a 2D texture to the shared material.
  "texture": {
    "file": "CONCRETE.png",            // relative to the project root
    "name": "terrain_concrete",
    "repeat": [0.5, 0.5],
    "texuniform": true
  },

  // Explicit per-cell placements. One tile per cell: two entries for the same
  // (row, col) is an error. Combine with `randomization` to fill the rest.
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

---

## Your config is validated

A terrain config describes an experiment, so the framework rejects mistakes rather
than working around them. The case that motivated this: `{"terrain": "slope", "dge": 8}`
used to build **flat ground** and report success, so a run finished and produced
numbers for a course that was never built.

Rejected, with a message naming the problem:

- **Unknown keys**, in either config form. Prefix a key with `_` to keep it as a
  comment.
- **Unknown tile `params`**, reported with the tile type and the cell.
- **Two tiles in one cell.**
- **A `texture` outside `palette_preset: "uniform"`**, which used to be discarded
  along with any typo in its path.
- **Per-type `palette` entries under `"uniform"`**, which cannot apply to one shared
  color.
- **`palette_preset: "custom"` missing a color** for a placed tile type.
- **Randomizing a list-valued parameter** such as `size_range`. A `[lo, hi]` spec
  would be read as a range and replace the list with a single number.
- **Reversed numeric ranges** in `param_ranges`.
- **A `terrain_name` that is not a bare file name**, since it becomes
  `terrain/<terrain_name>.xml`.

## Asking where the ground is

If you need the surface height at a point, for example to place something on the
terrain, ask the terrain package rather than probing a compiled model:

```python
from myoassist_terrains import max_surface_height_in, surface_height_at

z = surface_height_at(config, x=1.5, y=-2.0)                     # a point
foot_z = max_surface_height_in(config, x=1.5, y=-2.0, radius=0.12)  # a footprint
```

Both take a config, not a model, and both work for uniform and tiled terrain. Use the
footprint query for anything with extent: a point query between two stepping stones
reports the base slab, which is not where a foot would rest.

This is how MyoAssist seats a model at reset. It matters because the alternative,
measuring the ground from a compiled model's collision geometry, is unreliable at the
contact margins needed to find the surface at all, and produced models that started
episodes buried in their terrain.
