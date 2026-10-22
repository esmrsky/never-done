/* Never Done — behavior. Plain JS, no dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Reading progress bar ---------- */
  var bar = document.querySelector(".progress");
  function paintProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (bar) bar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", paintProgress, { passive: true });
  window.addEventListener("resize", paintProgress);
  paintProgress();

  /* ---------- TOC scrollspy ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  var chapterMap = tocLinks
    .map(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  function spy() {
    var line = window.innerHeight * 0.28;
    var current = null;
    for (var i = 0; i < chapterMap.length; i++) {
      if (chapterMap[i].el.getBoundingClientRect().top <= line) current = chapterMap[i];
    }
    chapterMap.forEach(function (c) {
      if (c === current) c.link.setAttribute("aria-current", "true");
      else c.link.removeAttribute("aria-current");
    });
    if (current && current.link.scrollIntoView) {
      // keep the active item visible inside the sticky TOC without scrolling the page
      var toc = document.querySelector(".toc");
      if (toc) {
        var r = current.link.getBoundingClientRect();
        var tr = toc.getBoundingClientRect();
        if (r.top < tr.top || r.bottom > tr.bottom) {
          toc.scrollTop += r.top - tr.top - tr.height / 2;
        }
      }
    }
  }
  window.addEventListener("scroll", spy, { passive: true });
  spy();

  /* ---------- Scroll reveals ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach
      ? revealables.forEach(function (el) { el.classList.add("is-in"); })
      : Array.prototype.forEach.call(revealables, function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- Timeline: spine fill + item lighting ---------- */
  var timeline = document.querySelector(".timeline");
  if (timeline) {
    function paintSpine() {
      var r = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      // progress of the reading line (35% down the viewport) through the timeline
      var line = vh * 0.35;
      var p = (line - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      timeline.style.setProperty("--tl-progress", p.toFixed(4));
    }
    window.addEventListener("scroll", paintSpine, { passive: true });
    window.addEventListener("resize", paintSpine);
    paintSpine();

    var items = timeline.querySelectorAll(".tl-item, .tl-era");
    if ("IntersectionObserver" in window) {
      var tio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle("is-lit", entry.isIntersecting);
          });
        },
        { rootMargin: "-20% 0px -55% 0px" }
      );
      Array.prototype.forEach.call(items, function (el) { tio.observe(el); });
    } else {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-lit"); });
    }
  }

  /* ---------- Chart hover tooltips (shared, event-delegated) ----------
     Any SVG element carrying data-tip shows a positioned tooltip.
     Values remain readable without hover via visible labels + table twins. */
  var tip = document.createElement("div");
  tip.setAttribute("role", "status");
  tip.style.cssText =
    "position:fixed;z-index:70;pointer-events:none;max-width:280px;" +
    "background:var(--ink);color:var(--paper);font-family:var(--font-sans);" +
    "font-size:0.8125rem;line-height:1.45;padding:0.45rem 0.65rem;border-radius:8px;" +
    "opacity:0;transition:opacity 0.12s ease;";
  document.body.appendChild(tip);

  function showTip(text, x, y) {
    tip.textContent = text;
    tip.style.opacity = "1";
    var pad = 14;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, x + pad), window.innerWidth - w - 8);
    var top = y - h - pad;
    if (top < 8) top = y + pad;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip() { tip.style.opacity = "0"; }

  document.addEventListener("pointermove", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
    if (t) showTip(t.getAttribute("data-tip"), e.clientX, e.clientY);
    else hideTip();
  });
  document.addEventListener("pointerleave", hideTip);
  // keyboard access: focusable marks show the same info
  document.addEventListener("focusin", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
    if (t) {
      var r = t.getBoundingClientRect();
      showTip(t.getAttribute("data-tip"), r.left + r.width / 2, r.top);
    }
  });
  document.addEventListener("focusout", hideTip);
})();
