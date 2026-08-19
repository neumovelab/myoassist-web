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

## Keyframes

Only `myolegs22` ships keyframes. For the other three keys, a device combination adds the
same five poses, so **every combined leg model has five keyframes** and a device config's
`keyframe_overrides` applies to all four keys:

| Key | In the base model | After a device combination | `keyframe_overrides` |
|-----|-------------------|----------------------------|----------------------|
| `myolegs22` | 5 | 5 | applies |
| `myolegs26` | none | 5, added | applies |
| `myolegs` | none | 5, added | applies |
| `myofullbody` | none | 5, added | applies |

The five poses are `stand`, `walk_left`, `walk_right`, `squat` and `lunge`. The `walk_left`
and `walk_right` poses also carry a 1.5 m/s forward velocity.

`load_msk` returns the base model and runs no combination, so it gives no keyframe for three
of the four keys. Use `load_combined` to get the poses.

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
- **No keyframe in the base model.** On its own the model loads at `qpos0`, the assembled
  standing pose, and floats a small distance above the ground. A device combination adds the
  five poses.

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
  `walk_left`, `walk_right`, `squat`, and `lunge`. They remain after a device combination,
  and the pipeline removes the slot of any joint that the device surgery removes.

## myolegs (80-muscle)

<div class="msk-figure">
<div class="msk-figure-img">
<img src="../assets/msk/myoleg80.png" alt="myolegs (80-muscle) model">
</div>
<div class="msk-figure-text" markdown="1">

`myolegs` is the 80-muscle lower-limb model: the highest muscle fidelity for the legs,
over the same passive torso scaffold as `myolegs26`.

- **Torso.** Passive torso scaffold, so torso-targeting devices work on it.
- **Free-root base.** Like `myolegs26`, the root is a `freejoint`, so a device keyframe
  override that targets `pelvis_ty` is skipped. See [Root frame](#root-frame).
- **No keyframe in the base model.** On its own it loads at `qpos0`, and floats a small
  distance above the ground. A device combination adds the five poses.
- Requires `mujoco>=3.4,<3.12`, the same as every other MSK key.

</div>
</div>

## myofullbody (full body)

<div class="msk-figure">
<div class="msk-figure-img">
<img src="../assets/msk/myofullbody.png" alt="myofullbody model">
</div>
<div class="msk-figure-text" markdown="1">

`myofullbody` is the most complete human model: torso muscles, arms, and legs (123 base
DOFs). Use it for whole-body studies, or when a device or task involves the trunk or
arms.

- Requires `mujoco>=3.4,<3.12`, the same as every other MSK key.
- Every device also composes with it, because it shares the same torso attachment
  scaffold. See the [Device Catalog](devices/catalog).
- **Free root, no keyframe in the base model.** The same as `myolegs26`. A device
  combination adds the five poses.
- **Do not cache it.** The model is large, so a cache hit is slower than a fresh build. See
  [Exporting & Loading](devices/exporting-and-loading#do-not-cache-myofullbody).

</div>
</div>

## Root frame

`myolegs22` has a planar root: three named sagittal DOFs, which are `pelvis_tx` (fore-aft),
`pelvis_ty` (vertical) and `pelvis_tilt`. The other three keys have a `freejoint` root, which
is the myosuite convention.

The difference shows in two places:

- A device `keyframe_overrides` entry that targets `pelvis_ty` applies on `myolegs22`. On a
  free-root model the pipeline skips that entry and gives no message, because the joint does
  not exist.
- The reflex controller reads the pelvis state from those named DOFs.

The controller-optimization path therefore reframes a free-root model. It replaces the
`freejoint` with the same three named DOFs before the device attaches. This is automatic when
you give `myolegs26` or `myolegs` to `train.py`, so the reflex controller works on the 3D
lineage. See [Running Optimizations](../controller-optimization/Running_Optimizations).

The reinforcement-learning path keeps the `freejoint`, because a 3D policy controls all six
root DOFs.

One MSK key can thus load with a different root in the two paths. The muscles, the device and
the mass properties do not change.

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
