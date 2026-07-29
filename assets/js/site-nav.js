(() => {
  const script = document.currentScript;
  const siteRoot = script ? new URL("../../", script.src) : new URL("/", window.location.href);
  const main = document.querySelector("main");
  const navItems = [
    ["Home", ""],
    ["Services", "services/"],
    ["Institutional", "education-management-software-nagpur/"],
    ["Projects", "projects/"],
    ["Case Studies", "case-studies/"],
    ["UAE", "uae/"],
    ["Insights", "insights/"],
    ["Company", "about/"]
  ];
  const headers = document.querySelectorAll(".site-header");

  if (main) {
    main.id ||= "main-content";

    if (!document.querySelector(".skip-link")) {
      const skipLink = document.createElement("a");
      skipLink.className = "skip-link";
      skipLink.href = "#main-content";
      skipLink.textContent = "Skip to main content";
      document.body.prepend(skipLink);
    }
  }

  headers.forEach((header) => {
    const button = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".site-nav");

    if (!button || !nav) return;

    const currentPath = new URL(window.location.href).pathname.replace(/\/index\.html$/, "/");
    const navLinks = navItems.map(([label, path]) => {
      const link = document.createElement("a");
      const url = new URL(path, siteRoot);
      const targetPath = url.pathname.replace(/\/index\.html$/, "/");
      const isCaseStudy = label === "Case Studies" && currentPath.includes("/case-studies/");
      const isInsight = label === "Insights" && currentPath.includes("/insights/");
      const isUaePage = label === "UAE" && [
        "/uae/",
        "/custom-software-development-dubai/",
        "/internal-business-software-uae/",
        "/workflow-automation-software-dubai/"
      ].some((route) => currentPath.endsWith(route));

      link.href = url.href;
      link.textContent = label;

      if (currentPath === targetPath || isCaseStudy || isInsight || isUaePage) {
        link.setAttribute("aria-current", "page");
      }

      return link;
    });

    const consultationLink = document.createElement("a");
    consultationLink.className = "nav-cta";
    consultationLink.href = "https://calendly.com/shubhamsinghvr/strategy-call";
    consultationLink.target = "_blank";
    consultationLink.rel = "noopener";
    consultationLink.textContent = "Discuss a project";

    nav.replaceChildren(...navLinks, consultationLink);

    const closeMenu = () => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation");
      nav.classList.remove("is-open");
    };

    const toggleMenu = () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      button.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
      nav.classList.toggle("is-open", !isOpen);
    };

    button.addEventListener("click", toggleMenu);

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1120) {
        closeMenu();
      }
    });
  });
})();
