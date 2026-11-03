(function () {
  'use strict';
  var id = 'limiting-reactants';
  var notes = document.getElementById('finish-notes');
  if (notes) {
    notes.addEventListener('click', function () { window.MRDProgress.markDone(id, 'notes'); });
    return;
  }
  var steps = ['notes', 'explore', 'predict', 'game', 'quiz'];
  var reset = document.getElementById('reset-progress');
  var cancel = document.getElementById('cancel-reset');
  var armed = false;
  function disarm() {
    armed = false;
    reset.textContent = 'Reset my progress';
    cancel.hidden = true;
  }
  function render() {
    var progress = window.MRDProgress.get(id);
    var count = steps.filter(function (step) { return progress.done[step]; }).length;
    document.getElementById('progress-count').textContent = count + ' of 5 steps done';
    document.getElementById('pathway-meter').value = count;
    document.getElementById('completion').hidden = count !== 5;
    steps.forEach(function (step, index) {
      var station = document.getElementById('step-' + step);
      var state = progress.done[step] ? 'done' : (index === 0 || progress.done[steps[index - 1]] ? 'next' : 'locked');
      station.dataset.state = state;
      station.querySelector('.station-status').textContent = state === 'done' ? '✓ Done' : (state === 'next' ? 'Up next' : 'Locked');
      station.querySelector('.step-open').hidden = state === 'locked';
      station.querySelector('.step-anyway').hidden = state !== 'locked';
      station.querySelector('.lock-hint').hidden = state !== 'locked';
    });
  }
  document.querySelectorAll('[data-mark-game]').forEach(function (link) {
    function mark(event) {
      if (event.type === 'click' || event.button === 1) window.MRDProgress.markDone(id, 'game');
    }
    link.addEventListener('click', mark);
    link.addEventListener('auxclick', mark);
  });
  reset.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      reset.textContent = 'Are you sure? Reset all 5 steps';
      cancel.hidden = false;
      return;
    }
    window.MRDProgress.reset(id);
    disarm();
    document.getElementById('reset-message').textContent = 'Progress reset. Start fresh with the notes.';
  });
  cancel.addEventListener('click', disarm);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') disarm(); });
  window.addEventListener('pageshow', function () { disarm(); render(); });
  window.addEventListener('storage', render);
  window.addEventListener('mrd-progress', render);
  render();
}());
