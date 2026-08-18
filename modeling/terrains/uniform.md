---
title: Uniform Terrains
parent: Terrains
grand_parent: Simulation Environments
nav_order: 3
layout: home
---

# Uniform Terrains

A **uniform** terrain is one continuous walkable surface, rather than a grid of
tiles. Use it when the ground should be a single condition held constant across the
whole course: level, a fixed grade, or a rough surface without a specific layout.
This is the terrain family for steady-state locomotion, and the one the reflex CO
pipeline is designed around.

Select it with a top-level `"terrain"` string. That key is what distinguishes the two
config forms, so a uniform config never carries `grid` or `tiles`:

```json
{ "msk": "myolegs22", "device": "Humotech_L1", "terrain": { "terrain": "slope", "deg": 8 } }
```

## The four types

| `terrain` | Surface | Geometry |
|---|---|---|
| `"flat"` | Level ground | One effectively infinite plane |
| `"slope"` | A constant grade | One tilted plane, rising in `+x` |
| `"random"` | Rough ground | One heightfield of per-cell noise |
| `"sinusoidal"` | Rolling waves | One heightfield, a sinusoid along `+x` |

`flat` and `slope` are planes, so they extend as far as the model can walk. `random`
and `sinusoidal` are heightfields covering `extent x extent` metres, with a smooth
**safe zone** flattened around the origin so a model does not spawn on a bump or in a
pit.

## Every field

Only `terrain` is required. Everything else has a default, and a field that does not
apply to the chosen type is ignored.

| Key | Default | Applies to | Meaning |
|---|---|---|---|
| `terrain` | required | all | `"flat"`, `"slope"`, `"random"` or `"sinusoidal"`. |
| `terrain_name` | `"uniform_<terrain>"` | all | Output name. Must be a bare file name, since it becomes `terrain/<terrain_name>.xml`. |
| `deg` | `0.0` | `slope` | Grade in degrees, `-90 < deg < 90`. Positive rises in `+x`, the walking direction. |
| `amplitude` | `0.1` | `random`, `sinusoidal` | Surface relief in metres. Must be greater than 0. |
| `period` | `1.0` | `sinusoidal` | Wavelength along `+x` in metres. Must be greater than 0. |
| `seed` | `0` | `random` | RNG seed, so a rough surface is reproducible. |
| `extent` | `20.0` | `random`, `sinusoidal` | Full side length of the surface in metres. |
| `resolution` | `256` | `random`, `sinusoidal` | Heightfield grid resolution, same in both axes. Minimum 8. |
| `safe_zone_radius` | `3.0` | `random`, `sinusoidal` | Radius in metres over which the surface is flattened toward 0 around the origin. `0` disables it. |
| `base_depth` | `1.0` | `random`, `sinusoidal` | Solid thickness below the surface in metres. |
| `palette_preset` | `"uniform"` | all | `"diverse"`, `"uniform"` or `"custom"`. |
| `palette` | `{}` | all | Surface rgba, under the key `"uniform"`, `"terrain"`, or the terrain type name. |
| `texture` | none | all | A texture block, as described in [Configuration](configuration). |

## Choosing `resolution` and `extent` together

These two set the cell size, and the cell size is what the surface actually feels
like underfoot. `random` is noise **at cell scale**: neighbouring samples differ by up
to `amplitude`, so the cell size sets the wavelength of the roughness.

At the defaults, `extent = 20` over `resolution = 256` gives cells of about 8 cm.
That is fine-grained rubble. For longer-wavelength undulation at the same relief,
raise `extent` or lower `resolution`:

```json
{ "terrain": "random", "amplitude": 0.08, "extent": 20.0, "resolution": 64 }
```

which gives roughly 32 cm cells. `sinusoidal` is smooth, so its shape comes from
`period` and `resolution` only needs to be fine enough to resolve it.

## Typos are rejected

Unknown keys are errors. This is worth stating plainly, because the failure it
replaces was silent:

```json
{ "terrain": "slope", "dge": 8 }
```

used to build **flat ground** and pass validation, so a run completed and reported
numbers for a grade that was never there. It now fails with the offending key named.
Prefix a key with `_` if you want to keep it as a comment.

## Asking where the ground is

A uniform surface still answers the surface-height queries, so the same code works
whether the terrain is uniform or tiled:

```python
from myoassist_terrains import surface_height_at

z = surface_height_at(config, x=4.0, y=0.0)   # on an 8 degree slope: about 0.56
```

See [Configuration](configuration#asking-where-the-ground-is) for the footprint
variant and why this is preferable to measuring a compiled model.

Velocity maps are the one thing that needs a tiled terrain: they sample per cell, and
a uniform surface has no cells. Passing one is rejected with a message saying so.
