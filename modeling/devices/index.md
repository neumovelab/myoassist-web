---
title: Assistive Devices
parent: Simulation Environments
has_children: true
nav_order: 2
layout: home
---

# Assistive Devices

A **device** is the assistive hardware that composes with a human MSK model to form
an environment. A device is an exoskeleton, a powered or passive prosthetic leg, or a
teaching stub. Devices come from [`assist_sim`](https://github.com/neumovelab/assist_sim).
You select one with the `device` field of the
[environment spec](../../getting-started/defining-an-environment).

See [Device Catalog](catalog) for every device and its MSK compatibility.

## Where devices fit

Four packages work together to build a simulation:

- **`myo_sim`** provides the human MSK models and their meshes.
- **`assist_sim`** holds the device configurations and the combination pipeline. It
  composes one MSK and one device into a single runnable model.
- **`myoassist.terrains`** provides the scene (ground and heightfields). The
  `assist_sim` output is model-only, with no ground.
- **`myoassist`** consumes the composed model for Controller Optimization and
  Reinforcement Learning.

`assist_sim` composes the model. It does not provide MSK models, terrain, or a
training loop.

## Device keys

Each device key comes from a config file, `models/<DeviceDir>/<variant>config.yaml`.
For example, `models/DephyExoBoot/L1config.yaml` gives the key `DephyExoBoot_L1`, and
`models/OpenSourceLeg/A_L1config.yaml` gives `OpenSourceLeg_A_L1`. The device's
`device.name` field is also registered as an alias.

When a device attaches to an MSK, its `device.name` becomes a prefix on every body,
site, mesh, joint, actuator, and tendon that the device contributes (for example
`DephyExoBootL1_exo_1_r`). The prefix prevents name collisions and marks the device's
parts in the composed model.

## Per-MSK overrides

One device config can carry per-MSK variations. Sections such as `attachments`,
`tendon_modifications`, `keyframe_overrides`, `actuator_removals`, `tendon_removals`,
and `mesh_replacements` can hold a `default` entry plus per-MSK-key entries. The
resolver picks the matching MSK key if it is present, otherwise it uses `default`.
See [Device Configuration](device-configuration) for the sections and their fields.
