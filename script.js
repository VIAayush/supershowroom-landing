(() => {
  const WA_NUMBER = '918431101466';

  // Sticky nav border
  const nav = document.getElementById('nav');
  const sticky = document.getElementById('stickyCta');
  const heroForm = document.getElementById('heroForm');
  const contact = document.getElementById('contact');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    // Mobile sticky CTA: show after the hero form scrolls away, hide near the contact section
    const heroBottom = heroForm.getBoundingClientRect().bottom;
    const contactTop = contact.getBoundingClientRect().top;
    sticky.classList.toggle('show', heroBottom < 0 && contactTop > window.innerHeight * 0.6);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Reveal on scroll — progressive enhancement.
  // Content is visible by default; it is only hidden once this script runs (html.js-reveal),
  // and reveals are driven by scroll position so they never depend on IntersectionObserver.
  const reveal = el => el.classList.add(el.classList.contains('timeline') ? 'in-view' : 'in');
  document.querySelectorAll('.hero .reveal').forEach(reveal);
  let pending = [...document.querySelectorAll('.reveal, .timeline')].filter(el => !el.closest('.hero'));
  const checkReveal = () => {
    if (!pending.length) return;
    const limit = window.innerHeight * 0.92;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top < limit) { reveal(el); return false; }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', checkReveal);
      window.removeEventListener('resize', checkReveal);
      clearInterval(revealPoll);
    }
  };
  document.documentElement.classList.add('js-reveal');
  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal);
  window.addEventListener('load', checkReveal);
  // Timer fallback: some browsers/webviews throttle or skip scroll events.
  const revealPoll = setInterval(checkReveal, 250);
  checkReveal();

  // Plan buttons preselect the contact form plan
  document.querySelectorAll('.plan-cta').forEach(btn => btn.addEventListener('click', () => {
    const sel = document.querySelector('#contactForm select[name="plan"]');
    if (sel) sel.value = btn.dataset.plan;
  }));

  // Lead forms
  document.querySelectorAll('.form-card').forEach(card => {
    const form = card.querySelector('form');
    const success = card.querySelector('.form-success');
    if (!form) return;

    const setError = (input, msg) => {
      const field = input.closest('.field');
      field.classList.toggle('invalid', !!msg);
      let err = field.querySelector('.err');
      if (msg) {
        if (!err) { err = document.createElement('span'); err.className = 'err'; field.appendChild(err); }
        err.textContent = msg;
      } else if (err) err.remove();
      return !msg;
    };

    form.querySelectorAll('input').forEach(i => i.addEventListener('input', () => {
      if (i.closest('.field')?.classList.contains('invalid')) validate(i);
    }));

    function validate(i) {
      const v = i.value.trim();
      if (i.name === 'name') return setError(i, v.length < 2 ? 'Please enter your name' : '');
      if (i.name === 'brand') return setError(i, v.length < 2 ? 'Please enter your brand name' : '');
      if (i.name === 'phone') return setError(i, /^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10)) && v.replace(/\D/g, '').length >= 10 ? '' : 'Enter a valid 10-digit mobile number');
      if (i.name === 'email' && v) return setError(i, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email');
      return true;
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const inputs = [...form.querySelectorAll('input[name="name"], input[name="phone"], input[name="brand"], input[name="email"]')];
      const ok = inputs.map(validate).every(Boolean);
      if (!ok) { form.querySelector('.invalid input')?.focus(); return; }

      const data = Object.fromEntries(new FormData(form).entries());
      const lines = [
        `Hi SuperShowroom! I'd like to book a demo.`,
        `Name: ${data.name}`,
        `Brand: ${data.brand}`,
        `Phone: +91 ${data.phone}`,
        data.email ? `Email: ${data.email}` : '',
        `Category: ${data.category}`,
        `Plan: ${data.plan}`,
        data.addons ? `Add-ons: ${data.addons}` : '',
        data.notes ? `Notes: ${data.notes}` : ''
      ].filter(Boolean);

      success.querySelector('[data-name]').textContent = data.name.split(' ')[0];
      success.querySelector('[data-wa]').href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
      form.hidden = true;
      success.hidden = false;
    });

    success.querySelector('[data-reset]').addEventListener('click', () => {
      const keep = form.querySelector('input[name="addons"]')?.value;
      form.reset();
      if (keep) form.querySelector('input[name="addons"]').value = keep;
      success.hidden = true;
      form.hidden = false;
    });
  });

  // Cursor spotlight on cards
  const spotSel = '.reason, .bx, .get, .plan, .addon, .promise, .feature, .invoice, .data-card';
  document.querySelectorAll(spotSel).forEach(el => {
    el.classList.add('spot');
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Add-ons picker
  const addonInputs = [...document.querySelectorAll('.addon input')];
  const bar = document.getElementById('addonBar');
  const abCount = document.getElementById('abCount');
  const abTitle = document.getElementById('abTitle');
  const abList = document.getElementById('abList');
  const addonField = document.getElementById('addonField');
  const selectedAddons = () => addonInputs.filter(i => i.checked).map(i => i.value);

  function syncAddons() {
    const picked = selectedAddons();
    addonInputs.forEach(i => i.closest('.addon').classList.toggle('checked', i.checked));
    bar.classList.toggle('has', picked.length > 0);
    abCount.textContent = picked.length;
    abCount.classList.remove('bump'); void abCount.offsetWidth; abCount.classList.add('bump');
    abTitle.textContent = picked.length ? `${picked.length} add-on${picked.length > 1 ? 's' : ''} selected` : 'No add-ons selected';
    abList.textContent = picked.length ? picked.join(' · ') : 'Tap a card above to add it to your plan';
    const checked = addonInputs.filter(i => i.checked).map(i => i.closest('.addon'));
    const sum = checked.reduce((t, el) => t + Number(el.dataset.price || 0), 0);
    const variable = checked.some(el => el.dataset.variable);
    const abTotal = document.getElementById('abTotal');
    if (abTotal) abTotal.textContent = '₹' + sum.toLocaleString('en-IN') + '/yr + GST' + (variable ? ' + msgs' : '');
    // mirror into the contact form
    addonField.hidden = picked.length === 0;
    addonField.querySelector('input').value = picked.join(', ');
    addonField.querySelector('.addon-summary').innerHTML = picked.map(p => `<span>${p.replace(/&/g, '&amp;')}</span>`).join('');
  }
  addonInputs.forEach(i => i.addEventListener('change', syncAddons));
  syncAddons();

  // Year-one cost calculator
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const range = document.getElementById('sales');
  const segBtns = document.querySelectorAll('.seg button');
  const ring = document.getElementById('ring');
  const C = 2 * Math.PI * 50;
  let plan = 25000, rate = 0.02;

  function calc() {
    const monthly = Number(range.value);
    const fee = monthly * 12 * rate;
    const total = plan + fee;
    const share = total / (monthly * 12) * 100;
    range.style.setProperty('--p', ((monthly - range.min) / (range.max - range.min) * 100) + '%');
    document.getElementById('salesOut').textContent = inr(monthly);
    document.getElementById('cPlan').textContent = inr(plan);
    document.getElementById('cRate').textContent = `(${rate * 100}%)`;
    document.getElementById('cFee').textContent = inr(fee);
    document.getElementById('cTotal').textContent = inr(total);
    document.getElementById('cShare').textContent = share.toFixed(1) + '%';
    // ring scaled so 25% share fills the circle
    ring.style.strokeDashoffset = C * (1 - Math.min(share, 25) / 25);
  }
  segBtns.forEach(b => b.addEventListener('click', () => {
    segBtns.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-checked', 'false'); });
    b.classList.add('active');
    b.setAttribute('aria-checked', 'true');
    plan = Number(b.dataset.plan);
    rate = Number(b.dataset.fee);
    calc();
  }));
  range.addEventListener('input', calc);
  calc();
})();
