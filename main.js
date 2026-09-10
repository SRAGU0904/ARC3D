let frame = document.querySelector("#task-frame");
const buttons = document.querySelectorAll(".task-link");

function loadTask(source) {
  const replacement = document.createElement("iframe");
  replacement.id = "task-frame";
  replacement.title = "Selected ARC-3D task";
  replacement.src = source;
  frame.replaceWith(replacement);
  frame = replacement;
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    loadTask(button.dataset.src);
  });
});

const initialTask = document.querySelector(".task-link.is-active");
if (initialTask) loadTask(initialTask.dataset.src);

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== "arc3d:open-case") return;

  const { taskId, variantId, caseId, seed } = event.data;
  if (!["task1", "task2", "task3"].includes(taskId)) return;

  const query = new URLSearchParams({ variant: variantId, puzzle: caseId });
  if (seed !== null && seed !== undefined) query.set("seed", seed);
  loadTask(`./${taskId}/?${query}`);
});
