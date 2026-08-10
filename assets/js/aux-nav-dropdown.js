// Close the "MyoAssist Repositories" aux-nav dropdown on an outside click or Escape.
// The dropdown is a native details/summary element, which does not close on an
// outside click by itself. The outside-click and Escape listeners are bound only
// while the dropdown is open (driven by its toggle event) so the opening click can
// never immediately re-close it.
(function () {
  function wire(details) {
    function onDocClick(event) {
      if (!details.contains(event.target)) {
        details.open = false;
      }
    }
    function onKeydown(event) {
      if (event.key === "Escape" || event.key === "Esc") {
        details.open = false;
      }
    }
    details.addEventListener("toggle", function () {
      if (details.open) {
        document.addEventListener("click", onDocClick);
        document.addEventListener("keydown", onKeydown);
      } else {
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onKeydown);
      }
    });
  }

  function init() {
    var list = document.querySelectorAll("details.aux-nav-dropdown-details");
    for (var i = 0; i < list.length; i++) {
      wire(list[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
