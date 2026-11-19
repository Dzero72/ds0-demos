// Forno Fiamma checkout · Version 1.0 · DesignStudioZero
// Plain JavaScript, no dependencies.
// Nothing is charged or sent anywhere: connect your payment provider in placeOrder() below.

const CONFIG = {
  orderId: 'FF-8842',
  currency: 'GBP',
  locale: 'en-GB',
  deliveryFee: 2.5,
  packaging: 1,
  tipRate: 0.125,          // 12.5% of the subtotal
  eta: { delivery: 'About 35–45 min', pickup: 'Ready in about 20–25 min' }
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const icon = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const setIcon = (svg, name) => $('use', svg).setAttribute('href', '#i-' + name);
const money = n => new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency }).format(n);

$$('[data-order]').forEach(el => (el.textContent = CONFIG.orderId));

/* ---------- Totals ---------- */
const state = { fulfilment: 'delivery', timing: 'asap', total: 0 };

function items() {
  return $$('.items li').map(li => {
    const qty = Number(li.dataset.qty), price = Number(li.dataset.price);
    return { li, qty, price, name: $('b', li).textContent, line: qty * price };
  });
}

function renderTotals() {
  const list = items();
  const subtotal = list.reduce((s, i) => s + i.line, 0);
  const delivery = state.fulfilment === 'delivery' ? CONFIG.deliveryFee : 0;
  const tip = Math.round(subtotal * CONFIG.tipRate * 100) / 100;
  const total = subtotal + delivery + tip + CONFIG.packaging;
  state.total = total;

  list.forEach(i => ($('[data-line]', i.li).textContent = money(i.line)));
  $('[data-subtotal]').textContent = money(subtotal);
  $('[data-delivery]').textContent = money(delivery);
  $('[data-tip]').textContent = money(tip);
  $('[data-packaging]').textContent = money(CONFIG.packaging);
  $('[data-total]').textContent = money(total);
  $('[data-total-inline]').textContent = money(total);
  const count = list.reduce((s, i) => s + i.qty, 0);
  $('[data-count]').textContent = count + (count === 1 ? ' item' : ' items');
  $('[data-pay-label]').textContent = `Pay ${money(total)} & place order`;
}

/* ---------- Fulfilment and timing ---------- */
$$('input[name=fulfilment]').forEach(r => r.addEventListener('change', () => {
  state.fulfilment = r.value;
  $$('[data-show]').forEach(el => (el.hidden = el.dataset.show !== r.value));
  $('[data-eta]').textContent = CONFIG.eta[r.value];
  renderTotals();
}));

$$('input[name=timing]').forEach(r => r.addEventListener('change', () => {
  state.timing = r.value;
  $('.slot-picker').hidden = r.value !== 'later';
}));

/* ---------- Summary accordion (phones) ---------- */
const toggle = $('.summary-toggle');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', open);
  $('#summary-body').hidden = !open;
});

/* ---------- Progress rail follows the scroll ---------- */
if ('IntersectionObserver' in window) {
  const steps = { delivery: $('[data-step=delivery]'), payment: $('[data-step=payment]') };
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.target.id !== 'payment') return;
      const onPayment = e.isIntersecting || e.boundingClientRect.top < 0;
      steps.delivery.className = onPayment ? 'done' : 'current';
      steps.payment.className = onPayment ? 'current' : '';
      steps.delivery.toggleAttribute('aria-current', !onPayment);
      steps.payment.toggleAttribute('aria-current', onPayment);
      $('.dot', steps.delivery).innerHTML = onPayment ? icon('check') : '2';
    });
  }, { rootMargin: '0px 0px -40% 0px' }).observe($('#payment'));
}

/* ---------- Card fields ---------- */
const f = { number: $('#cc-number'), exp: $('#cc-exp'), csc: $('#cc-csc'), name: $('#cc-name') };
const digits = v => v.replace(/\D/g, '');

