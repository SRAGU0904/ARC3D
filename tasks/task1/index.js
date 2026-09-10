import { baseVariant } from "./variants/base.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task1",
  title: "Task 1",
  subtitle: "Surface Repair",
  summary: "Repair missing surface voxels in incomplete solid blocks.",
  rule: "Infer the completed block surfaces and select every labeled missing voxel.",
  answerFormat: "multi-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
  },
});
