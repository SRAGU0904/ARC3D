# ARC-3D Demo: task 543a7ed5

## Current project structure

The website is now data-driven while keeping the original task-page layout.

- `tasks/catalog.js` is the central task catalog used by the documentation page.
- `tasks/taskN/index.js` contains task-level metadata and registers its variants.
- `tasks/taskN/variants/*.js` contains the actual example and test puzzle data.
- `tasks/taskN/index.html`, `main.js`, and `styles.css` contain that task's webpage and renderer.
- `documentation.html` presents every registered task, variant, and case.

Open the project with the no-cache, auto-reload development server:

```sh
python3 dev_server.py --port 4181
```

Then visit `http://localhost:4181/`. Saving web source files reloads the relevant
page automatically.

### Adding a variant

Copy the relevant task's `variants/base.js`, give the exported variant a stable
ID, then import and register it in that task's `index.js`. A variant owns its
example/test case data and becomes visible on the generated Documentation page.

Rendered benchmark images for new variants should use:

```text
rendered_puzzle_images/taskN/variant-id/case-id/view-id.png
```

The original flat `taskN/case-id` image folders remain supported as the `base`
variant for backward compatibility.

### Seeded label-permutation variant

Every task registers a `label-permutation` robustness variant. It keeps the
base geometry fixed and deterministically reassigns candidate labels. Each
case derives a separate permutation from the task id, case id, and shared seed.

Open it from Documentation, then enter a seed in the top-right control, or use
a direct URL:

```text
http://localhost:4181/tasks/task2/?variant=label-permutation&puzzle=test&seed=42
```

The same seed always reproduces the same labels. Changing the seed generates a
different set of case-specific permutations. Correct answers are recomputed
from geometry after permutation; the original base data is never mutated.

This folder contains a local webpage demo that extends the ARC-AGI-1 training
task `543a7ed5` into a 3D voxel repair concept with one example and one test
puzzle.

The root page now works as a task browser. Open the project root and use the
top navigation to switch between `task1`, `task2`, and `task3`. Each task page
contains `Example 1`, `Example 2`, and `Test`.

## Source task

- ARC-AGI-1 stores tasks as JSON files with `train` demonstration pairs and
  `test` pairs. Each grid is a rectangle of integers `0` to `9`, visualized as
  colors.
- Task `543a7ed5` is an ARC-AGI-1 public training task with 15 x 15 examples.
  The test output is also 15 x 15 in the official JSON.
- The visible rule used for this concept: orange shapes are incomplete object
  evidence; the output adds green enclosing boundaries and yellow inferred
  internal missing regions.

## 3D interpretation

The demo uses a theoretical 10 x 10 x 10 voxel reasoning volume. Empty cells are
not drawn. Visible voxels touch directly, with black edge lines separating cube
units. Orange voxels are observed intact surface blocks; green voxels are
surface blocks that were missing from the broken object and should be repaired.

The `Example` tab shows input and output. The `Test` tab opens in a workspace
state where the user or model selects labeled candidate positions such as `A`,
`C`, or `D`. The selected labels are shown as a JSON action:

```json
{"repairs":["A","D"]}
```

`Check` compares the selected labels with the hidden answer. `Reveal` shows the
target repaired object.

To make a puzzle easier or harder, edit `missingVoxels` and `candidates` in
`main.js`. Each missing voxel is one visible surface block removed from the
completed cuboid:

```js
missingVoxels: [
  [4, 2, 4],
  [2, 4, 4],
]
```

One entry means the user only needs to repair one block.

Candidate labels define what the model is allowed to answer:

```js
candidates: [
  { label: "A", voxel: [4, 2, 4] },
  { label: "B", voxel: [5, 3, 4] },
]
```

If a candidate voxel is also in `missingVoxels`, it is a correct repair label.
Otherwise it is a distractor.

## Run locally

From this directory:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

The page imports Three.js from jsDelivr, so the browser needs internet access
the first time it loads the demo.
