const menuButton = document.querySelector("[data-menu-toggle]");

if (menuButton) {
  menuButton.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
    const isOpen = document.body.classList.contains("menu-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
});

document.querySelectorAll("[data-fill-format]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector("#trip-format");
    if (target) {
      target.value = button.textContent.trim();
      target.focus();
    }
  });
});

document.querySelectorAll("form[data-prototype-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("[data-form-status]");
    const message = form.getAttribute("data-success-message") || "Спасибо. Сообщение получено.";
    if (status) {
      status.textContent = message;
    }
    form.reset();
  });
});
