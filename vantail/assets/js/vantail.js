/*!
 * Vantail – SaaS & Developer Tool HTML Template
 * vantail.js · Version 1.0.0
 *
 * Plain JavaScript, no dependencies. Each component below starts only when
 * its markup is on the page, so this one file is shared by every page.
 * Every component is an enhancement: the pages work with JavaScript off.
 *
 * CONTENTS
 *  1. Helpers
 *  2. Theme switch
 *  3. Mobile menu
 *  4. Dropdown menus
 *  5. Tabs
 *  6. Accordion (one open at a time)
 *  7. Copy-code buttons
 *  8. Pricing toggle
 *  9. Post filter
 * 10. Form validation
 * 11. Password helpers (show/hide, requirements)
 * 12. Docs sidebar toggle
 * 13. Table of contents highlight
 * 14. Start-up
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Helpers
     ------------------------------------------------------------------------ */

  var root = document.documentElement;
  var uid = 0;

  /** Returns all elements matching a selector as an array. */
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /** Gives an element an id if it does not have one, and returns it. */
  function ensureId(el, prefix) {
    if (!el.id) {
      uid += 1;
      el.id = (prefix || "vt") + "-" + uid;
    }
    return el.id;
  }

  /** Small SVG icons used by injected buttons. */
  var icons = {
    copy: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5v5.5M12 16.5v.01" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  };

  /** One shared polite live region for short status messages. */
  var liveRegion = null;
  function announce(message) {
    if (!liveRegion) {
      liveRegion = document.createElement("p");
      liveRegion.className = "u-visually-hidden";
      liveRegion.setAttribute("role", "status");
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = "";
    window.setTimeout(function () {
      liveRegion.textContent = message;
    }, 50);
  }

  /** Matches the breakpoint used by the CSS for the mobile menu (60rem). */
  var mobileQuery = window.matchMedia("(max-width: 60rem)");


  /* ------------------------------------------------------------------------
     2. Theme switch
     Follows the system theme until the visitor clicks the switch, then saves
     the choice in localStorage under "vantail-theme".
     ------------------------------------------------------------------------ */

  function initTheme() {
    var buttons = $$(".theme-toggle");
    if (!buttons.length) {
      return;
    }

    var systemLight = window.matchMedia("(prefers-color-scheme: light)");

    function current() {
      var set = root.getAttribute("data-theme");
      if (set === "light" || set === "dark") {
        return set;
      }
      return systemLight.matches ? "light" : "dark";
    }

    function updateUi() {
      var theme = current();
      var label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
      buttons.forEach(function (button) {
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
      });
      $$('meta[name="theme-color"]').forEach(function (meta) {
        meta.setAttribute("content", theme === "dark" ? "#09090B" : "#FAFAFA");
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var next = current() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try {
          window.localStorage.setItem("vantail-theme", next);
        } catch (error) {
          // Storage blocked: the choice lasts for this page view only.
        }
        updateUi();
      });
    });

    // Keep the label right if the system theme changes while the page is open.
    if (systemLight.addEventListener) {
      systemLight.addEventListener("change", updateUi);
    }

    updateUi();
  }


  /* ------------------------------------------------------------------------
     3. Mobile menu
     ------------------------------------------------------------------------ */

  function initMobileMenu() {
    var toggle = document.querySelector(".nav-toggle");
    if (!toggle) {
      return;
    }
    var nav = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!nav) {
      return;
    }

    function setOpen(open, returnFocus) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      root.classList.toggle("has-menu-open", open);

      if (open) {
        var first = nav.querySelector("a, summary");
        if (first) {
          first.focus();
        }
      } else if (returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Escape closes the menu and returns focus to the button.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false, true);
      }
    });

    // Choosing a link closes the menu (useful for links to the same page).
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setOpen(false);
      }
    });

    // Close the menu when the keyboard focus leaves the header.
    var header = toggle.closest(".site-header");
    if (header) {
      header.addEventListener("focusout", function (event) {
        if (nav.classList.contains("is-open") && event.relatedTarget && !header.contains(event.relatedTarget)) {
          setOpen(false);
        }
      });
    }

    // Reset when the window grows past the mobile breakpoint.
    var onChange = function (query) {
      if (!query.matches) {
        setOpen(false);
      }
    };
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", onChange);
    }
  }


  /* ------------------------------------------------------------------------
     4. Dropdown menus
     The menus are native <details> elements. The script closes other menus
     when one opens, and closes them on Escape or a click outside.
     ------------------------------------------------------------------------ */

  function initDropdowns() {
    var menus = $$(".nav-menu");
    if (!menus.length) {
      return;
    }

    menus.forEach(function (menu) {
      menu.addEventListener("toggle", function () {
        if (menu.open) {
          menus.forEach(function (other) {
            if (other !== menu) {
              other.open = false;
            }
          });
        }
      });
    });

    document.addEventListener("click", function (event) {
      menus.forEach(function (menu) {
        if (menu.open && !menu.contains(event.target) && !mobileQuery.matches) {
          menu.open = false;
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }
      menus.forEach(function (menu) {
        if (menu.open) {
          menu.open = false;
          menu.querySelector("summary").focus();
        }
      });
    });
  }


  /* ------------------------------------------------------------------------
     5. Tabs
     Markup: <div class="tabs" data-tabs> containing .tabs__panel elements,
     each with data-tab-label="Label". The script builds an ARIA tab list,
     supports arrow keys, Home and End, and hides inactive panels.
     ------------------------------------------------------------------------ */

  function initTabs() {
    $$("[data-tabs]").forEach(function (tabs) {
      var panels = $$(".tabs__panel", tabs).filter(function (panel) {
        return panel.parentElement === tabs;
      });
      if (panels.length < 2) {
        return;
      }

      var list = document.createElement("div");
      list.className = "tabs__list";
      list.setAttribute("role", "tablist");
      if (tabs.getAttribute("data-tabs-label")) {
        list.setAttribute("aria-label", tabs.getAttribute("data-tabs-label"));
      }

      var buttons = panels.map(function (panel, index) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "tabs__tab";
        button.setAttribute("role", "tab");
        button.textContent = panel.getAttribute("data-tab-label") || "Tab " + (index + 1);
        button.id = ensureId(panel, "panel") + "-tab";
        button.setAttribute("aria-controls", panel.id);

        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", button.id);
        panel.setAttribute("tabindex", "0");

        button.addEventListener("click", function () {
          select(index, false);
        });

        list.appendChild(button);
        return button;
      });

      function select(index, moveFocus) {
        buttons.forEach(function (button, i) {
          var active = i === index;
          button.setAttribute("aria-selected", String(active));
          button.tabIndex = active ? 0 : -1;
          panels[i].hidden = !active;
        });
        if (moveFocus) {
          buttons[index].focus();
        }
      }

      list.addEventListener("keydown", function (event) {
        var index = buttons.indexOf(document.activeElement);
        if (index < 0) {
          return;
        }
        var next = null;
        if (event.key === "ArrowRight") {
          next = (index + 1) % buttons.length;
        } else if (event.key === "ArrowLeft") {
          next = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === "Home") {
          next = 0;
        } else if (event.key === "End") {
          next = buttons.length - 1;
        }
        if (next !== null) {
          event.preventDefault();
          select(next, true);
        }
      });

      tabs.insertBefore(list, panels[0]);
      select(0, false);
    });
  }


  /* ------------------------------------------------------------------------
     6. Accordion
     Each item is a native <details>, which opens and closes without
     JavaScript. With data-accordion="single" only one item stays open.
     ------------------------------------------------------------------------ */

  function initAccordions() {
    $$('[data-accordion="single"]').forEach(function (accordion) {
      var items = $$("details", accordion);
      items.forEach(function (item) {
        item.addEventListener("toggle", function () {
          if (item.open) {
            items.forEach(function (other) {
              if (other !== item) {
                other.open = false;
              }
            });
          }
        });
      });
    });
  }


  /* ------------------------------------------------------------------------
     7. Copy-code buttons
     Adds a "Copy" button to every [data-copy] element. The text copied is
     the content of the <code> element inside it.
     ------------------------------------------------------------------------ */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers and pages opened from the file system.
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.className = "u-visually-hidden";
      document.body.appendChild(area);
      area.select();
      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(area);
        if (ok) {
          resolve();
        } else {
          reject(new Error("Copy command failed"));
        }
      } catch (error) {
        document.body.removeChild(area);
        reject(error);
      }
    });
  }

  function initCopyButtons() {
    $$("[data-copy]").forEach(function (block) {
      var code = block.querySelector("code");
      if (!code) {
        return;
      }
      var label = block.getAttribute("data-copy") || "code";
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.setAttribute("aria-label", "Copy " + label);
      button.innerHTML = icons.copy + "<span>Copy</span>";

      var timer = null;
      button.addEventListener("click", function () {
        copyText(code.textContent.trim()).then(function () {
          button.classList.add("is-copied");
          button.innerHTML = icons.check + "<span>Copied</span>";
          announce("Copied to clipboard");
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            button.classList.remove("is-copied");
            button.innerHTML = icons.copy + "<span>Copy</span>";
          }, 2000);
        }).catch(function () {
          announce("Copy failed. Select the text and copy it manually.");
        });
      });

      var slot = block.querySelector(".code-block__header") || block;
      slot.appendChild(button);
    });
  }


  /* ------------------------------------------------------------------------
     8. Pricing toggle
     Markup: [data-pricing] holds buttons with data-billing="monthly|yearly"
     and prices with data-monthly / data-yearly values.
     ------------------------------------------------------------------------ */

  function initPricing() {
    $$("[data-pricing]").forEach(function (pricing) {
      var options = $$("[data-billing]", pricing);
      if (!options.length) {
        return;
      }

      function show(billing) {
        options.forEach(function (option) {
          option.setAttribute("aria-pressed", String(option.getAttribute("data-billing") === billing));
        });
        $$("[data-monthly]", pricing).forEach(function (el) {
          el.textContent = el.getAttribute("data-" + billing);
        });
        $$("[data-note-monthly]", pricing).forEach(function (el) {
          el.textContent = el.getAttribute("data-note-" + billing);
        });
      }

      options.forEach(function (option) {
        option.addEventListener("click", function () {
          var billing = option.getAttribute("data-billing");
          show(billing);
          announce(billing === "yearly" ? "Showing yearly prices" : "Showing monthly prices");
        });
      });

      show("monthly");
    });
  }


  /* ------------------------------------------------------------------------
     9. Post filter
     Markup: buttons with data-filter="value" (use "all" for everything) and
     items with data-category="value".
     ------------------------------------------------------------------------ */

  function initFilters() {
    $$("[data-filter-group]").forEach(function (group) {
      var target = document.getElementById(group.getAttribute("data-filter-group"));
      if (!target) {
        return;
      }
      var buttons = $$("[data-filter]", group);
      var items = $$("[data-category]", target);
      var status = document.getElementById(group.getAttribute("data-filter-status"));

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var value = button.getAttribute("data-filter");
          var shown = 0;
          buttons.forEach(function (other) {
            other.setAttribute("aria-pressed", String(other === button));
          });
          items.forEach(function (item) {
            var match = value === "all" || item.getAttribute("data-category") === value;
            item.hidden = !match;
            if (match) {
              shown += 1;
            }
          });
          if (status) {
            status.textContent = "Showing " + shown + (shown === 1 ? " post" : " posts") +
              (value === "all" ? "" : " in " + button.textContent.trim());
          }
        });
      });
    });
  }


  /* ------------------------------------------------------------------------
     10. Form validation
     Add data-validate to a <form>. Fields use normal HTML attributes
     (required, type="email", minlength, pattern). Optional attributes:
       data-error-required, data-error-type, data-error-short, data-error-pattern
       data-match="otherFieldId"   (the value must match another field)
     With data-demo on the form, a valid form shows the [data-form-success]
     message instead of sending. Remove data-demo to send the form for real.
     ------------------------------------------------------------------------ */

  function fieldLabel(input) {
    var label = input.labels && input.labels[0];
    if (!label) {
      return "This field";
    }
    var clone = label.cloneNode(true);
    $$(".field__optional, a", clone).forEach(function (el) {
      el.parentNode.removeChild(el);
    });
    return clone.textContent.trim();
  }

  function errorFor(input) {
    var v = input.validity;
    var name = fieldLabel(input);
    if (v.valueMissing) {
      if (input.type === "checkbox") {
        return input.getAttribute("data-error-required") || "Please tick this box to continue.";
      }
      return input.getAttribute("data-error-required") || "Enter your " + name.toLowerCase() + ".";
    }
    if (v.typeMismatch) {
      return input.getAttribute("data-error-type") || "Enter a valid " + name.toLowerCase() + ", like name@example.com.";
    }
    if (v.tooShort) {
      return input.getAttribute("data-error-short") || name + " must be at least " + input.minLength + " characters.";
    }
    if (v.patternMismatch) {
      return input.getAttribute("data-error-pattern") || "Check the format of " + name.toLowerCase() + ".";
    }
    var matchId = input.getAttribute("data-match");
    if (matchId) {
      var other = document.getElementById(matchId);
      if (other && other.value !== input.value) {
        return input.getAttribute("data-error-match") || "The two values do not match.";
      }
    }
    return "";
  }

  function setError(input, message) {
    var field = input.closest(".field") || input.parentElement;
    var errorId = ensureId(input, "field") + "-error";
    var error = document.getElementById(errorId);
    var describedBy = (input.getAttribute("aria-describedby") || "").split(" ").filter(function (id) {
      return id && id !== errorId;
    });

    if (message) {
      if (!error) {
        error = document.createElement("p");
        error.className = "field__error";
        error.id = errorId;
        field.appendChild(error);
      }
      error.innerHTML = icons.alert + "<span></span>";
      error.lastChild.textContent = message;
      describedBy.push(errorId);
      input.setAttribute("aria-invalid", "true");
      field.classList.add("field--invalid");
    } else {
      if (error) {
        error.parentNode.removeChild(error);
      }
      input.removeAttribute("aria-invalid");
      field.classList.remove("field--invalid");
    }

    if (describedBy.length) {
      input.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
      input.removeAttribute("aria-describedby");
    }
  }

  function initForms() {
    $$("form[data-validate]").forEach(function (form) {
      form.setAttribute("novalidate", "");
      var inputs = $$("input, select, textarea", form).filter(function (input) {
        return input.type !== "hidden" && input.type !== "submit" && input.type !== "button";
      });
      var summary = form.querySelector("[data-form-summary]");
      var success = form.parentElement.querySelector("[data-form-success]");
      var submitted = false;

      function validate(input) {
        var message = errorFor(input);
        setError(input, message);
        return message;
      }

      inputs.forEach(function (input) {
        // After the first submit, re-check fields as the visitor fixes them.
        var evt = input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "input";
        input.addEventListener(evt, function () {
          if (submitted || input.getAttribute("aria-invalid") === "true") {
            validate(input);
          }
        });
        input.addEventListener("blur", function () {
          if (input.value && input.type !== "checkbox") {
            validate(input);
          }
        });
      });

      form.addEventListener("submit", function (event) {
        submitted = true;
        var errors = [];
        inputs.forEach(function (input) {
          var message = validate(input);
          if (message) {
            errors.push({ input: input, message: message });
          }
        });

        if (errors.length) {
          event.preventDefault();
          if (summary) {
            var list = summary.querySelector("ul");
            list.innerHTML = "";
            errors.forEach(function (item) {
              var li = document.createElement("li");
              var link = document.createElement("a");
              link.href = "#" + item.input.id;
              link.textContent = item.message;
              link.addEventListener("click", function (e) {
                e.preventDefault();
                item.input.focus();
              });
              li.appendChild(link);
              list.appendChild(li);
            });
            summary.querySelector("[data-form-summary-title]").textContent =
              errors.length === 1 ? "There is 1 problem with this form" : "There are " + errors.length + " problems with this form";
            summary.hidden = false;
            summary.focus();
          } else {
            errors[0].input.focus();
          }
          return;
        }

        if (summary) {
          summary.hidden = true;
        }

        // Demo mode: show the success message instead of sending the form.
        if (form.hasAttribute("data-demo")) {
          event.preventDefault();
          if (success) {
            form.hidden = true;
            success.hidden = false;
            success.focus();
          } else {
            announce("Thanks, the form was sent.");
          }
          form.reset();
          submitted = false;
        }
      });
    });
  }


  /* ------------------------------------------------------------------------
     11. Password helpers
     data-reveal on a password input adds a Show/Hide button.
     data-requirements-for="inputId" on a list ticks off rules as you type:
     list items use data-rule="length:8", "number" or "letter".
     ------------------------------------------------------------------------ */

  function initPasswords() {
    $$("input[data-reveal]").forEach(function (input) {
      var wrap = input.parentElement;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "field__reveal";
      button.textContent = "Show";
      button.setAttribute("aria-label", "Show password");
      button.setAttribute("aria-controls", ensureId(input, "password"));
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        var reveal = input.type === "password";
        input.type = reveal ? "text" : "password";
        button.textContent = reveal ? "Hide" : "Show";
        button.setAttribute("aria-pressed", String(reveal));
      });
      wrap.appendChild(button);
    });

    $$("[data-requirements-for]").forEach(function (list) {
      var input = document.getElementById(list.getAttribute("data-requirements-for"));
      if (!input) {
        return;
      }
      var rules = $$("[data-rule]", list);

      function check() {
        var value = input.value;
        rules.forEach(function (rule) {
          var parts = rule.getAttribute("data-rule").split(":");
          var met = false;
          if (parts[0] === "length") {
            met = value.length >= Number(parts[1] || 8);
          } else if (parts[0] === "number") {
            met = /\d/.test(value);
          } else if (parts[0] === "letter") {
            met = /[a-z]/i.test(value);
          }
          rule.classList.toggle("is-met", met);
          var state = rule.querySelector(".u-visually-hidden");
          if (state) {
            state.textContent = met ? " (done)" : " (not done yet)";
          }
        });
      }

      input.addEventListener("input", check);
      check();
    });
  }


  /* ------------------------------------------------------------------------
     12. Docs sidebar toggle (small screens)
     ------------------------------------------------------------------------ */

  function initDocsSidebar() {
    $$(".docs-sidebar__toggle").forEach(function (button) {
      var nav = document.getElementById(button.getAttribute("aria-controls"));
      if (!nav) {
        return;
      }
      button.addEventListener("click", function () {
        var open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        nav.classList.toggle("is-open", open);
      });
    });
  }


  /* ------------------------------------------------------------------------
     13. Table of contents highlight
     Highlights the link for the section currently in view.
     ------------------------------------------------------------------------ */

  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) {
      return;
    }
    $$("[data-scrollspy]").forEach(function (toc) {
      var links = $$('a[href^="#"]', toc);
      var targets = links.map(function (link) {
        return document.getElementById(decodeURIComponent(link.getAttribute("href").slice(1)));
      }).filter(Boolean);
      if (!targets.length) {
        return;
      }

      function activate(id) {
        links.forEach(function (link) {
          var on = link.getAttribute("href") === "#" + id;
          link.classList.toggle("is-active", on);
          if (on) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activate(entry.target.id);
          }
        });
      }, { rootMargin: "-20% 0px -70% 0px" });

      targets.forEach(function (target) {
        observer.observe(target);
      });
    });
  }


  /* ------------------------------------------------------------------------
     14. Start-up
     ------------------------------------------------------------------------ */

  function init() {
    initTheme();
    initMobileMenu();
    initDropdowns();
    initTabs();
    initAccordions();
    initCopyButtons();
    initPricing();
    initFilters();
    initForms();
    initPasswords();
    initDocsSidebar();
    initScrollSpy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}());
