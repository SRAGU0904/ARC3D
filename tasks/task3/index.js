import { baseVariant } from "./variants/base.js";
import { junctionBiasControlVariant } from "./variants/junction-bias-control.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task3",
  title: "Task 3",
  subtitle: "Mirror Completion",
  summary: "Complete the correspondence between the orange and green voxel structures.",
  rule: "Infer the structural symmetry and select the labeled face where the missing voxel belongs.",
  answerFormat: "single-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
    "junction-bias-control": junctionBiasControlVariant,
  },
});
