/* Davis Legal · Bicycle Accident Lawyer landing page (ad version)
   1. Scroll reveal (IntersectionObserver, reduced-motion aware)
   2. Sticky mobile call bar, shown once the hero form scrolls away
   3. Case evaluation form validation and submission feedback
*/
(function () {
  'use strict';

  /* 1. Scroll reveal --------------------------------------------------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
      /* Root extends far above the viewport so anything jumped past is revealed. */
    }, { rootMargin: '10000px 0px -8% 0px', threshold: 0 });
    revealItems.forEach(function (el) { observer.observe(el); });
  }

  /* 2. Sticky mobile call bar ------------------------------------------------ */
  var hero = document.querySelector('.hero');
  var mobileBar = document.querySelector('.mobile-bar');
  if (hero && mobileBar) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        mobileBar.classList.toggle('is-shown', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(hero);
    } else {
      mobileBar.classList.add('is-shown');
    }
  }

  /* 3. Case evaluation form -------------------------------------------------- */
  var form = document.getElementById('case-review');
  if (!form) { return; }

  var status = document.getElementById('form-status');
  var submitButton = form.querySelector('button[type="submit"]');
  var submitLabel = submitButton.textContent;

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; },
    phone: function (v) { return v.replace(/\D/g, '').length >= 10 ? '' : 'Please enter a phone number with at least 10 digits.'; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address, like name@example.com.'; },
    message: function (v) { return v.trim().length >= 10 ? '' : 'Please tell us briefly what happened.'; }
  };

  var showError = function (field, message) {
    var errorEl = document.getElementById('e-' + field.name);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) { errorEl.textContent = message; }
  };

  var validateField = function (field) {
    var message = rules[field.name] ? rules[field.name](field.value) : '';
    showError(field, message);
    return !message;
  };

  Array.prototype.forEach.call(form.elements, function (field) {
    if (!rules[field.name]) { return; }
    field.addEventListener('blur', function () { validateField(field); });
    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true') { validateField(field); }
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    status.removeAttribute('data-state');

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (!validateField(field) && !firstInvalid) { firstInvalid = field; }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      status.setAttribute('data-state', 'error');
      status.textContent = 'Please correct the highlighted fields and try again.';
      return;
    }

    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending...';

    /* Set data-endpoint on the <form> to post to the firm's form handler
       (WordPress contact form, Formspree, CRM webhook). */
    var endpoint = form.getAttribute('data-endpoint');
    var finish = function (ok) {
      submitButton.removeAttribute('aria-busy');
      submitButton.textContent = submitLabel;
      status.setAttribute('data-state', ok ? 'success' : 'error');
      status.textContent = ok
        ? 'Thank you. We have your details and will contact you within one business day. If this is urgent, call (662) 617-9028.'
        : 'Something went wrong sending your request. Please call (662) 617-9028 and we will help right away.';
      if (ok) { form.reset(); }
    };

    if (endpoint) {
      fetch(endpoint, { method: 'POST', body: new FormData(form) })
        .then(function (res) { finish(res.ok); })
        .catch(function () { finish(false); });
    } else {
      window.setTimeout(function () { finish(true); }, 600);
    }
  });
})();
