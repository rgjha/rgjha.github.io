/* figures-su2.js — every figure on the page.
   F1 hero schematic, F2 one qubit of magic, F3 the dressed site,
   F4 the CFT point, F5 the crossover walk, F6 the (m,g) resource maps.
   Curves for F1/F5/F6 are schematic reconstructions of the paper's figures:
   they follow the functional behavior and values reported, not raw data. */
(function (EV) {
  "use strict";

  var GSTAR = 1.9;

  function fmt(x, d) {
    if (d == null) d = 2;
    return Number(x).toLocaleString("en-US", {
      minimumFractionDigits: d, maximumFractionDigits: d
    });
  }
  EV.fmt = fmt;

  /* --- the schematic model at m = 0.2 (after Fig. 5) ---------------- */
  function modelS(g)   { return 1.32 * 0.5 * (1 - Math.tanh((g - GSTAR) / 1.1)); }
  function modelM(g)   {
    return 0.30 * 0.5 * (1 - Math.tanh((g - 2.6) / 0.75))
         + 0.012 * Math.exp(-Math.pow((g - 1.4) / 0.5, 2));
  }
  function modelRho(g) { return 0.42 * 0.5 * (1 - Math.tanh((g - GSTAR) / 1.2)); }
  function dSdg(g) {
    var t = Math.tanh((g - GSTAR) / 1.1);
    return -(1.32 / (2 * 1.1)) * (1 - t * t);
  }

  /* --- tiny axis kit ------------------------------------------------ */
  function axes(svg, x, y, o) {
    o = o || {};
    (o.yTicks || y.ticks(4)).forEach(function (t) {
      svg.append("line").attr("class", "grid-line")
        .attr("x1", x.range()[0]).attr("x2", x.range()[1])
        .attr("y1", y(t)).attr("y2", y(t));
      svg.append("text").attr("class", "tick-txt")
        .attr("x", x.range()[0] - 7).attr("y", y(t) + 4)
        .attr("text-anchor", "end").text(fmt(t, o.yDec == null ? 1 : o.yDec));
    });
    (o.xTicks || x.ticks(6)).forEach(function (t) {
      svg.append("text").attr("class", "tick-txt")
        .attr("x", x(t)).attr("y", y.range()[0] + 16)
        .attr("text-anchor", "middle").text(fmt(t, o.xDec == null ? 0 : o.xDec));
    });
    svg.append("line").attr("class", "axis-line")
      .attr("x1", x.range()[0]).attr("x2", x.range()[1])
      .attr("y1", y.range()[0]).attr("y2", y.range()[0]);
    svg.append("line").attr("class", "axis-line")
      .attr("x1", x.range()[0]).attr("x2", x.range()[0])
      .attr("y1", y.range()[0]).attr("y2", y.range()[1]);
  }

  function curve(svg, pts, x, y, color, w) {
    var line = d3.line()
      .x(function (p) { return x(p[0]); })
      .y(function (p) { return y(p[1]); });
    return svg.append("path").datum(pts).attr("d", line)
      .attr("fill", "none").attr("stroke", color).attr("stroke-width", w || 2.2);
  }

  function sample(fn, a, b, N) {
    var out = [];
    for (var i = 0; i <= N; i++) {
      var g = a + ((b - a) * i) / N;
      out.push([g, fn(g)]);
    }
    return out;
  }

  /* =================================================================
     F1 — hero schematic: S and M2/L against g, the crossover marked.
     ================================================================= */
  function f1() {
    var host = document.getElementById("f1-stage");
    if (!host) return;
    var svg = d3.select(host).append("svg").attr("role", "img")
      .attr("aria-label",
        "Schematic plot of entanglement entropy and magic density against the coupling g. " +
        "Both are largest at g = 0 and vanish at large g. The entanglement falls steadily; " +
        "the magic density holds a plateau and then drops after the crossover coupling " +
        "g-star of about 1.9, which is marked with a dashed line.");

    function render() {
      var W = host.clientWidth || 480;
      var H = Math.max(240, Math.min(330, W * 0.62));
      var M = { t: 26, r: 18, b: 40, l: 44 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      var x = d3.scaleLinear().domain([0, 5.4]).range([M.l, W - M.r]);
      var y = d3.scaleLinear().domain([0, 1.42]).range([H - M.b, M.t]);

      // intermediate regime band
      svg.append("rect")
        .attr("x", x(0.9)).attr("width", x(3.1) - x(0.9))
        .attr("y", M.t).attr("height", H - M.b - M.t)
        .attr("fill", "var(--solid)").attr("fill-opacity", 0.055);
      svg.append("text").attr("class", "tick-txt")
        .attr("x", x(2.0)).attr("y", H - M.b - 8).attr("text-anchor", "middle")
        .text("intermediate regime");

      axes(svg, x, y, { yTicks: [0, 0.5, 1.0], xTicks: [0, 1, 2, 3, 4, 5], yDec: 1 });

      // g* marker
      svg.append("line")
        .attr("x1", x(GSTAR)).attr("x2", x(GSTAR)).attr("y1", H - M.b).attr("y2", M.t)
        .attr("stroke", "var(--signal)").attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "5 4");
      svg.append("text").attr("class", "mark-txt mark-txt--sig")
        .attr("x", x(GSTAR)).attr("y", M.t - 8).attr("text-anchor", "middle")
        .text("g⋆ ≈ 1.9");

      // S and M2/L (M scaled up so both read on one axis, as in Fig. 1)
      curve(svg, sample(modelS, 0, 5.4, 160), x, y, "var(--solid)");
      curve(svg, sample(function (g) { return modelM(g) * 4.2; }, 0, 5.4, 160),
        x, y, "var(--signal)");

      svg.append("text").attr("class", "mark-txt")
        .attr("x", x(0.35)).attr("y", y(modelS(0.35)) - 10)
        .attr("fill", "var(--solid)").attr("font-weight", 500)
        .text("entanglement S");
      svg.append("text").attr("class", "mark-txt mark-txt--sig")
        .attr("x", x(2.35)).attr("y", y(modelM(2.35) * 4.2) - 12)
        .attr("font-weight", 500)
        .text("magic M₂/L");

      svg.append("text").attr("class", "tick-txt")
        .attr("x", x(0.15)).attr("y", M.t + 2).text("weak coupling");
      svg.append("text").attr("class", "tick-txt")
        .attr("x", x(5.35)).attr("y", M.t + 2).attr("text-anchor", "end")
        .text("strong coupling");
      svg.append("text").attr("class", "tick-txt")
        .attr("x", x(4.9)).attr("y", y(0.16)).attr("text-anchor", "end")
        .text("S → 0,  M₂/L → 0");
      svg.append("text").attr("class", "tick-txt")
        .attr("x", x(2.7)).attr("y", H - 5).attr("text-anchor", "middle").text("coupling g");
    }

    render();
    EV.onResize(render);
  }

  /* =================================================================
     F2 — one qubit of magic. Bloch sphere + live M2.
     ================================================================= */
  function f2() {
    var host = document.getElementById("f2-stage");
    if (!host) return;
    var thIn = document.getElementById("f2-theta");
    var phIn = document.getElementById("f2-phi");
    var thOut = document.getElementById("f2-theta-out");
    var phOut = document.getElementById("f2-phi-out");
    var xyzEl = document.getElementById("f2-xyz");
    var m2El = document.getElementById("f2-m2");
    var verdict = document.getElementById("f2-verdict");
    var desc = document.getElementById("f2-desc");
    var chips = Array.prototype.slice.call(
      document.querySelectorAll("#f2-presets .chip"));

    var PRESETS = {
      zero: [0, 0],
      plus: [90, 0],
      t: [90, 45],
      max: [54.7356, 45]
    };

    var svg = d3.select(host).append("svg").attr("role", "img");

    function bloch(thetaDeg, phiDeg) {
      var th = (thetaDeg * Math.PI) / 180, ph = (phiDeg * Math.PI) / 180;
      return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
    }
    function m2Of(v) {
      var q = Math.pow(v[0], 4) + Math.pow(v[1], 4) + Math.pow(v[2], 4);
      return -Math.log2((q + 1) / 2);
    }

    function render() {
      var th = +thIn.value, ph = +phIn.value;
      var v = bloch(th, ph);
      var m2 = m2Of(v);

      var W = Math.min(host.clientWidth || 380, 460);
      var H = Math.max(260, Math.min(360, W * 0.92));
      var cx = W / 2, cy = H / 2 + 4;
      var R = Math.min(W, H) / 2 - 34;
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H)
        .style("margin-inline", "auto").style("max-width", W + "px");
      svg.selectAll("*").remove();

      // oblique projection: y right, z up, x toward viewer lower-left
      function proj(p) {
        return [cx + R * (p[1] - 0.42 * p[0]), cy - R * (p[2] - 0.30 * p[0])];
      }
      function path(pts) {
        return "M" + pts.map(function (q) {
          return q[0].toFixed(1) + "," + q[1].toFixed(1);
        }).join("L");
      }
      function ring(fn) {   // sample a closed curve on the sphere
        var pts = [];
        for (var i = 0; i <= 96; i++) pts.push(proj(fn((2 * Math.PI * i) / 96)));
        return pts;
      }

      // sphere outline + equator + a meridian
      svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", R)
        .attr("fill", "var(--solid)").attr("fill-opacity", 0.05)
        .attr("stroke", "var(--ink-50)").attr("stroke-width", 1.1);
      svg.append("path")
        .attr("d", path(ring(function (t) { return [Math.cos(t), Math.sin(t), 0]; })))
        .attr("fill", "none").attr("stroke", "var(--ink-50)")
        .attr("stroke-width", 1).attr("stroke-dasharray", "3 4");
      svg.append("path")
        .attr("d", path(ring(function (t) { return [Math.cos(t), 0, Math.sin(t)]; })))
        .attr("fill", "none").attr("stroke", "var(--rule)").attr("stroke-width", 1);

      // axes
      [[[1.28, 0, 0], "X"], [[0, 1.28, 0], "Y"], [[0, 0, 1.26], "Z"]]
        .forEach(function (ax) {
          var a = proj([-ax[0][0], -ax[0][1], -ax[0][2]]);
          var b = proj(ax[0]);
          svg.append("line").attr("class", "lead-line")
            .attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]);
          svg.append("text").attr("class", "tick-txt")
            .attr("x", b[0] + 4).attr("y", b[1] - 3).text(ax[1]);
        });

      // the six stabilizer states: ringed like boundary lattice points
      [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(function (s) {
        var q = proj(s);
        svg.append("circle").attr("class", "lat-dot--bdy")
          .attr("cx", q[0]).attr("cy", q[1]).attr("r", 4.4);
      });
      // the eight maximal-magic directions, faint
      var r3 = 1 / Math.sqrt(3);
      [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]]
        .forEach(function (s) {
          var q = proj([s[0] * r3, s[1] * r3, s[2] * r3]);
          svg.append("circle")
            .attr("cx", q[0]).attr("cy", q[1]).attr("r", 2.2)
            .attr("fill", "var(--signal)").attr("fill-opacity", 0.35);
        });

      // the state
      var p = proj(v);
      svg.append("line")
        .attr("x1", cx).attr("y1", cy).attr("x2", p[0]).attr("y2", p[1])
        .attr("stroke", "var(--signal)").attr("stroke-width", 2.2);
      svg.append("circle").attr("cx", p[0]).attr("cy", p[1]).attr("r", 6)
        .attr("fill", "var(--signal)");
      svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 2.2)
        .attr("fill", "var(--ink)");

      svg.attr("aria-label",
        "Bloch sphere with the state at polar angle " + th + " degrees and azimuth " +
        ph + " degrees. Its magic M2 is " + fmt(m2, 3) + " bits.");

      // readouts
      thOut.textContent = th + "°";
      phOut.textContent = ph + "°";
      xyzEl.textContent = fmt(v[0], 2) + ", " + fmt(v[1], 2) + ", " + fmt(v[2], 2);
      m2El.textContent = fmt(m2, 3);
      var stab = m2 < 0.02;
      m2El.className = "v " + (stab ? "good" : "bad");
      verdict.textContent = stab
        ? "Stabilizer — classically easy."
        : m2 > 0.55
          ? "Nearly maximal magic — as non-classical as one qubit gets."
          : "Magical — outside the easy set.";
      verdict.className = "verdict" + (stab ? "" : " bad");
      desc.textContent =
        "Pauli expectations " + fmt(v[0], 2) + ", " + fmt(v[1], 2) + ", " + fmt(v[2], 2) +
        "; stabilizer Rényi entropy " + fmt(m2, 3) + " of a maximum 0.585.";
    }

    function press(chip) {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var p = PRESETS[chip.dataset.preset];
        thIn.value = String(p[0]);
        phIn.value = String(p[1]);
        press(chip);
        render();
      });
    });
    [thIn, phIn].forEach(function (el) {
      el.addEventListener("input", function () { press(null); render(); });
    });

    render();
    EV.onResize(render);
  }

  /* =================================================================
     F3 — the dressed site: pick (jL, nM, jR), check the singlet rule.
     ================================================================= */
  function f3() {
    var host = document.getElementById("f3-stage");
    if (!host) return;
    var jmEl = document.getElementById("f3-jm");
    var triEl = document.getElementById("f3-tri");
    var intEl = document.getElementById("f3-int");
    var verdict = document.getElementById("f3-verdict");
    var desc = document.getElementById("f3-desc");

    var state = { jl: 0, nm: 0, jr: 0 };

    function group(id, key) {
      var chips = Array.prototype.slice.call(
        document.querySelectorAll("#" + id + " .chip"));
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          chips.forEach(function (c) {
            c.setAttribute("aria-pressed", c === chip ? "true" : "false");
          });
          state[key] = +chip.dataset.v;
          render();
        });
      });
    }
    group("f3-jl", "jl");
    group("f3-nm", "nm");
    group("f3-jr", "jr");

    var svg = d3.select(host).append("svg").attr("role", "img");

    function jhalf(j) { return j === 0.5 ? "1/2" : "0"; }

    function render() {
      var jl = state.jl, nm = state.nm, jr = state.jr;
      var jm = nm === 1 ? 0.5 : 0;
      var tri = jr >= Math.abs(jl - jm) - 1e-9 && jr <= jl + jm + 1e-9;
      var integer = Math.abs(((jl + jm + jr) % 1)) < 1e-9;
      var ok = tri && integer;

      var W = Math.min(host.clientWidth || 380, 480);
      var H = Math.max(190, Math.min(230, W * 0.5));
      var cy = H / 2 - 6;
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H)
        .style("margin-inline", "auto").style("max-width", W + "px");
      svg.selectAll("*").remove();

      var pad = 26, mid = W / 2, rSite = 30;
      var linkCol = ok ? "var(--solid)" : "var(--signal)";

      function halfLink(x0, x1, j, label, lx) {
        svg.append("line")
          .attr("x1", x0).attr("x2", x1).attr("y1", cy).attr("y2", cy)
          .attr("stroke", linkCol)
          .attr("stroke-width", j === 0.5 ? 5 : 1.6)
          .attr("stroke-dasharray", j === 0.5 ? null : "5 5")
          .attr("opacity", j === 0.5 ? 0.9 : 0.65);
        svg.append("text").attr("class", "mark-txt")
          .attr("x", lx).attr("y", cy - 14).attr("text-anchor", "middle")
          .text(label + " = " + jhalf(j));
      }
      halfLink(pad, mid - rSite, jl, "jₗ", (pad + mid - rSite) / 2);
      halfLink(mid + rSite, W - pad, jr, "jᵣ", (mid + rSite + W - pad) / 2);

      // lattice-dot endcaps at the neighbouring sites
      [pad, W - pad].forEach(function (x) {
        svg.append("circle").attr("class", "lat-dot")
          .attr("cx", x).attr("cy", cy).attr("r", 3.4);
      });

      // the matter site
      svg.append("circle").attr("cx", mid).attr("cy", cy).attr("r", rSite)
        .attr("fill", ok ? "var(--solid)" : "var(--signal)").attr("fill-opacity", 0.10)
        .attr("stroke", linkCol).attr("stroke-width", 2);
      // quark dots
      if (nm === 1) {
        svg.append("circle").attr("cx", mid).attr("cy", cy)
          .attr("r", 6.5).attr("fill", "var(--signal)");
      } else if (nm === 2) {
        svg.append("circle").attr("cx", mid - 9).attr("cy", cy)
          .attr("r", 6.5).attr("fill", "var(--signal)");
        svg.append("circle").attr("cx", mid + 9).attr("cy", cy)
          .attr("r", 6.5).attr("fill", "var(--signal)");
      }
      svg.append("text").attr("class", "mark-txt")
        .attr("x", mid).attr("y", cy + rSite + 20).attr("text-anchor", "middle")
        .text(nm === 0 ? "empty · jₘ = 0"
            : nm === 1 ? "1 quark · jₘ = 1/2"
            : "2 quarks · jₘ = 0");

      // the fusion statement
      svg.append("text").attr("class", "mark-txt" + (ok ? "" : " mark-txt--sig"))
        .attr("x", mid).attr("y", 24).attr("text-anchor", "middle")
        .attr("font-weight", 500)
        .text(jhalf(jl) + " ⊗ " + jhalf(jm) + " ⊗ " + jhalf(jr) +
              (ok ? "  ⊃  0" : "  ⊅  0"));

      svg.attr("aria-label",
        "A dressed site with left flux " + jhalf(jl) + ", matter occupation " + nm +
        " and right flux " + jhalf(jr) + ". " +
        (ok ? "The three fuse to a singlet: physical."
            : "The three cannot fuse to a singlet: forbidden."));

      jmEl.textContent = jhalf(jm);
      triEl.textContent = tri ? "✓" : "✗";
      triEl.className = "v " + (tri ? "good" : "bad");
      intEl.textContent = integer ? "✓" : "✗";
      intEl.className = "v " + (integer ? "good" : "bad");
      verdict.textContent = ok
        ? "Physical: a gauge singlet — one of the 6."
        : "Forbidden: Gauss's law says no — one of the 30 discarded.";
      verdict.className = "verdict" + (ok ? "" : " bad");
      desc.textContent = "Left flux " + jhalf(jl) + ", matter " + nm +
        ", right flux " + jhalf(jr) + ": " + (ok ? "allowed." : "not allowed.");
    }

    render();
    EV.onResize(render);
  }

  /* =================================================================
     F4 — the CFT point: Calabrese–Cardy arc and the magic scaling law.
     ================================================================= */
  function f4() {
    var host = document.getElementById("f4-stage");
    var plotHost = document.getElementById("f4-plot");
    if (!host || !plotHost) return;
    var LIn = document.getElementById("f4-L");
    var cutIn = document.getElementById("f4-cut");
    var LOut = document.getElementById("f4-L-out");
    var cutOut = document.getElementById("f4-cut-out");
    var sEl = document.getElementById("f4-s");
    var m2El = document.getElementById("f4-m2");
    var desc = document.getElementById("f4-desc");

    var K = 1.5;          // the non-universal constant in (4), fixed by eye
    var A = 0.29, B = -0.69, C = 0.88;   // the paper's fit of (5)

    function Sof(L, l) {
      return (1 / 6) * Math.log((2 * L / Math.PI) * Math.sin(Math.PI * l / L)) + K;
    }
    function M2of(L) { return A * L + B * Math.log(L) + C; }

    var svgS = d3.select(host).append("svg").attr("role", "img");
    var svgM = d3.select(plotHost).append("svg").attr("role", "img");

    function render() {
      var L = +LIn.value;
      var l = Math.max(1, Math.min(L - 1, Math.round((+cutIn.value / 100) * L)));

      /* left: S(l) for this L */
      var W = host.clientWidth || 420;
      var H = Math.max(210, Math.min(280, W * 0.62));
      var M = { t: 24, r: 16, b: 40, l: 46 };
      svgS.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svgS.selectAll("*").remove();
      var x = d3.scaleLinear().domain([0, 100]).range([M.l, W - M.r]);
      var y = d3.scaleLinear().domain([1.4, 2.4]).range([H - M.b, M.t]);
      axes(svgS, x, y, { yTicks: [1.6, 1.8, 2.0, 2.2], xTicks: [0, 25, 50, 75, 100], yDec: 1 });

      var pts = [];
      for (var i = 1; i < 160; i++) {
        var li = (L * i) / 160;
        if (li < 1 || li > L - 1) continue;
        pts.push([(100 * li) / L, Sof(L, li)]);
      }
      curve(svgS, pts, x, y, "var(--solid)");
      var sNow = Sof(L, l);
      svgS.append("circle")
        .attr("cx", x((100 * l) / L)).attr("cy", y(sNow)).attr("r", 5.5)
        .attr("fill", "var(--signal)");
      svgS.append("text").attr("class", "tick-txt")
        .attr("x", (M.l + W - M.r) / 2).attr("y", H - 5).attr("text-anchor", "middle")
        .text("cut position l (% of L)");
      svgS.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(13," + (M.t + (H - M.b - M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("S(l)");
      svgS.attr("aria-label",
        "Entanglement entropy against cut position for L = " + L +
        ", an arc peaking at the middle. At the marked cut l = " + l +
        " the entropy is " + fmt(sNow, 3) + ".");

      /* right: M2(L) with the current L marked */
      var W2 = plotHost.clientWidth || 420;
      var H2 = Math.max(210, Math.min(280, W2 * 0.62));
      svgM.attr("viewBox", "0 0 " + W2 + " " + H2).attr("width", W2).attr("height", H2);
      svgM.selectAll("*").remove();
      var x2 = d3.scaleLinear().domain([10, 105]).range([M.l, W2 - M.r]);
      var y2 = d3.scaleLinear().domain([0, 30]).range([H2 - M.b, M.t]);
      axes(svgM, x2, y2, { yTicks: [0, 10, 20, 30], xTicks: [20, 40, 60, 80, 100], yDec: 0 });

      var pts2 = [];
      for (var Lx = 12; Lx <= 104; Lx += 2) pts2.push([Lx, M2of(Lx)]);
      curve(svgM, pts2, x2, y2, "var(--signal)");
      for (var Lm = 20; Lm <= 100; Lm += 10) {
        svgM.append("circle")
          .attr("cx", x2(Lm)).attr("cy", y2(M2of(Lm)))
          .attr("r", Lm === L ? 5.5 : 2.6)
          .attr("fill", Lm === L ? "var(--signal)" : "var(--solid)");
      }
      svgM.append("text").attr("class", "tick-txt")
        .attr("x", (M.l + W2 - M.r) / 2).attr("y", H2 - 5).attr("text-anchor", "middle")
        .text("system size L");
      svgM.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(13," + (M.t + (H2 - M.b - M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("M₂ = αL + β ln L + γ");
      var m2Now = M2of(L);
      svgM.attr("aria-label",
        "Total magic against system size: a nearly straight line, extensive. " +
        "At L = " + L + " it is " + fmt(m2Now, 1) + " bits.");

      LOut.textContent = String(L);
      cutOut.textContent = "l = " + l;
      sEl.textContent = fmt(sNow, 3);
      m2El.textContent = fmt(m2Now, 1);
      desc.textContent = "L = " + L + ", cut at l = " + l + ": S = " + fmt(sNow, 3) +
        "; total magic M2 = " + fmt(m2Now, 1) + " bits, about " +
        fmt(m2Now / L, 2) + " per site.";
    }

    [LIn, cutIn].forEach(function (el) { el.addEventListener("input", render); });
    render();
    EV.onResize(render);
  }

  /* =================================================================
     F5 — the crossover walk: S, M2/L, rho against g with a cursor.
     ================================================================= */
  function f5() {
    var host = document.getElementById("f5-stage");
    if (!host) return;
    var gIn = document.getElementById("f5-g");
    var gOut = document.getElementById("f5-g-out");
    var sEl = document.getElementById("f5-s");
    var mEl = document.getElementById("f5-m");
    var rEl = document.getElementById("f5-rho");
    var dsEl = document.getElementById("f5-ds");
    var verdict = document.getElementById("f5-verdict");
    var desc = document.getElementById("f5-desc");

    var svg = d3.select(host).append("svg").attr("role", "img");

    var PANELS = [
      { fn: modelS,   label: "entanglement S",      max: 1.45, color: "var(--solid)" },
      { fn: modelM,   label: "magic M₂/L",      max: 0.34, color: "var(--signal)" },
      { fn: modelRho, label: "particle density ρ", max: 0.46, color: "var(--ink)" }
    ];

    function render() {
      var g = +gIn.value;
      var W = host.clientWidth || 720;
      var narrow = W < 640;
      var pw = narrow ? W : (W - 2 * 26) / 3;
      var ph = narrow ? 170 : Math.max(190, Math.min(240, pw * 0.72));
      var H = narrow ? 3 * (ph + 18) : ph;
      var M = { t: 24, r: 10, b: 34, l: 42 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      PANELS.forEach(function (p, i) {
        var ox = narrow ? 0 : i * (pw + 26);
        var oy = narrow ? i * (ph + 18) : 0;
        var grp = svg.append("g").attr("transform", "translate(" + ox + "," + oy + ")");
        var x = d3.scaleLinear().domain([0, 10]).range([M.l, pw - M.r]);
        var y = d3.scaleLinear().domain([0, p.max]).range([ph - M.b, M.t]);
        axes(grp, x, y, {
          yTicks: [0, p.max / 2, p.max].map(function (t) { return +t.toFixed(2); }),
          xTicks: [0, 2, 4, 6, 8, 10], yDec: p.max < 1 ? 2 : 1
        });

        // g* line
        grp.append("line")
          .attr("x1", x(GSTAR)).attr("x2", x(GSTAR))
          .attr("y1", ph - M.b).attr("y2", M.t)
          .attr("stroke", "var(--signal)").attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 4").attr("opacity", 0.75);

        curve(grp, sample(p.fn, 0, 10, 200), x, y, p.color);

        // cursor
        var v = p.fn(g);
        grp.append("line")
          .attr("x1", x(g)).attr("x2", x(g)).attr("y1", ph - M.b).attr("y2", M.t)
          .attr("stroke", "var(--ink-50)").attr("stroke-width", 1)
          .attr("stroke-dasharray", "2 3");
        grp.append("circle").attr("cx", x(g)).attr("cy", y(v)).attr("r", 5)
          .attr("fill", p.color);

        grp.append("text").attr("class", "mark-txt")
          .attr("x", M.l).attr("y", M.t - 8).attr("font-weight", 500).text(p.label);
        if (i === 0) {
          grp.append("text").attr("class", "tick-txt mark-txt--sig")
            .attr("x", x(GSTAR) + 4).attr("y", M.t + 10)
            .attr("fill", "var(--signal)").text("g⋆");
        }
        grp.append("text").attr("class", "tick-txt")
          .attr("x", (M.l + pw - M.r) / 2).attr("y", ph - 4)
          .attr("text-anchor", "middle").text("g");
      });

      var s = modelS(g), m = modelM(g), r = modelRho(g), ds = Math.abs(dSdg(g));
      gOut.textContent = fmt(g, 2);
      sEl.textContent = fmt(s, 3);
      mEl.textContent = fmt(m, 3);
      rEl.textContent = fmt(r, 3);
      dsEl.textContent = fmt(ds, 3);
      var region = g < 1.4 ? 0 : g <= 2.4 ? 1 : 2;
      verdict.textContent = region === 0
        ? "Left of g⋆: entanglement already falling, magic on its plateau — the magic-rich regime."
        : region === 1
          ? "At the crossover: |dS/dg| is near its maximum, and magic begins to fall."
          : "Right of g⋆: confinement empties the vacuum — approaching a product stabilizer state.";
      verdict.className = "verdict" + (region === 1 ? " bad" : "");
      desc.textContent = "At g = " + fmt(g, 2) + ": S = " + fmt(s, 3) +
        ", magic density " + fmt(m, 3) + ", particle density " + fmt(r, 3) +
        ", |dS/dg| = " + fmt(ds, 3) + ". Crossover at g⋆ ≈ 1.9.";
      svg.attr("aria-label",
        "Three panels: entanglement entropy, magic density and particle density " +
        "against coupling g from 0 to 10, each with a cursor at g = " + fmt(g, 2) +
        " and a dashed marker at the crossover g⋆ ≈ 1.9.");
    }

    gIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  /* =================================================================
     F6 — resource maps over the (m, g) plane. Canvas heatmap.
     ================================================================= */
  function f6() {
    var host = document.getElementById("f6-stage");
    if (!host) return;
    var atEl = document.getElementById("f6-at");
    var vEl = document.getElementById("f6-v");
    var uEl = document.getElementById("f6-u");
    var desc = document.getElementById("f6-desc");
    var chips = Array.prototype.slice.call(
      document.querySelectorAll("#f6-mode .chip"));

    var mode = "magic";
    var GMAX = 3.2, MMAX = 1.0;

    function magic(m, g) {
      return 0.08 + 0.33 * Math.exp(-m / 0.5) *
        0.5 * (1 - Math.tanh((g - 2.4) / 0.9));
    }
    function ee(m, g) {
      return 0.08 + 0.33 * Math.exp(-m / 0.6) *
        0.5 * (1 - Math.tanh((g - 1.6) / 1.0));
    }
    function val(m, g) { return (mode === "magic" ? magic : ee)(m, g); }

    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("role", "img");
    host.appendChild(canvas);
    var ctx = canvas.getContext("2d");

    var color = d3.scaleSequential(
      d3.interpolateRgb("#E7ECE2", "#12566E")).domain([0.06, 0.42]);

    var geomBox = { x0: 0, y0: 0, w: 0, h: 0 };

    function render() {
      var W = host.clientWidth || 640;
      var H = Math.max(260, Math.min(380, W * 0.52));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var M = { t: 18, r: 74, b: 40, l: 48 };
      var x0 = M.l, y0 = M.t, w = W - M.l - M.r, h = H - M.t - M.b;
      geomBox = { x0: x0, y0: y0, w: w, h: h };

      // the field
      var NX = 140, NY = 96;
      for (var i = 0; i < NX; i++) {
        for (var j = 0; j < NY; j++) {
          var g = (GMAX * (i + 0.5)) / NX;
          var m = (MMAX * (j + 0.5)) / NY;
          ctx.fillStyle = color(val(m, g));
          ctx.fillRect(x0 + (w * i) / NX, y0 + h - (h * (j + 1)) / NY,
                       w / NX + 0.75, h / NY + 0.75);
        }
      }

      function gx(g) { return x0 + (w * g) / GMAX; }
      function my(m) { return y0 + h - (h * m) / MMAX; }

      // constant m/g slices, dashed white — the continuum-limit paths
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      [1, 0.5, 0.25, 0.125, 0.0625].forEach(function (r) {
        ctx.beginPath();
        var gEnd = Math.min(GMAX, MMAX / r);
        ctx.moveTo(gx(0), my(0));
        ctx.lineTo(gx(gEnd), my(r * gEnd));
        ctx.stroke();
      });

      // g* marker
      ctx.strokeStyle = "rgba(179,18,63,0.9)";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(gx(GSTAR), y0);
      ctx.lineTo(gx(GSTAR), y0 + h);
      ctx.stroke();
      ctx.setLineDash([]);

      // simulated-point grid, hollow circles
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      for (var gg = 0.2; gg < GMAX; gg += 0.4) {
        for (var mm = 0.1; mm < MMAX; mm += 0.18) {
          ctx.beginPath();
          ctx.arc(gx(gg), my(mm), 2.1, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // frame + labels
      ctx.strokeStyle = "#0E2129";
      ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = "#0E2129";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      [0, 1, 2, 3].forEach(function (g) {
        ctx.fillText(String(g), gx(g), y0 + h + 16);
      });
      ctx.fillText("coupling g", x0 + w / 2, H - 6);
      ctx.textAlign = "right";
      [0, 0.5, 1].forEach(function (m) {
        ctx.fillText(fmt(m, 1), x0 - 6, my(m) + 4);
      });
      ctx.save();
      ctx.translate(12, y0 + h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("mass m", 0, 0);
      ctx.restore();
      ctx.textAlign = "left";
      ctx.fillStyle = "#B3123F";
      ctx.fillText("g⋆", gx(GSTAR) + 4, y0 + 12);

      // colorbar
      var cbX = x0 + w + 18, cbW = 12;
      for (var k = 0; k < h; k++) {
        var t = 0.42 - (0.36 * k) / h;
        ctx.fillStyle = color(t);
        ctx.fillRect(cbX, y0 + k, cbW, 1.5);
      }
      ctx.strokeStyle = "#0E2129";
      ctx.strokeRect(cbX, y0, cbW, h);
      ctx.fillStyle = "#0E2129";
      ctx.fillText("0.41", cbX + cbW + 4, y0 + 8);
      ctx.fillText("0.08", cbX + cbW + 4, y0 + h);

      canvas.setAttribute("aria-label",
        "Heatmap of " + (mode === "magic" ? "magic density" : "entanglement entropy") +
        " over the mass-coupling plane. Darkest at the critical corner m = g = 0, " +
        "fading toward strong coupling, with the crossover marked at g of about 1.9.");
    }

    function probe(ev) {
      var rect = canvas.getBoundingClientRect();
      var px = ev.clientX - rect.left, py = ev.clientY - rect.top;
      if (px < geomBox.x0 || px > geomBox.x0 + geomBox.w ||
          py < geomBox.y0 || py > geomBox.y0 + geomBox.h) return;
      var g = (GMAX * (px - geomBox.x0)) / geomBox.w;
      var m = MMAX * (1 - (py - geomBox.y0) / geomBox.h);
      atEl.textContent = "(" + fmt(m, 2) + ", " + fmt(g, 2) + ")";
      vEl.textContent = fmt(val(m, g), 3);
      desc.textContent = "At m = " + fmt(m, 2) + ", g = " + fmt(g, 2) + " the " +
        (mode === "magic" ? "magic density" : "scaled entanglement") +
        " is about " + fmt(val(m, g), 3) + ".";
    }
    canvas.addEventListener("pointermove", probe);
    canvas.addEventListener("pointerdown", probe);

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        mode = chip.dataset.mode;
        uEl.textContent = mode === "magic" ? "M₂/L" : "S (scaled)";
        render();
      });
    });

    render();
    EV.onResize(render);
  }

  EV.figuresSU2 = {
    init: function () { f1(); f2(); f3(); f4(); f5(); f6(); }
  };
})(window.EV = window.EV || {});
