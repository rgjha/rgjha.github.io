/* main.js — page controller: math typesetting, one resize bus,
   the reveal orchestration, and the plane's response to the section in view. */
(function (EV) {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var resizers = [];
  var rTimer = null;
  EV.onResize = function (fn) { resizers.push(fn); };
  function runResizers() { resizers.forEach(function (f) { try { f(); } catch (e) { /* keep going */ } }); }
  window.addEventListener("resize", function () {
    clearTimeout(rTimer);
    rTimer = setTimeout(runResizers, 120);
  });

  function typeset() {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }

  function reveals() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var group = en.target.parentElement
          ? Array.prototype.slice.call(en.target.parentElement.querySelectorAll(":scope > .reveal"))
          : [en.target];
        var i = Math.max(0, group.indexOf(en.target));
        en.target.style.setProperty("--d", Math.min(i, 4) * 70 + "ms");
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  function moods() {
    var secs = Array.prototype.slice.call(document.querySelectorAll("[data-mood]"));
    if (!secs.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (en) {
        if (en.isIntersecting && (!best || en.intersectionRatio > best.intersectionRatio)) best = en;
      });
      if (!best) return;
      var m = best.target.dataset.mood.split(",");
      EV.plane.setMood({ alpha: +m[0], sig: +m[1] });
    }, { threshold: [0.15, 0.4, 0.7] });
    secs.forEach(function (s) { io.observe(s); });
  }

  function boot() {
    document.documentElement.classList.remove("boot");
    document.documentElement.classList.add("booted");
  }

  function start() {
    typeset();
    EV.plane.init();
    EV.figuresPP.init();
    EV.counter.init();
    reveals();
    moods();
    boot();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(runResizers, 30); });
    }
    window.addEventListener("load", function () { setTimeout(runResizers, 60); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window.EV = window.EV || {});
