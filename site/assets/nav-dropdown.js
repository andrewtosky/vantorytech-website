// Dropdowns in the main navigation (Solutions, Industries): hover, click or tap, and keyboard.
(function(){
  'use strict';
  var wraps = Array.prototype.slice.call(document.querySelectorAll('.nav-sol'));
  if (!wraps.length) return;
  var desktop = window.matchMedia('(min-width: 881px)');
  var canHover = window.matchMedia('(hover: hover)');
  var hoverOk = function(){ return desktop.matches && canHover.matches; };
  var all = wraps.map(function(wrap){
    var btn = wrap.querySelector('.nav-sol-btn');
    var timer;
    var d = {
      wrap: wrap, btn: btn,
      isOpen: function(){ return wrap.classList.contains('open'); },
      set: function(open){
        clearTimeout(timer);
        if (open) all.forEach(function(o){ if (o !== d && o.isOpen()) o.set(false); });
        wrap.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    };
    btn.addEventListener('click', function(e){ e.stopPropagation(); d.set(!d.isOpen()); });
    wrap.addEventListener('mouseenter', function(){ if (hoverOk()) d.set(true); });
    wrap.addEventListener('mouseleave', function(){
      if (hoverOk()){ clearTimeout(timer); timer = setTimeout(function(){ d.set(false); }, 180); }
    });
    wrap.addEventListener('focusout', function(e){
      if (desktop.matches && d.isOpen() && e.relatedTarget && !wrap.contains(e.relatedTarget)) d.set(false);
    });
    return d;
  });
  document.addEventListener('click', function(e){
    all.forEach(function(d){ if (d.isOpen() && !d.wrap.contains(e.target)) d.set(false); });
  });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    all.forEach(function(d){ if (d.isOpen()){ d.set(false); d.btn.focus(); } });
  });
  if (desktop.addEventListener) desktop.addEventListener('change', function(){ all.forEach(function(d){ d.set(false); }); });
})();
