import { baseVariant } from "./variants/base.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { reducedFaceAdjacencyVariant } from "./variants/reduced-face-adjacency.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task2",
  title: "Task 2",
  subtitle: "Nearest Candidate",
  summary: "Choose the labeled object voxel closest to the separate blue voxel.",
  rule: "Reconstruct candidate and blue positions across views, then compare their 3D distances.",
  answerFormat: "single-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
    "reduced-face-adjacency": reducedFaceAdjacencyVariant,
  },
});
