import { baseVariant } from "./variants/base.js";
import { junctionBiasControlVariant } from "./variants/junction-bias-control.js";
import { labelPermutationVariant } from "./variants/label-permutation.js";
import { pointSymmetricCorrespondenceVariant } from "./variants/point-symmetric-correspondence.js";
import { rotationalCorrespondenceVariant } from "./variants/rotational-correspondence.js";
import { yAxisCorrespondenceVariant } from "./variants/y-axis-correspondence.js";
import { translationalCorrespondenceVariant } from "./variants/translational-correspondence.js";
import { defineTask } from "../schema.js";

export const taskDefinition = defineTask({
  id: "task3",
  title: "Task 3",
  subtitle: "Symmetry Pattern",
  summary: "Infer the spatial correspondence connecting the orange and green voxel structures.",
  rule: "Reconstruct the transformation specified by the variant, then select the labeled face where the missing corresponding voxel belongs.",
  answerFormat: "single-select",
  defaultVariant: "base",
  variants: {
    base: baseVariant,
    "label-permutation": labelPermutationVariant,
    "junction-bias-control": junctionBiasControlVariant,
    "point-symmetric-correspondence": pointSymmetricCorrespondenceVariant,
    "rotational-correspondence": rotationalCorrespondenceVariant,
    "y-axis-correspondence": yAxisCorrespondenceVariant,
    "translational-correspondence": translationalCorrespondenceVariant,
  },
});
