import { baseVariant } from "./variants/base.js";
import { junctionBiasControlVariant } from "./variants/junction-bias-control.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task3",
  title: "Task 3",
  subtitle: "Symmetry Pattern",
  summary: "Infer the spatial symmetry connecting the orange and green voxel structures.",
  rule: "Reconstruct the correspondence between the two structures, then select the labeled face where the missing symmetric voxel belongs.",
  answerFormat: "single-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
    "junction-bias-control": junctionBiasControlVariant,
  },
});
