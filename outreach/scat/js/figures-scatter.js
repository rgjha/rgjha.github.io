/* figures-scatter.js — every figure on the page.
   The centrepiece is a space-time energy-density renderer (canvas) that
   recreates the paper's Fig. 1: time upward, position across, colour = energy
   above the vacuum. F1 three-panel, F2 anatomy, F3 the η line, F4 explorer,
   F5 time delay, F6 resonance, F7 high-energy limit, D1 inelastic sketch.
   Figures marked schematic follow the paper's behaviour, not raw data. */
(function (EV) {
  "use strict";

  function fmt(x, d) {
    if (d == null) d = 2;
    return Number(x).toLocaleString("en-US", {
      minimumFractionDigits: d, maximumFractionDigits: d
    });
  }
  EV.fmt = fmt;

  /* colour ramp: vacuum (paper) -> warm build-up -> hot track.
     Kept on-palette: paper -> lattice -> solid -> signal -> pale flash. */
  var HEAT = d3.scaleLinear()
    .domain([0, 0.22, 0.5, 0.8, 1])
    .range(["#E7ECE2", "#AFC1AE", "#12566E", "#B3123F", "#F4D9B0"])
    .clamp(true);

  /* ===============================================================
     Core: draw an energy-density space-time diagram onto a canvas.
     opts: mode 'elastic'|'resonance'|'inelastic', delay, tau (lifetime),
           production (0..1), tCursor (0..1 or null), collideT, speed.
     =============================================================== */
  function drawSpacetime(canvas, opts) {
    opts = opts || {};
    var mode = opts.mode || "elastic";
    var delay = opts.delay == null ? 0.03 : opts.delay;     // vertical gap at vertex
    var tau = opts.tau == null ? 0.18 : opts.tau;           // resonance lifetime
    var production = opts.production == null ? 0.7 : opts.production;
    var speed = opts.speed == null ? 0.62 : opts.speed;     // dposition/dtime
    var tc = opts.collideT == null ? 0.34 : opts.collideT;  // collision time
    var pc = 0.5;
    var wPk = opts.track == null ? 0.017 : opts.track;      // track half-width

    var W = canvas.clientWidth || 300;
    var H = opts.height || Math.round(W * 0.92);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.height = H + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // gaussian bump
    function g(dx, w) { return Math.exp(-(dx * dx) / (2 * w * w)); }

    // energy at (position p in 0..1, time t in 0..1)
    function energy(p, t) {
      var e = 0;
      // incoming: two packets converging to (pc, tc)
      if (t <= tc) {
        var f = (tc - t);
        e += g(p - (pc - speed * f), wPk);
        e += g(p - (pc + speed * f), wPk);
      } else {
        var td = t - tc;
        // resonance lump
        if (mode === "resonance") {
          var lump = Math.exp(-td / tau);
          e += 1.15 * lump * g(p - pc, wPk * 2.6);
          // faint secondary outgoing pairs (interference), start after small delay
          var tdo = Math.max(0, td - 0.02);
          var amp = 0.55 * (1 - Math.exp(-td / (tau * 1.2)));
          [0.82, 1.12].forEach(function (vv, i) {
            var a = amp * (i === 0 ? 1 : 0.7);
            e += a * g(p - (pc - speed * vv * tdo), wPk);
            e += a * g(p - (pc + speed * vv * tdo), wPk);
          });
        } else {
          // hold at centre during the delay window, then release
          var teff = Math.max(0, td - delay);
          if (td < delay) {
            e += g(p - pc, wPk * 1.5) * 1.0;
          }
          // primary elastic outgoing
          var mainAmp = mode === "inelastic" ? 0.78 : 1.0;
          e += mainAmp * g(p - (pc - speed * teff), wPk);
          e += mainAmp * g(p - (pc + speed * teff), wPk);
          // inelastic: extra produced tracks at other velocities
          if (mode === "inelastic") {
            var vs = [1.35, 0.42, 0.9];
            var amps = [0.5, 0.5, 0.34].map(function (a) { return a * production; });
            for (var k = 0; k < vs.length; k++) {
              e += amps[k] * g(p - (pc - speed * vs[k] * teff), wPk * 1.15);
              e += amps[k] * g(p - (pc + speed * vs[k] * teff), wPk * 1.15);
            }
          }
        }
      }
      return e;
    }

    // paint
    var NX = Math.min(220, Math.max(120, Math.round(W / 2)));
    var NY = Math.round(NX * (H / W));
    var cw = W / NX, ch = H / NY;
    for (var iy = 0; iy < NY; iy++) {
      var t = 1 - (iy + 0.5) / NY;           // time increases upward
      for (var ix = 0; ix < NX; ix++) {
        var p = (ix + 0.5) / NX;
        var val = energy(p, t);
        if (val > 0.015) {
          ctx.fillStyle = HEAT(Math.min(1, val));
          ctx.fillRect(ix * cw, iy * ch, cw + 0.7, ch + 0.7);
        } else {
          ctx.fillStyle = HEAT(0);
          ctx.fillRect(ix * cw, iy * ch, cw + 0.7, ch + 0.7);
        }
      }
    }

    // frame
    ctx.strokeStyle = "#0E2129";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    // time cursor (F2)
    if (opts.tCursor != null) {
      var yc = H * (1 - opts.tCursor);
      ctx.strokeStyle = "rgba(14,33,41,0.55)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, yc); ctx.lineTo(W, yc); ctx.stroke();
      ctx.setLineDash([]);
      // dots where the particles are
      var tt = opts.tCursor;
      var pts = [];
      if (tt <= tc) {
        var f = tc - tt;
        pts = [pc - speed * f, pc + speed * f];
      } else {
        var teff = Math.max(0, tt - tc - (mode === "resonance" ? 0 : delay));
        if (mode === "resonance") pts = [pc];
        else pts = [pc - speed * teff, pc + speed * teff];
      }
      pts.forEach(function (px) {
        ctx.fillStyle = "#0E2129";
        ctx.beginPath(); ctx.arc(px * W, yc, 4, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = "#F4D9B0";
        ctx.beginPath(); ctx.arc(px * W, yc, 2, 0, 2 * Math.PI); ctx.fill();
      });
    }

    // axis hints
    ctx.fillStyle = "#5b6b63";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    if (opts.axes !== false) {
      ctx.save();
      ctx.translate(11, H / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillText("time →", 0, 0);
      ctx.restore();
      ctx.textAlign = "center";
      ctx.fillText("position →", W / 2, H - 5);
    }
    return { energy: energy, W: W, H: H };
  }

  /* ===============================================================
     F1 — three panels: elastic, resonance, inelastic (recreate Fig 1).
     =============================================================== */
  function f1() {
    var host = document.getElementById("f1-stage");
    if (!host) return;
    var built = false, canvases = [];

    function build() {
      host.innerHTML = "";
      var wrap = document.createElement("div");
      wrap.style.display = "grid";
      wrap.style.gridTemplateColumns = "repeat(3, 1fr)";
      wrap.style.gap = "8px";
      var labels = ["elastic", "resonance", "inelastic"];
      canvases = labels.map(function (lab) {
        var cell = document.createElement("div");
        var cv = document.createElement("canvas");
        cv.style.width = "100%"; cv.style.display = "block";
        cv.setAttribute("role", "img");
        cv.setAttribute("aria-label", "Space-time energy density: " + lab + " scattering.");
        var cap = document.createElement("div");
        cap.textContent = lab;
        cap.style.cssText = "font-family:var(--mono);font-size:0.72rem;color:var(--ink-70);text-align:center;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em";
        cell.appendChild(cv); cell.appendChild(cap);
        wrap.appendChild(cell);
        return cv;
      });
      host.appendChild(wrap);
      built = true;
    }

    function render() {
      if (!built) build();
      drawSpacetime(canvases[0], { mode: "elastic", delay: 0.05, height: hgt(canvases[0]) });
      drawSpacetime(canvases[1], { mode: "resonance", tau: 0.16, height: hgt(canvases[1]) });
      drawSpacetime(canvases[2], { mode: "inelastic", production: 0.75, height: hgt(canvases[2]) });
    }
    function hgt(cv) { return Math.round((cv.clientWidth || 150) * 1.15); }

    render();
    EV.onResize(render);
  }

  /* ===============================================================
     F2 — anatomy of a collision with a time cursor.
     =============================================================== */
  function f2() {
    var host = document.getElementById("f2-stage");
    if (!host) return;
    var tIn = document.getElementById("f2-t");
    var tOut = document.getElementById("f2-t-out");
    var aEl = document.getElementById("f2-a");
    var bEl = document.getElementById("f2-b");
    var cEl = document.getElementById("f2-c");
    var desc = document.getElementById("f2-desc");
    var cv = document.createElement("canvas");
    cv.style.width = "100%"; cv.style.display = "block"; cv.setAttribute("role", "img");
    host.appendChild(cv);

    var tc = 0.34;
    function render() {
      var frac = +tIn.value / 100;
      drawSpacetime(cv, { mode: "elastic", delay: 0.05, tCursor: frac,
        height: Math.round((cv.clientWidth || 300) * 0.95) });
      var phase = frac < tc - 0.02 ? "before" : frac < tc + 0.07 ? "at" : "after";
      aEl.className = "v" + (phase === "before" ? " good" : "");
      bEl.className = "v" + (phase === "at" ? " good" : "");
      cEl.className = "v" + (phase === "after" ? " good" : "");
      tOut.textContent = frac >= 0.99 ? "end" : frac <= 0.01 ? "start" : fmt(frac, 2);
      desc.textContent = "Time cursor at " + Math.round(frac * 100) + "% — the particles are " +
        (phase === "before" ? "approaching each other."
          : phase === "at" ? "in contact at the collision point."
          : "receding after the bounce.");
    }
    tIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  /* ===============================================================
     F3 — the IFT line (after Fig 2): η dial + mass spectrum.
     =============================================================== */
  function f3() {
    var host = document.getElementById("f3-stage");
    if (!host) return;
    var etaIn = document.getElementById("f3-eta");
    var etaOut = document.getElementById("f3-eta-out");
    var regEl = document.getElementById("f3-regime");
    var nEl = document.getElementById("f3-nstable");
    var charEl = document.getElementById("f3-char");
    var verdict = document.getElementById("f3-verdict");
    var desc = document.getElementById("f3-desc");
    var svg = d3.select(host).append("svg").attr("role", "img");

    // slider 0..100 -> eta on a log-ish scale 0..~3
    function etaOf(s) { return s === 0 ? 0 : Math.pow(10, -2.2 + (s / 100) * 2.7); } // ~0.006 .. ~3
    var ETA3 = 0.022, ETA2 = 0.333;
    // E8 masses (m1=1), first six + heavier flagged
    var MASSES = [1, 1.618, 1.989, 2.405, 2.956, 3.218];

    function render() {
      var s = +etaIn.value;
      var eta = etaOf(s);
      var nStable = eta < ETA3 ? 3 : eta < ETA2 ? 2 : 1;

      var W = Math.min(host.clientWidth || 700, 820);
      var H = Math.max(230, Math.min(300, W * 0.42));
      var M = { t: 40, r: 20, b: 46, l: 44 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      // the interpolation line E8 --- free fermion
      var lx0 = M.l, lx1 = W - M.r, ly = M.t - 14;
      svg.append("line").attr("x1", lx0).attr("x2", lx1).attr("y1", ly).attr("y2", ly)
        .attr("stroke", "var(--ink)").attr("stroke-width", 1.5);
      // position of eta on the line (map eta 0..3 -> 0..1, sqrt for spread)
      function etaX(e) { return lx0 + (lx1 - lx0) * Math.min(1, Math.sqrt(e / 3)); }
      // markers for thresholds
      [[ETA3, "η₃"], [ETA2, "η₂"]].forEach(function (m) {
        svg.append("line").attr("x1", etaX(m[0])).attr("x2", etaX(m[0]))
          .attr("y1", ly - 5).attr("y2", ly + 5).attr("stroke", "var(--ink-50)").attr("stroke-width", 1);
        svg.append("text").attr("class", "tick-txt").attr("x", etaX(m[0])).attr("y", ly - 9)
          .attr("text-anchor", "middle").text(m[1]);
      });
      svg.append("text").attr("class", "tick-txt").attr("x", lx0).attr("y", ly + 16)
        .attr("text-anchor", "start").attr("fill", "var(--signal)").text("E₈  (η=0)");
      svg.append("text").attr("class", "tick-txt").attr("x", lx1).attr("y", ly + 16)
        .attr("text-anchor", "end").text("free fermion (η→∞)");
      // current-eta dot
      svg.append("circle").attr("cx", etaX(eta)).attr("cy", ly).attr("r", 5.5)
        .attr("fill", "var(--signal)").attr("stroke", "var(--paper)").attr("stroke-width", 1.5);

      // mass spectrum bars
      var y = d3.scaleLinear().domain([0, 3.6]).range([H - M.b, M.t + 6]);
      [1, 2, 3].forEach(function (t) {
        svg.append("line").attr("class", "grid-line")
          .attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(t)).attr("y2", y(t));
        svg.append("text").attr("class", "tick-txt").attr("x", M.l - 7).attr("y", y(t) + 4)
          .attr("text-anchor", "end").text(t);
      });
      // two-particle threshold line
      svg.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(2)).attr("y2", y(2))
        .attr("stroke", "var(--ink)").attr("stroke-width", 1).attr("stroke-dasharray", "6 3");
      svg.append("text").attr("class", "tick-txt").attr("x", W - M.r).attr("y", y(2) - 5)
        .attr("text-anchor", "end").text("2m₁ threshold");

      var bw = (W - M.l - M.r) / (MASSES.length * 1.7);
      MASSES.forEach(function (m, i) {
        var cx = M.l + (i + 0.6) * (W - M.l - M.r) / MASSES.length;
        // a particle is "stable" if below threshold OR (above threshold and still stable at this eta)
        var belowThr = m <= 2 + 1e-9;
        // heavier-than-threshold particles are stable only very near E8; here reflect nStable
        var stable = belowThr || (eta < ETA3 && i < 3) ;
        var isResonance = !belowThr && eta >= ETA3;
        svg.append("rect")
          .attr("x", cx - bw / 2).attr("y", y(m)).attr("width", bw).attr("height", y(0) - y(m))
          .attr("fill", stable ? "var(--solid)" : "var(--lattice)")
          .attr("fill-opacity", stable ? 0.85 : 0.4)
          .attr("stroke", isResonance ? "var(--signal)" : "none")
          .attr("stroke-dasharray", isResonance ? "3 2" : null)
          .attr("stroke-width", isResonance ? 1.3 : 0);
        svg.append("text").attr("class", "tick-txt").attr("x", cx).attr("y", y(m) - 5)
          .attr("text-anchor", "middle")
          .attr("fill", stable ? "var(--solid)" : "var(--ink-50)")
          .text("m" + (i + 1));
      });
      svg.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(12," + ((y(0) + M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("mass / m₁");

      svg.attr("aria-label", "IFT interpolation line and mass spectrum. At η = " + fmt(eta, 3) +
        " there are " + nStable + " stable particles.");

      etaOut.textContent = eta < 0.01 ? fmt(eta, 3) : fmt(eta, 2);
      regEl.textContent = eta < ETA3 ? "near E₈" : eta < ETA2 ? "intermediate" : "near free";
      nEl.textContent = String(nStable);
      charEl.textContent = (eta < 1e-3 || s === 0) ? "integrable" : "non-integrable";
      var integ = (s === 0);
      verdict.textContent = integ
        ? "η = 0: the integrable E₈ theory — eight particles, exactly solvable, trivial-to-predict scattering."
        : eta > 2.5
          ? "Large η: essentially a free fermion — particles pass through, scattering is trivial."
          : "Strongly coupled and non-integrable — " + nStable + " stable particle" +
            (nStable > 1 ? "s" : "") + ", and no exact S-matrix. Simulation territory.";
      verdict.className = "verdict" + (integ || eta > 2.5 ? "" : " ");
      desc.textContent = "η = " + fmt(eta, 3) + ": " + nStable + " stable particles, " +
        (integ ? "integrable." : "non-integrable.");
    }
    etaIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  /* ===============================================================
     F4 — collision explorer: energy E and coupling η -> space-time.
     =============================================================== */
  function f4() {
    var host = document.getElementById("f4-stage");
    if (!host) return;
    var EIn = document.getElementById("f4-E");
    var etaIn = document.getElementById("f4-eta");
    var EOut = document.getElementById("f4-E-out");
    var etaOut = document.getElementById("f4-eta-out");
    var regEl = document.getElementById("f4-regime");
    var probEl = document.getElementById("f4-prob");
    var delEl = document.getElementById("f4-delay");
    var verdict = document.getElementById("f4-verdict");
    var desc = document.getElementById("f4-desc");
    var cv = document.createElement("canvas");
    cv.style.width = "100%"; cv.style.display = "block"; cv.setAttribute("role", "img");
    host.appendChild(cv);

    function etaOf(s) { return Math.pow(10, -2.2 + (s / 100) * 2.7); }
    var E_RES = 2.405;                 // lightest resonance (m4) in units of m1
    var E_THRESH = 2.618;              // m1+m2 production threshold

    function render() {
      var E = +EIn.value / 100;        // 0.6 .. 3.6
      var eta = etaOf(+etaIn.value);

      // resonance only meaningful near E8 (small eta); width grows with eta
      var resActive = eta < 0.18 && Math.abs(E - E_RES) < 0.28;
      var aboveThr = E > E_THRESH;
      var mode = aboveThr ? "inelastic" : resActive ? "resonance" : "elastic";

      // time delay: peaks/rings near resonance, small elsewhere (schematic)
      var delay = 0.03 + 0.10 * Math.exp(-Math.pow((E - E_RES) / 0.22, 2)) * (eta < 0.3 ? 1 : 0.3);
      // elastic probability: 1 below threshold; falls above, floor depends on eta vs eta_c
      var etaC = 0.033;
      var pInf = eta > etaC ? 1 : 0;
      var prob;
      if (!aboveThr) prob = 1.0;
      else {
        var x = (E - E_THRESH);
        prob = pInf + (1 - pInf) * Math.exp(-x * 2.4) * 0.9 + (pInf === 1 ? -0.15 * Math.exp(-x * 2.4) : 0);
        prob = Math.max(0, Math.min(1, prob));
      }
      var tau = 0.30 - Math.min(0.24, eta * 0.9);   // narrower (longer) near E8

      drawSpacetime(cv, {
        mode: mode, delay: delay, tau: Math.max(0.06, tau),
        production: Math.min(1, (E - E_THRESH) * 1.6 + 0.3),
        height: Math.round((cv.clientWidth || 600) * 0.62)
      });

      EOut.textContent = fmt(E, 2) + " m₁";
      etaOut.textContent = fmt(eta, eta < 0.1 ? 3 : 2);
      regEl.textContent = mode === "inelastic" ? "inelastic" : mode === "resonance" ? "resonance" : "elastic";
      probEl.textContent = fmt(prob, 2);
      probEl.className = "v " + (prob > 0.66 ? "good" : prob < 0.34 ? "bad" : "");
      delEl.textContent = fmt(delay * 100, 0) + " (a.u.)";
      verdict.textContent = mode === "inelastic"
        ? "Above the production threshold — the outgoing X sprouts extra tracks: new particles are being made."
        : mode === "resonance"
          ? "On a resonance — a lump of energy forms at the collision point and slowly decays."
          : "Elastic bounce — two in, two out, with a small time delay carrying the scattering phase.";
      verdict.className = "verdict" + (mode === "inelastic" ? " bad" : "");
      desc.textContent = "E = " + fmt(E, 2) + " m₁, η = " + fmt(eta, 3) + ": " + mode +
        " scattering; elastic probability " + fmt(prob, 2) + ".";
    }
    [EIn, etaIn].forEach(function (el) { el.addEventListener("input", render); });
    render();
    EV.onResize(render);
  }

  /* ===============================================================
     F5 — time delay vs energy (line chart).
     =============================================================== */
  function f5() {
    var host = document.getElementById("f5-stage");
    if (!host) return;
    var EIn = document.getElementById("f5-E");
    var EOut = document.getElementById("f5-E-out");
    var valEl = document.getElementById("f5-val");
    var signEl = document.getElementById("f5-sign");
    var desc = document.getElementById("f5-desc");
    var svg = d3.select(host).append("svg").attr("role", "img");

    var E_RES = 2.405;
    function delayOf(E) {
      // broad positive background + sharp swing near the resonance (schematic Wigner delay)
      return 0.6 * Math.exp(-Math.pow((E - 1.6) / 0.7, 2))
           + 1.3 * ((E - E_RES) / 0.18) * Math.exp(-Math.pow((E - E_RES) / 0.18, 2));
    }

    function render() {
      var Enow = +EIn.value / 100;
      var W = Math.min(host.clientWidth || 640, 780);
      var H = Math.max(220, Math.min(300, W * 0.5));
      var M = { t: 20, r: 18, b: 42, l: 50 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();
      var x = d3.scaleLinear().domain([0.6, 2.4]).range([M.l, W - M.r]);
      var y = d3.scaleLinear().domain([-1.6, 1.6]).range([H - M.b, M.t]);

      [-1, 0, 1].forEach(function (t) {
        svg.append("line").attr("class", "grid-line").attr("x1", M.l).attr("x2", W - M.r)
          .attr("y1", y(t)).attr("y2", y(t));
        svg.append("text").attr("class", "tick-txt").attr("x", M.l - 7).attr("y", y(t) + 4)
          .attr("text-anchor", "end").text(t);
      });
      [1, 1.5, 2].forEach(function (t) {
        svg.append("text").attr("class", "tick-txt").attr("x", x(t)).attr("y", H - M.b + 16)
          .attr("text-anchor", "middle").text(fmt(t, 1));
      });
      svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", W - M.r)
        .attr("y1", y(0)).attr("y2", y(0));

      // resonance marker
      svg.append("line").attr("x1", x(E_RES > 2.4 ? 2.4 : E_RES)).attr("x2", x(Math.min(2.4, E_RES)))
        .attr("y1", H - M.b).attr("y2", M.t).attr("stroke", "var(--signal)")
        .attr("stroke-width", 1).attr("stroke-dasharray", "4 4");

      var pts = [];
      for (var i = 0; i <= 200; i++) {
        var E = 0.6 + (1.8 * i) / 200;
        pts.push([E, delayOf(E)]);
      }
      var line = d3.line().x(function (p) { return x(p[0]); }).y(function (p) { return y(p[1]); });
      svg.append("path").datum(pts).attr("d", line).attr("fill", "none")
        .attr("stroke", "var(--solid)").attr("stroke-width", 2.2);

      var yv = delayOf(Enow);
      svg.append("circle").attr("cx", x(Enow)).attr("cy", y(yv)).attr("r", 5).attr("fill", "var(--signal)");

      svg.append("text").attr("class", "tick-txt").attr("x", (M.l + W - M.r) / 2).attr("y", H - 5)
        .attr("text-anchor", "middle").text("collision energy E / m₁");
      svg.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(13," + (M.t + (H - M.b - M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("time delay Δt (a.u.)");
      svg.attr("aria-label", "Elastic time delay versus energy; at E = " + fmt(Enow, 2) +
        " m1 the delay is " + fmt(yv, 2) + " arbitrary units.");

      EOut.textContent = fmt(Enow, 2) + " m₁";
      valEl.textContent = fmt(yv, 2);
      signEl.textContent = yv >= 0 ? "delay (lingers)" : "advance (hurries)";
      signEl.className = "v " + (yv >= 0 ? "good" : "bad");
      desc.textContent = "At E = " + fmt(Enow, 2) + " m₁ the elastic time delay is " + fmt(yv, 2) +
        " a.u. (" + (yv >= 0 ? "positive — particles linger" : "negative — particles hurry through") + ").";
    }
    EIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  /* ===============================================================
     F6 — resonance lifetime: width slider drives the lump decay.
     =============================================================== */
  function f6() {
    var host = document.getElementById("f6-stage");
    if (!host) return;
    var wIn = document.getElementById("f6-width");
    var wOut = document.getElementById("f6-width-out");
    var lifeEl = document.getElementById("f6-life");
    var stateEl = document.getElementById("f6-state");
    var desc = document.getElementById("f6-desc");
    var cv = document.createElement("canvas");
    cv.style.width = "100%"; cv.style.display = "block"; cv.setAttribute("role", "img");
    host.appendChild(cv);

    function render() {
      var gamma = +wIn.value / 100;               // width 0.04 .. 0.60
      var tau = Math.max(0.05, 0.06 / gamma * 0.28 + 0.05); // lifetime ~ 1/gamma
      drawSpacetime(cv, { mode: "resonance", tau: tau,
        height: Math.round((cv.clientWidth || 300) * 1.0) });
      wOut.textContent = fmt(gamma, 2);
      lifeEl.textContent = fmt(1 / gamma, 1) + " (a.u.)";
      stateEl.textContent = gamma < 0.14 ? "narrow / long-lived" : gamma > 0.4 ? "broad / fleeting" : "moderate";
      stateEl.className = "v " + (gamma < 0.14 ? "good" : gamma > 0.4 ? "bad" : "");
      desc.textContent = "Resonance width Γ = " + fmt(gamma, 2) + ", lifetime about " +
        fmt(1 / gamma, 1) + " a.u.: the central lump " +
        (gamma < 0.14 ? "lingers before decaying." : "decays almost immediately.");
    }
    wIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  /* ===============================================================
     F7 — high-energy elastic probability + Zamolodchikov switch.
     =============================================================== */
  function f7() {
    var host = document.getElementById("f7-stage");
    if (!host) return;
    var etaIn = document.getElementById("f7-eta");
    var etaOut = document.getElementById("f7-eta-out");
    var peEl = document.getElementById("f7-pe");
    var pinfEl = document.getElementById("f7-pinf");
    var sideEl = document.getElementById("f7-side");
    var verdict = document.getElementById("f7-verdict");
    var desc = document.getElementById("f7-desc");
    var svg = d3.select(host).append("svg").attr("role", "img");

    function etaOf(s) { return Math.pow(10, -2.2 + (s / 100) * 2.7); }
    var ETA_C = 0.033;

    function render() {
      var eta = etaOf(+etaIn.value);
      var pInf = eta > ETA_C ? 1 : 0;

      var W = Math.min(host.clientWidth || 700, 820);
      var H = Math.max(230, Math.min(300, W * 0.44));
      var M = { t: 20, r: 120, b: 44, l: 48 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();
      var x = d3.scaleLinear().domain([2.6, 12]).range([M.l, W - M.r]);
      var y = d3.scaleLinear().domain([0, 1.05]).range([H - M.b, M.t]);

      [0, 0.5, 1].forEach(function (t) {
        svg.append("line").attr("class", "grid-line").attr("x1", M.l).attr("x2", W - M.r)
          .attr("y1", y(t)).attr("y2", y(t));
        svg.append("text").attr("class", "tick-txt").attr("x", M.l - 7).attr("y", y(t) + 4)
          .attr("text-anchor", "end").text(fmt(t, 1));
      });
      [4, 6, 8, 10, 12].forEach(function (t) {
        svg.append("text").attr("class", "tick-txt").attr("x", x(t)).attr("y", H - M.b + 16)
          .attr("text-anchor", "middle").text(t);
      });
      svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", W - M.r)
        .attr("y1", y(0)).attr("y2", y(0));
      svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", M.l)
        .attr("y1", y(0)).attr("y2", M.t);

      // P(E) descending to pInf
      var pts = [];
      for (var i = 0; i <= 200; i++) {
        var E = 2.6 + (9.4 * i) / 200;
        var xx = E - 2.6;
        var p = pInf + (1 - pInf) * Math.exp(-xx * 0.55) + (pInf === 1 ? -0.35 * Math.exp(-xx * 0.55) : 0);
        pts.push([E, Math.max(0, Math.min(1, p))]);
      }
      svg.append("path").datum(pts)
        .attr("d", d3.line().x(function (p) { return x(p[0]); }).y(function (p) { return y(p[1]); }))
        .attr("fill", "none").attr("stroke", "var(--solid)").attr("stroke-width", 2.4);

      // asymptote
      svg.append("line").attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(pInf)).attr("y2", y(pInf))
        .attr("stroke", "var(--signal)").attr("stroke-width", 1).attr("stroke-dasharray", "6 3");
      svg.append("text").attr("class", "mark-txt mark-txt--sig")
        .attr("x", W - M.r + 6).attr("y", y(pInf) + 4).text("P∞ = " + pInf);

      // inset: the switch P∞(η)
      var ix0 = W - M.r + 14, iw = M.r - 22, iy0 = M.t + 6, ih = 60;
      svg.append("text").attr("class", "tick-txt").attr("x", ix0).attr("y", iy0 - 4).text("P∞(η)");
      svg.append("rect").attr("x", ix0).attr("y", iy0).attr("width", iw).attr("height", ih)
        .attr("fill", "none").attr("stroke", "var(--rule)");
      var ex = d3.scaleLog().domain([0.006, 3]).range([ix0, ix0 + iw]);
      var ey = d3.scaleLinear().domain([0, 1]).range([iy0 + ih, iy0]);
      // step function
      svg.append("path")
        .attr("d", "M" + ex(0.006) + "," + ey(0) + "H" + ex(ETA_C) + "V" + ey(1) + "H" + ex(3))
        .attr("fill", "none").attr("stroke", "var(--solid)").attr("stroke-width", 1.8);
      svg.append("line").attr("x1", ex(ETA_C)).attr("x2", ex(ETA_C)).attr("y1", iy0).attr("y2", iy0 + ih)
        .attr("stroke", "var(--ink-50)").attr("stroke-dasharray", "2 2");
      svg.append("text").attr("class", "tick-txt").attr("x", ex(ETA_C)).attr("y", iy0 + ih + 11)
        .attr("text-anchor", "middle").text("η_c");
      svg.append("circle").attr("cx", ex(Math.max(0.006, Math.min(3, eta)))).attr("cy", ey(pInf)).attr("r", 4)
        .attr("fill", "var(--signal)");

      svg.append("text").attr("class", "tick-txt").attr("x", (M.l + W - M.r) / 2).attr("y", H - 5)
        .attr("text-anchor", "middle").text("collision energy E / m₁");
      svg.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(12," + (M.t + (H - M.b - M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("P₁₁→₁₁");
      svg.attr("aria-label", "Elastic probability falling to its high-energy limit; the inset shows " +
        "the conjectured switch of P-infinity at eta_c. Here eta = " + fmt(eta, 3) + ", P-infinity = " + pInf + ".");

      etaOut.textContent = fmt(eta, eta < 0.1 ? 3 : 2);
      peEl.textContent = fmt(pts[pts.length - 1][1], 2);
      pinfEl.textContent = String(pInf);
      pinfEl.className = "v " + (pInf === 1 ? "good" : "bad");
      sideEl.textContent = eta > ETA_C ? "above η_c" : "below η_c";
      verdict.textContent = pInf === 1
        ? "η > η_c: at high energy the particles almost always just bounce — elastic scattering wins, P∞ = 1."
        : "η < η_c: at high energy production takes over completely — elastic scattering dies, P∞ = 0.";
      verdict.className = "verdict" + (pInf === 1 ? "" : " bad");
      desc.textContent = "η = " + fmt(eta, 3) + " (" + (eta > ETA_C ? "above" : "below") +
        " η_c ≈ 0.033): P∞ = " + pInf + ".";
    }
    etaIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  /* ===============================================================
     D1 — small inelastic sketch (superposition of channels).
     =============================================================== */
  function d1() {
    var host = document.getElementById("d1-stage");
    if (!host) return;
    var cv = document.createElement("canvas");
    cv.style.width = "100%"; cv.style.display = "block"; cv.setAttribute("role", "img");
    cv.setAttribute("aria-label",
      "Space-time diagram of an inelastic collision: beyond the two elastic outgoing tracks, " +
      "additional fainter tracks fan out, the produced particles, all in superposition.");
    host.appendChild(cv);
    function render() {
      drawSpacetime(cv, { mode: "inelastic", production: 0.8,
        height: Math.round((cv.clientWidth || 500) * 0.5), axes: true });
    }
    render();
    EV.onResize(render);
  }

  EV.figuresScatter = {
    init: function () { f1(); f2(); f3(); f4(); f5(); f6(); f7(); d1(); }
  };
})(window.EV = window.EV || {});
