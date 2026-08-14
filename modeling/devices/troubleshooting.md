---
title: Troubleshooting
parent: Assistive Devices
grand_parent: Simulation Environments
nav_order: 8
layout: home
---

# Troubleshooting

This page lists common errors and their fixes. If you find an error that is not in
this list, read the error message first. Every error message carries a
`did you mean ...` suggestion and the name of the YAML section that holds the
incorrect reference.

## Install / import

### `ResolutionImpossible` or a `mujoco` / `dm-control` conflict during install

MyoAssist installs with `uv`, not plain `pip`. If you run `pip install -e .`, the resolver
stops with a conflict about `mujoco` or `dm-control`. MyoSuite pins older versions in its
metadata, and the `pyproject.toml` override that relaxes them is only read by `uv`. Install
uv and use it:

```bash
pip install uv
uv pip install -e .
```

### `ImportError: ... myo_sim ... is not installed`

`myo_sim` composes the musculoskeletal (MSK) models. `assist_sim` gets them through
`myo_sim.load_spec(...)`. Install it from PyPI:

```bash
pip install myo-sim
```

### `ImportError: MSK model '...' requires ... mujoco>=3.3.4`

The pipeline does the model surgery in memory with `MjSpec.delete`. MuJoCo 3.3.4 is
the first version that has `MjSpec.delete`. Your environment has an older MuJoCo
version. To upgrade, run `pip install "mujoco>=3.3.4"`.

### `ModuleNotFoundError: No module named 'assist_sim'`

`assist_sim` is not on `sys.path`. Use one of these two fixes:

- Run `uv pip install -e .` from the root of the repository.
- Or run scripts that call `sys.path.insert(0, repo_root)`. The scripts in
  `examples/` do this.

## Config / resolution

### `ValueError: Unknown MSK model 'myoleg22'`

The MSK key has a spelling error. The error message includes a
`Did you mean 'myolegs22'?` suggestion. The keys are case-sensitive.

### `ValueError: Unknown device 'OSL'`

The device key has a spelling error. Try `OpenSourceLeg_A_L1` or the alias `OSL_A`.
The command `python -m assist_sim list` shows every key.

### `ValueError: Device 'X' is not compatible with MSK 'Y'`

The YAML of the device sets a `compatible_msk:` list, and `Y` is not in it. Use one
of these two fixes:

- Select a compatible MSK model. The error message lists them.
- Or, if `Y` must be compatible, add `Y` to the list, or remove the
  `compatible_msk:` field from the device YAML.

### `ValueError: tendon_modifications references unknown tendon '...'`

The YAML names a tendon that the MSK model does not have. A common cause is a
`default:` block that you wrote for 22 or 26 and then applied to 80. The 80-muscle
lineage splits the lumped muscles and uses different names. To fix this, write
80-muscle entries under `myolegs:`, or add an empty `myolegs: []` override to
disable the block:

```yaml
tendon_modifications:
  default: [...]
  myolegs: []
```

`myofullbody` uses the same 80-muscle leg, so it usually takes the same block. A
YAML anchor keeps the two blocks equal. The same applies to an unknown wrap site,
wrap geom, or `new_body`: the fix is per-MSK entries or an empty override. See
[Per-MSK Overrides](per-msk-overrides).

### `ValueError: wrap edit op 'drop_site' is no longer supported`

`drop_site` is retired. It raises an error instead of a skip, so a surgical edit
that you believe is applied always has an effect, or it tells you that it failed.
The four active operations are `reposition_site`, `replace_site`,
`reposition_geom`, and `replace_geom`. To remove a muscle, use `actuator_removals`
plus `tendon_removals`.

### A re-anchored muscle starts outside its own length range

`tendon_modifications` changes the path of a muscle, but the compiler keeps the
authored `lengthrange` (`LRopt.useexisting=1`). Calculate the range again, then set
it in the `actuator_overrides:` section:

```yaml
actuator_overrides:
  default:
    - name: "gastroc_r"
      lengthrange: [0.202513, 0.229413]
```

The name resolves bare first, then with the device prefix.

### A muscle disappears that you expected surgery to keep

`spec.delete(body)` cascades. It removes the subtree and every element that
references it, which includes each tendon with a wrap point on a removed body. The
surgery keeps some biarticular muscles, such as `hamstrings` across a transfemoral
amputation and `gastroc` across a transtibial amputation. The cascade also removes
these muscles if you do not re-anchor them first. Add a `tendon_modifications:`
block that moves every wrap point at the cut or distal to the cut onto the residual
bone. Also move the wrap cylinder of each muscle. If one geom stays behind, the
cascade removes the tendon, whatever number of sites you moved.

### `ValueError: body_removals references unknown body 'X'`

The MSK model does not have the body name that you listed. A common cause is one
config that you use on several MSK models with different skeletons. `body_removals`
accepts the per-MSK form, so select the bodies by key:

```yaml
body_removals:
  default:
    - "tibia_r"
  myolegs: &r80_bodies
    - "tibia_r"
    - "patella_r"   # a sibling of tibia_r, so the cascade misses it
  myofullbody: *r80_bodies
```

## Rendering / viewer

### An export carries a skybox you did not ask for

The exports are **not** scene-free. The pipeline removes the myosuite headlight and
global settings, then adds a soft headlight and a neutral gradient skybox, so a
bare export renders correctly in a viewer. This applies to every export: combined
models and `load_msk` output. A downstream scene that supplies its own headlight or
skybox wins when you put it on top.

### Model floats inside or outside the floor in the viewer

The `assist_sim` exports are **model-only**: they have no ground body, no hfield,
and no floor. If you want a floor for the simulation, add one with
`myoassist.terrains`, or include a terrain config in your wrapper XML.

### The initial camera view is off center or incorrectly rotated

`examples/quickstart.py` selects the camera azimuth from the MSK model. If you add a
new MSK model with a different world orientation, change the azimuth branch in that
file.

## Cache

### Stale combined output after a config edit

The cache key uses the mtime of each input file. Some editors restore the mtime
when they save a file. If you edited a config file and the mtime did not change,
force a new compile:

```bash
rm -r .assist_sim_cache/
```

### Broken mesh paths in the exported XML

`assist_sim` rewrites the mesh paths relative to the export location and removes the
source `meshdir`. If your downstream tool does not find a mesh, check the tool. The
mesh paths in the export are valid *only* relative to the directory of the export
file.

## How to ask for help

If you cannot solve the problem, see the
[GitHub Issues](../../contribution/#1-github-issues) section on the Contributing page, 
collect this information:

- The exact `load_combined_model` or `load_combined` call that you made.
- The full error message, with the "did you mean" suggestion.
- The YAML that you use, or a diff against the YAML in the repository.
- The output of `python -m assist_sim --version`.

Then open an issue at <https://github.com/neumovelab/assist_sim/issues>.
