/* Shared with Recipe Builder. Keep updates scoped to the supplied fields. */
(function () {
  'use strict';
  var steps = ['notes', 'explore', 'predict', 'game', 'quiz'];
  var memory = Object.create(null);
  var volatile = Object.create(null);
  function empty() {
    return { v: 1, done: { notes: false, explore: false, predict: false, game: false, quiz: false }, quizBest: 0 };
  }
  function clean(value) {
    var result = empty();
    if (!value || value.v !== 1 || !value.done || typeof value.done !== 'object') return result;
    steps.forEach(function (step) { result.done[step] = value.done[step] === true; });
    if (Number.isInteger(value.quizBest) && value.quizBest >= 0 && value.quizBest <= 5) result.quizBest = value.quizBest;
    return result;
  }
  function key(id) { return 'mrd-pathway:' + id; }
  function get(id) {
    var raw;
    try {
      raw = window.localStorage.getItem(key(id));
    } catch (error) { return clean(memory[id]); }
    if (volatile[id]) return clean(memory[id]);
    try { return raw === null ? empty() : clean(JSON.parse(raw)); }
    catch (error) { return empty(); }
  }
  function write(id, value) {
    memory[id] = clean(value);
    try {
      window.localStorage.setItem(key(id), JSON.stringify(value));
      volatile[id] = false;
    } catch (error) { volatile[id] = true; /* In-page progress still works. */ }
    window.dispatchEvent(new CustomEvent('mrd-progress', { detail: { pathwayId: id } }));
    return clean(value);
  }
  function set(id, patch) {
    var value = get(id);
    patch = patch || {};
    if (patch.done && typeof patch.done === 'object') {
      steps.forEach(function (step) {
        if (Object.prototype.hasOwnProperty.call(patch.done, step) && typeof patch.done[step] === 'boolean') value.done[step] = patch.done[step];
      });
    }
    if (Number.isInteger(patch.quizBest) && patch.quizBest >= 0 && patch.quizBest <= 5) value.quizBest = Math.max(value.quizBest, patch.quizBest);
    return write(id, value);
  }
  function markDone(id, step) {
    if (steps.indexOf(step) === -1) return get(id);
    var done = {};
    done[step] = true;
    return set(id, { done: done });
  }
  function reset(id) {
    var value = get(id);
    steps.forEach(function (step) { value.done[step] = false; });
    value.quizBest = 0;
    return write(id, value);
  }
  window.MRDProgress = { get: get, markDone: markDone, set: set, reset: reset };
}());
