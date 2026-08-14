---
title: Add a Device
parent: Assistive Devices
grand_parent: Simulation Environments
nav_order: 4
layout: home
---

# Add a Device

This page walks you through how to build a new device configuration and model. The pipeline finds the device
automatically if the device obeys the directory layout below. For the mesh
preparation that comes first, see [Modeling Tips](modeling-tips). For the full
config schema, see [Device Configuration](device-configuration).

## Directory layout

```
assist_sim/models/                  # the scanned root
└── MyDevice/                       # directory name -> half of the registry key
    ├── L1config.yaml               # YAML config (see Device Configuration)
    ├── L1model.xml                 # MuJoCo XML: bodies, geoms, meshes
    └── mesh/                       # STL files referenced by L1model.xml
        ├── part_a.stl
        ├── part_b.stl
        └── ...
```

The registry key comes from the directory name plus the config stem:
`MyDevice/L1config.yaml` gives `MyDevice_L1`. To add more variants, write sibling
configs (`A_L1config.yaml`, `KA_L1config.yaml`). OpenSourceLeg is an example.

## Step 1: Write `L1model.xml`

The device XML is a standalone MuJoCo XML file. It contains only the physical
description of the device. `MjSpec.from_file` must load it on its own. Its bodies
do not connect to a world here, because the pipeline attaches them to the
musculoskeletal (MSK) model.

The minimum content is:

```xml
<mujoco model="MyDeviceL1">
    <compiler angle="radian"/>

    <asset>
        <mesh file="mesh/part_a.stl" name="part_a_geom"/>
        <!-- ...other meshes... -->
    </asset>

    <worldbody>
        <body name="my_device_part_a" pos="0 0 0">
            <inertial pos="0 0 0" mass="0.1" diaginertia="0.001 0.001 0.001"/>
            <geom name="part_a_geom" mesh="part_a_geom" type="mesh" rgba="0.3 0.3 0.3 1"/>
            <site name="my_device_attach_marker" pos="0 0 0"/>
        </body>
        <!-- ...other top-level bodies... -->
    </worldbody>

    <!-- Optional: spatial tendons and tendon-transmission actuators
         for cable-driven devices -->
</mujoco>
```

**Conventions:**

- Each body that attaches to the MSK model on its own must be a *top-level*
  `<body>`, a direct child of `<worldbody>`. The `attachments` list in the YAML
  file selects these bodies by name.
- Sites can be inside bodies. The pipeline adds the device name as a prefix to
  each site at attach time.
- For a prosthetic, also put the *replacement meshes* in `<asset>`, such as the
  residual stump meshes. No geom in the device XML has to refer to them. The
  pipeline loads them when it applies `mesh_replacements`.

## Step 2: Write `config.yaml`

The YAML file controls the combination. See [Device Configuration](device-configuration)
for the full schema. The minimum content is:

```yaml
device:
  name: "MyDevice_L1"
  model_xml: "L1model.xml"

attachments:
  - device_body: "my_device_part_a"
    parent_body: "tibia_r"
```

An exoskeleton usually also needs joint overrides, actuators, and keyframe
overrides:

```yaml
joint_overrides:
  - name: "ankle_angle_r"
    range: [-0.45, 0.349]

actuators:
  - name: "MyDevice_motor_r"
    joint: "ankle_angle_r"
    gaintype: "fixed"
    gainprm: [100, 0, 0]
    ctrlrange: [-1, 1]
    ctrllimited: true

keyframe_overrides:
  stand:
    pelvis_ty: 0.93
```

A **free-floating mechanism** clamps to the leg at more than one point, such as a
parallel-linkage exoskeleton. A rigid strap-on is not one. Give each root body its
own `<freejoint>` in the XML, attach the body to `world`, then hold it with
`equality` constraints in place of rigid re-parenting:

