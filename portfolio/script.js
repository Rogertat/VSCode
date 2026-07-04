/* ==========================================================================
   Roger — Portfolio interactions
   Progressive enhancement: the page is fully usable if this never runs.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Signals to the inline head-script failsafe that JS is alive, so it won't
  // force-reveal everything (see the reveal-off fallback in index.html).
  window.__revealReady = true;

  /* ---- Current year in footer ---------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Theme toggle (persisted) -------------------------------------- */
  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    // Reflect current theme in aria-pressed on load (not just after first click)
    themeBtn.setAttribute("aria-pressed", String(root.getAttribute("data-theme") === "dark"));
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      themeBtn.setAttribute("aria-pressed", String(next === "dark"));
    });
  }

  /* ---- Mobile navigation --------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  function menuFocusables() {
    return Array.prototype.slice.call(
      navMenu.querySelectorAll('a[href], button:not([disabled])')
    );
  }
  function openMenu() {
    if (!navMenu || !navToggle) return;
    navMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    var f = menuFocusables();
    if (f.length) f[0].focus(); // move focus into the drawer
  }
  function closeMenu(restoreFocus) {
    if (!navMenu || !navToggle) return;
    var wasOpen = navMenu.classList.contains("is-open");
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    if (wasOpen && restoreFocus) navToggle.focus(); // return focus to the trigger
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      if (navMenu.classList.contains("is-open")) closeMenu(true);
      else openMenu();
    });
    // Close when a link is tapped (let the anchor take focus naturally)
    navMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });
    // Close on Escape and restore focus to the toggle
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMenu.classList.contains("is-open")) closeMenu(true);
    });
    // Close when clicking outside the drawer
    document.addEventListener("click", function (e) {
      if (
        navMenu.classList.contains("is-open") &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        closeMenu(false);
      }
    });
    // Simple focus trap while the drawer is open
    navMenu.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !navMenu.classList.contains("is-open")) return;
      var f = menuFocusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---- Placeholder links (href="#") don't jump to top ---------------- */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---- Résumé: print to PDF ------------------------------------------ */
  var printButtons = document.querySelectorAll("[data-print]");
  printButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
  });

  /* ---- Header shadow on scroll --------------------------------------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Reveal on scroll ---------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      // threshold 0 + a bottom margin so even elements taller than the
      // viewport reveal as soon as their top edge scrolls into view.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---- Active nav link via scroll spy -------------------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-menu a[href^="#"]')
  );
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter(Boolean);

  if (sections.length) {
    var spyTicking = false;
    function updateActive() {
      spyTicking = false;
      var line = window.scrollY + window.innerHeight * 0.35;
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= line) current = sections[i];
      }
      // At the very bottom of the page, always highlight the last section
      // (it may be too short to ever cross the 35% line).
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
        current = sections[sections.length - 1];
      }
      var id = current ? current.id : null;
      navLinks.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
      });
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!spyTicking) { spyTicking = true; window.requestAnimationFrame(updateActive); }
      },
      { passive: true }
    );
    window.addEventListener("resize", updateActive);
    updateActive();
  }
})();
