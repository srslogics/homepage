(() => {
  const script = document.currentScript;
  const siteRoot = script ? new URL("../../", script.src) : new URL("/", window.location.href);
  const main = document.querySelector("main");
  const navItems = [
    ["Home", ""],
    ["Services", "services/"],
    ["Institutional", "education-management-software-nagpur/"],
    ["Client Systems", "projects/"],
    ["Case Studies", "case-studies/"],
    ["Regions", "regions/"],
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
      const isCaseStudy = label === "Case Studies" && (
        currentPath.includes("/case-studies/") || currentPath.includes("/client-reviews/")
      );
      const isInsight = label === "Insights" && currentPath.includes("/insights/");
      const isRegionPage = label === "Regions" && [
        "/regions/",
        "/uk/",
        "/us/",
        "/uae/",
        "/custom-software-development-dubai/",
        "/internal-business-software-uae/",
        "/workflow-automation-software-dubai/"
      ].some((route) => currentPath.endsWith(route));

      link.href = url.href;
      link.textContent = label;

      if (currentPath === targetPath || isCaseStudy || isInsight || isRegionPage) {
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
      if (window.innerWidth > 1280) {
        closeMenu();
      }
    });
  });

  document.querySelectorAll(".site-footer").forEach((footer) => {
    if (footer.querySelector(".footer-trust-links, [data-trust-links]")) return;

    const bottom = footer.querySelector(".footer-bottom");
    if (!bottom) return;

    const links = document.createElement("nav");
    links.className = "footer-trust-links";
    links.setAttribute("aria-label", "Trust and legal");

    [
      ["Privacy", "privacy/"],
      ["Terms", "terms/"],
      ["Security", "security/"]
    ].forEach(([label, path]) => {
      const link = document.createElement("a");
      link.href = new URL(path, siteRoot).href;
      link.textContent = label;
      links.append(link);
    });

    bottom.insertAdjacentElement("afterend", links);
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = document.querySelectorAll(".section-frame > .container");

  if (!reduceMotion && revealTargets.length && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-enabled");

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -8% 0px"
    });

    revealTargets.forEach((target) => revealObserver.observe(target));
  }
})();
