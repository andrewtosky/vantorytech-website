// Solutions page: the "What do you want to see?" dropdown shows one topic at a time.
(function () {
  var select = document.getElementById('topic');
  if (!select) return;
  var parts = document.querySelectorAll('[data-part]');
  var cardGrids = Array.prototype.slice.call(document.querySelectorAll('.solutions'));
  var deepGrid = document.querySelector('.deep');
  var topics = Array.prototype.map.call(select.options, function (o) { return o.value; }).filter(Boolean);

  function show(topic) {
    var all = !topic;
    var deepItem = !all && deepGrid && deepGrid.querySelector('[data-topic="' + topic + '"]');
    document.body.toggleAttribute('data-filtered', !all);
    parts.forEach(function (sec) {
      var part = sec.getAttribute('data-part');
      var visible = all ||
        (part === 'deep' && !!deepItem) ||
        (part === 'cards' && !deepItem && !!sec.querySelector('[data-topic="' + topic + '"]')) ||
        (part === 'custom' && topic === 'custom');
      sec.hidden = !visible;
    });
    cardGrids.concat(deepGrid ? [deepGrid] : []).forEach(function (grid) {
      var any = false;
      grid.classList.toggle('one', !all);
      grid.querySelectorAll('[data-topic]').forEach(function (el) {
        el.hidden = !all && el.getAttribute('data-topic') !== topic;
        if (!el.hidden) any = true;
      });
      // The core and "Also possible" grids: hide whichever has nothing to show
      if (grid !== deepGrid) grid.hidden = !all && !any;
    });
  }

  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    return topics.indexOf(h) !== -1 ? h : '';
  }

  select.addEventListener('change', function () {
    var topic = select.value;
    show(topic);
    history.replaceState(null, '', topic ? '#' + topic : location.pathname);
    var first = document.querySelector('main > section:not([hidden]):not(.hero)');
    if (first && topic) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('hashchange', function () {
    var t = fromHash();
    if (t || !location.hash) { select.value = t; show(t); }
  });

  var start = fromHash();
  if (start) { select.value = start; show(start); }
})();
