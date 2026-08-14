// Dark-mode toggle.
//
// Swaps the main just-the-docs stylesheet between the branded light build
// (just-the-docs-default.css) and the dark build (just-the-docs-myoassist_dark.css),
// persists the choice in localStorage, and honors the OS preference on first
// visit. Loaded as a synchronous <script src> in <head> (see head_custom.html),
// so it runs before first paint and the theme is set with no flash.
//
// This lives in an external file on purpose: the site compresses every page to a
// single line, which mangles inline scripts (line comments and HTML-like tokens
// such as "<head>" leak into the page). External JS is served verbatim.
(function () {
  var LIGHT = "default", DARK = "myoassist_dark", KEY = "ma-theme";

  // Swap themes without a flash of unstyled content: insert the new stylesheet
  // and only remove the old one once the new one has loaded, so a styled sheet
  // stays applied the whole time (mutating href in place drops styles mid-load).
  function apply(theme) {
    var link = document.querySelector('link[rel="stylesheet"]');
    if (!link) { return; }
    var href = link.getAttribute("href");
    var target = href.replace(/just-the-docs-[A-Za-z0-9_]+\.css/, "just-the-docs-" + theme + ".css");
    if (target === href) { return; }
    var next = link.cloneNode(false);
    next.setAttribute("href", target);
    next.addEventListener("load", function () {
      if (link.parentNode) { link.parentNode.removeChild(link); }
    });
    link.parentNode.insertBefore(next, link.nextSibling);
  }

  function preferred() {
    try {
      var s = localStorage.getItem(KEY);
      if (s === LIGHT || s === DARK) { return s; }
    } catch (e) {}
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? DARK : LIGHT;
  }

  var current = preferred();
  apply(current);

  function syncIcons() {
    var dark = current === DARK;
    var d = document.querySelectorAll(".theme-icon-dark");
    var l = document.querySelectorAll(".theme-icon-light");
    for (var i = 0; i < d.length; i++) { d[i].style.display = dark ? "none" : ""; }
    for (var j = 0; j < l.length; j++) { l[j].style.display = dark ? "" : "none"; }
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncIcons();
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        current = current === DARK ? LIGHT : DARK;
        apply(current);
        try { localStorage.setItem(KEY, current); } catch (e) {}
        syncIcons();
      });
    }
  });
})();
