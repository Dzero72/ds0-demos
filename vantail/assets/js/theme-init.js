/*!
 * Vantail – theme-init.js
 * Load this small file in the <head>, before the stylesheet and without defer.
 *  1. Swaps the "no-js" class on <html> for "js".
 *  2. Applies the saved theme before the page is painted (no flash of the
 *     wrong theme).
 *  3. Preloads the two fonts so text renders in Geist as early as possible.
 *     Preloading is skipped when the page is opened straight from the file
 *     system (file://), where browsers block font preloads and would log
 *     errors. Fonts still load normally from the stylesheet there.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  root.className = root.className.replace(/\bno-js\b/, "js");

  // 2. Saved theme
  try {
    var saved = window.localStorage.getItem("vantail-theme");
    if (saved === "light" || saved === "dark") {
      root.setAttribute("data-theme", saved);
    }
  } catch (error) {
    // Storage can be blocked (private mode, strict settings).
    // The page then follows the system theme.
  }

  // 3. Font preloads (paths are relative to the HTML page)
  if (/^https?:$/.test(window.location.protocol)) {
    var fonts = ["assets/fonts/Geist-Latin.woff", "assets/fonts/GeistMono-Latin.woff"];
    for (var i = 0; i < fonts.length; i += 1) {
      var link = document.createElement("link");
      link.rel = "preload";
      link.href = fonts[i];
      link.as = "font";
      link.type = "font/woff";
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
  }
}());
