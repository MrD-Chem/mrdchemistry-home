/* Shared by every pathway page and the Recipe Builder. Keep updates scoped to the supplied fields. */
(function () {
  'use strict';
  /* The steps of each pathway, in order. Add a pathway here to give it saved progress. */
  var PATHWAYS = {
    'limiting-reactants': ['notes', 'explore', 'predict', 'game', 'quiz'],
    'ionic-naming': ['formulas', 'naming', 'polyatomics', 'roman']
  };
  var memory = Object.create(null);
  var volatile = Object.create(null);
  function stepsFor(id) { return PATHWAYS[id] || []; }
  function empty(id) {
    var done = {};
    stepsFor(id).forEach(function (step) { done[step] = false; });
    return { v: 1, done: done, quizBest: 0 };
  }
  function clean(id, value) {
    var steps = stepsFor(id);
    var result = empty(id);
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
    } catch (error) { return clean(id, memory[id]); }
    if (volatile[id]) return clean(id, memory[id]);
    try { return raw === null ? empty(id) : clean(id, JSON.parse(raw)); }
    catch (error) { return empty(id); }
  }
  function write(id, value) {
    memory[id] = clean(id, value);
    try {
      window.localStorage.setItem(key(id), JSON.stringify(value));
      volatile[id] = false;
    } catch (error) { volatile[id] = true; /* In-page progress still works. */ }
    window.dispatchEvent(new CustomEvent('mrd-progress', { detail: { pathwayId: id } }));
    return clean(id, value);
  }
  function set(id, patch) {
    var steps = stepsFor(id);
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
    if (stepsFor(id).indexOf(step) === -1) return get(id);
    var done = {};
    done[step] = true;
    return set(id, { done: done });
  }
  function reset(id) {
    var value = get(id);
    stepsFor(id).forEach(function (step) { value.done[step] = false; });
    value.quizBest = 0;
    return write(id, value);
  }
  window.MRDProgress = { get: get, markDone: markDone, set: set, reset: reset, steps: function (id) { return stepsFor(id).slice(); } };
}());
