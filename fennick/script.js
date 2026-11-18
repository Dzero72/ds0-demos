/*
 * Fennick – script.js
 * Plain JavaScript, no dependencies, no build step.
 * 1. Mobile menu  2. Waitlist form
 * The page works without this file: the navigation stays visible on
 * small screens and the browser's built-in email check runs on the form.
 */

/* 1. Mobile menu
   Opens and closes the main navigation on narrow screens. */
const menuButton = document.getElementById('menu-toggle');
const nav = document.getElementById('main-nav');

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

// Close the menu after a link is chosen, on Escape, or on a click outside it.
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', (e) => {
  if (nav.classList.contains('is-open') && !e.target.closest('.bar')) setMenu(false);
});

/* 2. Waitlist form
   Checks the email address in the browser, then shows a success message. */
const form = document.getElementById('join');
const email = document.getElementById('email');
const error = document.getElementById('email-error');
const success = document.getElementById('join-success');

// Our own messages replace the browser's pop-up bubbles.
form.noValidate = true;

// Something@something.something, with no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function showError(message) {
  error.textContent = message;
  error.hidden = false;
  email.setAttribute('aria-invalid', 'true');
  email.focus();
}

function clearError() {
  error.textContent = '';
  error.hidden = true;
  email.removeAttribute('aria-invalid');
}

// Clear the error as soon as the visitor fixes the address.
email.addEventListener('input', () => {
  if (email.getAttribute('aria-invalid') === 'true' && EMAIL_PATTERN.test(email.value.trim())) {
    clearError();
  }
});

form.addEventListener('submit', (e) => {
  const value = email.value.trim();

  // Stop the form and explain the problem if the address isn't valid.
  if (!value) {
    e.preventDefault();
    return showError('Please enter your work email.');
  }
  if (!EMAIL_PATTERN.test(value)) {
    e.preventDefault();
    return showError('That email doesn’t look right. Try something like name@company.com.');
  }

  clearError();

  /*
   * CONNECT YOUR BACKEND HERE
   * Right now the address is not sent anywhere: the two lines below stop
   * the form and show the thank-you message. To collect sign-ups, choose one:
   *
   * A) Form service (Formspree, Mailchimp, Kit, Netlify Forms…):
   *    set the form's action in index.html to your service's URL, then
   *    delete the two lines below. The form will submit to your service.
   *
   * B) Stay on the page: keep e.preventDefault() and replace
   *    showSuccess(value) with a request to your endpoint, for example:
   *
   *    fetch('https://your-form-endpoint.example/subscribe', {
   *      method: 'POST',
   *      headers: { 'Content-Type': 'application/json' },
   *      body: JSON.stringify({ email: value })
   *    }).then((res) => {
   *      if (res.ok) showSuccess(value);
   *      else showError('Something went wrong. Please try again.');
   *    }).catch(() => showError('Something went wrong. Please try again.'));
   *
   * Full steps: documentation/index.html, section 6.
   */
  e.preventDefault();
  showSuccess(value);
});

function showSuccess(address) {
  form.hidden = true;
  success.textContent = '';
  const strong = document.createElement('b');
  strong.textContent = 'You’re on the list.';
  success.append(strong, ` We’ll send your invite to ${address} as soon as a spot opens up.`);
  success.focus();
}
