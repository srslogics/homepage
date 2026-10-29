(() => {
  const script = document.currentScript;
  const siteRoot = script ? new URL("../../", script.src) : new URL("/", window.location.href);
  const main = document.querySelector("main");
  const navItems = [
    ["Services", "services/"],
    ["Client systems", "projects/"],
    ["Our approach", "process/"],
    ["Insights", "insights/"],
    ["Company", "about/"]
  ];
  const headers = document.querySelectorAll(".site-header");
  const subpages = {
    Services: [["Education management", "education-management-software-nagpur/"], ["Business data analysis", "business-data-analysis-systems/"]],
    "Client systems": [["Case studies", "case-studies/"], ["Client feedback", "client-reviews/"]],
    "Our approach": [["Pricing", "pricing/"], ["Security", "security/"]],
    Insights: [["The Invisible Engine", "insights/the-invisible-engine/"]],
    Company: [["Careers", "careers/"], ["International delivery", "regions/"]]
  };

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

    header.dataset.navReady = "true";

    const currentPath = new URL(window.location.href).pathname.replace(/\/index\.html$/, "/");
    const navLinks = navItems.map(([label, path]) => {
      const link = document.createElement("a");
      const url = new URL(path, siteRoot);
      const targetPath = url.pathname.replace(/\/index\.html$/, "/");
      const isCaseStudy = label === "Client systems" && (
        currentPath.includes("/case-studies/") || currentPath.includes("/client-reviews/")
      );
      const isInsight = label === "Insights" && currentPath.includes("/insights/");
      const isService = label === "Services" && /\/(?:education-management-software-nagpur|business-data-analysis-systems|custom-software-development-dubai|internal-business-software-uae|workflow-automation-software-dubai)\/$/.test(currentPath);
      const isApproach = label === "Our approach" && /\/(?:pricing|security)\/$/.test(currentPath);
      const isCompany = label === "Company" && /\/(?:careers|regions|uk|us|uae|raipur|nagpur-custom-software-company)\/$/.test(currentPath);

      link.href = url.href;
      link.textContent = label;

      if (currentPath === targetPath || isCaseStudy || isInsight || isService || isApproach || isCompany) {
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

    const dropdowns = navLinks.map((link, index) => {
      const label = navItems[index][0];
      const group = document.createElement("div");
      group.className = "nav-dropdown";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "nav-dropdown-trigger";
      trigger.textContent = label;
      trigger.setAttribute("aria-expanded", "false");
      if (link.hasAttribute("aria-current")) group.classList.add("is-current");
      const panel = document.createElement("div");
      panel.className = "nav-dropdown-panel";
      panel.id = `${nav.id}-submenu-${index}`;
      panel.hidden = true;
      trigger.setAttribute("aria-controls", panel.id);
      link.textContent = `${label} overview`;
      if (new URL(link.href).pathname !== currentPath) link.removeAttribute("aria-current");
      link.replaceWith(group);
      panel.append(link);
      subpages[label].forEach(([title, path]) => {
        const child = document.createElement("a");
        child.href = new URL(path, siteRoot).href;
        child.textContent = title;
        if (new URL(child.href).pathname === currentPath) child.setAttribute("aria-current", "page");
        panel.append(child);
      });
      group.append(trigger, panel);
      const setOpen = (open) => {
        panel.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
      };
      trigger.addEventListener("click", () => {
        const open = panel.hidden;
        dropdowns.forEach((item) => item.setOpen(false));
        setOpen(open);
      });
      group.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "mouse" || window.innerWidth <= 1100) return;
        dropdowns.forEach((item) => item.setOpen(false));
        setOpen(true);
      });
      group.addEventListener("pointerleave", () => {
        if (!group.contains(document.activeElement)) setOpen(false);
      });
      group.addEventListener("focusout", (event) => {
        if (!group.contains(event.relatedTarget)) setOpen(false);
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setOpen(true);
          panel.querySelector("a").focus();
        }
      });
      group.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
          event.stopPropagation();
          setOpen(false);
          trigger.focus();
        }
      });
      return { setOpen };
    });

    const closeMenu = () => {
      dropdowns.forEach((item) => item.setOpen(false));
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
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        closeMenu();
        button.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100) {
        closeMenu();
      }
    });
  });

  document.querySelectorAll(".site-footer").forEach((footer) => {
    const footerBottom = footer.querySelector(".footer-bottom");
    if (footerBottom && !footer.querySelector("[data-project-assistant]")) {
      const assistantLink = document.createElement("a");
      assistantLink.href = new URL("assistant/", siteRoot).href;
      assistantLink.dataset.projectAssistant = "";
      assistantLink.textContent = "Project assistant";
      const assistantEntry = document.createElement("p");
      assistantEntry.append(assistantLink);
      footerBottom.append(assistantEntry);
    }
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
      // Long galleries must reveal even when only their top edge is visible.
      threshold: 0,
      rootMargin: "0px 0px -8% 0px"
    });

    revealTargets.forEach((target) => revealObserver.observe(target));
  }
})();
