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
