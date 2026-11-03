(function () {
  'use strict';
  function render() {
    var progress = window.MRDProgress.get('limiting-reactants');
    var count = Object.keys(progress.done).filter(function (step) { return progress.done[step]; }).length;
    document.getElementById('hub-progress').textContent = count + ' of 5 steps done';
    document.getElementById('hub-meter').value = count;
  }
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', render);
  window.addEventListener('mrd-progress', render);
  render();
}());