```yaml
attachments:
  - device_body: "part3_r"        # top-level body with a <freejoint>
    parent_body: "world"
    pos: [-0.157, 0.035, -0.583]  # world pose so it sits on the leg
    quat: [0.121, 0, 0, 0.993]

equality:
  - type: "connect"
    device_body: "part3_r"
    parent_body: "calcn_r"
    anchor: [-0.071, 0.05, 0.005]  # in part3_r's local frame
```

For a prosthetic, remove the biological bones and their muscles:

```yaml
body_removals:
  - "talus_r"          # transtibial; cascades to calcn_r and toes_r

actuator_removals:
  - "soleus_r"
  - "tibant_r"

tendon_removals:
  - "soleus_r_tendon"
  - "tib_ant_r_tendon"
```

`body_removals` uses `spec.delete`, which cascades. It removes the subtree and
every actuator, tendon, and sensor that refers to the subtree. A real amputation
keeps some biarticular muscles, so you must re-anchor each such muscle onto the
residual bone **before** the removals. Use `tendon_modifications` and
`actuator_overrides` for that step. See [Per-MSK Overrides](per-msk-overrides) for
the worked re-anchor example.

## Step 3: Verify discovery

```python
from assist_sim.registry import DEVICE_CONFIGS, refresh
refresh()
print("MyDevice_L1" in DEVICE_CONFIGS)   # should be True
```

Or use the command line:

```bash
python -m assist_sim list
```

## Step 4: Compile and examine the model

```bash
python examples/quickstart.py myolegs26 MyDevice_L1
```

If the viewer opens and shows the device attached, the device is correct. These
problems are usual at this step:

- **`unknown body 'my_device_part_a'`**: the body name in `attachments` does not
  agree with the top-level body in the device XML. Names are case-sensitive.
- **The device geometry is in the wrong position**: MuJoCo reads the `pos` and
  `quat` of the device body in the frame of the parent body. Set `pos` and `quat`
  on the attachment in the YAML file to adjust the position.
- **The device is incorrect on 80 only**: the 80-muscle model can use different
  parent body names, or need a different attachment pose. Use the per-MSK
  `attachments:` form. HMEDI is an example. See
  [Per-MSK Overrides](per-msk-overrides).

## Use a custom device outside the package

You can keep a device outside `assist_sim/models/`, for example an internal lab
project. Give an absolute path to the device YAML file in `load_combined_model`:

```python
from assist_sim import load_combined_model

model, data = load_combined_model(
    human_xml="myolegs26.xml",                      # an MSK XML on disk
    device_config="/home/me/projects/MyExo/L1config.yaml",
    msk_key="myolegs26",                            # selects per-MSK blocks
)
```

`myo_sim` composes its MSK models at run time and supplies no XML for them. Write
one out first if you need this form:

```bash
python -m assist_sim msk myolegs26 -o myolegs26.xml
```

A custom device does not appear in `get_available_combinations()` or in
`python -m assist_sim list`. You must know the path.

**Naming:** the directory name becomes the prefix of the registry key, and the
`device.name` field is the namespace prefix on every imported body, site, mesh,
joint, actuator, and tendon. Make `device.name` the same as the directory name
plus the variant, such as `MyExo_L1`. If a custom device and a bundled device
share a key, the bundled device wins, so select a distinctive name.

## Custom MSK models

`assist_sim` supports four curated MSK keys: `myolegs22`, `myolegs26`, `myolegs`,
and `myofullbody`. It resolves them through `myo_sim`. There is no pattern to load
an arbitrary MSK XML from a path, because the pipeline depends on per-MSK
conventions, such as the frame orientation and the joint, tendon, and site names.
To add support for a new MSK model, contribute it upstream to `myo_sim` and then
register it. See [Adding a new MSK model](../msk-models#adding-a-new-msk-model)
and [Contributing](../../contribution/).

## See also

- [Device Configuration](device-configuration): the full YAML schema.
- [Per-MSK Overrides](per-msk-overrides): device behavior that differs by MSK
  model, and the amputation re-anchor example.
- [Modeling Tips](modeling-tips): prepare and inspect the device meshes.
