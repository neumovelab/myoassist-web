---
title: MSK Models
parent: Simulation Environments
nav_order: 1
layout: home
---

# MSK Models

The human musculoskeletal (MSK) model is the `msk` of an
[environment spec](../getting-started/defining-an-environment). MSK models come from
[`myo_sim`](https://github.com/MyoHub/myo_sim). `myo_sim` composes each leg model at
runtime, so an MSK key resolves by a call to `myo_sim.build_spec(<model>)`. The
`assist_sim` key matches the `myo_sim` model name.

| Key | Base DOFs | Description |
|-----|-----------|-------------|
| `myolegs22` | 39 | Planar 22-muscle, sagittal-plane legs and passive torso. A 26→22 reduction of `myolegs26`. |
| `myolegs26` | 47 | 26-muscle, passive torso and legs. |
| `myolegs` | 35 | 80-muscle, passive torso. |
| `myofullbody` | 129 | Full body: torso muscles, arms, and legs. |

`myolegs`, `myofullbody`, and `myolegs22` require `mujoco>=3.3.4`. `myolegs26` builds
on `3.3.3`. An unknown key raises a clear error rather than a silent fallback.

The muscle count and the 2D or 3D control mode come from the `msk` key. You do not set
them separately.

## `myolegs22`

`myolegs22` is the planar model used for most reflex Controller Optimization work.

- **Planar root.** The root is three sagittal-plane DOFs: `pelvis_tx` (fore-aft),
  `pelvis_ty` (vertical), and `pelvis_tilt`. Device keyframe overrides that target
  `pelvis_ty` therefore apply.
- **Reduced from 26.** The frontal-plane hip DOFs (`hip_adduction`, `hip_rotation`)
  and the `abd`/`add` muscles are removed to go from 26 to 22 muscles. The torso is
  kept.
- **Keyframes.** It ships five keyframes that survive device combination: `stand`,
  `walk_left`, `walk_right`, `squat`, and `lunge`.

## `myolegs26`

`myolegs26` is the 3D counterpart, with a passive anatomical torso over 26-muscle
legs.

- **Torso.** A passive torso scaffold (spine, ribs, head; no arms, no torso muscles)
  sits over the legs. Torso-targeting devices, such as HMEDI's torso band, work on it.
- **Free-root base.** The root is a `freejoint` on the torso scaffold, not
  `pelvis_tx`/`pelvis_ty` slide joints. Device keyframe overrides that target
  `pelvis_ty` are skipped, because that joint does not exist.
- **No keyframe.** The model loads at `qpos0`, the assembled standing pose. Like
  `myolegs`, it loads floating slightly above the ground; there is no `stand`
  keyframe.

## Larger models

`myolegs` (80-muscle) and `myofullbody` (full body with arms) share the same passive
torso scaffold, so every device works with them too. See the
[Device Catalog](devices/catalog) compatibility matrix, and
[Defining an Environment](../getting-started/defining-an-environment) for how to pair
an MSK with a device and a terrain.
