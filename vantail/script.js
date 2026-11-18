/*
 * Vantail – script.js
 * Plain JavaScript, no dependencies, no build step.
 * 1. Theme switch  2. Mobile menu
 * The page works without this file: the theme follows the visitor's
 * system setting and the navigation stays visible on small screens.
 */

/* 1. Theme switch
   Follows the system light/dark setting until the visitor clicks,
   then remembers their choice in localStorage. */
const root = document.documentElement;
const themeButton = document.getElementById('theme');

try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
} catch (e) { /* storage blocked: keep following the system setting */ }

themeButton.addEventListener('click', () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : !matchMedia('(prefers-color-scheme: light)').matches;
  root.dataset.theme = isDark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

/* 2. Mobile menu
   Opens and closes the main navigation on narrow screens. */
const menuButton = document.getElementById('menu-toggle');
const nav = document.getElementById('main-nav');

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
});

// Close the menu after a link is chosen or Escape is pressed.
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    menuButton.focus();
  }
});
