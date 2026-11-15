/* Shared chrome for every page: music player bar, sun and moon switch, live calendar, scene palette and the menu.
   Each page only needs <main data-page="home|about|projects|contact"> and the script tags at the end of <body>
   (scene.js, seal.js, main.js, player.js). */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mainEl = document.querySelector("[data-page]");
  var page = mainEl ? mainEl.getAttribute("data-page") : "home";

  /* One red seal per page. The same seal shows in the page header and in the menu. */
  var PAGES = [
    { id: "home", href: "index.html", seal: "gate", name: "Home", arc: "The Mountain Gate", sub: "Start here", label: "Page", val: "1/4", desc: "Who I am, in one screen." },
    { id: "about", href: "about.html", seal: "path", name: "About", arc: "The Path", sub: "Who I am", label: "Page", val: "2/4", desc: "My background, skills, studies and where I want to go." },
    { id: "projects", href: "projects.html", seal: "sword", name: "Projects", arc: "The Arsenal", sub: "Selected work", label: "Page", val: "3/4", desc: "Pathfinder, Humber ASV, Bunnyhop, Bytecrawl, Lắng and more." },
    { id: "contact", href: "contact.html", seal: "post", name: "Contact", arc: "The Messenger", sub: "Find me online", label: "Page", val: "4/4", desc: "GitHub, LinkedIn and the Humber ASV site." },
  ];

  /* ---------- Dawn and time of day ----------
     Day follows the clock (morning to night). Dawn is the sunrise palette. The choice is saved under the old key "ltl-hour". */
  var dark = false;
  var saved = null;
  try { saved = localStorage.getItem("ltl-hour"); } catch (e) {}

  function todOf(h) {
    if (h >= 5 && h < 9) return { key: "morning", label: "Early Morning" };
    if (h >= 9 && h < 15) return { key: "day", label: "Daytime" };
    if (h >= 15 && h < 17) return { key: "afternoon", label: "Afternoon" };
    if (h >= 17 && h < 21) return { key: "evening", label: "Evening" };
    return { key: "night", label: "Late Night" };
  }
  /* Two looks: Night Vigil is the moonlit jade night, Day is ember dusk. Without a saved choice the clock decides. */
  dark = true; /* one look only: the storm night */
  function applyPalette() {
    var t = todOf(new Date().getHours());
    document.documentElement.setAttribute("data-hour", dark ? "night" : "day");
    if (window.LTLWater) window.LTLWater.setPalette(dark ? "night" : t.key === "night" ? "evening" : t.key);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#07090f");
    if (modeBtn) {
      modeBtn.setAttribute("aria-checked", dark ? "true" : "false");
      modeBtn.title = dark ? "Switch to ember dusk" : "Switch to night vigil colours";
    }
  }
  function toggleDark() {
    dark = !dark;
    try { localStorage.setItem("ltl-hour", dark ? "dark" : "day"); } catch (e) {}
    applyPalette();
  }

  /* A bagua dial: rosewood octagon, twelve jade hour beads (the current hour glows), eight trigrams, a slow yin-yang. */
  function octPts(r, rot) { var o = [], k; for (k = 0; k < 8; k++) { var a = (rot + k * 45) * Math.PI / 180; o.push((Math.cos(a) * r).toFixed(2) + "," + (Math.sin(a) * r).toFixed(2)); } return o.join(" "); }
  function baguaSvg() {
    var s = '<svg class="bagua" id="bagua" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
      '<polygon points="' + octPts(48, 22.5) + '" fill="#2a0f0c" stroke="#d6b36a" stroke-width="2"/>' +
      '<polygon points="' + octPts(44.5, 22.5) + '" fill="none" stroke="#c8c3b2" stroke-width="0.8" stroke-dasharray="3 2.4" opacity="0.8"/>' +
      '<polygon points="' + octPts(26, 22.5) + '" fill="#4a2616" stroke="#d6b36a" stroke-width="1.4"/>';
    var k, j, a;
    for (k = 0; k < 12; k++) {
      a = (k * 30 - 90) * Math.PI / 180;
      s += '<line x1="' + (Math.cos(a) * 28).toFixed(1) + '" y1="' + (Math.sin(a) * 28).toFixed(1) + '" x2="' + (Math.cos(a) * 36).toFixed(1) + '" y2="' + (Math.sin(a) * 36).toFixed(1) + '" stroke="#a99a78" stroke-width="0.8"/>';
      s += '<circle class="bead" data-i="' + k + '" cx="' + (Math.cos(a) * 36.5).toFixed(1) + '" cy="' + (Math.sin(a) * 36.5).toFixed(1) + '" r="4.6"/>';
    }
    var TRI = ["111", "011", "101", "001", "110", "010", "100", "000"];
    for (k = 0; k < 8; k++) {
      s += '<g transform="rotate(' + (k * 45) + ') translate(0 -19.5)">';
      for (j = 0; j < 3; j++) {
        var y = -2.6 + j * 2.6;
        if (TRI[k][j] === "1") s += '<rect x="-4" y="' + y + '" width="8" height="1.2" fill="#f0e2bd"/>';
        else s += '<rect x="-4" y="' + y + '" width="3.4" height="1.2" fill="#f0e2bd"/><rect x="0.6" y="' + y + '" width="3.4" height="1.2" fill="#f0e2bd"/>';
      }
      s += '</g>';
    }
    s += '<g class="yy"><circle r="11" fill="#efe6d3"/><path d="M0 -11 A11 11 0 0 1 0 11 A5.5 5.5 0 0 1 0 0 A5.5 5.5 0 0 0 0 -11Z" fill="#150c0a"/>' +
      '<circle cx="0" cy="-5.5" r="1.7" fill="#150c0a"/><circle cx="0" cy="5.5" r="1.7" fill="#efe6d3"/><circle r="11" fill="none" stroke="#d6b36a" stroke-width="1"/></g></svg>';
    return s;
  }

  /* ---------- Markup ---------- */
  var html =
    '<noscript><nav class="noscript-nav" aria-label="Pages"><a href="index.html">Home</a><a href="about.html">About</a><a href="projects.html">Projects</a><a href="contact.html">Contact</a></nav></noscript>' +
    '<header class="site-head">' +
    '<div class="topbar">' +
    '<a class="brand" href="index.html" aria-label="Le Tran Lam Vinh, home"><span class="seal mini" data-seal="gate" aria-hidden="true"></span><span class="brand-t">Le Tran Lam Vinh<small>Web · Security · Silicon</small></span></a>' +
    '<nav class="topnav" aria-label="Pages">' + PAGES.filter(function (q) { return q.href; }).map(function (q) { return '<a href="' + q.href + '"' + (q.id === page ? ' aria-current="page"' : '') + '><span>' + q.name + '</span></a>'; }).join('') + '</nav>' +
    '<div class="head-r">' +
    '<div class="cal" id="cal" aria-label="Today">' + baguaSvg() + '<div class="cal-text">' +
    '<div class="cal-row"><span class="cal-date" id="cal-date"></span><span class="cal-day" id="cal-day"></span>' +
    '<svg class="moon" id="moon" viewBox="-12 -12 24 24" role="img" aria-label="Moon phase"></svg></div>' +
    '<div class="cal-row2"><span class="cal-wk" id="cal-wk"></span><span class="cal-tod" id="cal-tod"></span><span class="cal-time" id="cal-time"></span></div></div></div>' +
    '<button class="nav-burger" id="nav-burger" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><i></i><i></i><i></i></button>' +
    '</div>' +
    '</div>' +
    '<div class="pod" id="pod" role="group" aria-label="Music player">' +
    '<button class="disc" id="p-play" type="button" aria-label="Play"><span class="platter"></span><span class="hub"><svg id="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l14 8-14 8z"/></svg><svg id="i-pause" viewBox="0 0 24 24" aria-hidden="true" hidden><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg></span></button>' +
    '<div class="deck">' +
    '<div class="lcd" aria-live="polite"><div class="artist" id="p-artist"></div><div class="tw"><span class="title" id="p-title"></span></div><i class="meter" id="p-meter"></i></div>' +
    '<button class="pbtn" id="p-prev" type="button" aria-label="Previous track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5v14l-10-7z"/><rect x="5" y="5" width="3" height="14"/></svg></button>' +
    '<button class="pbtn" id="p-next" type="button" aria-label="Next track"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v14l10-7z"/><rect x="16" y="5" width="3" height="14"/></svg></button>' +
    '<button class="pbtn" id="p-add" type="button" aria-label="Add your own music" title="Add your own music"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg></button>' +
    '<button class="list-btn" id="p-list" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="menu" title="Open the list (Esc)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v2.5H4zM4 10.75h16v2.5H4zM4 15.5h16V18H4z"/></svg>LIST</button>' +
    '<input id="p-file" type="file" accept="audio/*" multiple hidden>' +
    '</div>' +
    '</div>' +
    '</header>' +
    '<div class="menu" id="menu" role="dialog" aria-modal="true" aria-labelledby="menu-title" hidden>' +
    '<p class="m-ghost" aria-hidden="true">道</p>' +
    '<div class="m-inner"><div><h2 class="m-title" id="menu-title">Menu</h2><ul class="m-list" id="m-list"></ul></div>' +
    '<aside class="m-detail" aria-live="polite"><div class="seal huge" id="m-card" aria-hidden="true"></div><p class="m-arc" id="m-arc"></p><p class="m-desc" id="m-desc"></p></aside></div>' +
    '<div class="m-hint"><button class="m-key" id="m-ok" type="button"><kbd>Enter</kbd>Confirm</button><button class="m-key" id="m-back" type="button"><kbd>Esc</kbd>Close</button></div>' +
    '</div>';
  /* Duotone for the portrait: maps the photo's brightness onto the theme's two colours, so the photo sits in the
     water palette (blue by day, plum and peach at dawn). Hover shows the real colours (see .p-nat in the CSS). */
  function duo(id, r, g, b) {
    return '<filter id="' + id + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.33 0.55 0.12 0 0 0.33 0.55 0.12 0 0 0.33 0.55 0.12 0 0 0 0 0 1 0"/>' +
      '<feComponentTransfer><feFuncR type="table" tableValues="' + r + '"/><feFuncG type="table" tableValues="' + g + '"/><feFuncB type="table" tableValues="' + b + '"/></feComponentTransfer></filter>';
  }
  html = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    duo("duo-day", "0.03 0.42 0.94", "0.03 0.34 0.82", "0.05 0.28 0.62") +
    duo("duo-dawn", "0.03 0.42 0.94", "0.03 0.34 0.82", "0.05 0.28 0.62") +
    duo("duo-night", "0.03 0.42 0.94", "0.03 0.34 0.82", "0.05 0.28 0.62") +
    "</defs></svg>" + html;
  document.body.insertAdjacentHTML("afterbegin", html);

  /* Logo tiles show the site's logo when it loads and keep the initials when it does not. */
  Array.prototype.forEach.call(document.querySelectorAll(".logo img"), function (img) {
    var tile = img.parentNode;
    function ok() { tile.classList.add("has-img"); }
    function bad() { img.remove(); }
    if (img.complete) { img.naturalWidth > 0 ? ok() : bad(); }
    else { img.addEventListener("load", ok); img.addEventListener("error", bad); }
  });

  var modeBtn = null;

  /* ---------- Calendar ---------- */
  var elDate = document.getElementById("cal-date");
  var elDay = document.getElementById("cal-day");
  var elTod = document.getElementById("cal-tod");
  var elTime = document.getElementById("cal-time");
  var elWk = document.getElementById("cal-wk");
  var elMoon = document.getElementById("moon");
  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function moonSvg(d) {
    var SYN = 29.530588853;
    var ref = Date.UTC(2000, 0, 6, 18, 14);
    var p = (((d.getTime() - ref) / 86400000) % SYN + SYN) % SYN / SYN;
    var waning = p > 0.5;
    var q = waning ? 1 - p : p;
    var c = Math.cos(2 * Math.PI * q);
    var rx = (10 * Math.abs(c)).toFixed(2);
    var sweep = c > 0 ? 0 : 1;
    var lit = "M0 -10 A10 10 0 0 1 0 10 A" + rx + " 10 0 0 " + sweep + " 0 -10Z";
    var flip = waning ? ' transform="scale(-1 1)"' : "";
    elMoon.innerHTML =
      '<circle r="10" fill="#140d0b" stroke="#d9b56a" stroke-width="1.4"/>' +
      '<path d="' + lit + '" fill="#d9b56a"' + flip + "/>";
    elMoon.setAttribute("aria-label", "Moon phase " + Math.round(p * 100) + " percent through the cycle");
  }
  var lastTod = "";
  function tick() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    elDate.textContent = (d.getMonth() + 1) + "/" + d.getDate();
    elDay.textContent = DAYS[d.getDay()];
    elWk.textContent = d.getDay() === 0 || d.getDay() === 6 ? "WEEKEND" : "WEEKDAY";
    elTime.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    Array.prototype.forEach.call(document.querySelectorAll("#bagua .bead"), function (b) { b.classList.toggle("on", +b.getAttribute("data-i") === d.getHours() % 12); });
    var t = todOf(d.getHours());
    elTod.textContent = "";
    if (t.key !== lastTod) { lastTod = t.key; applyPalette(); moonSvg(d); }
  }
  applyPalette();
  tick();
  setInterval(tick, 15000);

  /* ---------- Page changes ---------- */
  function go(href) {
    if (reduce) { location.href = href; return; }
    document.body.classList.add("leaving");
    setTimeout(function () { location.href = href; }, 200);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    var h = a.getAttribute("href");
    if (!/^[\w-]+\.html(#.*)?$/.test(h)) return;
    e.preventDefault();
    go(h);
  });

  /* ---------- Menu ---------- */
  var menu = document.getElementById("menu");
  var listEl = document.getElementById("m-list");
  var cardEl = document.getElementById("m-card");
  var arcEl = document.getElementById("m-arc");
  var descEl = document.getElementById("m-desc");
  var openBtn = document.getElementById("p-list");
  var rows = [];
  var sel = 0;
  var isOpen = false;
  var inertEls = Array.prototype.slice.call(document.querySelectorAll("main, footer"));
  inertEls.push(document.querySelector(".site-head"));

  function hourVal() { return dark ? "On" : "Off"; }
  function build() {
    listEl.innerHTML = "";
    rows = PAGES.map(function (it, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "m-row" + (it.id === page ? " here" : "");
      b.style.setProperty("--i", i);
      b.innerHTML = '<span class="m-num"></span><span class="m-name"></span><span class="m-rank"><small></small><b></b></span><span class="m-sub"></span>';
      b.querySelector(".m-num").textContent = (window.LTLSeal && window.LTLSeal.glyphs[it.seal]) || "";
      b.querySelector(".m-name").textContent = it.name;
      b.querySelector("small").textContent = it.label;
      b.querySelector("b").textContent = it.act === "hour" ? hourVal() : it.val;
      b.querySelector(".m-sub").textContent = it.sub;
      b.addEventListener("pointermove", function (e) { if (e.pointerType === "touch" || i === sel) return; select(i, false); });
      b.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch" && i !== sel) select(i, false); });
      b.addEventListener("click", function () { select(i, false); activate(i); });
      li.appendChild(b);
      listEl.appendChild(li);
      return b;
    });
  }
  function playCard(cls) {
    if (reduce) return;
    cardEl.classList.remove("deal", "swap");
    void cardEl.offsetWidth;
    cardEl.classList.add(cls);
  }
  function select(i, focus, first) {
    var changed = i !== sel;
    sel = i;
    rows.forEach(function (r, k) {
      var on = k === i;
      if (r.classList.contains("sel") !== on) r.classList.toggle("sel", on);
      r.setAttribute("aria-current", PAGES[k].id === page ? "page" : "false");
    });
    var it = PAGES[i];
    if (window.LTLSeal) window.LTLSeal.fill(cardEl, it.seal);
    if (first) playCard("deal");
    else if (changed) playCard("swap");
    arcEl.textContent = it.arc;
    descEl.textContent = it.desc;
    if (focus) rows[i].focus({ preventScroll: true });
  }
  var closeTimer = 0;
  function finishClose() {
    clearTimeout(closeTimer);
    menu.classList.remove("closing");
    menu.hidden = true;
  }
  function openMenu(viaKey) {
    if (isOpen) return;
    clearTimeout(closeTimer);
    menu.classList.remove("closing");
    build();
    isOpen = true;
    var start = 0;
    PAGES.forEach(function (p, i) { if (p.id === page) start = i; });
    sel = -1;
    menu.classList.toggle("kb", viaKey === true);
    menu.hidden = false;
    document.documentElement.classList.add("menu-open");
    inertEls.forEach(function (el) { if (el) el.inert = true; });
    menu.inert = false;
    openBtn.setAttribute("aria-expanded", "true"); var bg=document.getElementById("nav-burger"); if(bg) bg.setAttribute("aria-expanded","true");
    select(start, true, true);
  }
  /* Closing plays a short exit instead of vanishing, hands the page back at once, and can be interrupted by reopening. */
  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    document.documentElement.classList.remove("menu-open");
    inertEls.forEach(function (el) { if (el) el.inert = false; });
    openBtn.setAttribute("aria-expanded", "false"); var bg2=document.getElementById("nav-burger"); if(bg2) bg2.setAttribute("aria-expanded","false");
    if (reduce) { menu.hidden = true; return; }
    menu.classList.add("closing");
    closeTimer = setTimeout(finishClose, 180);
  }
  function activate(i) {
    var it = PAGES[i];
    if (it.act === "hour") {
      toggleDark();
      rows[i].querySelector("b").textContent = hourVal();
      return;
    }
    if (it.id === page) { closeMenu(); openBtn.focus(); return; }
    go(it.href);
  }

  /* The player lives in .site-head, which the menu makes inert. Keep it usable by closing first. */
  openBtn.addEventListener("click", function () { openMenu(false); });
  var burger = document.getElementById("nav-burger");
  if (burger) burger.addEventListener("click", function () { openMenu(false); });
  document.getElementById("m-ok").addEventListener("click", function () { activate(sel); });
  document.getElementById("m-back").addEventListener("click", function () { closeMenu(); openBtn.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    var typing = /INPUT|TEXTAREA|SELECT/.test(tag);
    if (!isOpen) {
      if (typing) return;
      /* Esc opens the menu; M still works too. */
      if (e.key === "Escape" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        if (!e.repeat) openMenu(true);
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); if (!e.repeat) { closeMenu(); openBtn.focus(); } }
    else if (e.key === "ArrowDown") { e.preventDefault(); select((sel + 1) % PAGES.length, true); }
    else if (e.key === "ArrowUp") { e.preventDefault(); select((sel - 1 + PAGES.length) % PAGES.length, true); }
    else if (e.key === "Home") { e.preventDefault(); select(0, true); }
    else if (e.key === "End") { e.preventDefault(); select(PAGES.length - 1, true); }
  });

  /* ---------- Persona-style hover menus ([data-pm]): hover, focus or tap an item to show its detail ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-pm]"), function (wrap) {
    var items = Array.prototype.slice.call(wrap.querySelectorAll(".pm > li"));
    var pane = wrap.querySelector(".pm-pane");
    var cur = -1;
    function pick(i) {
      if (i === cur) return;
      cur = i;
      items.forEach(function (li, k) { li.classList.toggle("on", k === i); });
      pane.innerHTML = items[i].querySelector(".pm-d").innerHTML + '<p class="pm-cmd">Command</p>';
      pane.classList.remove("pop");
      void pane.offsetWidth;
      if (!reduce) pane.classList.add("pop");
    }
    wrap.classList.add("pm-js");
    items.forEach(function (li, i) {
      var b = li.querySelector(".pm-btn");
      b.addEventListener("mouseenter", function () { pick(i); });
      b.addEventListener("focus", function () { pick(i); });
      b.addEventListener("click", function () { pick(i); if (window.innerWidth <= 900) pane.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          var n = (i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
          items[n].querySelector(".pm-btn").focus();
        }
      });
    });
    pick(0);
  });

  /* ---------- Header ----------
     Hides after a deliberate scroll down. Comes back at once when the pointer reaches the top edge or the header,
     on scroll up, swipe right, or keyboard focus. Never hides while the pointer or focus is inside it. */
  (function () {
    var root = document.documentElement;
    var head = document.querySelector(".site-head");
    var zone = document.createElement("div");
    zone.className = "head-zone";
    zone.setAttribute("aria-hidden", "true");
    document.body.appendChild(zone);
    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "head-tab";
    tab.setAttribute("aria-label", "Show the player and menu");
    tab.innerHTML = '<svg viewBox="0 0 10 14" aria-hidden="true"><path d="M2 1l7 6-7 6z"/></svg>';
    document.body.appendChild(tab);
    var lastY = window.scrollY, down = 0, ticking = false, tx = 0, ty = 0, inside = false;
    function setHide(h) {
      if (h && (inside || menuIsOpen())) return;
      if (root.classList.contains("head-hide") !== h) root.classList.toggle("head-hide", h);
    }
    function menuIsOpen() { return root.classList.contains("menu-open"); }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.scrollY, dy = y - lastY;
        lastY = y;
        if (y < 80) { down = 0; setHide(false); return; }
        if (dy < -4) { down = 0; setHide(false); }
        else if (dy > 0) { down += dy; if (down > 28) setHide(true); }
      });
    }, { passive: true });
    /* hover in: the top strip and the header itself */
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      if (e.clientY <= 56) { down = 0; setHide(false); }
    }, { passive: true });
    tab.addEventListener("click", function () { down = 0; setHide(false); var b = document.getElementById("p-list"); if (b) b.focus({ preventScroll: true }); });
    tab.addEventListener("pointerenter", function (e) { if (e.pointerType !== "touch") { down = 0; setHide(false); } });
    zone.addEventListener("pointerenter", function () { down = 0; setHide(false); });
    document.addEventListener("mouseleave", function () { inside = false; });
    if (head) {
      head.addEventListener("pointerenter", function () { inside = true; setHide(false); });
      head.addEventListener("pointerleave", function () { inside = false; });
      head.addEventListener("focusin", function () { setHide(false); });
    }
    window.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    window.addEventListener("touchend", function (e) {
      var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      if (dx > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { down = 0; setHide(false); }
    }, { passive: true });
  })();
})();
