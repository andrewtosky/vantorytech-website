// Solutions dropdown in the main navigation: hover, click or tap, and keyboard.
(function(){
  'use strict';
  var wrap = document.querySelector('.nav-sol');
  if (!wrap) return;
  var btn = wrap.querySelector('.nav-sol-btn');
  var menu = document.getElementById(btn.getAttribute('aria-controls'));
  var desktop = window.matchMedia('(min-width: 881px)');
  var canHover = window.matchMedia('(hover: hover)');
  var timer;
  function set(open){
    clearTimeout(timer);
    wrap.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function isOpen(){ return wrap.classList.contains('open'); }
  btn.addEventListener('click', function(e){ e.stopPropagation(); set(!isOpen()); });
  wrap.addEventListener('mouseenter', function(){ if (desktop.matches && canHover.matches) set(true); });
  wrap.addEventListener('mouseleave', function(){
    if (desktop.matches && canHover.matches){ clearTimeout(timer); timer = setTimeout(function(){ set(false); }, 180); }
  });
  document.addEventListener('click', function(e){ if (isOpen() && !wrap.contains(e.target)) set(false); });
  document.addEventListener('keydown', function(e){
    if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()){ set(false); btn.focus(); }
  });
  wrap.addEventListener('focusout', function(e){
    if (desktop.matches && isOpen() && e.relatedTarget && !wrap.contains(e.relatedTarget)) set(false);
  });
  desktop.addEventListener && desktop.addEventListener('change', function(){ set(false); });
})();
