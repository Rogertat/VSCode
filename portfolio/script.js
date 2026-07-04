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

  /* ---- The oracle: a tiny, extremely serious inference engine -------- */
  var oracleBtn = document.querySelector("[data-oracle]");
  var oracleScreen = document.querySelector("[data-oracle-screen]");
  if (oracleBtn && oracleScreen) {
    var STAGES = [
      "> tokenizing your curiosity... done",
      "> loading 6+ yrs of experience [##########] 100%",
      "> attention: all heads on you",
      "> sampling verdict (temperature=0.9)..."
    ];
    var VERDICTS = [
      "P(Roger replies fast) = 0.997 - the missing 0.003 is sleep.",
      "verdict: HIRE_SIGNAL_DETECTED. recommended action: scroll down, hit email.",
      "output: 42. re-ran it to be safe. still 42. email him.",
      "your roadmap x Roger -> shipped. confidence: uncomfortably high.",
      "warning: candidate may refactor your pipeline out of sheer curiosity.",
      "fully grounded, citation-backed conclusion: you should say hi."
    ];
    var running = false;
    var print = function (text, cls) {
      var p = document.createElement("p");
      p.className = "oracle-line" + (cls ? " " + cls : "");
      p.textContent = text;
      oracleScreen.appendChild(p);
      while (oracleScreen.children.length > 6) oracleScreen.removeChild(oracleScreen.firstChild);
    };
    oracleBtn.addEventListener("click", function () {
      if (running) return;
      running = true;
      oracleBtn.disabled = true;
      oracleBtn.textContent = "inferencing...";
      var verdict = "> " + VERDICTS[Math.floor(Math.random() * VERDICTS.length)];
      if (prefersReducedMotion) {
        STAGES.forEach(function (s) { print(s); });
        print(verdict, "verdict");
        running = false;
        oracleBtn.disabled = false;
        oracleBtn.textContent = "▶ Run it again";
        return;
      }
      var i = 0;
      var step = function () {
        if (i < STAGES.length) {
          print(STAGES[i++]);
          setTimeout(step, 420 + Math.random() * 380);
        } else {
          print(verdict, "verdict");
          running = false;
          oracleBtn.disabled = false;
          oracleBtn.textContent = "▶ Run it again";
        }
      };
      setTimeout(step, 250);
    });
  }

  /* ---- Hero blobs drift toward the pointer (fine pointers only) ------ */
  var blobs = document.querySelectorAll(".blob");
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  if (blobs.length && finePointer && !prefersReducedMotion) {
    var hero = document.querySelector(".hero");
    var ticking = false, mx = 0, my = 0;
    hero.addEventListener("mousemove", function (e) {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          blobs.forEach(function (b, i) {
            var depth = (i + 1) * 9;
            b.style.translate = mx * depth + "px " + my * depth + "px";
          });
        });
      }
    });
  }

  /* ---- For the ones who open the console (hello, fellow engineer) ---- */
  try {
    var art = [
      "%c  ____                        ",
      " |  _ \\ ___   __ _  ___ _ __ ",
      " | |_) / _ \\ / _` |/ _ \\ '__|",
      " |  _ < (_) | (_| |  __/ |   ",
      " |_| \\_\\___/ \\__, |\\___|_|   ",
      "             |___/            "
    ].join("\n");
    console.log(art, "color:#6c4cf1; font-weight:bold");
    console.log(
      "%cCurious enough to open the console? We'd get along.\n" +
      "%cAI/ML engineer, 6+ yrs, currently @ Xerago. -> roger29995@gmail.com",
      "color:#12b3a3; font-size:13px; font-weight:bold",
      "color:#888; font-size:12px"
    );
  } catch (e) {}
})();
