/* figures-pp.js — every figure on the page.
   F1 the four-stage pipeline (after Fig. 1), F2 the branching tree,
   F3 the cost/accuracy trade-off, F4 short-data super-resolution,
   F5 the dynamical structure factor. Figures marked schematic follow the
   functional forms reported in the paper, not raw data. */
(function (EV) {
  "use strict";

  function fmt(x, d) {
    if (d == null) d = 2;
    return Number(x).toLocaleString("en-US", {
      minimumFractionDigits: d, maximumFractionDigits: d
    });
  }
  EV.fmt = fmt;

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
        .attr("text-anchor", "middle").text(o.xFmt ? o.xFmt(t) : fmt(t, o.xDec == null ? 0 : o.xDec));
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

  /* =================================================================
     F1 — the four-stage pipeline, a native recreation of Fig. 1.
     ================================================================= */
  function f1() {
    var host = document.getElementById("f1-stage");
    if (!host) return;
    var svg = d3.select(host).append("svg").attr("role", "img")
      .attr("aria-label",
        "A four-stage pipeline. Stage 1, Pauli propagation, drawn as a branching binary " +
        "tree. Stage 2, CAMPS ground state, drawn as stacked bars over site boxes. Stage 3, " +
        "positivity extension, a solid wave in a short window continued as a dashed wave. " +
        "Stage 4, the dynamical structure factor, a two-lobed dispersion curve. Arrows " +
        "connect the stages left to right.");

    function render() {
      var W = host.clientWidth || 480;
      var vertical = W < 520;
      var n = 4;
      var gap = vertical ? 16 : 20;
      var pw = vertical ? W : (W - 3 * gap) / 4;
      var ph = vertical ? 96 : Math.max(120, Math.min(150, pw * 1.05));
      var lh = 30; // label strip
      var cellH = ph + lh;
      var H = vertical ? n * (cellH + gap) : cellH + 4;
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      var titles = ["Pauli propagation", "CAMPS ground state",
                    "Positivity extension", "Dynamical S(k, ω)"];

      function panelXY(i) {
        if (vertical) return [0, i * (cellH + gap)];
        return [i * (pw + gap), 0];
      }

      function box(g, x, y, w, h) {
        g.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h)
          .attr("rx", 8).attr("fill", "var(--solid)").attr("fill-opacity", 0.06)
          .attr("stroke", "var(--rule)").attr("stroke-width", 1);
      }

      for (var i = 0; i < 4; i++) {
        var xy = panelXY(i);
        var g = svg.append("g").attr("transform", "translate(" + xy[0] + "," + xy[1] + ")");
        box(g, 0, 0, pw, ph);
        var cx = pw / 2, cy = ph / 2;

        if (i === 0) {
          // branching tree
          var nodes = [
            [0.5, 0.14], [0.32, 0.40], [0.68, 0.40],
            [0.22, 0.70], [0.44, 0.70], [0.60, 0.70], [0.80, 0.70],
            [0.16, 0.92], [0.30, 0.92], [0.54, 0.92], [0.70, 0.92]
          ];
          var edges = [[0,1,1],[0,2,1],[1,3,1],[1,4,0],[2,5,0],[2,6,1],
                       [3,7,1],[3,8,0],[6,9,0],[6,10,1]];
          edges.forEach(function (e) {
            var a = nodes[e[0]], b = nodes[e[1]];
            g.append("line")
              .attr("x1", a[0] * pw).attr("y1", a[1] * ph)
              .attr("x2", b[0] * pw).attr("y2", b[1] * ph)
              .attr("stroke", e[2] ? "var(--solid)" : "var(--ink-50)")
              .attr("stroke-width", e[2] ? 2.4 : 1)
              .attr("opacity", e[2] ? 0.95 : 0.45);
          });
          nodes.forEach(function (nd, idx) {
            var kept = idx < 7 || idx === 9 || idx === 10;
            g.append("circle").attr("cx", nd[0] * pw).attr("cy", nd[1] * ph)
              .attr("r", idx === 0 ? 5 : 3.8)
              .attr("fill", kept ? "var(--solid)" : "var(--lattice)");
          });
        } else if (i === 1) {
          // CAMPS: half-link style bars over site boxes
          var sites = 5;
          var sw = pw * 0.66, sx0 = (pw - sw) / 2;
          for (var s = 0; s < sites; s++) {
            var bx = sx0 + (sw * s) / (sites - 1);
            g.append("line").attr("x1", bx).attr("x2", bx)
              .attr("y1", ph * 0.22).attr("y2", ph * 0.62)
              .attr("stroke", "var(--ink-50)").attr("stroke-width", 1);
            g.append("rect").attr("x", bx - 8).attr("y", ph * 0.62)
              .attr("width", 16).attr("height", 14).attr("rx", 2)
              .attr("fill", "var(--ink)");
          }
          // entanglement bars
          [[0,1,0.30],[1,3,0.40],[2,4,0.50]].forEach(function (b) {
            var x1 = sx0 + (sw * b[0]) / (sites - 1);
            var x2 = sx0 + (sw * b[1]) / (sites - 1);
            g.append("line").attr("x1", x1).attr("x2", x2)
              .attr("y1", ph * b[2]).attr("y2", ph * b[2])
              .attr("stroke", "var(--solid)").attr("stroke-width", 4)
              .attr("stroke-linecap", "round");
          });
        } else if (i === 2) {
          // positivity extension: solid window + dashed continuation
          var m = 12, x0 = m, x1 = pw - m, wy = cy;
          var winEnd = x0 + (x1 - x0) * 0.42;
          g.append("rect").attr("x", x0).attr("y", ph * 0.2)
            .attr("width", winEnd - x0).attr("height", ph * 0.6)
            .attr("fill", "var(--ink)").attr("fill-opacity", 0.08);
          var solid = [], dash = [];
          for (var p = 0; p <= 60; p++) {
            var tt = p / 60;
            var xx = x0 + (x1 - x0) * tt;
            var yy = wy - Math.sin(tt * 9) * Math.exp(-tt * 1.1) * ph * 0.32;
            (xx <= winEnd ? solid : dash).push([xx, yy]);
          }
          var ld = d3.line();
          g.append("path").attr("d", ld(solid)).attr("fill", "none")
            .attr("stroke", "var(--ink)").attr("stroke-width", 2.2);
          g.append("path").attr("d", ld(dash)).attr("fill", "none")
            .attr("stroke", "var(--solid)").attr("stroke-width", 2)
            .attr("stroke-dasharray", "4 4");
        } else {
          // dispersion two-lobe
          var mm = 16, ax0 = mm, ax1 = pw - 8, ay0 = ph - 20, ay1 = 14;
          g.append("line").attr("class", "axis-line")
            .attr("x1", ax0).attr("x2", ax0).attr("y1", ay0).attr("y2", ay1);
          g.append("line").attr("class", "axis-line")
            .attr("x1", ax0).attr("x2", ax1).attr("y1", ay0).attr("y2", ay0);
          var dp = [];
          for (var q = 0; q <= 80; q++) {
            var kk = (q / 80) * 2 * Math.PI;
            var val = (1 - Math.cos(kk)) / 2; // 0..1
            dp.push([ax0 + (ax1 - ax0) * (q / 80), ay0 - (ay0 - ay1) * val]);
          }
          g.append("path").attr("d", d3.line()(dp)).attr("fill", "none")
            .attr("stroke", "var(--solid)").attr("stroke-width", 5)
            .attr("stroke-linecap", "round").attr("opacity", 0.25);
          g.append("path").attr("d", d3.line()(dp)).attr("fill", "none")
            .attr("stroke", "var(--solid)").attr("stroke-width", 2);
          g.append("text").attr("class", "tick-txt").attr("x", ax0 - 3).attr("y", ay1 + 2)
            .attr("text-anchor", "end").text("ω");
          g.append("text").attr("class", "tick-txt").attr("x", ax1).attr("y", ay0 + 14)
            .attr("text-anchor", "end").text("k");
        }

        // number badge + title
        g.append("circle").attr("cx", 12).attr("cy", ph + 15).attr("r", 9)
          .attr("fill", "var(--solid)");
        g.append("text").attr("x", 12).attr("y", ph + 19).attr("text-anchor", "middle")
          .attr("fill", "var(--paper)").attr("font-family", "var(--mono)")
          .attr("font-size", 11).attr("font-weight", 600).text(String(i + 1));
        g.append("text").attr("x", 27).attr("y", ph + 19)
          .attr("font-family", "var(--mono)").attr("font-size", 11)
          .attr("fill", "var(--ink)").text(titles[i]);

        // connector arrow
        if (i < 3) {
          if (vertical) {
            var yA = (i + 1) * (cellH + gap) - gap;
            svg.append("path")
              .attr("d", "M" + (pw / 2) + "," + (yA - gap + 2) + "V" + (yA + gap - 4))
              .attr("stroke", "var(--ink-50)").attr("stroke-width", 1.6).attr("fill", "none");
            svg.append("path")
              .attr("d", "M" + (pw / 2 - 4) + "," + (yA + gap - 8) + "L" + (pw / 2) + "," + (yA + gap - 3) + "L" + (pw / 2 + 4) + "," + (yA + gap - 8))
              .attr("stroke", "var(--ink-50)").attr("stroke-width", 1.6).attr("fill", "none");
          } else {
            var xA = (i + 1) * (pw + gap) - gap + gap / 2;
            var yc = ph / 2;
            svg.append("circle").attr("cx", xA).attr("cy", yc).attr("r", 5)
              .attr("fill", "var(--paper)").attr("stroke", "var(--solid)").attr("stroke-width", 1.6);
            svg.append("path")
              .attr("d", "M" + (xA + 6) + "," + yc + "l7,0m-3,-3l3,3l-3,3")
              .attr("stroke", "var(--solid)").attr("stroke-width", 1.6).attr("fill", "none");
          }
        }
      }
    }

    render();
    EV.onResize(render);
  }

  /* =================================================================
     F2 — the branching tree of Pauli propagation.
     ================================================================= */
  function f2() {
    var host = document.getElementById("f2-stage");
    if (!host) return;
    var thIn = document.getElementById("f2-theta");
    var dIn = document.getElementById("f2-depth");
    var thOut = document.getElementById("f2-theta-out");
    var dOut = document.getElementById("f2-depth-out");
    var leavesEl = document.getElementById("f2-leaves");
    var keptEl = document.getElementById("f2-kept");
    var wEl = document.getElementById("f2-w");
    var desc = document.getElementById("f2-desc");

    var EPS = 1e-3;
    var svg = d3.select(host).append("svg").attr("role", "img");

    function render() {
      var thetaDeg = +thIn.value, depth = +dIn.value;
      var theta = (thetaDeg * Math.PI) / 180;
      var c = Math.abs(Math.cos(2 * theta)), s = Math.abs(Math.sin(2 * theta));

      // build tree: each node splits into cos (same) and sin (new) child
      var levels = [[{ x: 0.5, coef: 1, kind: "root" }]];
      for (var d = 1; d <= depth; d++) {
        var prev = levels[d - 1], cur = [];
        prev.forEach(function (nd) {
          cur.push({ parent: nd, coef: nd.coef * c, kind: "cos" });
          cur.push({ parent: nd, coef: nd.coef * s, kind: "sin" });
        });
        levels.push(cur);
      }
      // position nodes evenly per level
      levels.forEach(function (lv) {
        var m = lv.length;
        lv.forEach(function (nd, i) { nd.x = (i + 0.5) / m; });
      });

      var leaves = Math.pow(2, depth);
      var kept = levels[depth].filter(function (nd) { return nd.coef >= EPS; }).length;
      var maxW = levels[depth].reduce(function (a, nd) { return Math.max(a, nd.coef); }, 0);

      var W = Math.min(host.clientWidth || 520, 760);
      var H = Math.max(240, Math.min(360, W * 0.62));
      var M = { t: 20, r: 16, b: 34, l: 16 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H)
        .style("max-width", W + "px").style("margin-inline", "auto");
      svg.selectAll("*").remove();

      var innerH = H - M.t - M.b;
      function px(nd) { return M.l + (W - M.l - M.r) * nd.x; }
      function py(level) { return M.t + (depth > 0 ? (innerH * level) / depth : 0); }

      // edges
      for (var L = 1; L <= depth; L++) {
        levels[L].forEach(function (nd) {
          var faint = nd.kind === "sin";
          var vis = nd.coef >= EPS;
          svg.append("line")
            .attr("x1", px(nd.parent)).attr("y1", py(L - 1))
            .attr("x2", px(nd)).attr("y2", py(L))
            .attr("stroke", vis ? (faint ? "var(--signal)" : "var(--solid)") : "var(--lattice)")
            .attr("stroke-width", Math.max(0.8, 4 * nd.coef))
            .attr("opacity", vis ? (faint ? 0.7 : 0.9) : 0.35)
            .attr("stroke-dasharray", faint ? "3 2" : null);
        });
      }
      // nodes
      for (var L2 = 0; L2 <= depth; L2++) {
        levels[L2].forEach(function (nd) {
          var vis = nd.coef >= EPS;
          svg.append("circle").attr("cx", px(nd)).attr("cy", py(L2))
            .attr("r", L2 === 0 ? 6 : 4)
            .attr("fill", L2 === 0 ? "var(--ink)"
                        : vis ? (nd.kind === "sin" ? "var(--signal)" : "var(--solid)")
                              : "var(--lattice)");
        });
      }

      svg.append("text").attr("class", "tick-txt").attr("x", M.l).attr("y", H - 8)
        .text("root operator");
      svg.append("text").attr("class", "tick-txt").attr("x", W - M.r).attr("y", H - 8)
        .attr("text-anchor", "end").text(leaves + " leaves after " + depth + " rotations");

      svg.attr("aria-label",
        "A binary tree of depth " + depth + " with " + leaves + " leaves. Solid blue edges " +
        "are cosine branches where the string is unchanged; dashed red edges are sine " +
        "branches creating new strings. " + kept + " leaves stay above the coefficient " +
        "cutoff.");

      thOut.textContent = thetaDeg + "°";
      dOut.textContent = String(depth);
      leavesEl.textContent = leaves.toLocaleString("en-US");
      keptEl.textContent = kept.toLocaleString("en-US");
      keptEl.className = "v " + (kept < leaves ? "good" : "");
      wEl.textContent = fmt(maxW, 3);
      desc.textContent = "At θ = " + thetaDeg + "° and depth " + depth + ", the tree has " +
        leaves + " leaves; " + kept + " survive the cutoff ε = 1e−3. The largest surviving " +
        "coefficient is " + fmt(maxW, 3) + ".";
    }

    [thIn, dIn].forEach(function (el) { el.addEventListener("input", render); });
    render();
    EV.onResize(render);
  }

  /* =================================================================
     F3 — string count vs cutoff, schematic trade-off.
     ================================================================= */
  function f3() {
    var host = document.getElementById("f3-stage");
    if (!host) return;
    var epsIn = document.getElementById("f3-eps");
    var wIn = document.getElementById("f3-w");
    var epsOut = document.getElementById("f3-eps-out");
    var wOut = document.getElementById("f3-w-out");
    var peakEl = document.getElementById("f3-peak");
    var accEl = document.getElementById("f3-acc");
    var verdict = document.getElementById("f3-verdict");
    var desc = document.getElementById("f3-desc");

    var EPS_VALS = [1e-2, 5e-3, 1e-3, 5e-4, 1e-4];
    var EPS_LBL = ["1e−2", "5e−3", "1e−3", "5e−4", "1e−4"];
    var svg = d3.select(host).append("svg").attr("role", "img");

    function render() {
      var ei = +epsIn.value, w = +wIn.value;
      var eps = EPS_VALS[ei];
      // schematic: peak count rises as eps->0 and w->N; accuracy window likewise
      var tightness = (4 - ei) / 4 * 0.6 + (w - 2) / 10 * 0.4; // 0..1
      var peak = Math.round(200 * Math.pow(80, tightness));     // ~200 .. 16000
      var accWindow = 1.2 + tightness * 8.5;                    // time it stays exact

      var W = Math.min(host.clientWidth || 700, 820);
      var H = Math.max(240, Math.min(340, W * 0.5));
      var M = { t: 22, r: 20, b: 40, l: 58 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      var x = d3.scaleLinear().domain([0, 10]).range([M.l, W - M.r]);
      var y = d3.scaleLog().domain([100, 40000]).range([H - M.b, M.t]);

      [100, 1000, 10000].forEach(function (t) {
        svg.append("line").attr("class", "grid-line")
          .attr("x1", M.l).attr("x2", W - M.r).attr("y1", y(t)).attr("y2", y(t));
        svg.append("text").attr("class", "tick-txt").attr("x", M.l - 8).attr("y", y(t) + 4)
          .attr("text-anchor", "end").text(t >= 1000 ? (t / 1000) + "k" : t);
      });
      [0, 2, 4, 6, 8, 10].forEach(function (t) {
        svg.append("text").attr("class", "tick-txt").attr("x", x(t)).attr("y", H - M.b + 16)
          .attr("text-anchor", "middle").text(t);
      });
      svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", W - M.r)
        .attr("y1", H - M.b).attr("y2", H - M.b);
      svg.append("line").attr("class", "axis-line").attr("x1", M.l).attr("x2", M.l)
        .attr("y1", H - M.b).attr("y2", M.t);

      // growth curve: rises, peaks near accWindow, then truncation flattens it
      var pts = [];
      for (var i = 0; i <= 100; i++) {
        var t = (10 * i) / 100;
        var grow = peak * (1 - Math.exp(-t / (accWindow * 0.5)));
        var val = Math.max(120, Math.min(peak, grow));
        pts.push([t, val]);
      }
      // accuracy window shading
      svg.append("rect").attr("x", M.l).attr("width", x(Math.min(10, accWindow)) - M.l)
        .attr("y", M.t).attr("height", H - M.b - M.t)
        .attr("fill", "var(--solid)").attr("fill-opacity", 0.06);
      svg.append("text").attr("class", "tick-txt")
        .attr("x", (M.l + x(Math.min(10, accWindow))) / 2).attr("y", M.t + 12)
        .attr("text-anchor", "middle").attr("fill", "var(--solid)").text("faithful window");

      curve(svg, pts, x, y, "var(--signal)", 2.4);

      svg.append("line").attr("x1", x(Math.min(10, accWindow))).attr("x2", x(Math.min(10, accWindow)))
        .attr("y1", H - M.b).attr("y2", M.t)
        .attr("stroke", "var(--solid)").attr("stroke-width", 1).attr("stroke-dasharray", "4 4");

      svg.append("text").attr("class", "tick-txt").attr("x", (M.l + W - M.r) / 2).attr("y", H - 6)
        .attr("text-anchor", "middle").text("time t");
      svg.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(14," + (M.t + (H - M.b - M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("retained Pauli strings");

      svg.attr("aria-label",
        "Retained Pauli string count against time on a log axis. Tighter cutoffs raise the " +
        "peak count to about " + peak + " and widen the faithful window to about t = " +
        fmt(accWindow, 1) + ".");

      epsOut.textContent = EPS_LBL[ei];
      wOut.textContent = String(w);
      peakEl.textContent = peak.toLocaleString("en-US");
      accEl.textContent = "t ≈ " + fmt(accWindow, 1);
      var loose = tightness < 0.35;
      verdict.textContent = loose
        ? "Loose cutoffs: cheap, but the signal wanders off early."
        : tightness > 0.75
          ? "Tight cutoffs: faithful for long, but the string count is large."
          : "A workable balance — accurate through the useful window at moderate cost.";
      verdict.className = "verdict" + (loose ? " bad" : "");
      desc.textContent = "ε = " + EPS_LBL[ei] + ", w = " + w + ": peak of about " + peak +
        " strings, faithful to roughly t = " + fmt(accWindow, 1) + ".";
    }

    [epsIn, wIn].forEach(function (el) { el.addEventListener("input", render); });
    render();
    EV.onResize(render);
  }

  /* =================================================================
     F4 — super-resolution from short data.
     ================================================================= */
  function f4() {
    var host = document.getElementById("f4-stage");
    if (!host) return;
    var ptsIn = document.getElementById("f4-pts");
    var rankIn = document.getElementById("f4-rank");
    var ptsOut = document.getElementById("f4-pts-out");
    var rankOut = document.getElementById("f4-rank-out");
    var needEl = document.getElementById("f4-need");
    var okEl = document.getElementById("f4-ok");
    var verdict = document.getElementById("f4-verdict");
    var desc = document.getElementById("f4-desc");

    // the "true" signal: sum of r cosines with fixed frequencies
    var FREQS = [1.4, 3.1, 4.7];
    var AMPS = [1.0, 0.55, 0.35];
    var svg = d3.select(host).append("svg").attr("role", "img");

    function signal(t, r) {
      var v = 0;
      for (var i = 0; i < r; i++) v += AMPS[i] * Math.cos(FREQS[i] * t);
      return v / r;
    }

    function render() {
      var nPts = +ptsIn.value, r = +rankIn.value;
      var need = 2 * r;
      var ok = nPts >= need;
      var dt = 0.28, tWin = (nPts - 1) * dt;

      var W = Math.min(host.clientWidth || 720, 820);
      var H = Math.max(240, Math.min(320, W * 0.46));
      var M = { t: 22, r: 20, b: 40, l: 46 };
      svg.attr("viewBox", "0 0 " + W + " " + H).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      var tMax = 10;
      var x = d3.scaleLinear().domain([0, tMax]).range([M.l, W - M.r]);
      var y = d3.scaleLinear().domain([-1.1, 1.1]).range([H - M.b, M.t]);
      axes(svg, x, y, { yTicks: [-1, 0, 1], xTicks: [0, 2, 4, 6, 8, 10], yDec: 0 });

      // measured window shading
      svg.append("rect").attr("x", M.l).attr("width", x(tWin) - M.l)
        .attr("y", M.t).attr("height", H - M.b - M.t)
        .attr("fill", "var(--ink)").attr("fill-opacity", 0.06);
      svg.append("text").attr("class", "tick-txt").attr("x", (M.l + x(tWin)) / 2).attr("y", M.t + 12)
        .attr("text-anchor", "middle").text("measured");

      // reconstruction: if enough data, recover exactly r freqs; else degrade
      var full = [];
      for (var i = 0; i <= 240; i++) {
        var t = (tMax * i) / 240;
        full.push([t, signal(t, r)]);
      }
      // continuation (dashed beyond window) vs true (solid within)
      var inWin = full.filter(function (p) { return p[0] <= tWin + 1e-9; });
      var beyond = full.filter(function (p) { return p[0] >= tWin - 1e-9; });

      if (ok) {
        curve(svg, inWin, x, y, "var(--solid)", 2.4);
        svg.append("path").datum(beyond).attr("d", d3.line()
            .x(function (p) { return x(p[0]); }).y(function (p) { return y(p[1]); }))
          .attr("fill", "none").attr("stroke", "var(--solid)").attr("stroke-width", 2)
          .attr("stroke-dasharray", "5 4");
      } else {
        // underdetermined: show a wrong/wobbly extension
        curve(svg, inWin, x, y, "var(--solid)", 2.4);
        var bad = beyond.map(function (p) {
          var decay = Math.exp(-(p[0] - tWin) * 0.5);
          return [p[0], p[1] * decay + (1 - decay) * 0.15 * Math.sin(p[0] * 1.3)];
        });
        svg.append("path").datum(bad).attr("d", d3.line()
            .x(function (p) { return x(p[0]); }).y(function (p) { return y(p[1]); }))
          .attr("fill", "none").attr("stroke", "var(--signal)").attr("stroke-width", 2)
          .attr("stroke-dasharray", "5 4");
      }

      // the measured points
      for (var k = 0; k < nPts; k++) {
        var t = k * dt;
        svg.append("circle").attr("cx", x(t)).attr("cy", y(signal(t, r))).attr("r", 3.6)
          .attr("fill", "var(--solid)");
      }

      svg.append("text").attr("class", "tick-txt").attr("x", (M.l + W - M.r) / 2).attr("y", H - 6)
        .attr("text-anchor", "middle").text("time t");
      svg.append("text").attr("class", "tick-txt")
        .attr("transform", "translate(13," + (M.t + (H - M.b - M.t) / 2) + ") rotate(-90)")
        .attr("text-anchor", "middle").text("C(t)");

      svg.attr("aria-label",
        nPts + " measured points spanning t up to " + fmt(tWin, 1) + ", reconstructing a " +
        r + "-frequency signal. " + (ok ? "Enough data: the extension matches."
          : "Too few points: the extension is underdetermined and drifts."));

      ptsOut.textContent = String(nPts);
      rankOut.textContent = String(r);
      needEl.textContent = String(need);
      okEl.textContent = ok ? "locked on" : "underdetermined";
      okEl.className = "v " + (ok ? "good" : "bad");
      verdict.textContent = ok
        ? nPts <= need + 2
          ? "Just enough: " + nPts + " points fix " + r + " frequenc" + (r > 1 ? "ies" : "y") + " and the rest is free."
          : "Comfortably resolved — the frequencies are pinned and the correlator extends cleanly."
        : "Not enough: " + r + " frequencies need " + need + " clean samples, but only " + nPts + " are given.";
      verdict.className = "verdict" + (ok ? "" : " bad");
      desc.textContent = nPts + " points, rank r = " + r + " (needs " + need + "): " +
        (ok ? "reconstruction locks on." : "underdetermined, extension drifts.");
    }

    [ptsIn, rankIn].forEach(function (el) { el.addEventListener("input", render); });
    render();
    EV.onResize(render);
  }

  /* =================================================================
     F5 — the dynamical structure factor heatmap.
     ================================================================= */
  function f5() {
    var host = document.getElementById("f5-stage");
    if (!host) return;
    var tauIn = document.getElementById("f5-tau");
    var tauOut = document.getElementById("f5-tau-out");
    var dispEl = document.getElementById("f5-disp");
    var widthEl = document.getElementById("f5-width");
    var desc = document.getElementById("f5-desc");
    var chips = Array.prototype.slice.call(document.querySelectorAll("#f5-mode .chip"));

    var mode = "fm";

    // dispersion: 1D magnon ω=4(1-cos k); 2D LSW ω=A sqrt(1-γ^2), path Γ-X-M-Γ
    function omegaFM(kf) { return 4 * (1 - Math.cos(kf * Math.PI)); } // kf in 0..1 -> 0..π
    function omega2D(kf) {
      // kf 0..1 along Γ(0,0)->X(π,0)->M(π,π)->Γ ; build γ along the path
      var A = 8.9, kx, ky;
      if (kf < 1 / 3) { var u = kf * 3; kx = u * Math.PI; ky = 0; }
      else if (kf < 2 / 3) { var u2 = (kf - 1 / 3) * 3; kx = Math.PI; ky = u2 * Math.PI; }
      else { var u3 = (kf - 2 / 3) * 3; kx = (1 - u3) * Math.PI; ky = (1 - u3) * Math.PI; }
      var g = (Math.cos(kx) + Math.cos(ky)) / 2;
      return A * Math.sqrt(Math.max(0, 1 - g * g));
    }

    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("role", "img");
    host.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var color = d3.scaleSequential(d3.interpolateRgb("#E7ECE2", "#12566E")).domain([0, 1]);

    function render() {
      var tau = +tauIn.value;
      var omega = mode === "fm" ? omegaFM : omega2D;
      var wMax = mode === "fm" ? 8.5 : 11;
      var W = host.clientWidth || 700;
      var H = Math.max(260, Math.min(360, W * 0.5));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      var M = { t: 16, r: 20, b: 40, l: 52 };
      var x0 = M.l, y0 = M.t, w = W - M.l - M.r, h = H - M.t - M.b;
      var lw = 1 / tau; // linewidth

      var NX = 200, NY = 130;
      for (var i = 0; i < NX; i++) {
        var kf = i / (NX - 1);
        var wk = omega(kf);
        for (var j = 0; j < NY; j++) {
          var om = wMax * (1 - (j + 0.5) / NY);
          var d = (om - wk) / (lw * 1.4);
          var intensity = Math.exp(-d * d) * (0.4 + 0.6 * Math.sin(kf * Math.PI)); // fade at zone edges
          if (intensity > 0.02) {
            ctx.fillStyle = color(Math.min(1, intensity));
            ctx.fillRect(x0 + w * (i / NX), y0 + h * (j / NY), w / NX + 0.8, h / NY + 0.8);
          }
        }
      }

      // frame
      ctx.strokeStyle = "#0E2129";
      ctx.strokeRect(x0, y0, w, h);
      ctx.fillStyle = "#0E2129";
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      // omega ticks
      ctx.textAlign = "right";
      for (var t = 0; t <= wMax; t += (mode === "fm" ? 2 : 3)) {
        var yy = y0 + h * (1 - t / wMax);
        ctx.fillText(String(t), x0 - 6, yy + 4);
      }
      ctx.save(); ctx.translate(14, y0 + h / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillText("frequency ω", 0, 0); ctx.restore();

      // k labels
      ctx.textAlign = "center";
      if (mode === "fm") {
        [["0", 0], ["π/2", 0.5], ["π", 1]].forEach(function (p) {
          ctx.fillText(p[0], x0 + w * p[1], y0 + h + 16);
        });
        ctx.fillText("momentum k", x0 + w / 2, y0 + h + 32);
      } else {
        [["Γ", 0], ["X", 1 / 3], ["M", 2 / 3], ["Γ", 1]].forEach(function (p) {
          var xx = x0 + w * p[1];
          ctx.fillText(p[0], xx, y0 + h + 16);
          ctx.strokeStyle = "rgba(14,33,41,0.25)";
          ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y0 + h); ctx.stroke();
        });
        ctx.fillStyle = "#0E2129";
        ctx.fillText("Brillouin-zone path", x0 + w / 2, y0 + h + 32);
      }

      // dispersion ridge overlay
      ctx.strokeStyle = "rgba(179,18,63,0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var q = 0; q <= 160; q++) {
        var kf2 = q / 160, wk2 = omega(kf2);
        var X = x0 + w * kf2, Y = y0 + h * (1 - wk2 / wMax);
        q === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
      }
      ctx.stroke();

      canvas.setAttribute("aria-label",
        "Heatmap of the dynamical structure factor. A bright ridge follows the " +
        (mode === "fm" ? "1D magnon dispersion omega equals 4 times (1 minus cos k)"
                       : "2D linear spin-wave dispersion along the Brillouin-zone path") +
        ", with linewidth set by the damping tau = " + fmt(tau, 1) + ".");

      tauOut.textContent = fmt(tau, 1);
      dispEl.textContent = mode === "fm" ? "4(1 − cos k)" : "A√(1 − γₖ²)";
      widthEl.textContent = fmt(lw, 2);
      desc.textContent = (mode === "fm" ? "1D magnon band" : "2D spin-wave dispersion") +
        " with damping τ = " + fmt(tau, 1) + ", giving linewidth about " + fmt(lw, 2) + ".";
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        mode = chip.dataset.mode;
        render();
      });
    });

    tauIn.addEventListener("input", render);
    render();
    EV.onResize(render);
  }

  EV.figuresPP = {
    init: function () { f1(); f2(); f3(); f4(); f5(); }
  };
})(window.EV = window.EV || {});
