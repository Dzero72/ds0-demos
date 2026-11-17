// Theme toggle: follows the system setting until clicked, then remembers the choice.
const root = document.documentElement, btn = document.getElementById('theme');
try { const saved = localStorage.getItem('theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
btn.addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});