function brandOf(n) {
  if (/^4/.test(n)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'MC';
  if (/^3[47]/.test(n)) return 'AMEX';
  return '';
}

f.number.addEventListener('input', () => {
  const d = digits(f.number.value).slice(0, 19);
  f.number.value = d.replace(/(.{4})(?=.)/g, '$1 ');
  $('[data-brand]').textContent = brandOf(d);
  clearError(f.number);
});
f.exp.addEventListener('input', e => {
  let d = digits(f.exp.value).slice(0, 4);
  if (d.length === 1 && d > '1') d = '0' + d;
  f.exp.value = d.length > 2 || (d.length === 2 && e.inputType !== 'deleteContentBackward') ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
  clearError(f.exp);
});
f.csc.addEventListener('input', () => { f.csc.value = digits(f.csc.value).slice(0, 4); clearError(f.csc); });
f.name.addEventListener('input', () => clearError(f.name));

function luhn(n) {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let x = Number(n[n.length - 1 - i]);
    if (i % 2) { x *= 2; if (x > 9) x -= 9; }
    sum += x;
  }
  return sum % 10 === 0;
}

function setError(input, msg) {
  input.setAttribute('aria-invalid', 'true');
  $('#' + input.id + '-err').textContent = msg;
}
function clearError(input) {
  input.removeAttribute('aria-invalid');
  $('#' + input.id + '-err').textContent = '';
}

function validateCard() {
  let first = null;
  const fail = (input, msg) => { setError(input, msg); first = first || input; };
  const n = digits(f.number.value);
  if (n.length < 13 || !luhn(n)) fail(f.number, 'Check your card number.');
  const [mm, yy] = digits(f.exp.value).match(/.{1,2}/g) || [];
  const now = new Date(), year = now.getFullYear() % 100, month = now.getMonth() + 1;
  if (!mm || !yy || mm < 1 || mm > 12 || yy < year || (Number(yy) === year && mm < month)) fail(f.exp, 'Enter a valid expiry date.');
  if (f.csc.value.length < 3) fail(f.csc, 'Enter the 3 or 4 digit code.');
  if (f.name.value.trim().length < 2) fail(f.name, 'Enter the name on the card.');
  if (first) first.focus();
  return !first;
}

/* ---------- Order sheet ---------- */
const sheetWrap = $('#sheet'), sheet = $('.sheet'), payBtn = $('#pay-btn'), track = $('[data-track]');
let timers = [], lastFocus = null, method = '';

const STAGES = [
  { icon: 'contactless', tag: 'Secure handshake', title: 'Confirming payment…', text: 'Talking to your bank. This only takes a moment.' },
  { icon: 'flame', tag: 'Wood-fired oven · 485°C', title: 'Claiming slot 3…', text: 'Reserving hot stone for a 90-second bake.', flame: true },
  { icon: 'receipt', tag: 'Kitchen pass', title: 'Sending your ticket…', text: 'Our pizzaiolo is shaping your dough.' },
  { icon: 'check-circle', title: 'Ordine confermato!', ok: true }
];
const LABELS = [['Authorising', 'Approved'], ['Claiming', 'Secured'], ['Printing', 'Printed'], ['', 'Confirmed']];

function setHero(s) {
  const icon = $('[data-hero-icon]');
  setIcon(icon, s.icon);
  icon.setAttribute('class', 'ic' + (s.flame ? ' flame' : '') + (s.ok ? ' ok' : ''));
  $('[data-hero-tag]').textContent = s.tag;
  $('[data-hero-title]').textContent = s.title;
  $('[data-hero-text]').textContent = s.text;
}

function setStage(i, status) {
  const li = $(`[data-stage="${i + 1}"]`);
  li.className = status;
  const svg = $('.node .ic', li);
  if (!li.dataset.icon) li.dataset.icon = $('use', svg).getAttribute('href').slice(3);
  setIcon(svg, status === 'done' ? (i === 3 ? 'verified' : 'check') : li.dataset.icon);
  $('.state', li).textContent = status === 'active' ? LABELS[i][0] : status === 'done' ? LABELS[i][1] : '';
}

