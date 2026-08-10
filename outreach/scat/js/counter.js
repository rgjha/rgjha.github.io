/* counter.js — the visit tally at the foot of the page.
   A static page has nowhere of its own to keep a running total, so the count
   lives in a small public counter and is fetched, and incremented, on each
   load. If that request fails the whole block stays hidden rather than
   showing a number the page cannot stand behind. */
(function (EV) {
  "use strict";

  /* counterapi.dev, free tier, no key and no cookie. The namespace/name pair
     is the whole identity of the counter — change it and the count restarts. */
  var ENDPOINT = "https://api.counterapi.dev/v1/ising-scattering-mps/visits/up";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function format(n) {
    return n.toLocaleString("en-US");
  }

  function run(el, total) {
    if (reduced || total <= 0) { el.textContent = format(total); return; }
    var DUR = 900;
    var t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / DUR);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(Math.round(total * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function whenSeen(section, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.disconnect();
        fn();
      });
    }, { threshold: 0.35 });
    io.observe(section);
  }

  function init() {
    var section = document.getElementById("visits");
    var el = document.getElementById("visit-count");
    if (!section || !el || !window.fetch) return;

    fetch(ENDPOINT, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("counter " + r.status);
        return r.json();
      })
      .then(function (d) {
        var n = Number(d && d.count);
        if (!isFinite(n) || n < 0) throw new Error("counter returned no count");
        el.textContent = format(n);
        section.hidden = false;
        whenSeen(section, function () { run(el, n); });
      })
      .catch(function () {
        /* no number, no block */
        section.hidden = true;
      });
  }

  EV.counter = { init: init };
})(window.EV = window.EV || {});
