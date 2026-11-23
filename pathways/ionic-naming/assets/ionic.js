/*
  Ionic Naming and Polyatomics: the ion puzzle board and the digital worksheet.
  Each part page sets <body data-part="formulas|naming|polyatomics|roman">.

  Puzzle idea (same as the paper pieces): a piece is as tall as its charge.
  Each unit of charge is one ">" tooth on a cation or one notch on an anion.
  The compound is neutral when both columns are the same height.

  Answers typed into the worksheet are saved only in this browser (localStorage).
*/
(function () {
  'use strict';

  /* Teacher code for the "Teacher's Initials" checkpoints. Change it here. */
  var TEACHER_CODE = '0019';

  var PATHWAY = 'ionic-naming';
  var MAX_UNITS = 12; /* most charge one side of the board can hold */
  var MAX_ROWS = 9;

  /* ---------- Ions ---------- */
  var IONS = {
    Li: { sym: 'Li', q: 1, name: 'lithium' },
    Na: { sym: 'Na', q: 1, name: 'sodium' },
    K: { sym: 'K', q: 1, name: 'potassium' },
    H: { sym: 'H', q: 1, name: 'hydrogen' },
    Mg: { sym: 'Mg', q: 2, name: 'magnesium' },
    Ca: { sym: 'Ca', q: 2, name: 'calcium' },
    Ba: { sym: 'Ba', q: 2, name: 'barium' },
    Zn: { sym: 'Zn', q: 2, name: 'zinc' },
    Al: { sym: 'Al', q: 3, name: 'aluminum', alt: ['aluminium'] },
    Cu1: { sym: 'Cu', q: 1, name: 'copper(I)', tm: true },
    Cu2: { sym: 'Cu', q: 2, name: 'copper(II)', tm: true },
    Fe2: { sym: 'Fe', q: 2, name: 'iron(II)', tm: true },
    Fe3: { sym: 'Fe', q: 3, name: 'iron(III)', tm: true },
    NH4: { sym: 'NH4', q: 1, name: 'ammonium', poly: true },
    F: { sym: 'F', q: -1, name: 'fluoride' },
    Cl: { sym: 'Cl', q: -1, name: 'chloride' },
    Br: { sym: 'Br', q: -1, name: 'bromide' },
    I: { sym: 'I', q: -1, name: 'iodide' },
    O: { sym: 'O', q: -2, name: 'oxide' },
    S: { sym: 'S', q: -2, name: 'sulfide', alt: ['sulphide'] },
    N: { sym: 'N', q: -3, name: 'nitride' },
    P: { sym: 'P', q: -3, name: 'phosphide' },
    OH: { sym: 'OH', q: -1, name: 'hydroxide', poly: true },
    NO3: { sym: 'NO3', q: -1, name: 'nitrate', poly: true },
    HCO3: { sym: 'HCO3', q: -1, name: 'hydrogen carbonate', alt: ['bicarbonate'], poly: true },
    SO4: { sym: 'SO4', q: -2, name: 'sulfate', alt: ['sulphate'], poly: true },
    CO3: { sym: 'CO3', q: -2, name: 'carbonate', poly: true },
    PO4: { sym: 'PO4', q: -3, name: 'phosphate', poly: true }
  };

  var PARTS = {
    formulas: {
      step: 'formulas', tone: 'yellow', names: false,
      cations: ['Li', 'Na', 'K', 'Mg', 'Ca', 'Zn', 'Al'],
      anions: ['F', 'Cl', 'Br', 'O', 'S', 'N', 'P'],
      cols: ['catF', 'anF', 'formula', 'charge'],
      example: { cat: 'Al', an: 'Cl' }
    },
    naming: {
      step: 'naming', tone: 'blue', names: true,
      cations: ['Li', 'Na', 'K', 'Mg', 'Ca', 'Ba', 'Al'],
      anions: ['F', 'Cl', 'Br', 'I', 'O', 'S', 'N', 'P'],
      cols: ['catF', 'anF', 'formula', 'name']
    },
    polyatomics: {
      step: 'polyatomics', tone: 'blue', names: true, requirePoly: true,
      cations: ['Na', 'K', 'Mg', 'Ca', 'Ba', 'Al', 'NH4'],
      anions: ['Cl', 'O', 'S', 'OH', 'NO3', 'HCO3', 'SO4', 'CO3', 'PO4'],
      cols: ['catF', 'catN', 'anF', 'anN', 'formula', 'name'],
      example: { cat: 'Ca', an: 'NO3' }
    },
    roman: {
      step: 'roman', tone: 'blue', names: true,
      cations: ['Cu1', 'Cu2', 'Fe2', 'Fe3'],
      anions: ['Cl', 'O', 'S', 'NO3', 'SO4'],
      cols: ['catF', 'anF', 'formula', 'name']
    }
  };

  var COL_HEADS = {
    catF: 'Cation formula', catN: 'Cation name', anF: 'Anion formula', anN: 'Anion name',
    formula: 'Compound formula', charge: 'Net charge', name: 'Compound name'
  };

  var partId = document.body.getAttribute('data-part');
  var part = PARTS[partId];
  if (!part) return;

  /* ---------- Storage (never required) ---------- */
  var STORE_KEY = 'mrd-ionic:' + partId;
  var NAME_KEY = 'mrd-ionic:student';
  function load(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) { return fallback; }
  }
  function save(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* page still works */ }
  }
  var state = load(STORE_KEY, null);
  if (!state || typeof state !== 'object') state = {};
  if (!state.fields || typeof state.fields !== 'object') state.fields = {};
  if (!Array.isArray(state.rows)) state.rows = [];
  state.rows = state.rows.filter(function (row) { return row && IONS[row.cat] && IONS[row.an]; }).slice(0, MAX_ROWS);
  state.approved = state.approved && typeof state.approved === 'object' ? state.approved : {};
  function persist() { save(STORE_KEY, state); }

  /* ---------- Chemistry helpers ---------- */
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function piece(ion, n) {
    if (n === 1) return ion.sym;
    return ion.poly ? '(' + ion.sym + ')' + n : ion.sym + n;
  }
  function formulaFor(catId, anId, catN, anN) {
    var cat = IONS[catId];
    var an = IONS[anId];
    if (!catN) {
      var g = gcd(cat.q, -an.q);
      catN = -an.q / g;
      anN = cat.q / g;
    }
    return piece(cat, catN) + piece(an, anN);
  }
  function nameFor(catId, anId) { return IONS[catId].name + ' ' + IONS[anId].name; }
  function namesFor(catId, anId) {
    var cats = [IONS[catId].name].concat(IONS[catId].alt || []);
    var ans = [IONS[anId].name].concat(IONS[anId].alt || []);
    var all = [];
    cats.forEach(function (c) { ans.forEach(function (a) { all.push(c + ' ' + a); }); });
    return all;
  }
  function chargeText(q) {
    var size = Math.abs(q);
    return (size === 1 ? '' : String(size)) + (q > 0 ? '+' : '−');
  }

  /* ---------- Formula rendering (digits after a symbol become subscripts) ---------- */
  function renderFormula(el, text) {
    el.textContent = '';
    var run = '';
    var subRun = '';
    var prev = '';
    function flushText() { if (run) { el.appendChild(document.createTextNode(run)); run = ''; } }
    function flushSub() {
      if (subRun) {
        var sub = document.createElement('sub');
        sub.textContent = subRun;
        el.appendChild(sub);
        subRun = '';
      }
    }
    for (var i = 0; i < text.length; i += 1) {
      var ch = text.charAt(i);
      var isDigit = ch >= '0' && ch <= '9';
      if (isDigit && (subRun || /[A-Za-z)\]]/.test(prev))) {
        flushText();
        subRun += ch;
      } else {
        flushSub();
        run += ch;
      }
      prev = ch;
    }
    flushText();
    flushSub();
  }
  function ionLabel(el, ion) {
    var sym = document.createElement('span');
    renderFormula(sym, ion.sym);
    var sup = document.createElement('sup');
    sup.textContent = chargeText(ion.q);
    el.appendChild(sym);
    el.appendChild(sup);
  }
  function ionSpeech(ion) {
    var size = Math.abs(ion.q);
    return ion.sym + ' ' + (size === 1 ? '' : size + ' ') + (ion.q > 0 ? 'plus' : 'minus') + ' (' + ion.name + ')';
  }

  /* ---------- Answer checking ---------- */
  var SUBS = '₀₁₂₃₄₅₆₇₈₉';
  function cleanFormula(text) {
    return String(text || '').replace(/[₀-₉]/g, function (c) { return String(SUBS.indexOf(c)); }).replace(/\s+/g, '');
  }
  function cleanName(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ')').replace(/\)(?=\S)/g, ') ').trim();
  }
  function cleanCharge(text) {
    var t = String(text || '').replace(/\s+/g, '').toLowerCase();
    return t === '0' || t === '+0' || t === '-0' || t === 'zero' || t === '±0';
  }
  function formulaHint(typed, expected, extra) {
    if (!typed) return 'Fill this in.';
    if (typed.toLowerCase() === expected.toLowerCase()) return 'Check your capital letters (Co is cobalt, CO is carbon + oxygen).';
    var bare = function (s) { return s.replace(/[()]/g, ''); };
    if (bare(typed) === bare(expected)) {
      return expected.indexOf('(') === -1 ? 'Only use parentheses when you need 2 or more of a polyatomic ion.' : 'Put the polyatomic ion in parentheses before its subscript.';
    }
    if (extra && extra.unreduced && typed === extra.unreduced) return 'Balanced, but use the smallest whole-number ratio.';
    if (extra && extra.anSym && typed.indexOf(extra.anSym) === 0 && typed.indexOf(extra.catSym) !== 0) return 'Which ion is written first?';
    return 'Count the pieces on each side again.';
  }
  function setMark(input, ok, hint) {
    var cell = input.closest('td') || input.parentNode;
    var mark = cell.querySelector('.mark');
    if (!mark) {
      mark = document.createElement('span');
      mark.className = 'mark';
      cell.appendChild(mark);
    }
    var hintEl = cell.querySelector('.cell-hint');
    if (!hintEl) {
      hintEl = document.createElement('span');
      hintEl.className = 'cell-hint';
      cell.appendChild(hintEl);
    }
    input.classList.toggle('is-right', ok);
    input.classList.toggle('is-wrong', !ok);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    mark.textContent = ok ? '✓' : '✗';
    mark.setAttribute('aria-label', ok ? 'Correct' : 'Not yet');
    hintEl.textContent = ok ? '' : (hint || '');
  }
  function clearMark(input) {
    input.classList.remove('is-right', 'is-wrong');
    input.removeAttribute('aria-invalid');
    var cell = input.closest('td') || input.parentNode;
    var mark = cell.querySelector('.mark');
    var hintEl = cell.querySelector('.cell-hint');
    if (mark) mark.textContent = '';
    if (hintEl) hintEl.textContent = '';
  }
  function checkStatic(input) {
    var kind = input.getAttribute('data-kind');
    var answers = input.getAttribute('data-answer').split('|');
    var value = input.value;
    if (kind === 'formula') {
      var typed = cleanFormula(value);
      var ok = answers.indexOf(typed) !== -1;
      setMark(input, ok, ok ? '' : formulaHint(typed, answers[0]));
      return ok;
    }
    if (kind === 'roman') {
      var roman = value.replace(/\s+/g, '').toUpperCase();
      var good = answers.indexOf(roman) !== -1;
      setMark(input, good, good ? '' : (roman ? 'I = 1, V = 5, X = 10.' : 'Fill this in.'));
      return good;
    }
    var name = cleanName(value);
    var right = answers.map(cleanName).indexOf(name) !== -1;
    setMark(input, right, right ? '' : (name ? 'Cation name first, then the anion name.' : 'Fill this in.'));
    return right;
  }

  /* ---------- Formula previews (shows subscripts as students type) ---------- */
  function attachPreview(input) {
    var preview = document.createElement('span');
    preview.className = 'fx-preview';
    preview.setAttribute('aria-hidden', 'true');
    input.insertAdjacentElement('afterend', preview);
    function update() { renderFormula(preview, cleanFormula(input.value)); }
    input.addEventListener('input', update);
    update();
  }

  /* ---------- Saved worksheet fields ---------- */
  var nameInput = document.getElementById('student-name');
  if (nameInput) {
    var savedName = load(NAME_KEY, '');
    if (typeof savedName === 'string') nameInput.value = savedName;
    nameInput.addEventListener('input', function () { save(NAME_KEY, nameInput.value); });
  }
  document.querySelectorAll('.ws input[id], .ws textarea[id]').forEach(function (field) {
    if (field.id === 'student-name' || field.classList.contains('no-save')) return;
    if (typeof state.fields[field.id] === 'string') field.value = state.fields[field.id];
    field.addEventListener('input', function () {
      state.fields[field.id] = field.value;
      persist();
      if (field.hasAttribute('data-answer')) clearMark(field);
    });
    if (field.getAttribute('data-kind') === 'formula') attachPreview(field);
  });

  document.querySelectorAll('[data-check]').forEach(function (button) {
    var section = document.getElementById(button.getAttribute('data-check'));
    var result = section.querySelector('.check-result');
    button.addEventListener('click', function () {
      var inputs = section.querySelectorAll('input[data-answer]');
      var right = 0;
      inputs.forEach(function (input) { if (checkStatic(input)) right += 1; });
      result.textContent = right === inputs.length ? 'All ' + right + ' correct. Nice work!' : right + ' of ' + inputs.length + ' correct. Look at the hints next to the ✗ marks.';
    });
  });

  /* ---------- Teacher checkpoints ---------- */
  function renderCheckpoint(cp) {
    var id = cp.id;
    var zone = document.getElementById(cp.getAttribute('data-unlocks'));
    var approved = state.approved[id] === true;
    cp.classList.toggle('is-approved', approved);
    cp.querySelector('.cp-form').hidden = approved;
    cp.querySelector('.cp-done').hidden = !approved;
    if (zone) {
      zone.classList.toggle('is-locked', !approved);
      if (approved) zone.removeAttribute('inert'); else zone.setAttribute('inert', '');
      var note = document.querySelector('[data-lock-note="' + zone.id + '"]');
      if (note) note.hidden = approved;
    }
  }
  document.querySelectorAll('.checkpoint').forEach(function (cp) {
    var form = cp.querySelector('.cp-form');
    var code = cp.querySelector('.cp-code');
    var msg = cp.querySelector('.cp-msg');
    var rule = document.getElementById(cp.getAttribute('data-needs'));
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (rule && !rule.value.trim()) {
        msg.textContent = 'Write your rule first, then show it to your teacher.';
        rule.focus();
        return;
      }
      if (code.value.trim() !== TEACHER_CODE) {
        msg.textContent = 'That code didn’t work. Ask your teacher.';
        code.select();
        return;
      }
      state.approved[cp.id] = true;
      persist();
      code.value = '';
      msg.textContent = '';
      renderCheckpoint(cp);
      var zone = document.getElementById(cp.getAttribute('data-unlocks'));
      var focusable = zone && zone.querySelector('h2');
      if (focusable) { focusable.setAttribute('tabindex', '-1'); focusable.focus(); }
    });
    renderCheckpoint(cp);
  });

  /* ---------- Print + finish ---------- */
  document.querySelectorAll('[data-print]').forEach(function (button) {
    button.addEventListener('click', function () { window.print(); });
  });
  document.querySelectorAll('[data-finish]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.MRDProgress) window.MRDProgress.markDone(PATHWAY, part.step);
    });
  });

  /* ---------- Ion puzzle board ---------- */
  var lab = document.querySelector('.lab');
  if (!lab) return;

  var board = { cat: null, catN: 0, an: null, anN: 0 };
  var status = lab.querySelector('.lab-status');
  var boardEl = lab.querySelector('.board');
  var colCat = lab.querySelector('.col-cat');
  var colAn = lab.querySelector('.col-an');
  var recordBtn = lab.querySelector('[data-record]');
  var clearBtn = lab.querySelector('[data-clear]');
  var flipBtn = lab.querySelector('[data-flip]');
  var showNames = false;

  function tone(ion) { return ion.poly ? 'pink' : part.tone; }
  function makeTile(id, side, mini) {
    var ion = IONS[id];
    var tile = document.createElement('span');
    tile.className = 'tile ' + side + ' u' + Math.abs(ion.q) + ' t-' + tone(ion);
    var face = document.createElement('span');
    face.className = 'tile-face';
    var label = document.createElement('span');
    label.className = 'tile-ion';
    ionLabel(label, ion);
    face.appendChild(label);
    if (part.names && (!mini || showNames)) {
      var nm = document.createElement('span');
      nm.className = 'tile-name';
      nm.textContent = ion.name;
      if (mini) { face.textContent = ''; }
      face.appendChild(nm);
    }
    tile.appendChild(face);
    return tile;
  }

  function buildTray() {
    [['cations', '.tray-cat', 'cat'], ['anions', '.tray-an', 'an']].forEach(function (group) {
      var list = lab.querySelector(group[1]);
      list.textContent = '';
      part[group[0]].forEach(function (id) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'tray-btn';
        button.setAttribute('aria-label', 'Add ' + ionSpeech(IONS[id]));
        button.appendChild(makeTile(id, group[2], true));
        button.addEventListener('click', function () { add(group[2], id); });
        list.appendChild(button);
      });
    });
  }

  function say(text, tone2) {
    status.textContent = text;
    status.setAttribute('data-tone', tone2 || '');
  }

  function add(side, id) {
    var ion = IONS[id];
    var current = board[side];
    var count = board[side + 'N'];
    if (current && current !== id) {
      say('Use one kind of ' + (side === 'cat' ? 'cation' : 'anion') + ' at a time. Tap a piece on the board to remove it, or tap Clear.', 'warn');
      return;
    }
    if ((count + 1) * Math.abs(ion.q) > MAX_UNITS) {
      say('That side of the board is full. Try a smaller set of pieces.', 'warn');
      return;
    }
    board[side] = id;
    board[side + 'N'] = count + 1;
    render(true);
  }
  function remove(side) {
    board[side + 'N'] -= 1;
    if (!board[side + 'N']) board[side] = null;
    render(true);
    /* keep keyboard users in place: focus a remaining piece on that side, else Clear */
    var col = side === 'cat' ? colCat : colAn;
    var left = col.querySelectorAll('.tile-btn');
    (left.length ? left[left.length - 1] : clearBtn).focus();
  }

  function balanced() {
    return board.cat && board.an && board.catN * IONS[board.cat].q === board.anN * -IONS[board.an].q;
  }

  function renderColumn(col, side) {
    col.textContent = '';
    var id = board[side];
    if (!id) {
      var slot = document.createElement('span');
      slot.className = 'slot';
      slot.textContent = side === 'cat' ? 'Cations' : 'Anions';
      col.appendChild(slot);
      return;
    }
    for (var i = 0; i < board[side + 'N']; i += 1) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'tile-btn';
      button.setAttribute('aria-label', 'Remove one ' + ionSpeech(IONS[id]));
      button.appendChild(makeTile(id, side, false));
      button.addEventListener('click', function () { remove(side); });
      col.appendChild(button);
    }
  }

  function render(announce) {
    renderColumn(colCat, 'cat');
    renderColumn(colAn, 'an');
    var plus = board.cat ? board.catN * IONS[board.cat].q : 0;
    var minus = board.an ? board.anN * IONS[board.an].q : 0;
    var neutral = balanced();
    var polyOk = !part.requirePoly || (neutral && (IONS[board.cat].poly || IONS[board.an].poly));
    boardEl.classList.toggle('is-neutral', !!neutral);
    recordBtn.disabled = !(neutral && polyOk);
    if (!announce) {
      say('Tap a piece in the trays to put it on the board. Tap a piece on the board to take it off.');
      return;
    }
    var sums = 'Positive charge +' + plus + ', negative charge ' + (minus ? '−' + -minus : '0') + '. ';
    if (!board.cat && !board.an) say('The board is empty. Tap a piece in the trays to start.');
    else if (!board.cat) say(sums + 'Now add a cation.');
    else if (!board.an) say(sums + 'Now add an anion.');
    else if (!neutral) {
      var net = plus + minus;
      say(sums + 'Net charge ' + (net > 0 ? '+' : '−') + Math.abs(net) + '. The edges don’t match yet. Add or remove pieces until both sides are the same height.');
    } else if (!polyOk) say(sums + 'Net charge 0. Neutral! This part needs at least one pink polyatomic piece, though.', 'warn');
    else if (gcd(board.catN, board.anN) > 1) say(sums + 'Net charge 0. Neutral! You could do it with fewer pieces; formulas use the smallest set. You can still record it.', 'good');
    else say(sums + 'Net charge 0. Neutral compound! Record it in the table.', 'good');
  }

  clearBtn.addEventListener('click', function () {
    board = { cat: null, catN: 0, an: null, anN: 0 };
    render(true);
  });
  if (flipBtn) {
    flipBtn.addEventListener('click', function () {
      showNames = !showNames;
      flipBtn.setAttribute('aria-pressed', showNames ? 'true' : 'false');
      flipBtn.textContent = showNames ? 'Flip cards: show formulas' : 'Flip cards: show names';
      buildTray();
    });
  }

  /* ---------- Recording table ---------- */
  var table = document.querySelector('.record-table');
  var tbody = table.querySelector('tbody');
  var tableMsg = document.querySelector('.record-msg');

  (function buildHead() {
    var tr = document.createElement('tr');
    part.cols.concat(['remove']).forEach(function (col) {
      var th = document.createElement('th');
      th.scope = 'col';
      if (col === 'remove') {
        var hidden = document.createElement('span');
        hidden.className = 'sr-only';
        hidden.textContent = 'Remove row';
        th.appendChild(hidden);
      } else th.textContent = COL_HEADS[col];
      tr.appendChild(th);
    });
    table.querySelector('thead').appendChild(tr);
  }());

  function ionCell(td, id) {
    var span = document.createElement('span');
    span.className = 'ion-text';
    ionLabel(span, IONS[id]);
    td.appendChild(span);
  }

  function renderExample() {
    if (!part.example) return;
    var ex = part.example;
    var tr = document.createElement('tr');
    tr.className = 'example-row';
    part.cols.concat(['remove']).forEach(function (col) {
      var td = document.createElement('td');
      if (col === 'catF') ionCell(td, ex.cat);
      else if (col === 'anF') ionCell(td, ex.an);
      else if (col === 'catN') td.textContent = IONS[ex.cat].name;
      else if (col === 'anN') td.textContent = IONS[ex.an].name;
      else if (col === 'formula') renderFormula(td, formulaFor(ex.cat, ex.an));
      else if (col === 'charge') td.textContent = '0';
      else if (col === 'name') td.textContent = nameFor(ex.cat, ex.an);
      else {
        var tag = document.createElement('span');
        tag.className = 'example-tag';
        tag.textContent = 'Example';
        td.appendChild(tag);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  function renderRows() {
    tbody.textContent = '';
    renderExample();
    state.rows.forEach(function (row, index) {
      var tr = document.createElement('tr');
      part.cols.forEach(function (col) {
        var td = document.createElement('td');
        if (col === 'catF') ionCell(td, row.cat);
        else if (col === 'anF') ionCell(td, row.an);
        else if (col === 'catN') td.textContent = IONS[row.cat].name;
        else if (col === 'anN') td.textContent = IONS[row.an].name;
        else {
          var input = document.createElement('input');
          input.type = 'text';
          input.className = 'cell-in';
          input.autocomplete = 'off';
          input.spellcheck = false;
          input.setAttribute('autocapitalize', 'off');
          input.setAttribute('data-col', col);
          if (col === 'charge') input.setAttribute('inputmode', 'numeric');
          input.setAttribute('aria-label', COL_HEADS[col] + ', row ' + (index + 1) + ' (' + IONS[row.cat].sym + ' and ' + IONS[row.an].sym + ')');
          input.value = typeof row[col] === 'string' ? row[col] : '';
          input.addEventListener('input', function () {
            row[col] = input.value;
            persist();
            clearMark(input);
          });
          td.appendChild(input);
          if (col === 'formula') attachPreview(input);
        }
        tr.appendChild(td);
      });
      var tdRemove = document.createElement('td');
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'row-remove';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', 'Remove row ' + (index + 1));
      removeBtn.addEventListener('click', function () {
        state.rows.splice(index, 1);
        persist();
        renderRows();
        tableMsg.textContent = 'Row removed.';
        var removeBtns = tbody.querySelectorAll('.row-remove');
        var next = removeBtns[Math.min(index, removeBtns.length - 1)];
        (next || document.querySelector('[data-check-rows]')).focus();
      });
      tdRemove.appendChild(removeBtn);
      tr.appendChild(tdRemove);
      tbody.appendChild(tr);
    });
    var left = MAX_ROWS - state.rows.length;
    document.querySelector('.rows-left').textContent = state.rows.length + ' of ' + MAX_ROWS + ' rows filled.';
    recordBtn.setAttribute('data-full', left ? 'false' : 'true');
  }

  recordBtn.addEventListener('click', function () {
    if (!balanced()) return;
    var exists = state.rows.some(function (row) { return row.cat === board.cat && row.an === board.an; });
    var isExample = part.example && part.example.cat === board.cat && part.example.an === board.an;
    if (exists || isExample) {
      say('That compound is already in the table. Try a different type of compound.', 'warn');
      return;
    }
    if (state.rows.length >= MAX_ROWS) {
      say('The table is full. Remove a row to record a new compound.', 'warn');
      return;
    }
    state.rows.push({ cat: board.cat, an: board.an, catN: board.catN, anN: board.anN });
    persist();
    renderRows();
    say('Recorded! Now fill in the new row of the table.', 'good');
    var inputs = tbody.querySelectorAll('tr:last-child .cell-in');
    if (inputs.length) inputs[0].focus();
  });

  document.querySelector('[data-check-rows]').addEventListener('click', function () {
    var total = 0;
    var right = 0;
    state.rows.forEach(function (row, index) {
      var tr = tbody.children[index + (part.example ? 1 : 0)];
      tr.querySelectorAll('.cell-in').forEach(function (input) {
        var col = input.getAttribute('data-col');
        var ok;
        total += 1;
        if (col === 'formula') {
          var expected = formulaFor(row.cat, row.an);
          var typed = cleanFormula(input.value);
          ok = typed === expected;
          setMark(input, ok, ok ? '' : formulaHint(typed, expected, {
            unreduced: row.catN ? formulaFor(row.cat, row.an, row.catN, row.anN) : '',
            anSym: IONS[row.an].sym,
            catSym: IONS[row.cat].sym
          }));
        } else if (col === 'charge') {
          ok = cleanCharge(input.value);
          setMark(input, ok, ok ? '' : (input.value.trim() ? 'A neutral compound has no leftover charge.' : 'Fill this in.'));
        } else {
          ok = namesFor(row.cat, row.an).map(cleanName).indexOf(cleanName(input.value)) !== -1;
          setMark(input, ok, ok ? '' : (input.value.trim() ? 'Use the names on the cards: cation first, then anion.' : 'Fill this in.'));
        }
        if (ok) right += 1;
      });
    });
    tableMsg.textContent = !total ? 'Record a compound from the board first.' : (right === total ? 'All ' + total + ' answers correct!' : right + ' of ' + total + ' answers correct. Look at the hints next to the ✗ marks.');
  });

  buildTray();
  renderRows();
  render(false);
}());
