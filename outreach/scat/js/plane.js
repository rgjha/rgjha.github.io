/* plane.js — the signature element.
   One lattice plane, anchored to document coordinates and drawn through a
   fixed viewport, so it stays still relative to the page while scrolling.
   Every lattice figure derives its grid phase from this plane, which is why
   a dot inside a figure lands exactly on a dot of the page behind it. */
(function (EV) {
  "use strict";

  var canvas, ctx, dpr = 1, W = 0, H = 0;
  var cell = 22;
  var reduced = false;
  var raf = null;

  // mood: what the plane is doing under the section currently in view
  var mood = { alpha: 0.85, sig: 0 };   // sig in [0,1] blends lattice -> signal
  var target = { alpha: 0.85, sig: 0 };
  var anim = null;

  var col = { lat: [175, 193, 174], sig: [179, 18, 63] };

  function readVars() {
    var cs = getComputedStyle(document.documentElement);
    var c = parseFloat(cs.getPropertyValue("--cell"));
    if (c > 0) cell = c;
  }

  function pickCell() {
    var w = window.innerWidth;
    var c = w < 560 ? 18 : w < 900 ? 20 : 22;
    document.documentElement.style.setProperty("--cell", c + "px");
    cell = c;
    return c;
  }

  function resize() {
    pickCell();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    schedule();
    EV.bus && EV.bus.emit("plane:resize", { cell: cell });
  }

  function rgba(mix, a) {
    var r = Math.round(col.lat[0] + (col.sig[0] - col.lat[0]) * mix);
    var g = Math.round(col.lat[1] + (col.sig[1] - col.lat[1]) * mix);
    var b = Math.round(col.lat[2] + (col.sig[2] - col.lat[2]) * mix);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function draw() {
    raf = null;
    ctx.clearRect(0, 0, W, H);
    var sy = window.scrollY || window.pageYOffset || 0;
    var y0 = -(((sy % cell) + cell) % cell);
    var r = cell >= 22 ? 1.15 : 1.0;
    var big = cell * 3;                       // the figure unit: every third dot

    // fine plane
    ctx.beginPath();
    for (var x = 0; x <= W + cell; x += cell) {
      for (var y = y0; y <= H + cell; y += cell) {
        ctx.rect(x - r, y - r, 2 * r, 2 * r);
      }
    }
    ctx.fillStyle = rgba(mood.sig, 0.55 * mood.alpha);
    ctx.fill();

    // the coarse sub-lattice the figures use, slightly stronger
    var bx0 = 0, by0 = -((((sy) % big) + big) % big);
    var R = r + 0.55;
    ctx.beginPath();
    for (var X = bx0; X <= W + big; X += big) {
      for (var Y = by0; Y <= H + big; Y += big) {
        ctx.rect(X - R, Y - R, 2 * R, 2 * R);
      }
    }
    ctx.fillStyle = rgba(mood.sig, 0.85 * mood.alpha);
    ctx.fill();
  }

  function schedule() {
    if (raf == null) raf = requestAnimationFrame(draw);
  }

  function setMood(next) {
    target.alpha = next.alpha == null ? target.alpha : next.alpha;
    target.sig = next.sig == null ? target.sig : next.sig;
    if (reduced) { mood.alpha = target.alpha; mood.sig = target.sig; schedule(); return; }
    if (anim) return;
    var step = function () {
      var da = target.alpha - mood.alpha, ds = target.sig - mood.sig;
      if (Math.abs(da) < 0.004 && Math.abs(ds) < 0.004) {
        mood.alpha = target.alpha; mood.sig = target.sig; anim = null; schedule(); return;
      }
      mood.alpha += da * 0.14;
      mood.sig += ds * 0.14;
      schedule();
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  /* Phase alignment ------------------------------------------------
     Given an element and a desired origin in element-local px, return the
     nearest origin whose position in document coordinates is a multiple of
     the plane pitch. Figures call this so their lattice registers with the
     page's. */
  function alignOrigin(el, localX, localY, pitch) {
    pitch = pitch || cell;
    var box = el.getBoundingClientRect();
    var docX = box.left + (window.scrollX || 0);
    var docY = box.top + (window.scrollY || 0);
    var fx = ((-(docX + localX)) % pitch + pitch) % pitch;
    var fy = ((-(docY + localY)) % pitch + pitch) % pitch;
    // move to the nearer of the two aligned positions
    if (fx > pitch / 2) fx -= pitch;
    if (fy > pitch / 2) fy -= pitch;
    return [localX + fx, localY + fy];
  }

  function init() {
    canvas = document.getElementById("plane");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    readVars();
    resize();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
  }

  EV.plane = {
    init: init,
    setMood: setMood,
    alignOrigin: alignOrigin,
    get cell() { return cell; },
    get unit() { return cell * 3; }
  };
})(window.EV = window.EV || {});
