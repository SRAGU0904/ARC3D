import { taskDefinition as task1 } from "./task1/index.js";
import { taskDefinition as task2 } from "./task2/index.js";
import { taskDefinition as task3 } from "./task3/index.js";

export const taskCatalog = [task1, task2, task3];

export function getTask(taskId) {
  return taskCatalog.find((task) => task.id === taskId) ?? null;
}
