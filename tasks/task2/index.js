import { baseVariant } from "./variants/base.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { reducedFaceAdjacencyVariant } from "./variants/reduced-face-adjacency.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task2",
  title: "Task 2",
  subtitle: "Spatial Distance",
  summary: "Compare the 3D distances between a separate blue reference voxel and labeled candidate voxels.",
  rule: "Reconstruct all positions across views, calculate their spatial distances, and apply the relation specified by the variant.",
  answerFormat: "single-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
    "reduced-face-adjacency": reducedFaceAdjacencyVariant,
  },
});
