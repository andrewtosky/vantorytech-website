// Trial request extras for the enquiry form.
// - Shows the "Your line" questions when Food and beverage is chosen.
// - Gives each enquiry email a clear subject line.
// - On the free solution plan page: switches between the quick and full plan forms.
// - Sends each enquiry to the Vantory enquiries script (Google Apps Script), which emails it to
//   Vantory and saves it in the enquiries sheet. It also checks the fields and shows the messages.
(function () {
  'use strict';
  // The Vantory enquiries web app (Google Apps Script). Code and setup steps are kept outside the site.
  var INTAKE_URL = 'https://script.google.com/macros/s/AKfycbzi5j4yWk1y53HibXQxnsSc7mN-UivqlgG_SugqmqijTkWoIpDJs4at8_8Il_UaR8Ui/exec';
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

    // Sending: every enquiry goes to the Vantory enquiries script in Google Apps Script, which emails it
    // to Vantory and saves it in the enquiries sheet. This listener runs first (capture phase) and stops the
    // older inline form code from running, so no outside form service is used.
    var checks = [['f-name', 'Please add your name.'], ['f-company', 'Please add your company name.'],
                  ['f-email', 'Please enter a valid work email, like name@company.com.'],
                  ['f-process', 'Please tell us which process or job you would like to improve.']];
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');

    function isPreview() {
      return location.protocol === 'file:' || /claude/.test(location.hostname);
    }

    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      e.preventDefault();
      e.stopPropagation();
      updateSubject();
      status.className = 'form-status';
      for (var i = 0; i < checks.length; i++) {
        var el = document.getElementById(checks[i][0]);
        if (!el.value.trim() || !el.checkValidity()) { status.textContent = checks[i][1]; el.focus(); return; }
      }
      var consent = document.getElementById('f-consent');
      if (!consent.checked) { status.textContent = 'Please tick the box to agree to our Privacy Policy.'; consent.focus(); return; }
      var first = val('f-name').split(' ')[0];
      if (isPreview()) {
        status.className = 'form-status ok';
        status.textContent = 'Thanks, ' + first + '. This is a preview, so nothing was sent. On the live site, your details go straight to the Vantory team.';
        return;
      }
      var data = new FormData(form);
      var payload = { token: TOKEN, page: location.pathname };
      data.forEach(function (v, k) {
        if (k === 'access_key' || k === 'from_name') return;
        if (typeof v !== 'string') return;
        if (payload[k] !== undefined) payload[k] = payload[k] + ', ' + v;
        else payload[k] = v;
      });
      payload.botcheck = data.get('botcheck') ? '1' : '';
      if (block && block.hidden) ['packaging', 'volume', 'checks', 'check', 'checkedNow', 'checked', 'lines', 'plc', 'photos'].forEach(function (k) { delete payload[k]; });
      button.disabled = true;
      status.textContent = 'Sending...';
      fetch(INTAKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error(res && res.message ? res.message : 'not sent');
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Thanks, ' + first + '. We have your details. We will read them and email you to book a call.';
        })
        .catch(function (err) {
          status.className = 'form-status';
          status.textContent = 'Sorry, your message could not be sent (' + (err && err.message ? err.message : 'no reply from the server') + '). Please try again in a minute, or email enquiries@vantorytech.com.';
        })
        .then(function () { button.disabled = false; });
    }, true);
  });
})();
