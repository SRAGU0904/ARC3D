import { baseVariant } from "./variants/base.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task1",
  title: "Task 1",
  subtitle: "Spatial Completion",
  summary: "Identify the missing voxels required to complete one or more solid 3D structures.",
  rule: "Reconstruct the intended complete geometry, then select every labeled position that fills a missing voxel.",
  answerFormat: "multi-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
  },
});
