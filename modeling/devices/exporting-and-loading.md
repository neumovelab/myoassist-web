---
title: Exporting & Loading Models
parent: Assistive Devices
grand_parent: Simulation Environments
nav_order: 6
layout: home
---

# Exporting & Loading Models

Sometimes you need a file on disk instead of an `MjModel` object in memory.
You might need to share a model, a file to open in `simulate.exe`, and a file for a
tool that needs a path. This page covers the export and reload
options provided.

## Export from Python

Use the registry key, which composes the musculoskeletal (MSK) model through
`myo_sim`:

```python
from assist_sim import load_combined

model, data = load_combined(
    "myolegs26",
    "DephyExoBoot_L1",
    export_xml="combined.xml",        # also write to disk
)
```

Or use an MSK XML that you already have on disk:

```python
from assist_sim import load_combined_model

model, data = load_combined_model(
    human_xml="path/to/myolegs26.xml",
    device_config="assist_sim/models/DephyExoBoot/L1config.yaml",
    export_xml="combined.xml",
)
```

Both functions compile the model in memory AND write a clean XML file to
`combined.xml`. The `model` and `data` objects are the same as the objects from a
call with no export.

## Export from the command line

```bash
python -m assist_sim combine myolegs26 DephyExoBoot_L1 -o combined.xml
```

The behavior is the same as the Python form. The command prints the resulting
`(nq, nu, nbody, nmesh)` for a quick check.

## Export a baseline MSK model with no device

`load_msk` is the equivalent of `load_combined` for a model with no device. It
does not run the combination pipeline. There are no removals, no attachment, and
no keyframe rebuild, because nothing changes the qpos layout:

```python
from assist_sim import load_msk

model, data = load_msk("myolegs26", export_xml="baseline.xml")
```

```bash
python -m assist_sim msk myolegs26 -o baseline.xml
```

`load_msk` accepts `cache_dir=` on the same terms as `load_combined`. Use it to
give a bare MSK model to a downstream tool.

## Upper-body environments

The [upper-body and seated-mobility environments](device-configuration#upper-body) do not use
`load_combined`. To write one to a standalone XML file, pass the output of its
`build_*_spec(...)` companion to `export_upper_body_xml`. Give it the spec output,
not the compiled builder output:

```python
from assist_sim.upper_body import build_auxivo_liftsuit_spec, export_upper_body_xml

export_upper_body_xml(build_auxivo_liftsuit_spec(), "auxivo_liftsuit.xml")
```

`export_upper_body_xml` uses the same writer as the gait-assistive devices, so
everything below about the exported XML applies to it. A raw `spec.to_xml()` does
**not** reload, because the merged fragment defaults and the `myo_sim` asset
directories do not survive it. `build_mpl` has no spec path and no export path,
because the MPL is already a standalone XML file on disk.

## Content of the exported XML

The export carries the model plus a minimal visual block. The export **contains**:

- The combined body hierarchy: the MSK model and the device, with the device
  prefix.
- The meshes. The export removes the duplicates and makes the paths relative to
  the directory of the export file.
- The joints, actuators, and tendons of the MSK model and of the device.
- The keyframes. The export applies the overrides and removes the slots of any
  removed joint.
- A soft headlight plus a skybox texture, so the file renders correctly on its
  own. A downstream scene that supplies its own headlight or skybox wins when you
  put it on top.

The exported XML does **not** contain:

- The ground plane, backdrop, pedestal, logo, scene lights, and cameras. The
  resolver removes the bundled myosuite scene before the pipeline sees it.
- The `<headlight>` and `<global>` camera settings of the MSK model.
- The scene textures and materials that no geom refers to.

An exported model therefore has no ground. Downstream tools (`myoassist`,
`myoassist.terrains`) put the ground and the lighting on top. Loading the model in the MuJoCo visualizer
and running the physics engine will drop the model into the void; be sure to hit pause and/or reload!

## Reload an exported XML

```python
import mujoco as mj

model = mj.MjModel.from_xml_path("combined.xml")
data = mj.MjData(model)
```

This is standard MuJoCo. The exported XML is a self-contained model, if you keep
the mesh files with it. The XML refers to the meshes by a path that is relative to
its own directory.

## Reload after you move the XML

The exported XML uses relative paths to its mesh files. If you move `combined.xml`
to a different location, do one of these three tasks:

1. Move the mesh directory tree with the XML. Keep the relative layout.
2. Change the mesh paths in the XML.
3. Export again from the original config to the new location.

Option 3 is the simplest. During the export, the pipeline makes the mesh paths
relative to the `export_xml=` target.

## Caching (faster repeat loads)

The cache is optional. Set `cache_dir=` to use it. All three entry points accept
it:

```python
model, data = load_combined("myolegs26", "DephyExoBoot_L1", cache_dir="./.assist_sim_cache")
model, data = load_msk("myolegs26", cache_dir="./.assist_sim_cache")
model, data = load_combined_model(human_xml=..., device_config=..., cache_dir="./.assist_sim_cache")
```

The first call runs the full pipeline. It writes a cached XML file and a
`meta.json` file, keyed on the inputs. The next call with the same inputs is a
cache hit and loads the cached XML directly, which is much faster. If you change
any input file, the next call misses the cache and compiles again.

To clear the cache, remove the directory:

```bash
rm -r .assist_sim_cache/
```

There is no global cache and no size limit. The cache is a local optimization for
one user.

## See also

- [Device Configuration](device-configuration): the YAML schema.
- [Troubleshooting](troubleshooting): problems with mesh paths and a stale cache.
