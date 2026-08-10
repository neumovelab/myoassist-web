---
title: Device Catalog
parent: Assistive Devices
grand_parent: Simulation Environments
nav_order: 1
layout: home
---

# Device Catalog

This page lists the human MSK models, the gait-assistive devices, the upper-body and
seated-mobility environments, and which pairs are compatible. For the authoritative,
installed set, run `python -m assist_sim list`.

<!-- TODO(media): device render/photo grid for the catalog. -->

## MSK models

`myo_sim` composes each leg model at runtime, so an MSK key resolves by a call to
`myo_sim.build_spec(<model>)`. The `assist_sim` key matches the `myo_sim` model name.

| Key | Base DOFs | Description |
|-----|-----------|-------------|
| `myolegs22` | 39 | Planar 22-muscle, sagittal-plane legs and passive torso. A 26→22 reduction of `myolegs26`. |
| `myolegs26` | 47 | 26-muscle, passive torso and legs. |
| `myolegs` | 35 | 80-muscle, passive torso. |
| `myofullbody` | 129 | Full body: torso muscles, arms, and legs. |

`myolegs`, `myofullbody`, and `myolegs22` require `mujoco>=3.3.4`. `myolegs26` builds
on `3.3.3`. An unknown key raises a clear error rather than a silent fallback.

## Gait-assistive devices

Lower-limb exoskeletons and prosthetic legs. Thirteen device keys from twelve device
directories:

| Device key | Type | Notes |
|------------|------|-------|
| `Anatomics_L1` | Ankle exoskeleton | Bilateral instrumented soles and a right shank/foot frame; passive (welded, no actuators). |
| `STRIDE_L2` | Cable-driven ankle exo | Bilateral, closed six-bar linkage behind each ankle; 400 N Bowden cables; ankle ROM clamped to the coupling window. |
| `DephyExoBoot_L1` | Ankle exoskeleton | Bilateral; boot strapping; ankle ROM override. |
| `HMEDI_L1` | Hip-flexion cable exo | Bilateral; spatial-tendon cables driven by `Exo_R`/`Exo_L`; torso piece attaches to `pelvis`. |
| `Hippo_L1` | Hip-flexion exoskeleton | Bilateral; pelvis backplate, hip shell, thigh cuffs; fixed-gain hip actuators on `hip_flexion_r`/`_l`. |
| `Humotech_L1` | Ankle exo with cables | Bilateral; plantar/dorsiflexion cables; joint-transmission `Exo_R`/`Exo_L`. |
| `OpenExo_L1` | Ankle exoskeleton | Bilateral. |
| `UTAnkleExo_L2` | Parallel-linkage ankle exo | Bilateral; free-rooted, clamped to the leg by `<connect>` equalities; spring and cable actuated. |
| `Tutorial_L1` | Teaching device | Stripped-down exo for onboarding and baselines. |
| `KFoot_L1` | Transtibial prosthetic | Removes the right talus and below; residual stump tibia; passive spring-damper ankle. |
| `NEUankle_L1` | Powered transtibial prosthetic | Same scope as KFoot, but the ankle is actively driven by a 50 Nm joint-torque actuator. |
| `OpenSourceLeg_A_L1` | Transtibial prosthetic | Removes the right talus and below; residual stump tibia. |
| `OpenSourceLeg_KA_L1` | Transfemoral prosthetic | Removes the right tibia and below; residual stump femur. |

`OSL_A` and `OSL_KA` are registered as aliases for the OSL keys.

## Upper-body and seated-mobility environments

These environments cover assistance above the legs and seated mobility. They are built
by dedicated functions in `assist_sim/upper_body.py`, not by the modular MSK × device
pipeline, so they do not appear in `python -m assist_sim list` or the compatibility
matrix.

| Environment | Description | Builder |
|-------------|-------------|---------|
| `AuxivoLiftsuit` | A passive back-exosuit on the muscled `myotorso` | `build_auxivo_liftsuit()` |
| `Wheelchair` | A seated human propelling a manual wheelchair | `build_wheelchair(arms=..., torso=...)` |
| `MPL` | A bimanual Modular Prosthetic Limb robot. It also drives the bionic-bimanual manipulation task (a biological arm plus an MPL prosthesis). | `build_mpl()`, `build_bionic_bimanual()` |

`Wheelchair`, `AuxivoLiftsuit`, and the bionic-bimanual task also expose a
`build_*_spec()` companion that returns the uncompiled `MjSpec`.
`export_upper_body_xml(spec, path)` writes it to a standalone, reloadable XML.

## Compatibility matrix

Every device works with every MSK model, because all four MSK models share the
passive torso scaffold. The three devices that pin `compatible_msk` (`KFoot_L1`,
`NEUankle_L1`, `STRIDE_L2`) list all four, so nothing is excluded.

| Device | myolegs22 | myolegs26 | myolegs | myofullbody |
|--------|:-:|:-:|:-:|:-:|
| `Anatomics_L1` | ✓ | ✓ | ✓ | ✓ |
| `NEUankle_L1` | ✓ | ✓ | ✓ | ✓ |
| `DephyExoBoot_L1` | ✓ | ✓ | ✓ | ✓ |
| `KFoot_L1` | ✓ | ✓ | ✓ | ✓ |
| `OpenSourceLeg_A_L1` | ✓ | ✓ | ✓ | ✓ |
| `OpenSourceLeg_KA_L1` | ✓ | ✓ | ✓ | ✓ |
| `STRIDE_L2` | ✓ | ✓ | ✓ | ✓ |
| `Humotech_L1` | ✓ | ✓ | ✓ | ✓ |
| `OpenExo_L1` | ✓ | ✓ | ✓ | ✓ |
| `UTAnkleExo_L2` | ✓ | ✓ | ✓ | ✓ |
| `Tutorial_L1` | ✓ | ✓ | ✓ | ✓ |
| `HMEDI_L1` | ✓ | ✓ | ✓ | ✓ |
| `Hippo_L1` | ✓ | ✓ | ✓ | ✓ |

## Listing combinations

```bash
python -m assist_sim list
```

This returns the live `{msk: [device, ...]}` map. It honors each device's
`compatible_msk` filter and shows only the MSK models that resolve in the installed
`myo_sim`.

```python
from assist_sim import get_available_combinations
print(get_available_combinations())
```
