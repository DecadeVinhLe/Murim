/* Music player in the header (markup is injected by main.js).
   Main track: assets/audio/color-your-night.mp3. The "+" button loads any other audio file for the visit.
   Position and play state carry over to the next page through sessionStorage. */
(function () {
  "use strict";
  var pod = document.getElementById("pod");
  if (!pod) return;
  var elArtist = document.getElementById("p-artist");
  var elTitle = document.getElementById("p-title");
  var elMeter = document.getElementById("p-meter");
  var bPrev = document.getElementById("p-prev");
  var bPlay = document.getElementById("p-play");
  var bNext = document.getElementById("p-next");
  var bAdd = document.getElementById("p-add");
  var fileIn = document.getElementById("p-file");
  var iPlay = document.getElementById("i-play");
  var iPause = document.getElementById("i-pause");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var KEY = "ltl-player";

  var MAIN = { url: "assets/audio/[Vietsub + Pinyin] Hiến Thiên Duyên (献天缘) - Nghê Hạo Nghị.mp3", artist: "何中华", title: "献天缘", main: true };

  var audio = new Audio();
  audio.preload = "metadata";
  var tracks = [MAIN];
  var idx = 0;
  var playing = false;
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}

  function ui() {
    pod.classList.toggle("playing", playing);
    iPlay.hidden = playing;
    iPause.hidden = !playing;
    bPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
  }
  function fitTitle() {
    elTitle.classList.remove("scroll");
    elTitle.style.removeProperty("--shift");
    requestAnimationFrame(function () {
      var over = elTitle.scrollWidth - elTitle.parentNode.clientWidth;
      if (over > 2 && !reduce) {
        elTitle.style.setProperty("--shift", (-over - 4) + "px");
        elTitle.style.setProperty("--dur", Math.max(4, over / 22 + 2) + "s");
        elTitle.classList.add("scroll");
      }
    });
  }
  function show(artist, title) {
    elArtist.textContent = artist;
    elTitle.textContent = title;
    elMeter.style.width = "0";
    fitTitle();
  }

  function loadIdx(i, autoplay) {
    idx = i;
    audio.pause();
    audio.loop = tracks.length === 1;
    audio.src = tracks[idx].url;
    show(tracks[idx].artist, tracks[idx].title);
    if (autoplay) play(); else { playing = false; ui(); }
  }
  function fail() {
    playing = false;
    ui();
    show("error", tracks[idx].main ? "Add assets/audio/[Vietsub + Pinyin] Hiến Thiên Duyên (献天缘) - Nghê Hạo Nghị.mp3" : "This file can't be played here");
  }
  function play() {
    var p = audio.play();
    playing = true;
    ui();
    if (p && p.catch) p.catch(function () { if (!audio.error) { playing = false; ui(); } });
  }
  function pause() { audio.pause(); playing = false; ui(); }
  function next() {
    if (tracks.length > 1) loadIdx((idx + 1) % tracks.length, playing);
    else audio.currentTime = 0;
  }
  function prev() {
    if (audio.currentTime > 3 || tracks.length === 1) { audio.currentTime = 0; return; }
    loadIdx((idx - 1 + tracks.length) % tracks.length, playing);
  }

  bPlay.addEventListener("click", function () { if (playing) pause(); else play(); });
  bNext.addEventListener("click", next);
  bPrev.addEventListener("click", prev);
  bAdd.addEventListener("click", function () { fileIn.click(); });
  audio.addEventListener("ended", function () { loadIdx((idx + 1) % tracks.length, true); });
  audio.addEventListener("error", fail);
  audio.addEventListener("loadedmetadata", function () {
    if (saved && tracks[idx].main) {
      if (saved.t > 0 && saved.t < audio.duration) { try { audio.currentTime = saved.t; } catch (e) {} }
      var again = saved.playing;
      saved = null;
      if (again) play();
    }
  });
  fileIn.addEventListener("change", function () {
    var list = Array.prototype.slice.call(fileIn.files || []);
    if (!list.length) return;
    var first = tracks.length;
    list.forEach(function (f) {
      var base = f.name.replace(/\.[^.]+$/, "");
      var parts = base.split(" - ");
      tracks.push({
        url: URL.createObjectURL(f),
        artist: parts.length > 1 ? parts[0].trim() : "My music",
        title: parts.length > 1 ? parts.slice(1).join(" - ").trim() : base
      });
    });
    fileIn.value = "";
    loadIdx(first, true);
  });

  function persist() {
    try {
      if (tracks[idx] && tracks[idx].main) sessionStorage.setItem(KEY, JSON.stringify({ t: audio.currentTime || 0, playing: playing }));
    } catch (e) {}
  }
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", function () { if (document.hidden) persist(); });

  setInterval(function () {
    elMeter.style.width = audio.duration > 0 ? ((audio.currentTime / audio.duration) * 100).toFixed(1) + "%" : "0";
    if (playing) persist();
  }, 500);

  audio.loop = true;
  audio.src = MAIN.url;
  show(MAIN.artist, MAIN.title);
  ui();
})();
