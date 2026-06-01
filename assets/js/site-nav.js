(() => {
  const headers = document.querySelectorAll(".site-header");

  headers.forEach((header) => {
    const button = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".site-nav");

    if (!button || !nav) return;

    const closeMenu = () => {
      button.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };

    const toggleMenu = () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
    };

    button.addEventListener("click", toggleMenu);

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 780) {
        closeMenu();
      }
    });
  });
})();
