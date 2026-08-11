---
title: Simulation Environments
nav_order: 3
has_children: true
layout: home
---

# Simulation Environments

A simulation environment is a composed MuJoCo model: a human musculoskeletal (MSK)
model, an assistive **device**, and a **terrain**. You describe it once with a
`{msk, device, terrain}` spec, and the same definition drives both the reflex
Controller Optimization and the Reinforcement Learning pipelines. See
[Defining an Environment](../getting-started/defining-an-environment).

<!-- TODO(media): compose-pipeline figure (myo_sim MSK + assist_sim device + terrain). -->

<div style="text-align: center;">
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin: 0 auto;">
    <div style="flex: 1 1 300px; min-width: 0; max-width: 600px;">
      <img src="../assets/ensemble.png" alt="An ensemble of composed environments on varied terrain" style="width: 100%; height: auto; max-height: 400px; object-fit: contain;">
    </div>
    <div style="flex: 1 1 300px; min-width: 0; max-width: 600px;">
      <img src="../assets/vel_map.png" alt="A target-velocity field over a tiled terrain" style="width: 100%; height: auto; max-height: 400px; object-fit: contain;">
    </div>
  </div>
  <div style="margin-top: 1rem;">
    <i>Composed environments across varied terrain (left) and a target-velocity field over a tiled course (right).</i>
  </div>
</div>

## How an environment is composed

Three sibling packages supply the parts, and MyoAssist composes them into one model:

- **`myo_sim`** provides the human MSK model.
- **`assist_sim`** provides the device and combines it with the MSK.
- **`myoassist.terrains`** provides the terrain scene.

The result is a single MuJoCo model that the Controller Optimization and Reinforcement
Learning pipelines step.

## In this section

- **[MSK Models](msk-models)**: the human models: `myolegs26`, `myolegs22`, `myolegs`,
  and `myofullbody`.
- **[Assistive Devices](devices/)**: the device catalog, the gait-assistive and
  upper-body environments, device configuration, and how to add, prepare, and export
  a device.
- **[Terrains](terrains/)**: tile types, terrain configuration, and velocity maps.
