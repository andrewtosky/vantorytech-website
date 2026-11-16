// Trial request extras for the enquiry form.
// - Shows the "Your line" questions when Food and beverage is chosen.
// - Gives each enquiry email a clear subject line.
// - On the free solution plan page: switches between the quick and full plan forms.
// - Sends a copy of each valid enquiry to the Vantory enquiries sheet (Google Apps Script),
//   alongside the existing Web3Forms email. The inline script on each page still handles
//   validation, the Web3Forms send and the on-page messages.
(function () {
  'use strict';
  // Paste the Apps Script web app URL here once it is deployed. Empty means no copy is sent.
  var INTAKE_URL = '';
  var TOKEN = 'vantory-site-2026';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var form = document.getElementById('enquiry');
    if (!form) return;
    var industry = document.getElementById('f-industry');
    var block = document.getElementById('fb-block');
    var subject = form.elements.subject;

    function val(id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    var planInputs = form.querySelectorAll('input[name="plan"]');
    var submitBtn = document.getElementById('plan-submit');
    function planType() {
      var c = form.querySelector('input[name="plan"]:checked');
      return c ? c.value : '';
    }
    function isQuick() { return planType() === 'Quick plan'; }

    function toggleBlock() {
      if (!block || !industry) return;
      block.hidden = industry.value !== 'Food and beverage' || isQuick();
    }

    function togglePlan() {
      if (!planInputs.length) return;
      form.querySelectorAll('[data-full]').forEach(function (el) { el.hidden = isQuick(); });
      if (submitBtn) submitBtn.firstChild.nodeValue = isQuick() ? 'Send and get my quick plan ' : 'Send and get my full plan ';
      toggleBlock();
    }

    function choosePlan(kind) {
      var el = document.getElementById(kind === 'quick' ? 'plan-quick' : 'plan-full');
      if (!el) return;
      el.checked = true;
      togglePlan();
      updateSubject();
    }
    document.querySelectorAll('[data-plan]').forEach(function (a) {
      a.addEventListener('click', function () { choosePlan(a.getAttribute('data-plan')); });
    });
    if (/^#(quick|full)$/.test(location.hash)) {
      choosePlan(location.hash.slice(1));
      var target = document.getElementById('form');
      if (target) setTimeout(function () { target.scrollIntoView(); }, 0);
    }
    planInputs.forEach(function (r) { r.addEventListener('change', togglePlan); });
    form.addEventListener('reset', function () { setTimeout(function () { togglePlan(); updateSubject(); }, 0); });

    function updateSubject() {
      if (!subject) return;
      var parts = [(planType() ? planType() + ' request: ' : 'Trial request: ') + (val('f-company') || 'New enquiry')];
      if (val('f-industry')) parts.push(val('f-industry'));
      if (val('f-timeline')) parts.push(val('f-timeline'));
      subject.value = parts.join(' · ');
      // Join the ticked checks into one field so the email shows all of them.
      var all = document.getElementById('f-checks');
      if (all) all.value = Array.prototype.map.call(form.querySelectorAll('input[name="check"]:checked'), function (c) { return c.value; }).join(', ');
    }

    togglePlan();
    toggleBlock();
    updateSubject();
    if (industry) industry.addEventListener('change', toggleBlock);
    form.addEventListener('input', updateSubject);
    form.addEventListener('change', updateSubject);

    // Same checks as the inline script, so only enquiries that will send are copied.
    function isValid() {
      var ids = ['f-name', 'f-company', 'f-email', 'f-process'];
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (!el || !el.value.trim() || !el.checkValidity()) return false;
      }
      var consent = document.getElementById('f-consent');
      return !!(consent && consent.checked);
    }

    function isPreview() {
      return location.protocol === 'file:' || /claude/.test(location.hostname);
    }

    form.addEventListener('submit', function () {
      updateSubject();
      if (!INTAKE_URL || isPreview() || !isValid()) return;
      var data = new FormData(form);
      var foodLine = block && !block.hidden;
      var payload = {
        token: TOKEN,
        plan: planType(),
        botcheck: data.get('botcheck') ? '1' : '',
        name: val('f-name'),
        company: val('f-company'),
        role: val('f-role'),
        email: val('f-email'),
        phone: val('f-phone'),
        country: val('f-country'),
        site: val('f-site'),
        industry: val('f-industry'),
        process: val('f-process'),
        pain: data.getAll('pain').join(', '),
        today: val('f-today'),
        packaging: foodLine ? val('f-packaging') : '',
        volume: foodLine ? val('f-volume') : '',
        checks: foodLine ? val('f-checks') : '',
        checkedNow: foodLine ? val('f-checked') : '',
        lines: foodLine ? val('f-lines') : '',
        plc: foodLine ? val('f-plc') : '',
        photos: foodLine ? val('f-photos') : '',
        timeline: val('f-timeline'),
        times: val('f-times'),
        page: location.pathname
      };
      try {
        fetch(INTAKE_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function () {});
      } catch (e) { /* the Web3Forms email still goes, so a failed copy is not shown to the visitor */ }
    });
  });
})();
