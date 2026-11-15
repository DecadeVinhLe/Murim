/* Murim scenery behind every page: one storm-night world painted in canvas, no libraries and no image files.
   It is rendered once like a matte painting (noise-textured sky, a huge veiled moon, rock pillars with strata and pines,
   a temple roofline with tiles and red lanterns, a wet street, bamboo in front) and then only the light moves:
   clouds and fog drift, lantern glow flickers, rain falls, embers rise, a little film grain breathes.
   Reduced motion gets one still frame. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = document.createElement("canvas");
  cv.id = "scene";
  cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext("2d");
  if (!ctx) return;

  /* ---------- noise ---------- */
  var seed = 1;
  function rnd() { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function h2(x, y) { var n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vn(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    var a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  function fbm(x, y, o) { var v = 0, a = 0.5, f = 1, i; for (i = 0; i < o; i++) { v += a * vn(x * f, y * f); f *= 2; a *= 0.5; } return v / (1 - Math.pow(0.5, o)); }
  function ss(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function mixc(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function mk(w, h) { var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }

  var W = 0, H = 0, dpr = 1, rs = 1, bg = null, fgc = null, cloudSp = [], fogSp = null, grain = null, lan = [], parts = [], clouds = [], fogs = [];
  var t0 = performance.now(), running = true, px = 0, py = 0, tpx = 0, tpy = 0, moon = { x: 0, y: 0, r: 0 };

  /* ---------- sprites ---------- */
  function moonTex() {
    var S = 320, c = mk(S, S), m = c.getContext("2d"), id = m.createImageData(S, S), d = id.data, x, y, i = 0, R = S / 2;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++, i += 4) {
      var dx = (x - R) / R, dy = (y - R) / R, r = Math.sqrt(dx * dx + dy * dy);
      if (r > 1) { d[i + 3] = 0; continue; }
      var big = fbm(x * 0.011 + 5, y * 0.011 + 2, 4), fine = fbm(x * 0.06, y * 0.06, 3);
      var mare = ss(0.47, 0.62, big);
      var col = mixc([226, 210, 172], [146, 128, 96], mare * 0.8);
      var k = 0.9 + (fine - 0.5) * 0.35, limb = 1 - 0.42 * Math.pow(r, 3.2), edge = ss(1, 0.985, r);
      d[i] = col[0] * k * limb; d[i + 1] = col[1] * k * limb; d[i + 2] = col[2] * k * limb; d[i + 3] = 255 * edge;
    }
    m.putImageData(id, 0, 0);
    seed = 77;
    var n, a, rr, cx, cy, cr;
    for (n = 0; n < 26; n++) {
      a = rnd() * 6.283; rr = Math.sqrt(rnd()) * R * 0.82; cx = R + Math.cos(a) * rr; cy = R + Math.sin(a) * rr; cr = 3 + rnd() * 11;
      m.strokeStyle = "rgba(90,74,52,0.3)"; m.lineWidth = 1.3; m.beginPath(); m.arc(cx, cy, cr, 0, 6.283); m.stroke();
      m.strokeStyle = "rgba(255,244,214,0.22)"; m.beginPath(); m.arc(cx - 1, cy - 1, cr, 3.6, 5.5); m.stroke();
    }
    return c;
  }
  /* a storm cloud with a warm rim on the side that faces the moon */
  function cloudTex(w, h, sd) {
    var c = mk(w, h), m = c.getContext("2d"), id = m.createImageData(w, h), d = id.data, x, y, i = 0;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++, i += 4) {
      var nx = x / w, ny = y / h, env = Math.sin(Math.min(1, nx) * Math.PI) * Math.sin(Math.min(1, ny) * Math.PI);
      var n = fbm(x * 0.012 + sd, y * 0.02 + sd * 2, 5) * 1.35 * env;
      var a = ss(0.36, 0.64, n);
      var n2 = fbm((x + 6) * 0.012 + sd, (y + 6) * 0.02 + sd * 2, 5) * 1.35 * env;
      var lit = Math.max(0, Math.min(1, (n - n2) * 14 + 0.1)) * a;
      d[i] = 7 + lit * 84; d[i + 1] = 9 + lit * 70; d[i + 2] = 16 + lit * 56; d[i + 3] = 255 * a * 0.9;
    }
    m.putImageData(id, 0, 0); return c;
  }
  function fogTex(w, h, sd) {
    var c = mk(w, h), m = c.getContext("2d"), id = m.createImageData(w, h), d = id.data, x, y, i = 0;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++, i += 4) {
      var env = Math.pow(Math.sin(x / w * Math.PI), 1.3) * Math.pow(Math.sin(y / h * Math.PI), 1.6);
      var n = fbm(x * 0.012 + sd, y * 0.04, 4) * 1.5;
      d[i] = 150; d[i + 1] = 160; d[i + 2] = 178; d[i + 3] = 255 * Math.min(1, n * env * 1.2);
    }
    m.putImageData(id, 0, 0); return c;
  }
  function grainTex() {
    var c = mk(256, 256), m = c.getContext("2d"), id = m.createImageData(256, 256), d = id.data, i, v;
    for (i = 0; i < d.length; i += 4) { v = rnd() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    m.putImageData(id, 0, 0); return c;
  }

  /* ---------- the painting ---------- */
  function jaggy(c, pts) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); }

  function paintSky(c) {
    var sw = Math.ceil(W / 5), sh = Math.ceil(H / 5), t = mk(sw, sh), m = t.getContext("2d"), id = m.createImageData(sw, sh), d = id.data, x, y, i = 0;
    var top = [3, 4, 10], mid = [14, 19, 33], low = [40, 40, 52], mx = moon.x / 5, my = moon.y / 5, mr = moon.r / 5;
    for (y = 0; y < sh; y++) for (x = 0; x < sw; x++, i += 4) {
      var ty = y / sh, base = ty < 0.55 ? mixc(top, mid, ty / 0.55) : mixc(mid, low, (ty - 0.55) / 0.45);
      var n = fbm(x * 0.05, y * 0.07 + 3, 5), k = 0.55 + n * 1.1;
      var dd = Math.sqrt((x - mx) * (x - mx) + (y - my) * (y - my)) / mr, gl = Math.exp(-dd * dd * 0.32) * 0.9;
      d[i] = base[0] * k + 226 * gl * 0.42; d[i + 1] = base[1] * k + 200 * gl * 0.36; d[i + 2] = base[2] * k + 150 * gl * 0.26; d[i + 3] = 255;
    }
    m.putImageData(id, 0, 0);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high"; c.drawImage(t, 0, 0, W, H);
    seed = 5; var s;
    for (s = 0; s < 110; s++) { var sx = rnd() * W, sy = rnd() * H * 0.5, a = 0.15 + rnd() * 0.45; c.fillStyle = "rgba(230,232,250," + a + ")"; c.fillRect(sx, sy, 1 + rnd() * 0.8, 1 + rnd() * 0.8); }
  }
  function paintMoon(c) {
    var g = c.createRadialGradient(moon.x, moon.y, moon.r * 0.9, moon.x, moon.y, moon.r * 3.2);
    g.addColorStop(0, "rgba(236,212,160,0.38)"); g.addColorStop(0.3, "rgba(236,212,160,0.1)"); g.addColorStop(1, "rgba(236,212,160,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = 0.92; c.drawImage(moonTex(), moon.x - moon.r, moon.y - moon.r, moon.r * 2, moon.r * 2); c.globalAlpha = 1;
  }
  function ridge(c, base, amp, f, sd, top, bot) {
    var x, pts = [[0, H]];
    for (x = 0; x <= W + 6; x += 6) pts.push([x, base + (fbm(x * f + sd, sd, 5) - 0.5) * amp * 2.2]);
    pts.push([W, H]); jaggy(c, pts); c.closePath();
    var g = c.createLinearGradient(0, base - amp * 1.4, 0, base + amp * 2.5); g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fill();
  }
  function fogBand(c, y, a, sd) {
    var k, n = 7; seed = sd;
    for (k = 0; k < n; k++) {
      var cx = (k / (n - 1)) * W * 1.1 - W * 0.05, w = W * (0.28 + rnd() * 0.2), h = H * (0.05 + rnd() * 0.04), cy = y + (rnd() - 0.5) * H * 0.04;
      c.save(); c.translate(cx, cy); c.scale(w / h, 1);
      var g = c.createRadialGradient(0, 0, 0, 0, 0, h);
      g.addColorStop(0, "rgba(150,160,180," + a + ")"); g.addColorStop(1, "rgba(150,160,180,0)");
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, h, 0, 6.283); c.fill(); c.restore();
    }
  }
  /* a karst pillar: jagged sides that bulge, strata streaks, a mossy crown with pines */
  function pillar(c, cx, w, top, bot, col, lit, sd, depth) {
    var y, pts = [], n = 26, left = [], right = [];
    for (y = 0; y <= n; y++) {
      var yy = bot - (bot - top) * (y / n), tt = y / n, hw = w * (1 + 0.3 * (1 - tt) - 0.12 * Math.sin(tt * 3 + sd));
      left.push([cx - hw + (fbm(yy * 0.03 + sd, sd, 3) - 0.5) * w * 0.55, yy]);
      right.push([cx + hw + (fbm(yy * 0.03 + sd + 9, sd, 3) - 0.5) * w * 0.55, yy]);
    }
    pts = left.concat([[left[n][0] + w * 0.18, top - 5], [cx - w * 0.2, top - 9 - fbm(sd, 4, 2) * 10], [cx + w * 0.3, top - 4], [right[n][0] - w * 0.1, top - 8]]).concat(right.reverse());
    c.save(); jaggy(c, pts); c.closePath();
    var g = c.createLinearGradient(cx - w, 0, cx + w, 0);
    g.addColorStop(0, col[0]); g.addColorStop(1, lit ? col[1] : col[0]); c.fillStyle = g; c.fill(); c.clip();
    seed = Math.floor(sd * 1000) + 3; var s;
    for (s = 0; s < 38; s++) {
      var sx = cx + (rnd() - 0.5) * w * 2.2, sy = top + rnd() * (bot - top) * 0.9, sl = 20 + rnd() * 90;
      c.strokeStyle = rnd() > 0.5 ? "rgba(0,0,0," + (0.14 + rnd() * 0.18) + ")" : "rgba(170,182,205," + (0.03 + rnd() * 0.05) + ")";
      c.lineWidth = 0.8 + rnd() * 2.4; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (rnd() - 0.5) * 6, sy + sl); c.stroke();
    }
    for (s = 0; s < 7; s++) {
      var ly = top + (bot - top) * (0.08 + rnd() * 0.7);
      c.strokeStyle = "rgba(0,0,0,0.2)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx - w * (0.5 + rnd() * 0.6), ly); c.lineTo(cx + w * (0.2 + rnd() * 0.8), ly + (rnd() - 0.5) * 8); c.stroke();
    }
    var sh = c.createLinearGradient(0, top, 0, bot); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(2,4,9," + (0.5 - depth * 0.12) + ")");
    c.fillStyle = sh; c.fillRect(cx - w * 2, top - 20, w * 4, bot - top + 40);
    c.restore();
    c.fillStyle = "rgba(36,54,48," + (0.9 - depth * 0.15) + ")";
    for (s = 0; s < 9; s++) { var mxp = cx + (rnd() - 0.5) * w * 1.6; c.beginPath(); c.ellipse(mxp, top - 4 - rnd() * 4, 6 + rnd() * 9, 3 + rnd() * 3, 0, 0, 6.283); c.fill(); }
    c.fillStyle = "rgba(14,26,24,0.95)";
    for (s = 0; s < 5; s++) {
      var tx = cx + (rnd() - 0.5) * w * 1.4, th = 14 + rnd() * 22 - depth * 3;
      c.beginPath(); c.moveTo(tx, top - th - 6); c.lineTo(tx - th * 0.36, top - 4); c.lineTo(tx + th * 0.36, top - 4); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(tx, top - th * 0.55 - 6); c.lineTo(tx - th * 0.5, top - 3); c.lineTo(tx + th * 0.5, top - 3); c.closePath(); c.fill();
    }
  }
  function roof(c, cx, y, w, h) {
    c.beginPath(); c.moveTo(cx - w, y + h * 0.15); c.quadraticCurveTo(cx - w * 0.5, y + h * 0.2, cx, y - h * 0.55);
    c.quadraticCurveTo(cx + w * 0.5, y + h * 0.2, cx + w, y + h * 0.15); c.lineTo(cx + w * 0.78, y + h * 0.42); c.lineTo(cx - w * 0.78, y + h * 0.42); c.closePath();
    c.fillStyle = "#0b0f18"; c.fill();
    c.strokeStyle = "rgba(0,0,0,0.55)"; c.lineWidth = 1;
    var k; for (k = -5; k <= 5; k++) { c.beginPath(); c.moveTo(cx, y - h * 0.5); c.lineTo(cx + w * k / 5.6, y + h * 0.28); c.stroke(); }
    c.beginPath(); c.moveTo(cx - w, y + h * 0.15); c.quadraticCurveTo(cx - w * 0.5, y + h * 0.2, cx, y - h * 0.55); c.quadraticCurveTo(cx + w * 0.5, y + h * 0.2, cx + w, y + h * 0.15);
    c.strokeStyle = "rgba(170,186,220,0.3)"; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = "#0b0f18"; c.fillRect(cx - w * 0.03, y - h * 0.8, w * 0.06, h * 0.3);
    lan.push({ x: cx - w * 0.86, y: y + h * 0.5 }); lan.push({ x: cx + w * 0.86, y: y + h * 0.5 });
  }
  function hall(c, cx, base, s) {
    var h = s * 0.5, y = base - s * 0.8, bw = s * 0.62;
    c.fillStyle = "#0a0d16"; c.fillRect(cx - bw, y + h * 0.42, bw * 2, h * 0.95);
    c.strokeStyle = "rgba(0,0,0,0.6)"; c.lineWidth = 1.2; var k;
    for (k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(cx + bw * k / 2.2, y + h * 0.42); c.lineTo(cx + bw * k / 2.2, y + h * 1.37); c.stroke(); }
    c.fillStyle = "rgba(150,44,30,0.55)"; c.fillRect(cx - bw * 0.3, y + h * 0.7, bw * 0.6, h * 0.45);
    roof(c, cx, y, s, h);
  }
  function pagoda(c, cx, base, s, tiers) {
    var i, y = base, w, h;
    c.fillStyle = "#090c14"; c.fillRect(cx - s * 1.05, base, s * 2.1, s * 0.25);
    for (i = 0; i < tiers; i++) {
      w = s * (1 - i * 0.15); h = s * 0.42 * (1 - i * 0.04); y = base - (i + 1) * h * 1.18;
      c.fillStyle = "#0a0d16"; c.fillRect(cx - w * 0.62, y + h * 0.42, w * 1.24, h * 0.9);
      c.fillStyle = "rgba(160,48,32,0.5)"; c.fillRect(cx - w * 0.14, y + h * 0.7, w * 0.28, h * 0.5);
      roof(c, cx, y, w, h);
    }
    c.fillStyle = "#0b0f18"; c.fillRect(cx - s * 0.02, y - h * 1.5, s * 0.04, h * 0.95);
  }

  function paintBg() {
    bg = mk(W * rs, H * rs); var c = bg.getContext("2d"); c.setTransform(rs, 0, 0, rs, 0, 0);
    lan = [];
    var narrow = W < 700, i, u = Math.min(W * 0.1, H * 0.16);
    paintSky(c); paintMoon(c);
    seed = 3;
    ridge(c, H * 0.6, H * 0.06, 0.003, 4, "#2b3445", "#161c28");
    fogBand(c, H * 0.62, 0.16, 11);
    ridge(c, H * 0.7, H * 0.06, 0.004, 9, "#1c2331", "#0e131c");
    var layers = [
      { col: ["#38455d", "#52627f"], y: 0.17, n: narrow ? 3 : 6, w: 0.045, depth: 0, fog: 0.62 },
      { col: ["#222c40", "#354562"], y: 0.3, n: narrow ? 3 : 6, w: 0.05, depth: 1, fog: 0.75 },
      { col: ["#121927", "#1f2b3f"], y: 0.44, n: narrow ? 2 : 5, w: 0.055, depth: 2, fog: 0.9 }
    ];
    layers.forEach(function (L, li) {
      seed = 100 + li * 17;
      for (i = 0; i < L.n; i++) {
        var cx = (i + 0.3 + rnd() * 0.5) / L.n * W, top = (L.y + rnd() * 0.18) * H, w = W * (L.w + rnd() * 0.02) * (narrow ? 1.7 : 1);
        pillar(c, cx, w, top, H * 0.96, L.col, cx < moon.x, rnd() * 9 + li * 3, L.depth);
      }
      fogBand(c, H * L.fog, 0.2 - li * 0.03, 21 + li * 5);
    });
    var mx = W * (narrow ? 0.74 : 0.8), base = H * 0.9;
    c.fillStyle = "#06080f"; c.beginPath(); c.moveTo(mx - u * 4.6, H); c.lineTo(mx - u * 3.4, base - u * 0.4); c.lineTo(mx - u * 1.8, base - u * 1.2);
    c.lineTo(mx + u * 1.8, base - u * 1.2); c.lineTo(mx + u * 4.4, base - u * 0.5); c.lineTo(mx + u * 5.8, H); c.closePath(); c.fill();
    hall(c, mx - u * 2.6, base - u * 0.2, u * 1.0); hall(c, mx + u * 3.2, base - u * 0.2, u * 1.0); hall(c, mx - u * 1.1, base - u * 0.85, u * 0.9);
    pagoda(c, mx + u * 0.9, base - u * 1.2, u * 1.0, 3);
    fogBand(c, base - u * 0.2, 0.16, 41);
    c.fillStyle = "#04060b"; c.fillRect(0, base + u * 0.3, W, H);
    seed = 61; var x;
    for (x = W * 0.46; x < W; x += u * 1.4) hall(c, x + (rnd() - 0.5) * 20, base + u * 0.36, u * (0.5 + rnd() * 0.12));
    var gy = H * 0.955, g = c.createLinearGradient(0, gy, 0, H); g.addColorStop(0, "#05070d"); g.addColorStop(1, "#020306"); c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
    seed = 8; for (i = 0; i < 40; i++) { c.fillStyle = "rgba(150,165,195," + (0.03 + rnd() * 0.06) + ")"; c.fillRect(rnd() * W, gy + rnd() * (H - gy), 20 + rnd() * 90, 1); }
    var vg = c.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,6,0.62)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    var lg = c.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, "rgba(2,3,8,0.5)"); lg.addColorStop(0.55, "rgba(2,3,8,0.14)"); lg.addColorStop(1, "rgba(2,3,8,0)"); c.fillStyle = lg; c.fillRect(0, 0, W, H);
  }

  /* bamboo, painted separately so it can sway a hair as one piece */
  function paintBamboo() {
    fgc = mk(W * rs, H * rs); var c = fgc.getContext("2d"); c.setTransform(rs, 0, 0, rs, 0, 0);
    seed = 31; var narrow = W < 700, n = narrow ? 3 : 7, i, y, k;
    for (i = 0; i < n; i++) {
      var bx = (i / n) * (narrow ? 0.34 : 0.26) * W + rnd() * 10 + 6, w = 9 + rnd() * 12, lean = (rnd() - 0.5) * 18, node = 80 + rnd() * 60, d = rnd();
      var g = c.createLinearGradient(bx - w / 2, 0, bx + w / 2, 0);
      g.addColorStop(0, "#07130e"); g.addColorStop(0.55, d > 0.5 ? "#1d4030" : "#17352a"); g.addColorStop(0.85, "#3f7658"); g.addColorStop(1, "#102319");
      c.fillStyle = g; c.beginPath(); c.moveTo(bx - w / 2, H + 10); c.quadraticCurveTo(bx - w / 2 + lean * 0.4, H * 0.5, bx - w / 2 + lean, -10);
      c.lineTo(bx + w / 2 + lean, -10); c.quadraticCurveTo(bx + w / 2 + lean * 0.4, H * 0.5, bx + w / 2, H + 10); c.closePath(); c.fill();
      for (y = H * 0.92 - rnd() * node; y > -10; y -= node) {
        var kk = 1 - y / H, nx = bx + lean * kk * 0.85;
        c.fillStyle = "rgba(4,12,9,0.85)"; c.fillRect(nx - w * 0.62, y, w * 1.24, 3.5);
        c.fillStyle = "rgba(110,170,130,0.22)"; c.fillRect(nx - w * 0.62, y - 1.5, w * 1.24, 1.5);
        if (rnd() > 0.35 && y > H * 0.1) {
          for (k = 0; k < 5; k++) {
            var dir = rnd() > 0.5 ? 1 : -1, ang = -0.9 + rnd() * 1.1, len = 38 + rnd() * 34, ex = nx + dir * Math.cos(ang) * len, ey = y + Math.sin(ang) * len * 0.8 + 10;
            c.fillStyle = rnd() > 0.5 ? "#112b20" : "#1b3f2e"; c.beginPath(); c.moveTo(nx, y);
            c.quadraticCurveTo((nx + ex) / 2, (y + ey) / 2 - 10, ex, ey); c.quadraticCurveTo((nx + ex) / 2, (y + ey) / 2 + 2, nx, y + 2); c.fill();
          }
        }
      }
    }
  }

  function build() {
    seed = 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2); rs = Math.min(dpr, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    moon.x = W * (W < 700 ? 0.62 : 0.6); moon.y = H * 0.44; moon.r = Math.min(W * 0.34, H * 0.4);
    paintBg(); paintBamboo();
    if (!cloudSp.length) { cloudSp = [cloudTex(560, 220, 3), cloudTex(520, 200, 11), cloudTex(600, 240, 19)]; fogSp = fogTex(520, 130, 5); grain = grainTex(); }
    seed = 9; clouds = [];
    var j; for (j = 0; j < (W < 700 ? 4 : 7); j++) clouds.push({ sp: j % 3, x: rnd(), y: 0.04 + rnd() * 0.5, s: 0.5 + rnd() * 0.5, v: 0.002 + rnd() * 0.004, a: 0.3 + rnd() * 0.3 });
    fogs = []; for (j = 0; j < 4; j++) fogs.push({ x: rnd(), y: 0.55 + j * 0.1, v: 0.003 + rnd() * 0.004, a: 0.14 + rnd() * 0.08 });
    parts = []; var pn = Math.round(Math.min(46, Math.max(18, W / 34)));
    for (j = 0; j < pn; j++) parts.push(seedPart(true));
    if (reduce) draw(2.5);
  }
  function seedPart(anywhere) {
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: 0.8 + Math.random() * 1.8, v: 4 + Math.random() * 10, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.55 };
  }

  function draw(t) {
    var i, g;
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    var mxp = moon.x, myp = moon.y, mrp = moon.r;
    var art = mode === "day" ? artDay : artNight;
    if (art) {
      /* the supplied painting, cropped to cover, with a calm dim so the text on top stays readable */
      var sc = Math.max(W / art.width, H / art.height) * 1.05, dw = art.width * sc, dh = art.height * sc;
      var ox = -(dw - W) * 0.5 - px * 14, oy = -(dh - H) * 0.3 - py * 8;
      ctx.drawImage(art, ox, oy, dw, dh);
      mxp = ox + dw * 0.5; myp = oy + dh * 0.25; mrp = dw * 0.39;
      ctx.fillStyle = mode === "day" ? "rgba(238,243,241,0.5)" : "rgba(3,5,12,0.5)"; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.drawImage(bg, -14 - px * 12, -10 - py * 6, W + 28, H + 20);
    }
    g = ctx.createRadialGradient(mxp, myp, mrp * 0.9, mxp, myp, mrp * 2.6);
    ctx.globalCompositeOperation = mode === "day" ? "source-over" : "lighter";
    var br = 0.07 + Math.sin(t * 0.5) * 0.02;
    g.addColorStop(0, "rgba(236,212,160," + br + ")"); g.addColorStop(1, "rgba(236,212,160,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    for (i = 0; i < clouds.length; i++) {
      var c = clouds[i], sp = cloudSp[c.sp], cw = W * 0.7 * c.s, ch = cw * sp.height / sp.width, x = ((c.x + t * c.v) % 1.5 - 0.3) * W;
      ctx.globalAlpha = mode === "day" ? 0 : art ? c.a * 0.35 : c.a; ctx.drawImage(sp, x, c.y * H, cw, ch);
    }
    for (i = 0; i < fogs.length; i++) {
      var f = fogs[i], fx = ((f.x + t * f.v) % 1.4 - 0.3) * W;
      ctx.globalAlpha = f.a * (0.8 + Math.sin(t * 0.2 + i) * 0.2); ctx.drawImage(fogSp, fx, f.y * H, W * 0.8, H * 0.14);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    for (i = 0; i < (art ? 0 : lan.length); i++) {
      var L = lan[i], fl = 0.7 + 0.3 * Math.sin(t * (1.1 + (i % 5) * 0.37) + i * 1.7) + 0.08 * Math.sin(t * 7 + i), rr = 15 + (i % 3) * 4;
      g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, rr * 2.4);
      g.addColorStop(0, "rgba(255,150,90," + (0.7 * fl).toFixed(3) + ")"); g.addColorStop(0.25, "rgba(232,62,38," + (0.34 * fl).toFixed(3) + ")"); g.addColorStop(1, "rgba(200,40,20,0)");
      ctx.fillStyle = g; ctx.fillRect(L.x - rr * 2.4, L.y - rr * 2.4, rr * 4.8, rr * 4.8);
      g = ctx.createLinearGradient(0, H * 0.955, 0, H);
      g.addColorStop(0, "rgba(220,60,36," + (0.18 * fl).toFixed(3) + ")"); g.addColorStop(1, "rgba(220,60,36,0)");
      ctx.fillStyle = g; ctx.fillRect(L.x - 3, H * 0.955, 6, H * 0.045);
    }
    ctx.globalCompositeOperation = "source-over";
    if (!art) { ctx.save(); ctx.translate(-px * 16, H); ctx.rotate(Math.sin(t * 0.3) * 0.0035); ctx.translate(0, -H); ctx.drawImage(fgc, 0, 0, W, H); ctx.restore(); }
    if (art && mode === "day") { g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(238,243,241,0.55)"); g.addColorStop(0.6, "rgba(238,243,241,0.12)"); g.addColorStop(1, "rgba(238,243,241,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    else if (art) { g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, "rgba(2,3,8,0.5)"); g.addColorStop(0.6, "rgba(2,3,8,0.12)"); g.addColorStop(1, "rgba(2,3,8,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      g = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.35, W * 0.5, H * 0.5, Math.max(W, H) * 0.8); g.addColorStop(0, "rgba(0,0,6,0)"); g.addColorStop(1, "rgba(0,0,6,0.55)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    for (i = 0; i < parts.length; i++) {
      var q = parts[i], al = q.a * Math.min(1, q.y / (H * 0.3));
      ctx.fillStyle = mode === "day" ? "rgba(255,255,255," + (al * 0.8).toFixed(3) + ")" : "rgba(255,110,60," + al.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(q.x + Math.sin(t * 0.6 + q.ph) * 14, q.y, q.r, 0, 6.2832); ctx.fill();
    }
    if (!reduce && mode !== "day") {
      ctx.strokeStyle = "rgba(190,200,222,0.12)"; ctx.lineWidth = 1; ctx.beginPath();
      for (i = 0; i < 80; i++) { var rx = ((i * 97.3 + t * 90) % (W + 80)) - 40, ry = ((i * 53.7 + t * 420) % (H + 60)) - 30; ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + 16); }
      ctx.stroke();
    }
    var gx = Math.floor(Math.random() * 256), gy = Math.floor(Math.random() * 256), pat = ctx.createPattern(grain, "repeat");
    ctx.save(); ctx.globalAlpha = 0.055; ctx.globalCompositeOperation = "overlay"; ctx.translate(-gx, -gy); ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
  }

  var artNight = null, artDay = null, mode = "night";
  function loadArt(src, set) { var im = new Image(); im.onload = function () { set(im); if (reduce) draw(2.5); }; im.src = src; }
  loadArt("assets/img/bg-moon.jpg", function (im) { artNight = im; });
  loadArt("assets/img/bg-karst.jpg", function (im) { artDay = im; });

  var last = 0;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < 33) return;
    var dt = Math.min(0.1, (now - last) / 1000 || 0.033); last = now;
    var t = (now - t0) / 1000;
    px += (tpx - px) * 0.04; py += (tpy - py) * 0.04;
    for (var i = 0; i < parts.length; i++) { var p = parts[i]; p.y -= p.v * dt; if (p.y < -10) parts[i] = seedPart(false); }
    draw(t);
  }

  var rt = 0;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 150); });
  window.addEventListener("pointermove", function (e) { tpx = e.clientX / W - 0.5; tpy = e.clientY / H - 0.5; }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  window.LTLWater = { setPalette: function (name) { mode = name === "night" ? "night" : "day"; if (reduce) draw(2.5); } };

  build();
  if (reduce) { draw(2.5); } else { requestAnimationFrame(frame); }
})();
