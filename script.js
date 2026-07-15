(function () {
  var currentYear = document.querySelector("[data-current-year]");
  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }

  var header = document.querySelector("[data-site-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navMenu = document.querySelector("[data-nav-menu]");

  function setScrolledState() {
    if (!header) {
      return;
    }

    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  function closeMenu() {
    if (!navToggle || !navMenu) {
      return;
    }

    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    navMenu.classList.remove("is-open");
  }

  function toggleMenu() {
    if (!navToggle || !navMenu) {
      return;
    }

    var isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu"
    );
    navMenu.classList.toggle("is-open", !isOpen);
  }

  setScrolledState();
  window.addEventListener("scroll", setScrolledState, { passive: true });

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", toggleMenu);

    navMenu.addEventListener("click", function (event) {
      if (event.target instanceof HTMLAnchorElement) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!revealItems.length || reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealItems.forEach(function (item) {
    observer.observe(item);
  });
})();
