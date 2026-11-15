/* Red seals (chop marks) used instead of icons: one character cut into a rough vermilion square.
   <span class="seal" data-seal="gate"></span> fills itself. LTLSeal.fill(el, id) redraws it (the menu does this). */
(function () {
  "use strict";
  var SEALS = {
    gate: "門", path: "道", sword: "劍", post: "信", night: "夜",
    s1: "一", s2: "二", s3: "三", s4: "四", s5: "五", s6: "六"
  };
  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<filter id="seal-rough" x="-5%" y="-5%" width="110%" height="110%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="3" result="g"/>' +
    '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 5.3" result="holes"/>' +
    '<feComposite in="d" in2="holes" operator="in"/></filter></defs></svg>';
  function fill(el, id) {
    var ch = SEALS[id];
    if (!ch) return;
    el.setAttribute("data-seal", id);
    el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g filter="url(#seal-rough)">' +
      '<rect x="4" y="4" width="92" height="92" fill="#b3242a"/>' +
      '<rect x="11" y="11" width="78" height="78" fill="none" stroke="#f1e3c8" stroke-opacity="0.5" stroke-width="2.2"/>' +
      '<text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="58" font-weight="900" fill="#f6ead2" ' +
      'font-family="\'Noto Serif SC\',\'Songti SC\',\'SimSun\',\'Noto Serif CJK SC\',serif">' + ch + "</text></g></svg>";
  }
  function init() {
    if (!document.getElementById("seal-rough")) document.body.insertAdjacentHTML("afterbegin", DEFS);
    Array.prototype.forEach.call(document.querySelectorAll(".seal[data-seal]"), function (el) { fill(el, el.getAttribute("data-seal")); });
  }
  window.LTLSeal = { fill: fill, glyphs: SEALS };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
