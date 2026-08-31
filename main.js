const frame = document.querySelector("#task-frame");
const buttons = document.querySelectorAll(".task-link");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    frame.src = button.dataset.src;
  });
});