function runFlow() {
  timers.forEach(clearTimeout);
  timers = [];
  const pickup = state.fulfilment === 'pickup', later = state.timing === 'later';
  const slot = $('#slot').value.replace(' – ', '–');

  $('[data-pay-desc]').textContent = method;
  $('[data-confirm-desc]').textContent = `Order #${CONFIG.orderId} · ${pickup ? 'ready for pickup' : 'cargo-bike delivery'}`;
  $('[data-ticket-tag]').textContent = later ? 'FIRE ' + $('#slot').value.slice(0, 5) : 'FIRE ASAP';
  $('[data-ticket-lines]').innerHTML = items().map(i => `<li><span>${i.qty}× ${i.name}</span><span>${money(i.line)}</span></li>`).join('');
  $('.ticket').hidden = true;
  track.setAttribute('aria-disabled', 'true');
  track.innerHTML = icon('spinner', 'spin') + '<span>Placing your order…</span>';

  STAGES.forEach((_, i) => setStage(i, i === 0 ? 'active' : ''));
  setHero(STAGES[0]);

  const step = (i, ms) => timers.push(setTimeout(() => {
    setStage(i - 1, 'done');
    if (i < 3) setStage(i, 'active');
    if (i === 2) $('.ticket').hidden = false;
    if (i === 3) {
      setStage(3, 'done');
      setHero({ ...STAGES[3], tag: `Order #${CONFIG.orderId}`, text: pickup ? (later ? `Collect ${slot} from 2 Arch Lane.` : 'Ready to collect in about 20–25 min from 2 Arch Lane.') : (later ? `Arriving ${slot} by cargo bike.` : 'Arriving in 35–45 min by cargo bike.') });
      track.removeAttribute('aria-disabled');
      track.innerHTML = icon(pickup ? 'store' : 'bike') + '<span>Track your order</span>';
    } else setHero(STAGES[i]);
  }, ms));
  step(1, 950); step(2, 2100); step(3, 3300);
}

function openSheet() {
  lastFocus = document.activeElement;
  sheetWrap.hidden = false;
  document.body.classList.add('locked');
  requestAnimationFrame(() => requestAnimationFrame(() => sheetWrap.classList.add('open')));
  sheet.focus();
  runFlow();
}

function closeSheet() {
  timers.forEach(clearTimeout);
  sheetWrap.classList.remove('open');
  document.body.classList.remove('locked');
  setTimeout(() => {
    sheetWrap.hidden = true;
    payBtn.disabled = false;
    renderTotals();
    if (lastFocus) lastFocus.focus();
  }, 400);
}

// CONNECT YOUR PAYMENT PROVIDER HERE.
// Replace the setTimeout line below with a call to your provider. Call openSheet()
// when the payment succeeds. If it fails, show the provider's error and run
// payBtn.disabled = false; renderTotals(); to re-enable the pay button.
function placeOrder(label) {
  method = label;
  payBtn.disabled = true;
  $('[data-pay-label]').textContent = 'Confirming payment…';
  setTimeout(openSheet, 450);
}

payBtn.addEventListener('click', () => {
  if (!validateCard()) { $('#payment').scrollIntoView({ block: 'start' }); return; }
  const n = digits(f.number.value);
  placeOrder(`${brandOf(n) || 'Card'} ending in ${n.slice(-4)}`);
});
$$('[data-express]').forEach(b => b.addEventListener('click', () => placeOrder(`Paying with ${b.textContent.trim()}`)));

$$('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
track.addEventListener('click', e => { if (track.getAttribute('aria-disabled') === 'true' || track.getAttribute('href') === '#') e.preventDefault(); });

document.addEventListener('keydown', e => {
  if (sheetWrap.hidden) return;
  if (e.key === 'Escape') closeSheet();
  if (e.key === 'Tab') {   // keep focus inside the sheet
    const items = $$('button, a[href], [tabindex="0"]', sheet).filter(el => !el.closest('[hidden]'));
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

renderTotals();
