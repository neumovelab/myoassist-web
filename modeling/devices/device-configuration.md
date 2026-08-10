---
title: Device Configuration
parent: Assistive Devices
grand_parent: Simulation Environments
nav_order: 2
layout: home
---

# Device Configuration

Every device has a YAML config under `models/<DeviceDir>/` (for example
`L1config.yaml`). The config tells `assist_sim` how to attach the device XML to a
human MSK and how to edit the combined model. This page covers the common sections.
For the full field-by-field reference and the deeper authoring notes, see the
[assist_sim config reference](https://github.com/neumovelab/assist_sim/blob/main/docs/device-config-reference.md).

## Top-level shape

```yaml
device:                  # required: name, model_xml, optional compatible_msk
attachments:             # required: map device bodies to MSK parent bodies

# optional sections, each defaults to empty:
equality:                # constraints tying a device body to the MSK
joint_overrides:         # change range/damping of existing MSK joints
actuators:               # add joint-transmission actuators
keyframe_overrides:      # patch joint values in existing keyframes, by name
body_removals:           # delete biological subtrees (prosthetics)
mesh_replacements:       # swap a geom's mesh
geom_removals:           # remove named geoms
body_overrides:          # override a body's mass / inertia
actuator_removals:       # remove named actuators
tendon_removals:         # remove named tendons
tendon_modifications:    # reposition / replace / drop tendon wrap sites
contact:                 # add contact pairs / excludes
sensors:                 # add sensors
sensor_removals:         # remove sensors
```

Only `device` and `attachments` are required.

## `device`

```yaml
device:
  name: "DephyExoBoot_L1"
  model_xml: "L1model.xml"
  compatible_msk: ["myolegs22", "myolegs26"]   # optional
```

| Field | Required | Meaning |
|-------|----------|---------|
| `name` | yes | Namespace prefix added to every body, site, mesh, joint, actuator, and tendon imported from the device XML. Convention: PascalCase plus an `_L1` suffix. |
| `model_xml` | yes | Path to the device MuJoCo XML, relative to this YAML file. |
| `compatible_msk` | no | Restrict which MSK models this device combines with. If absent, the device is compatible with all. |

## `attachments`

`attachments` maps each top-level device body to a parent body in the MSK.

```yaml
attachments:
  - device_body: "exo_1_r"
    parent_body: "tibia_r"
  - device_body: "fanny_pack"
    parent_body: "pelvis"
    pos: [0.0, 0.05, 0.0]      # optional frame offset
    quat: [1, 0, 0, 0]         # optional frame rotation
```

Each attachment re-parents the device body under the MSK body. Use `pos` and `quat`
to adjust the frame per attach point.

**Free-rooted devices.** A device that is a separate mechanism strapped to the leg
(for example a parallel linkage clamped at several points) attaches to `parent_body:
world` instead. The device body keeps its own `<freejoint>`, and `equality`
constraints then tie it to the leg.

## Optional sections

| Section | Purpose |
|---------|---------|
| `equality` | Add MuJoCo constraints (`connect`, `weld`, or `joint`) that tie a device body to an MSK body. Used to fasten free-rooted devices and to close kinematic loops. |
| `joint_overrides` | Change the range, damping, axis, or position of existing MSK joints. |
| `actuators` | Add joint-transmission actuators to the combined model. Tendon-transmission actuators are authored in the device XML instead. |
| `keyframe_overrides` | Patch joint values in the MSK's existing keyframes. Refers to joints by name, so it is model-agnostic. |
| `body_removals` | Delete biological body subtrees before attaching the device. Used for prosthetics (for example remove `talus_r` and below for a transtibial amputation). |
| `mesh_replacements` / `geom_removals` | Swap a geom's mesh for one from the device XML, or remove a named geom. |
| `body_overrides` | Override a body's mass and inertia. Used to reduce a residual limb after an amputation, so the stump does not carry the whole segment's mass. |
| `actuator_removals` / `tendon_removals` | Remove named actuators or tendons (for example muscles that cross an amputation level). |
| `tendon_modifications` | Reposition, replace, or drop tendon wrap sites without rebuilding the tendon. |
| `contact` | Add contact pairs and excludes to the combined model. |
| `sensors` / `sensor_removals` | Add or remove sensors (for example restore a foot touch sensor onto a prosthetic sole). |

## Per-MSK overrides

One config can carry per-MSK variations. A section holds a `default` entry plus
per-MSK-key entries, and the resolver picks the matching MSK key if present:

```yaml
attachments:
  default:
    - device_body: "hmedi_torso"
      parent_body: "torso"
  myolegs:
    - device_body: "hmedi_torso"
      parent_body: "pelvis"
      pos: [-0.105, 0.08, 0]
```

Most sections support this form. The
[assist_sim config reference](https://github.com/neumovelab/assist_sim/blob/main/docs/device-config-reference.md)
lists which sections support per-MSK overrides, and gives the full field detail and
authoring rules for each section.
