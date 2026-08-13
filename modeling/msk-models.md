---
title: Musculoskeletal Models
parent: Simulation Environments
nav_order: 1
layout: home
---

# Musculoskeletal Models

The human musculoskeletal (MSK) model is the `msk` of an
[environment spec](../getting-started/defining-an-environment) and come from
[`myo_sim`](https://github.com/MyoHub/myo_sim). Each leg model is composed at
runtime, so an MSK key resolves by a call to `myo_sim.load_spec(<model>)`. The
`assist_sim` key matches the `myo_sim` model name.

| Key | Base nq | Description |
|-----|---------|-------------|
| `myolegs26` | 47 | 26-muscle, passive torso and legs. |
| `myolegs22` | 39 | Planar 22-muscle. A sagittal-plane reduction of `myolegs26`. |
| `myolegs` | 35 | 80-muscle, passive torso. |
| `myofullbody` | 129 | Full body: torso muscles, arms, and legs. |

The muscle count and the 2D or 3D control mode come from the `msk` key. You do not set
them separately.

Only `myolegs22` ships keyframes. The other three models load at `qpos0`, so a device
config's `keyframe_overrides` has no effect on them.

## myolegs26

<div class="msk-figure">
<div class="msk-figure-img">
<img src="../assets/msk/myoleg26.png" alt="myolegs26 model">
</div>
<div class="msk-figure-text" markdown="1">

`myolegs26` is the base 3D model: 26-muscle legs under a passive anatomical torso.

- **Torso.** A passive torso scaffold (spine, ribs, head; no arms, no torso muscles)
  is rigidly attached to the legs.
- **Free-root base.** The root is a `freejoint` on the torso scaffold.
- **No keyframe.** The model loads at `qpos0`, the assembled standing pose, and loads
  floating slightly above the ground.

</div>
</div>

### myolegs22 (planar reduction)

`myolegs22` is a planar, sagittal-plane reduction of `myolegs26`.

- **Planar root.** The root is three sagittal-plane DOFs: `pelvis_tx` (fore-aft),
  `pelvis_ty` (vertical), and `pelvis_tilt`.
- **Reduced from 26.** The frontal-plane hip DOFs (`hip_adduction`, `hip_rotation`)
  and the `abd`/`add` muscles are removed to go from 26 to 22 muscles. The torso is
  kept.
- **Keyframes.** It ships five keyframes: `stand`,
  `walk_left`, `walk_right`, `squat`, and `lunge`.

## myolegs (80-muscle)

<div class="msk-figure">
<div class="msk-figure-img">
<img src="../assets/msk/myoleg80.png" alt="myolegs (80-muscle) model">
</div>
<div class="msk-figure-text" markdown="1">

`myolegs` is the 80-muscle lower-limb model: the highest muscle fidelity for the legs,
over the same passive torso scaffold as `myolegs26`.

- **Torso.** Passive torso scaffold, so torso-targeting devices work on it.
- **Free-root base.** Like `myolegs26`, the root is a `freejoint`, and device keyframe
  overrides that target `pelvis_ty` are skipped.
- **No keyframe.** It loads at `qpos0`, floating slightly above the ground.
- Requires `mujoco>=3.3.4`.

</div>
</div>

## myofullbody (full body)

<div class="msk-figure">
<div class="msk-figure-img">
<img src="../assets/msk/myofullbody.png" alt="myofullbody model">
</div>
<div class="msk-figure-text" markdown="1">

`myofullbody` is the most complete human model: torso muscles, arms, and legs (129 base
DOFs). Use it for whole-body studies, or when a device or task involves the trunk or
arms.

- Requires `mujoco>=3.3.4`.
- Every device also composes with it, because it shares the same torso attachment
  scaffold. See the [Device Catalog](devices/catalog).

</div>
</div>

## Adding a new MSK model

The MSK models live in `myo_sim`, not in this repository. `assist_sim` supports the
four curated keys above and resolves them through `myo_sim`. There is no pattern to
load an arbitrary MSK XML from a path, because the device pipeline depends on
per-MSK conventions, such as the frame orientation and the joint, tendon, and site
names.

To add support for a new MSK model, do two steps:

1. Contribute the model upstream to `myo_sim`, so `myo_sim.load_spec(<name>)` can
   return it.
2. Register the key in `assist_sim`, and add a per-MSK override block to each device
   that needs one (see [Per-MSK Overrides](devices/per-msk-overrides)).

To modify *existing* musculoskeletal models, they can be exported with or without an associated device through the `assist_sim` package, 
and modified manually once exported.

See [Contributing](../contribution/) to get started, or open an issue on the
[myo_sim](https://github.com/MyoHub/myo_sim) or
[assist_sim](https://github.com/neumovelab/assist_sim) repository.

See [Defining an Environment](../getting-started/defining-an-environment) for how to
pair an MSK with a device and a terrain.
