---
title: Defining an Environment
parent: Getting Started
nav_order: 1
layout: home
---

# Defining an Environment

In MyoAssist, an **environment** is a human musculoskeletal (MSK) model, an assistive
**device**, and a **terrain**, composed into one MuJoCo model. The same definition
drives both pipelines: reflex **Controller Optimization (CO)** and **Reinforcement
Learning (RL)**. You describe an environment once and run it either way.

## The environment spec

An environment has three fields. Each field is a **raw registry key**, not a
free-form path:

```json
{ "msk": "myolegs22", "device": "Humotech_L1", "terrain": { "terrain": "slope", "deg": 8 } }
```

| Field | What it is | Examples |
|-------|------------|----------|
| `msk` | human MSK model | `myolegs22`, `myolegs26` |
| `device` | assistive device | `DephyExoBoot_L1`, `Humotech_L1`, `OpenSourceLeg_A_L1`, `Tutorial_L1` |
| `terrain` | the ground (optional) | omit for flat; an inline config; or a terrains JSON path |

Run **`python -m assist_sim list`** to see every MSK and device that is installed,
and which pairs are compatible.

### MSK models

| Key | Description |
|-----|-------------|
| `myolegs22` | 22-muscle **2D** (sagittal-plane) lower limb |
| `myolegs26` | 26-muscle **3D** lower limb |

The muscle count and the 2D or 3D control mode come from `msk`. You do not set them
separately.

### Devices

Devices include ankle and knee exoskeletons (for example `DephyExoBoot_L1`,
`Humotech_L1`, `OpenExo_L1`, `UTAnkleExo_L2`, `HMEDI_L1`), robotic prosthetic legs
(for example `OpenSourceLeg_A_L1`, `OpenSourceLeg_KA_L1`), and a passive
`Tutorial_L1` for demos and baselines. `python -m assist_sim list` prints the
authoritative installed set. `python -m assist_sim validate <msk> <device>` checks
one pair.

### Terrain

Leave `terrain` unset (or `null`) for a flat, effectively-infinite ground plane.
Otherwise give one of the following.

A **uniform surface** (one plane or one heightfield):

| `terrain` | Result |
|-----------|--------|
| `{ "terrain": "flat" }` | a flat plane |
| `{ "terrain": "slope", "deg": 8 }` | a constant 8° incline (a tilted plane) |
| `{ "terrain": "random", "amplitude": 0.06 }` | a rough heightfield, up to 6 cm relief |
| `{ "terrain": "sinusoidal", "amplitude": 0.05, "period": 1.0 }` | rolling waves |

A **tiled grid**: a [terrain config](../modeling/terrains/configuration) with a `grid`
and per-cell `tiles`. Tile types are `flat`, `slope`, `stairs`,
`pyramid_stairs`, `rough`, `boulders`, `stepping_stones`, `discrete_obstacles`, and
`gap`. You can fill empty cells with `randomization`. Give the config inline or as a
path to a JSON file:

```json
"terrain": {
  "grid": { "rows": 1, "cols": 3, "tile_size": [4.0, 4.0] },
  "border": { "width": 0.5 },
  "tiles": [
    { "row": 0, "col": 0, "type": "flat",   "params": { "height": 0.0 } },
    { "row": 0, "col": 1, "type": "slope",  "params": { "angle_deg": 8.0, "axis": "x" } },
    { "row": 0, "col": 2, "type": "stairs", "params": { "n_steps": 5, "step_height": 0.1, "axis": "x" } }
  ]
}
```

The terrain sets the course grade. A `slope` terrain is the incline, and the
evaluation camera, cost, and readouts derive the angle from it. There is no separate
slope flag.

> **Reflex CO is for steady-state locomotion.** A constant slope is fine. Do not use
> the reflex controller to optimize over variable terrain (rough, stairs, mixed
> tiles). Use variable terrain with RL, or for visualization.

## Using an environment spec

### Controller Optimization (reflex)

```bash
# raw flags
python -m ctrl_optim.optim.train --msk myolegs22 --device Humotech_L1 \
    --terrain '{"terrain":"slope","deg":8}' --sim_time 20 -eff --ExoOn 1 ...

# or a shared env-spec file
python -m ctrl_optim.optim.train --env-spec docs/examples/env_exo_slope.json --sim_time 20 -eff --ExoOn 1 ...
```

There is no `--model`, `--musc_model`, or `--tgt_slope`. The `--msk` and `--device`
flags define the model, and the terrain defines the grade.

### Reinforcement Learning

Set the same three fields on `env_params` in your training-config JSON:

```json
"env_params": { "msk_key": "myolegs22", "device_key": "Humotech_L1", "terrain": null }
```

### Programmatically

```python
from myoassist_utils.env_spec import EnvSpec

spec = EnvSpec.load("docs/examples/env_exo_slope.json")
# or: EnvSpec(msk="myolegs22", device="Humotech_L1", terrain={"terrain": "slope", "deg": 8})

spec.validate()          # checks keys against the registry; raises with valid options on a bad key
xml = spec.compose()     # returns a loadable MuJoCo MJCF string
spec.compose(export_path="my_env.xml")   # also writes a standalone, loadable file
```

## Discovering and validating

```bash
python -m assist_sim list                       # every installed MSK / device + compatibility
python -m assist_sim validate myolegs22 Humotech_L1
```

`EnvSpec.validate()` does the same check in code. It raises a `ValueError` that lists
the valid options when a key is unknown or the MSK and device pair is incompatible.

## Ready-to-use examples

The `docs/examples/` directory in the
[myoassist repo](https://github.com/neumovelab/myoassist/tree/main/docs/examples) has
runnable env-specs:

| File | Environment |
|------|-------------|
| `env_exo_flat.json` | `myolegs22` + `Humotech_L1`, flat |
| `env_exo_slope.json` | `myolegs22` + `Humotech_L1`, 8° slope |
| `env_prosthesis_rough.json` | `myolegs22` + `OpenSourceLeg_A_L1`, rough heightfield |
| `env_tiled_course.json` | `myolegs22` + `Humotech_L1`, a flat, slope, and stairs tiled course |
| `env_tiled_random.json` | `myolegs22` + `OpenExo_L1`, a randomized 3×3 tiled grid |
