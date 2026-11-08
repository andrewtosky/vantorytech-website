// Homepage interactions: industry tabs, map steps, "One system" hotspots and the results selector.
// Loaded as a separate file so the site's Content-Security-Policy does not need a new inline-script hash.
(function () {
  function pressOnly(buttons, match) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', match(b) ? 'true' : 'false'); });
  }
  function showOnly(panels, match) {
    panels.forEach(function (p) { p.hidden = !match(p); });
  }

  // Map steps: the list buttons and the map chips in each scene share one active step
  document.querySelectorAll('.scene').forEach(function (scene) {
    var controls = scene.querySelectorAll('[data-step]');
    function pick(i) {
      pressOnly(controls, function (b) { return b.getAttribute('data-step') === i; });
      scene.querySelectorAll('.scene-steps li').forEach(function (li) {
        li.querySelector('p').hidden = li.querySelector('button').getAttribute('data-step') !== i;
      });
    }
    controls.forEach(function (b) {
      b.addEventListener('click', function () { pick(b.getAttribute('data-step')); });
    });
  });

  // Industry tabs: switching resets the scene to its first step
  var tabs = document.querySelectorAll('.tab');
  var scenes = document.querySelectorAll('.scene');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('data-tab');
      pressOnly(tabs, function (b) { return b === t; });
      showOnly(scenes, function (s) { return s.getAttribute('data-scene') === id; });
      var first = document.querySelector('.scene[data-scene="' + id + '"] .scene-steps [data-step="0"]');
      if (first) first.click();
    });
  });

  // "One system" hotspots
  var spots = document.querySelectorAll('.spot');
  var infos = document.querySelectorAll('.spot-info');
  spots.forEach(function (s) {
    s.addEventListener('click', function () {
      var i = s.getAttribute('data-spot');
      pressOnly(spots, function (b) { return b === s; });
      showOnly(infos, function (p) { return p.getAttribute('data-spot-info') === i; });
    });
  });

  // Results selector
  var picks = document.querySelectorAll('.pick');
  var stories = document.querySelectorAll('.story');
  picks.forEach(function (p) {
    p.addEventListener('click', function () {
      var i = p.getAttribute('data-story-pick');
      pressOnly(picks, function (b) { return b === p; });
      showOnly(stories, function (s) { return s.getAttribute('data-story') === i; });
    });
  });

  // Respect reduced motion for the moving robots on the maps
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.map svg').forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }
})();
