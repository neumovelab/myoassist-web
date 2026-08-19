---
title: Troubleshooting
parent: Assistive Devices
grand_parent: Simulation Environments
nav_order: 8
layout: home
---

# Troubleshooting

This page lists common errors and their fixes. If you find an error that is not in
this list, read the error message first. An unknown-key or unknown-name error
carries a `did you mean ...` suggestion and the name of the YAML section that holds
the incorrect reference. A shape or required-field error does not carry a
suggestion; it states what the field needs instead.

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

### `ImportError: MSK model '...' requires ... mujoco>=3.4`

The pipeline does the model surgery in memory with `MjSpec.delete`. Your environment has an
older MuJoCo version. To upgrade, run `pip install "mujoco>=3.4,<3.12"`.

`assist_sim` supports `mujoco>=3.4,<3.12`. Both ends of that range are tested. Do not use a
version outside it: the MuJoCo model API changed several times inside 3.x. For example
`MjsTendon.stiffness` became a 3 element vector at 3.7.0, and `MjData.ten_J` became sparse at
3.6.0. The pipeline handles both forms, but a version above the range is not tested.

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

The device key has a spelling error. Try `OpenSourceLeg_A_L1` or its alias
`OSL_A_L1`. The knee-ankle version is `OpenSourceLeg_KA_L1` or the alias
`OSL_KA_L1`. The command `python -m assist_sim list` shows every key.

### `ValueError: Device 'X' is not compatible with MSK 'Y'`

The YAML of the device sets a `compatible_msk:` list, and `Y` is not in it. Use one
of these two fixes:

- Select a compatible MSK model. The error message lists them.
- Or, if `Y` must be compatible, add `Y` to the list, or remove the
  `compatible_msk:` field from the device YAML.

### `ValueError: ... has unknown key(s): '...'`

The config loader rejects a key that it does not know. It gives the near matches and the full
list of valid keys:

```
L1config.yaml has unknown key(s): 'joint_overides' (did you mean 'joint_overrides',
'body_overrides', 'actuator_overrides'?). Valid keys: [...]
```

Correct the spelling. The loader checks the top-level sections, the keys of each item, and the
MSK names in a per-MSK block. A typed key that no section reads is a silent no-op, which is
why the loader stops instead.

Three related rejections come from the same check:

- An `actuators` entry needs both `name` and `joint`, and its `type` must be `general` or
  `motor`.
- A `keyframe_overrides` pose name must exist in the model. See
  [Keyframes](../msk-models#keyframes) for the five pose names.
- An MSK name in a per-MSK block must be a registry key. Run `python -m assist_sim list` for
  the valid keys.

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

### Training is slow

The model is composed at run time. Each parallel worker and each optimization candidate builds
its own model, so a training run without the cache costs 13 to 15 times more for each
environment. Turn the cache on:

```bash
export MYOASSIST_CACHE_DIR=~/.cache/myoassist
```

See [Caching](exporting-and-loading#caching).

### The cache made it slower

A cache hit costs one XML parse, so a very large model gains nothing. `myofullbody` is slower
with the cache than without it. Do not set a cache directory for `myofullbody`. For the three
leg models, set it.

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

One case gives absolute paths instead: if the export directory is on a different drive from
the meshes, there is no relative path between the two, so the export writes the absolute path.
The file loads correctly, but you cannot move that directory to another machine. To get
relative paths, export to the same drive as the package.

## How to ask for help

If you cannot solve the problem, see the
[GitHub Issues](../../contribution/#1-github-issues) section on the Contributing page, 
collect this information:

- The exact `load_combined_model` or `load_combined` call that you made.
- The full error message, with the "did you mean" suggestion.
- The YAML that you use, or a diff against the YAML in the repository.
- The output of `python -m assist_sim --version`.

Then open an issue at <https://github.com/neumovelab/assist_sim/issues>.
