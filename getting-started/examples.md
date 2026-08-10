---
title: Examples
parent: Getting Started
nav_order: 3
layout: home
---

# Environment Spec Examples

Each example is a complete environment spec: a human MSK model, an assistive device,
and a terrain. Both the Controller Optimization and Reinforcement Learning pipelines
can use it. See [Defining an Environment](defining-an-environment) for the field
reference. These specs also ship in the `docs/examples/` folder of the
[myoassist repo](https://github.com/neumovelab/myoassist/tree/main/docs/examples).

| Example | MSK | Device | Terrain |
|---------|-----|--------|---------|
| Exoskeleton, flat | `myolegs22` | `Humotech_L1` | flat |
| Exoskeleton, slope | `myolegs22` | `Humotech_L1` | 8° slope |
| Prosthesis, rough | `myolegs22` | `OpenSourceLeg_A_L1` | rough heightfield (6 cm) |
| Tiled course | `myolegs22` | `Humotech_L1` | flat, slope, and stairs |
| Random tiled grid | `myolegs22` | `OpenExo_L1` | randomized 3×3 grid |

## Exoskeleton on flat ground

```json
{ "msk": "myolegs22", "device": "Humotech_L1" }
```

## Exoskeleton on an 8° slope

```json
{
  "msk": "myolegs22",
  "device": "Humotech_L1",
  "terrain": { "terrain": "slope", "deg": 8 }
}
```

## Prosthesis on rough ground

```json
{
  "msk": "myolegs22",
  "device": "OpenSourceLeg_A_L1",
  "terrain": { "terrain": "random", "amplitude": 0.06 }
}
```

## Tiled course (flat, slope, stairs)

```json
{
  "msk": "myolegs22",
  "device": "Humotech_L1",
  "terrain": {
    "terrain_name": "mixed_course",
    "grid": { "rows": 1, "cols": 3, "tile_size": [4.0, 4.0] },
    "border": { "width": 0.5, "match_mode": "min" },
    "palette_preset": "uniform",
    "tiles": [
      { "row": 0, "col": 0, "type": "flat",   "params": { "height": 0.0 } },
      { "row": 0, "col": 1, "type": "slope",  "params": { "angle_deg": 8.0, "axis": "x", "plateau_ratio": 0.1 } },
      { "row": 0, "col": 2, "type": "stairs", "params": { "n_steps": 5, "step_height": 0.1, "peak_width": 0.4, "axis": "x" } }
    ]
  }
}
```

## Randomized 3×3 tiled grid

```json
{
  "msk": "myolegs22",
  "device": "OpenExo_L1",
  "terrain": {
    "terrain_name": "random_course_3x3",
    "grid": { "rows": 3, "cols": 3, "tile_size": [8.0, 8.0] },
    "border": { "width": 0.5, "match_mode": "min" },
    "palette_preset": "diverse",
    "tiles": [
      { "row": 1, "col": 1, "type": "flat", "params": { "height": 0.0 } }
    ],
    "randomization": {
      "seed": 17,
      "weights": { "rough": 0.4, "stairs": 0.2, "slope": 0.2, "stepping_stones": 0.2 }
    }
  }
}
```

## Using an example

```bash
# Controller Optimization (reflex)
python -m ctrl_optim.optim.train --env-spec docs/examples/env_exo_slope.json --sim_time 20 -eff --ExoOn 1 ...
```

```python
# Programmatically
from myoassist_utils.env_spec import EnvSpec

spec = EnvSpec.load("docs/examples/env_exo_slope.json").validate()
xml = spec.compose()   # returns a loadable MJCF string
```

To make your own, copy an example and change the keys. Run `python -m assist_sim list`
for every valid MSK and device, and see
[Defining an Environment](defining-an-environment) for the terrain field.
