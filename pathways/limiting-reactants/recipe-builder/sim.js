/*
  Recipe Builder — limiting reactant simulation (Limiting Reactants pathway).

  Two modes, picked by the URL:
    ?mode=explore  free play: pick a reaction, load the reactor, press React.
    ?mode=predict  5 rounds: predict the limiting reactant and the amount of product, then watch.

  How a reaction runs: "sets possible" for each reactant = amount ÷ coefficient.
  The smallest value is the limiting reactant. Whole sets react one at a time, so students
  see the recipe used over and over until one reactant can't fill another set.

  Progress goes through window.MRDProgress (../../assets/progress.js); the page still works
  without it. No timers keep running once a reaction ends.
*/
(function () {
  'use strict';

  var PATHWAY = 'limiting-reactants';
  var MAX = 12; // most molecules of one reactant in the reactor

  // ---------- Atoms and molecules ----------

  var ATOMS = {
    H: { c: '#f1f5f9', r: 6, name: 'Hydrogen' },
    O: { c: '#fb7185', r: 9, name: 'Oxygen' },
    N: { c: '#60a5fa', r: 9, name: 'Nitrogen' },
    C: { c: '#64748b', r: 9, name: 'Carbon' },
    Na: { c: '#a78bfa', r: 10, name: 'Sodium' },
    Cl: { c: '#4ade80', r: 10, name: 'Chlorine' },
    Fe: { c: '#f59e0b', r: 10, name: 'Iron' },
    Al: { c: '#cbd5e1', r: 10, name: 'Aluminum' }
  };

  // atoms: [element, x, y]; bonds: pairs of atom indexes
  var SPECIES = {
    H2: { atoms: [['H', 0, 0], ['H', 13, 0]], bonds: [[0, 1]] },
    O2: { atoms: [['O', 0, 0], ['O', 17, 0]], bonds: [[0, 1]] },
    N2: { atoms: [['N', 0, 0], ['N', 17, 0]], bonds: [[0, 1]] },
    Cl2: { atoms: [['Cl', 0, 0], ['Cl', 19, 0]], bonds: [[0, 1]] },
    H2O: { atoms: [['O', 0, 0], ['H', -12, 9], ['H', 12, 9]], bonds: [[0, 1], [0, 2]] },
    NH3: { atoms: [['N', 0, 0], ['H', -13, 8], ['H', 0, 14], ['H', 13, 8]], bonds: [[0, 1], [0, 2], [0, 3]] },
    CH4: { atoms: [['C', 0, 0], ['H', 0, -14], ['H', -14, 6], ['H', 14, 6], ['H', 0, 14]], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    CO2: { atoms: [['O', -17, 0], ['C', 0, 0], ['O', 17, 0]], bonds: [[0, 1], [1, 2]] },
    Na: { atoms: [['Na', 0, 0]], bonds: [] },
    Fe: { atoms: [['Fe', 0, 0]], bonds: [] },
    Al: { atoms: [['Al', 0, 0]], bonds: [] },
    NaCl: { atoms: [['Na', 0, 0], ['Cl', 19, 0]], bonds: [] },
    Fe2O3: { atoms: [['Fe', -10, -6], ['Fe', 10, -6], ['O', -19, 10], ['O', 0, 10], ['O', 19, 10]], bonds: [[0, 2], [0, 3], [1, 3], [1, 4]] },
    AlCl3: { atoms: [['Al', 0, 0], ['Cl', 0, -19], ['Cl', -17, 10], ['Cl', 17, 10]], bonds: [[0, 1], [0, 2], [0, 3]] }
  };

  // ---------- Reactions ----------
  // [species, coefficient]; ask = which product the Predict question asks about

  var EQUATIONS = [
    { id: 'water', name: 'Making water', reactants: [['H2', 2], ['O2', 1]], products: [['H2O', 2]], ask: 0, start: [6, 2] },
    { id: 'ammonia', name: 'Making ammonia', reactants: [['N2', 1], ['H2', 3]], products: [['NH3', 2]], ask: 0, start: [2, 9] },
    { id: 'salt', name: 'Making table salt', reactants: [['Na', 2], ['Cl2', 1]], products: [['NaCl', 2]], ask: 0, start: [5, 4] },
    { id: 'methane', name: 'Burning methane', reactants: [['CH4', 1], ['O2', 2]], products: [['CO2', 1], ['H2O', 2]], ask: 1, start: [4, 6] },
    { id: 'rust', name: 'Making rust', reactants: [['Fe', 4], ['O2', 3]], products: [['Fe2O3', 2]], ask: 0, start: [8, 3] },
    { id: 'alcl3', name: 'Making aluminum chloride', reactants: [['Al', 2], ['Cl2', 3]], products: [['AlCl3', 2]], ask: 0, start: [4, 9] }
  ];

  function eqById(id) {
    for (var i = 0; i < EQUATIONS.length; i++) if (EQUATIONS[i].id === id) return EQUATIONS[i];
    return EQUATIONS[0];
  }

  // ---------- Helpers ----------

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* old browser */ }

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // "Fe2O3" -> "Fe<sub>2</sub>O<sub>3</sub>" (formulas are internal constants, never user text)
  function f(formula) { return formula.replace(/(\d+)/g, '<sub>$1</sub>'); }

  function sideHtml(list) {
    return list.map(function (p) { return (p[1] > 1 ? p[1] : '') + f(p[0]); }).join(' + ');
  }

  function eqHtml(eq) { return sideHtml(eq.reactants) + ' → ' + sideHtml(eq.products); }

  function fmt(x, dp) {
    if (dp == null) return String(Math.round(x * 100) / 100);
    return x.toFixed(dp);
  }

  function moleculeSvg(name) {
    var sp = SPECIES[name];
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sp.atoms.forEach(function (a) {
      var r = ATOMS[a[0]].r;
      minX = Math.min(minX, a[1] - r); maxX = Math.max(maxX, a[1] + r);
      minY = Math.min(minY, a[2] - r); maxY = Math.max(maxY, a[2] + r);
    });
    var pad = 2;
    var w = maxX - minX + pad * 2, h = maxY - minY + pad * 2;
    var side = Math.max(w, h, 30);
    var vx = minX - pad - (side - w) / 2, vy = minY - pad - (side - h) / 2;
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', vx + ' ' + vy + ' ' + side + ' ' + side);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    sp.bonds.forEach(function (b) {
      var p = sp.atoms[b[0]], q = sp.atoms[b[1]];
      var line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', p[1]); line.setAttribute('y1', p[2]);
      line.setAttribute('x2', q[1]); line.setAttribute('y2', q[2]);
      line.setAttribute('class', 'bond');
      svg.appendChild(line);
    });
    sp.atoms.forEach(function (a) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', a[1]); c.setAttribute('cy', a[2]);
      c.setAttribute('r', ATOMS[a[0]].r);
      c.setAttribute('fill', ATOMS[a[0]].c);
      c.setAttribute('class', 'atom');
      svg.appendChild(c);
    });
    return svg;
  }

  function tile(name, extra) {
    var t = el('span', 'mol' + (extra ? ' ' + extra : ''));
    t.appendChild(moleculeSvg(name));
    return t;
  }

  // ---------- Reaction math ----------

  // counts: molecules (models) of each reactant in the reactor
  function analyse(eq, counts) {
    var ratios = eq.reactants.map(function (r, i) { return counts[i] / r[1]; });
    var minRatio = Math.min.apply(null, ratios);
    var sets = Math.floor(minRatio + 1e-9);
    var limiting = [];
    ratios.forEach(function (x, i) { if (Math.abs(x - minRatio) < 1e-9) limiting.push(i); });
    var left = eq.reactants.map(function (r, i) { return counts[i] - sets * r[1]; });
    var made = eq.products.map(function (p) { return sets * p[1]; });
    return { ratios: ratios, sets: sets, limiting: limiting, left: left, made: made };
  }

  // ---------- State ----------

  var params = new URLSearchParams(location.search);
  var mode = params.get('mode') === 'predict' ? 'predict' : 'explore';

  var state = {
    eq: EQUATIONS[0],
    counts: EQUATIONS[0].start.slice(),
    running: false,
    timers: [],
    finish: null,
    // explore progress
    reacted: 0,
    eqsTried: {},
    exploreDone: false,
    // predict
    rounds: [],
    round: 0,
    score: 0,
    choice: null,
    checked: false
  };

  var reactBins, prodBins, tray;

  // ---------- Drawing ----------

  function drawRecipe() {
    var eq = state.eq;
    var line = $('recipe');
    line.innerHTML = '';
    function addSide(list) {
      list.forEach(function (p, i) {
        if (i > 0) line.appendChild(el('span', 'rb-plus', '+'));
        var g = el('span', 'rb-recipe-item');
        g.appendChild(el('span', 'rb-coef', String(p[1]) + ' ×'));
        g.appendChild(tile(p[0]));
        g.appendChild(el('span', 'rb-formula', f(p[0])));
        line.appendChild(g);
      });
    }
    addSide(eq.reactants);
    line.appendChild(el('span', 'rb-plus rb-yields', '→'));
    addSide(eq.products);
    $('eq-text').innerHTML = eq.name + ': <strong>' + eqHtml(eq) + '</strong>';
  }

  function scaleNote() {
    var r = currentRound();
    return r && r.scale ? ' <span class="rb-dim">(each model = ' + r.scale + ' mol)</span>' : '';
  }

  function drawReactor() {
    var eq = state.eq;
    reactBins.innerHTML = '';
    prodBins.innerHTML = '';
    eq.reactants.forEach(function (r, i) {
      var bin = el('div', 'rb-bin');
      bin.dataset.i = i;
      var head = el('div', 'rb-bin-head');
      head.appendChild(el('span', 'rb-bin-name', f(r[0])));
      head.appendChild(el('span', 'rb-bin-count', amountLabel(i)));
      bin.appendChild(head);
      var grid = el('div', 'rb-grid');
      for (var k = 0; k < state.counts[i]; k++) grid.appendChild(tile(r[0]));
      bin.appendChild(grid);
      bin.appendChild(el('p', 'rb-badge', ''));
      reactBins.appendChild(bin);
    });
    eq.products.forEach(function (p, i) {
      var bin = el('div', 'rb-bin rb-bin--product');
      var head = el('div', 'rb-bin-head');
      head.appendChild(el('span', 'rb-bin-name', f(p[0])));
      head.appendChild(el('span', 'rb-bin-count', '0'));
      bin.appendChild(head);
      bin.appendChild(el('div', 'rb-grid'));
      prodBins.appendChild(bin);
      bin.dataset.i = i;
    });
    tray.innerHTML = '&nbsp;';
  }

  function amountLabel(i) {
    var r = currentRound();
    if (mode === 'predict' && r && r.amounts) return r.amounts[i];
    return state.counts[i] + ' molecule' + (state.counts[i] === 1 ? '' : 's');
  }

  function drawBars(show) {
    var box = $('bars');
    box.innerHTML = '';
    var eq = state.eq;
    var a = analyse(eq, state.counts);
    var r = currentRound();
    var scale = (mode === 'predict' && r && r.scale) ? r.scale : 1;
    var top = Math.max.apply(null, a.ratios.concat([1]));
    eq.reactants.forEach(function (re, i) {
      var row = el('div', 'rb-bar-row');
      var amt = state.counts[i] * scale;
      var label = el('span', 'rb-bar-label',
        f(re[0]) + ': ' + fmt(amt) + (scale !== 1 ? ' mol' : '') + ' ÷ ' + re[1] + ' = <strong>' + fmt(a.ratios[i] * scale) + '</strong>');
      var track = el('span', 'rb-bar-track');
      var fill = el('span', 'rb-bar-fill');
      if (show && a.limiting.indexOf(i) !== -1) fill.classList.add('is-limiting');
      // CSSOM (allowed by the CSP), not a style attribute
      fill.style.transform = 'scaleX(' + (show ? Math.max(a.ratios[i] / top, 0.02) : 0) + ')';
      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      box.appendChild(row);
    });
  }

  // Explore: +/- buttons sit inside each reactant bin, right above its molecules
  function drawSteppers() {
    if (mode !== 'explore') return;
    reactBins.querySelectorAll('.rb-bin').forEach(function (bin, i) {
      var r = state.eq.reactants[i];
      var old = bin.querySelector('.rb-stepper');
      if (old) old.remove();
      var g = el('div', 'rb-stepper');
      var minus = el('button', 'btn btn-ghost rb-step', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Remove one ' + r[0]);
      var val = el('output', 'rb-step-val', String(state.counts[i]));
      var plus = el('button', 'btn btn-ghost rb-step', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'Add one ' + r[0]);
      minus.disabled = state.running || state.counts[i] <= 0;
      plus.disabled = state.running || state.counts[i] >= MAX;
      minus.addEventListener('click', function () { change(i, -1); });
      plus.addEventListener('click', function () { change(i, 1); });
      g.appendChild(minus); g.appendChild(val); g.appendChild(plus);
      bin.insertBefore(g, bin.querySelector('.rb-grid'));
    });
  }

  function change(i, d) {
    if (state.running) return;
    var n = state.counts[i] + d;
    if (n < 0 || n > MAX) return;
    state.counts[i] = n;
    resetReaction();
    var btn = reactBins.querySelectorAll('.rb-stepper')[i].querySelectorAll('button')[d < 0 ? 0 : 1];
    if (btn && !btn.disabled) btn.focus();
  }

  function resetReaction() {
    stopTimers();
    state.running = false;
    drawReactor();
    drawBars(mode === 'explore');
    $('sets').hidden = mode === 'predict'; // no peeking before a prediction
    $('result').hidden = true;
    $('result').innerHTML = '';
    var missing = state.counts.some(function (c) { return c === 0; });
    $('btn-react').disabled = missing;
    $('need-all').hidden = !missing;
    $('btn-skip').hidden = true;
    drawSteppers();
  }

  function stopTimers() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
  }

  // ---------- Running a reaction ----------

  function runReaction(done) {
    var eq = state.eq;
    var a = analyse(eq, state.counts);
    var rBins = reactBins.querySelectorAll('.rb-bin');
    var pBins = prodBins.querySelectorAll('.rb-bin');
    var setNo = 0;
    var step = reduceMotion ? 0 : Math.max(260, Math.min(700, 3200 / Math.max(a.sets, 1)));
    state.running = true;
    $('btn-skip').hidden = reduceMotion || a.sets < 2;
    setBusy(true);

    function takeSet(instant) {
      var picked = [];
      eq.reactants.forEach(function (r, i) {
        var live = rBins[i].querySelectorAll('.mol:not(.is-used):not(.is-picked)');
        for (var k = live.length - 1, n = 0; k >= 0 && n < r[1]; k--, n++) {
          live[k].classList.add('is-picked');
          picked.push(live[k]);
        }
      });
      setNo++;
      tray.innerHTML = 'Set ' + setNo + ': ' + sideHtml(eq.reactants) + ' → ' + sideHtml(eq.products);
      function finishSet() {
        picked.forEach(function (m) { m.classList.remove('is-picked'); m.classList.add('is-used'); });
        eq.products.forEach(function (p, i) {
          var grid = pBins[i].querySelector('.rb-grid');
          for (var n = 0; n < p[1]; n++) grid.appendChild(tile(p[0], instant ? '' : 'is-born'));
          pBins[i].querySelector('.rb-bin-count').textContent = String(setNo * p[1]) + productUnit(i, setNo * p[1]);
        });
      }
      if (instant) finishSet();
      else state.timers.push(setTimeout(finishSet, step * 0.55));
    }

    function end() {
      stopTimers();
      state.running = false;
      state.finish = null;
      $('btn-skip').hidden = true;
      setBusy(false);
      showOutcome(a);
      if (done) done(a);
    }

    state.finish = function () {
      // finish instantly: complete any set in progress and the rest
      stopTimers();
      reactBins.querySelectorAll('.is-picked').forEach(function (m) { m.classList.remove('is-picked'); m.classList.add('is-used'); });
      // products already drawn for completed sets; redraw counts from scratch to be safe
      eq.products.forEach(function (p, i) {
        var grid = pBins[i].querySelector('.rb-grid');
        grid.innerHTML = '';
      });
      // mark exactly the used reactants
      eq.reactants.forEach(function (r, i) {
        var mols = rBins[i].querySelectorAll('.mol');
        mols.forEach(function (m, k) { m.classList.toggle('is-used', k >= mols.length - a.sets * r[1]); });
      });
      eq.products.forEach(function (p, i) {
        var grid = pBins[i].querySelector('.rb-grid');
        for (var n = 0; n < a.sets * p[1]; n++) grid.appendChild(tile(p[0]));
        pBins[i].querySelector('.rb-bin-count').textContent = String(a.sets * p[1]) + productUnit(i, a.sets * p[1]);
      });
      setNo = a.sets;
      tray.innerHTML = a.sets + ' full set' + (a.sets === 1 ? '' : 's') + ' reacted.';
      end();
    };

    if (step === 0) { state.finish(); return; }

    for (var s = 0; s < a.sets; s++) {
      state.timers.push(setTimeout(function () { takeSet(false); }, s * step));
    }
    state.timers.push(setTimeout(function () {
      tray.innerHTML = a.sets + ' full set' + (a.sets === 1 ? '' : 's') + ' reacted.';
      end();
    }, a.sets * step + 80));
  }

  function productUnit(i, n) {
    var r = currentRound();
    if (mode === 'predict' && r && r.scale) return ' = ' + fmt(n * r.scale) + ' mol';
    return '';
  }

  function setBusy(b) {
    document.querySelectorAll('.rb-step, #btn-reset, #btn-react, #eq-list button').forEach(function (n) {
      if (b) { n.dataset.wasDisabled = n.disabled ? '1' : ''; n.disabled = true; }
      else { n.disabled = n.dataset.wasDisabled === '1'; }
    });
    if (!b && mode === 'explore') drawSteppers();
  }

  function showOutcome(a) {
    var eq = state.eq;
    var rBins = reactBins.querySelectorAll('.rb-bin');
    var r = currentRound();
    var scale = (mode === 'predict' && r && r.scale) ? r.scale : 1;
    var unit = scale !== 1 ? ' mol' : '';
    eq.reactants.forEach(function (re, i) {
      var badge = rBins[i].querySelector('.rb-badge');
      var isLim = a.limiting.indexOf(i) !== -1;
      rBins[i].classList.add(isLim ? 'is-limiting' : 'is-excess');
      if (isLim) {
        badge.innerHTML = '<strong>Limiting</strong>: ran out first' +
          (a.left[i] > 0 ? ' (' + fmt(a.left[i] * scale) + unit + ' left, not enough for another set)' : '');
      } else {
        badge.innerHTML = '<strong>Excess</strong>: ' + fmt(a.left[i] * scale) + unit + ' left over';
      }
      rBins[i].querySelectorAll('.mol:not(.is-used)').forEach(function (m) { m.classList.add('is-left'); });
    });
    drawBars(true);
    $('sets').hidden = false;
    if (mode === 'explore') {
      var lim = a.limiting.map(function (i) { return f(eq.reactants[i][0]); });
      var html;
      if (a.limiting.length > 1) {
        html = '<p><strong>Perfect match!</strong> Both reactants run out at the same time, so nothing is left over.</p>';
      } else {
        var ex = eq.reactants.map(function (re, i) { return a.limiting.indexOf(i) === -1 ? fmt(a.left[i]) + ' ' + f(re[0]) : null; }).filter(Boolean);
        html = '<p><strong>' + lim[0] + ' is the limiting reactant.</strong> It gives the fewest sets (' + fmt(a.ratios[a.limiting[0]]) + '). ' +
          'Excess left over: ' + ex.join(', ') + '.</p>';
      }
      html += '<p>' + a.sets + ' set' + (a.sets === 1 ? '' : 's') + ' made ' +
        eq.products.map(function (p, i) { return a.made[i] + ' ' + f(p[0]); }).join(' and ') + '.</p>';
      $('result').innerHTML = html;
      $('result').hidden = false;
    }
  }

  // ---------- Explore mode ----------

  function setupExplore() {
    $('picker').hidden = false;
    $('controls').hidden = false;
    var list = $('eq-list');
    EQUATIONS.forEach(function (eq) {
      var b = el('button', 'rb-chip', '<span class="rb-chip-name">' + eq.name + '</span><span class="rb-chip-eq">' + eqHtml(eq) + '</span>');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { pick(eq.id); });
      b.dataset.id = eq.id;
      list.appendChild(b);
    });
    $('btn-react').addEventListener('click', function () {
      if (state.running) return;
      if (!$('result').hidden) resetReaction(); // run again with the same amounts
      runReaction(function () {
        state.reacted++;
        state.eqsTried[state.eq.id] = true;
        noteExplore();
      });
    });
    $('btn-reset').addEventListener('click', function () {
      state.counts = state.eq.start.slice();
      resetReaction();
    });
    pick(EQUATIONS[0].id);
  }

  function pick(id) {
    if (state.running) return;
    state.eq = eqById(id);
    state.counts = state.eq.start.slice();
    $('eq-list').querySelectorAll('.rb-chip').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === id ? 'true' : 'false');
    });
    drawRecipe();
    resetReaction();
  }

  function noteExplore() {
    if (state.exploreDone) return;
    var tried = Object.keys(state.eqsTried).length;
    if (state.reacted >= 3 && tried >= 2) {
      state.exploreDone = true;
      markDone('explore');
      var p = el('p', 'rb-done', '<strong>Explore step complete!</strong> Keep experimenting, or <a href="../">go back to the pathway</a> for the next step.');
      $('result').appendChild(p);
    } else {
      var needR = Math.max(0, 3 - state.reacted), needE = Math.max(0, 2 - tried);
      var msg = 'To finish this step: ';
      var bits = [];
      if (needR) bits.push('react ' + needR + ' more time' + (needR === 1 ? '' : 's'));
      if (needE) bits.push('try ' + needE + ' more reaction' + (needE === 1 ? '' : 's'));
      $('result').appendChild(el('p', 'rb-dim', msg + bits.join(' and ') + '.'));
    }
  }

  // ---------- Predict mode ----------

  function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = rand(0, i); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }

  // A particle round with one clear limiting reactant that uses up exactly (no partial sets)
  function particleRound(eq) {
    for (var tries = 0; tries < 200; tries++) {
      var L = rand(0, eq.reactants.length - 1);
      var cL = eq.reactants[L][1];
      var sets = rand(2, 4);
      if (sets * cL > MAX) sets = Math.floor(MAX / cL);
      if (sets < 1) continue;
      var counts = [];
      var ok = true;
      eq.reactants.forEach(function (r, i) {
        if (i === L) { counts[i] = sets * cL; return; }
        var c = r[1] * sets + rand(1, Math.max(2, r[1] * 2));
        if (c > MAX) ok = false;
        counts[i] = c;
      });
      if (!ok) continue;
      var a = analyse(eq, counts);
      if (a.limiting.length !== 1 || a.limiting[0] !== L) continue;
      var pr = eq.products[eq.ask];
      return {
        eq: eq, counts: counts, scale: null, amounts: null, limiting: L,
        prompt: 'The reactor holds ' + counts.map(function (c, i) { return c + ' ' + f(eq.reactants[i][0]); }).join(' and ') + ' molecules.',
        askLabel: 'b) How many ' + f(pr[0]) + ' molecules form?',
        unit: f(pr[0]) + ' molecules',
        answer: a.made[eq.ask], tol: 0,
        explain: function () {
          var aa = analyse(eq, counts);
          return 'Sets: ' + eq.reactants.map(function (r, i) { return f(r[0]) + ' ' + counts[i] + ' ÷ ' + r[1] + ' = ' + fmt(aa.ratios[i]); }).join(', ') +
            '. ' + f(eq.reactants[L][0]) + ' gives the fewest sets, so it is limiting. ' +
            f(pr[0]) + ': ' + aa.sets + ' × ' + pr[1] + ' = ' + aa.made[eq.ask] + '. ' +
            eq.reactants.map(function (r, i) { return i === L ? null : 'Left over: ' + aa.left[i] + ' ' + f(r[0]) + '.'; }).filter(Boolean).join(' ');
        }
      };
    }
    return null;
  }

  function buildRounds() {
    var pool = shuffle(EQUATIONS.filter(function (e) { return e.id !== 'ammonia' && e.id !== 'alcl3'; }).slice());
    var rounds = [];
    for (var i = 0; i < pool.length && rounds.length < 3; i++) {
      var r = particleRound(pool[i]);
      if (r) rounds.push(r);
    }
    var nh3 = eqById('ammonia');
    rounds.push({
      eq: nh3, counts: [3, 6], scale: 0.5, amounts: ['1.5 mol', '3.0 mol'], limiting: 1,
      prompt: 'Now with moles. The reactor holds 1.5 mol N<sub>2</sub> and 3.0 mol H<sub>2</sub>.',
      note: 'Each model in the reactor stands for 0.5 mol.',
      askLabel: 'b) How many moles of NH<sub>3</sub> form?',
      unit: 'mol NH<sub>3</sub>', answer: 2.0, answerText: '2.0', tol: 0.05,
      explain: function () {
        return 'Sets: N<sub>2</sub> 1.5 ÷ 1 = 1.5, H<sub>2</sub> 3.0 ÷ 3 = 1.0. H<sub>2</sub> gives fewer sets, so it is limiting. ' +
          'NH<sub>3</sub>: 1.0 × 2 = 2.0 mol. Left over: 1.5 − 1.0 = 0.5 mol N<sub>2</sub>.';
      }
    });
    var al = eqById('alcl3');
    rounds.push({
      eq: al, counts: [8, 9], scale: 0.25, amounts: ['54.0 g', '159.5 g'], limiting: 1,
      prompt: 'Now with grams. The reactor holds 54.0 g Al and 159.5 g Cl<sub>2</sub>.',
      note: 'Molar masses: Al 26.98 g/mol, Cl<sub>2</sub> 70.90 g/mol, AlCl<sub>3</sub> 133.33 g/mol. Change grams to moles first! Each model stands for 0.25 mol.',
      askLabel: 'b) How many grams of AlCl<sub>3</sub> form?',
      unit: 'g AlCl<sub>3</sub>', answer: 200, tol: 2,
      explain: function () {
        return 'Moles: Al 54.0 ÷ 26.98 = 2.00 mol, Cl<sub>2</sub> 159.5 ÷ 70.90 = 2.25 mol. ' +
          'Sets: Al 2.00 ÷ 2 = 1.00, Cl<sub>2</sub> 2.25 ÷ 3 = 0.75. Cl<sub>2</sub> gives fewer sets, so it is limiting. ' +
          'AlCl<sub>3</sub>: 0.75 × 2 = 1.50 mol × 133.33 g/mol = 200 g. Left over: 2.00 − 1.50 = 0.50 mol Al.';
      }
    });
    return rounds;
  }

  function currentRound() { return mode === 'predict' ? state.rounds[state.round] : null; }

  function setupPredict() {
    $('predict').hidden = false;
    $('questions').hidden = false;
    $('controls').hidden = true;
    $('btn-check').addEventListener('click', check);
    $('btn-next').addEventListener('click', nextRound);
    $('q-amount').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (!state.checked) check(); }
    });
    $('btn-again').addEventListener('click', startPredict);
    startPredict();
  }

  function startPredict() {
    state.rounds = buildRounds();
    state.round = 0;
    state.score = 0;
    $('summary').hidden = true;
    $('questions').hidden = false;
    showRound();
  }

  function showRound() {
    var r = currentRound();
    state.eq = r.eq;
    state.counts = r.counts.slice();
    state.choice = null;
    state.checked = false;
    $('round-title').textContent = 'Round ' + (state.round + 1) + ' of ' + state.rounds.length;
    $('round-score').textContent = 'Score: ' + state.score;
    $('round-prompt').innerHTML = r.prompt + ' Predict first, then press <strong>Check and React!</strong>';
    $('round-note').hidden = !r.note;
    $('round-note').innerHTML = r.note || '';
    $('q-amount-label').innerHTML = r.askLabel;
    $('q-unit').innerHTML = r.unit;
    var inp = $('q-amount');
    inp.value = '';
    inp.disabled = false;
    inp.classList.remove('is-right', 'is-wrong');
    var box = $('q-limit');
    box.innerHTML = '';
    var opts = r.eq.reactants.map(function (re, i) { return { html: f(re[0]), v: i }; });
    opts.push({ html: 'They run out together', v: -1 });
    opts.forEach(function (o) {
      var b = el('button', 'rb-choice', o.html);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.dataset.v = o.v;
      b.addEventListener('click', function () {
        if (state.checked) return;
        state.choice = o.v;
        box.querySelectorAll('.rb-choice').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
      box.appendChild(b);
    });
    $('btn-check').hidden = false;
    $('btn-next').hidden = true;
    $('q-hint').hidden = true;
    drawRecipe();
    resetReaction();
    $('recipe-label').textContent = 'The recipe (one set)';
  }

  function readNumber(s) {
    s = String(s).trim().replace(/\s+/g, '').replace(',', '.');
    if (!/^[-+]?\d*\.?\d+$/.test(s)) return NaN;
    return parseFloat(s);
  }

  function check() {
    if (state.checked || state.running) return;
    var r = currentRound();
    var val = readNumber($('q-amount').value);
    if (state.choice === null || isNaN(val)) { $('q-hint').hidden = false; return; }
    $('q-hint').hidden = true;
    state.checked = true;
    $('q-amount').disabled = true;
    $('btn-check').hidden = true;
    var limitRight = state.choice === r.limiting;
    var amountRight = Math.abs(val - r.answer) <= r.tol + 1e-9;
    $('q-limit').querySelectorAll('.rb-choice').forEach(function (b) {
      var v = Number(b.dataset.v);
      if (v === r.limiting) b.classList.add('is-right');
      else if (v === state.choice) b.classList.add('is-wrong');
      b.disabled = true;
    });
    $('q-amount').classList.add(amountRight ? 'is-right' : 'is-wrong');
    runReaction(function () {
      if (limitRight && amountRight) state.score++;
      $('round-score').textContent = 'Score: ' + state.score;
      var head = limitRight && amountRight ? '<strong class="rb-good">Both right!</strong>'
        : limitRight ? '<strong class="rb-half">Limiting reactant right, amount not quite.</strong>'
        : amountRight ? '<strong class="rb-half">Amount right, limiting reactant not quite.</strong>'
        : '<strong class="rb-bad">Not this time.</strong>';
      $('result').innerHTML = '<p>' + head + ' The answer: ' + f(r.eq.reactants[r.limiting][0]) + ' is limiting, and ' +
        (r.answerText || fmt(r.answer)) + ' ' + r.unit + ' form.</p><p>' + r.explain() + '</p>';
      $('result').hidden = false;
      var last = state.round === state.rounds.length - 1;
      var next = $('btn-next');
      next.textContent = last ? 'See my score →' : 'Next round →';
      next.hidden = false;
      next.focus();
    });
  }

  function nextRound() {
    if (state.round < state.rounds.length - 1) {
      state.round++;
      showRound();
      $('round-title').focus();
      return;
    }
    // finished
    var passed = state.score >= 3;
    if (passed) markDone('predict');
    $('questions').hidden = true;
    $('result').hidden = true;
    var s = $('summary');
    $('summary-title').textContent = passed ? 'Predict step complete!' : 'Almost there!';
    $('summary-text').innerHTML = 'You got <strong>' + state.score + ' of ' + state.rounds.length + '</strong> rounds fully right. ' +
      (passed ? 'Professor Mole is impressed. Head back to the pathway for the next step.'
        : 'Get at least 3 rounds right to finish this step. Remember: sets = amount ÷ coefficient, and the smallest wins.');
    s.hidden = false;
    $('summary-title').setAttribute('tabindex', '-1');
    $('summary-title').focus();
  }

  // ---------- Progress ----------

  function markDone(step) {
    try { if (window.MRDProgress) window.MRDProgress.markDone(PATHWAY, step); } catch (e) { /* storage blocked */ }
  }

  // ---------- Legend and start ----------

  function drawLegend() {
    var ul = $('legend');
    Object.keys(ATOMS).forEach(function (k) {
      var li = el('li', null);
      var dot = el('span', 'rb-dot');
      dot.style.background = ATOMS[k].c; // CSSOM, allowed by the CSP
      li.appendChild(dot);
      li.appendChild(document.createTextNode(k + ' ' + ATOMS[k].name));
      ul.appendChild(li);
    });
  }

  function init() {
    reactBins = $('react-bins');
    prodBins = $('prod-bins');
    tray = $('tray');
    $('round-title').setAttribute('tabindex', '-1');
    var cur = $('mode-' + mode);
    cur.setAttribute('aria-current', 'page');
    document.title = (mode === 'predict' ? 'Predict' : 'Explore') + ' · ' + document.title;
    $('btn-skip').addEventListener('click', function () { if (state.finish) state.finish(); });
    drawLegend();
    if (mode === 'predict') setupPredict();
    else setupExplore();
  }

  // Test hook for automated checks
  window.__RB_TEST__ = { analyse: analyse, EQUATIONS: EQUATIONS, buildRounds: buildRounds, state: state };

  init();
})();
