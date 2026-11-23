(function () {
  'use strict';
  function render() {
    document.querySelectorAll('[data-pathway-card]').forEach(function (card) {
      var id = card.getAttribute('data-pathway-card');
      var steps = window.MRDProgress.steps(id);
      var progress = window.MRDProgress.get(id);
      var count = steps.filter(function (step) { return progress.done[step]; }).length;
      card.querySelector('.hub-progress').textContent = count + ' of ' + steps.length + ' steps done';
      var meter = card.querySelector('progress');
      meter.max = steps.length;
      meter.value = count;
    });
  }
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', render);
  window.addEventListener('mrd-progress', render);
  render();
}());
