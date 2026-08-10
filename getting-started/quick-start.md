---
title: Quick Start
parent: Getting Started
nav_order: 1
layout: home
---

# Quick Start

After you install MyoAssist (see [Getting Started](./)), run one of these minimal
scripts to confirm your setup builds and steps a composed environment. Neither one
trains a policy. They only create an environment and run it, so you see something
move in a minute.

## Minimal RL environment

This creates a Gym-wrapped MuJoCo environment and steps it with random actions for
about 150 frames (5 seconds).

```bash
python rl_train/run_sim_minimal.py
```

On macOS, use `mjpython` so the MuJoCo viewer works:

```bash
mjpython rl_train/run_sim_minimal.py
```

## Minimal reflex controller (CO)

This builds a composed reflex environment, runs a random controller, and prints how
long the model stays upright. The walking duration changes each run, because the
control parameters are random.

```bash
cd ctrl_optim
python run_ctrl_minimal.py
```

## Next steps

- **[Defining an Environment](defining-an-environment)**: choose the MSK model,
  device, and terrain to simulate.
- **[Examples](examples)**: ready-to-run environment specs.
- **[Reinforcement Learning](../reinforcement-learning/)**: train a policy.
- **[Controller Optimization](../controller-optimization/)**: optimize a reflex
  controller.
