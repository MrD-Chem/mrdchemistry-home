(function () {
  'use strict';
  // All HTML below is authored lesson content, never student input.
  var questions = [
    {
      prompt: '2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O. You have 6 H<sub>2</sub> molecules and 5 O<sub>2</sub> molecules. Which is the limiting reactant?',
      choices: ['H<sub>2</sub>', 'O<sub>2</sub>', 'H<sub>2</sub>O', 'Neither'], answer: 0,
      explanation: 'Sets: H<sub>2</sub> 6 ÷ 2 = 3, O<sub>2</sub> 5 ÷ 1 = 5. H<sub>2</sub> gives fewer sets.'
    },
    {
      prompt: 'Same reaction: 2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O, with 6 H<sub>2</sub> molecules and 5 O<sub>2</sub> molecules. How many H<sub>2</sub>O molecules form?',
      min: 6, max: 6, unit: 'H₂O molecules', answerText: '6 H<sub>2</sub>O molecules',
      explanation: '3 sets × 2 H<sub>2</sub>O = 6 H<sub>2</sub>O. (2 O<sub>2</sub> are left over.)'
    },
    {
      prompt: 'N<sub>2</sub> + 3H<sub>2</sub> → 2NH<sub>3</sub>. You have 2.0 mol N<sub>2</sub> and 4.5 mol H<sub>2</sub>. Which is limiting?',
      choices: ['N<sub>2</sub>', 'H<sub>2</sub>', 'NH<sub>3</sub>', 'Neither'], answer: 1,
      explanation: 'Sets: N<sub>2</sub> 2.0 ÷ 1 = 2.0, H<sub>2</sub> 4.5 ÷ 3 = 1.5. H<sub>2</sub> gives fewer sets.'
    },
    {
      prompt: 'Same reaction: N<sub>2</sub> + 3H<sub>2</sub> → 2NH<sub>3</sub>, with 2.0 mol N<sub>2</sub> and 4.5 mol H<sub>2</sub>. How many moles of NH<sub>3</sub> form?',
      min: 2.95, max: 3.05, unit: 'mol NH₃', answerText: '3.0 mol NH<sub>3</sub>',
      explanation: '1.5 sets × 2 = 3.0 mol NH<sub>3</sub>.'
    },
    {
      prompt: '4Fe + 3O<sub>2</sub> → 2Fe<sub>2</sub>O<sub>3</sub>. You have 22.34 g Fe and 4.80 g O<sub>2</sub> (Fe 55.85, O<sub>2</sub> 32.00, Fe<sub>2</sub>O<sub>3</sub> 159.70 g/mol). How many grams of Fe<sub>2</sub>O<sub>3</sub> form?',
      min: 15.8, max: 16.1, unit: 'g Fe₂O₃', answerText: '16.0 g Fe<sub>2</sub>O<sub>3</sub>',
      explanation: 'Fe 22.34 ÷ 55.85 = 0.400 mol → 0.400 ÷ 4 = 0.100 sets. O<sub>2</sub> 4.80 ÷ 32.00 = 0.150 mol → 0.150 ÷ 3 = 0.050 sets. O<sub>2</sub> is limiting. Fe<sub>2</sub>O<sub>3</sub> = 0.050 × 2 = 0.100 mol × 159.70 = 16.0 g.'
    }
  ];
  var id = 'limiting-reactants';
  var index = 0;
  var score = 0;
  var answered = false;
  var form = document.getElementById('quiz-form');
  var controls = document.getElementById('answer-controls');
  var title = document.getElementById('question-title');
  var check = document.getElementById('check-answer');
  var next = document.getElementById('next-question');
  var feedback = document.getElementById('feedback');
  var error = document.getElementById('quiz-error');
  function render(focus) {
    var q = questions[index];
    answered = false;
    document.getElementById('results').hidden = true;
    document.getElementById('question-panel').hidden = false;
    document.getElementById('question-count').textContent = 'Question ' + (index + 1) + ' of 5';
    title.innerHTML = q.prompt;
    controls.replaceChildren();
    if (q.choices) {
      var fieldset = document.createElement('fieldset');
      fieldset.className = 'quiz-options';
      var legend = document.createElement('legend');
      legend.textContent = 'Choose one answer';
      fieldset.appendChild(legend);
      q.choices.forEach(function (choice, choiceIndex) {
        var label = document.createElement('label');
        label.className = 'choice';
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = String(choiceIndex);
        var text = document.createElement('span');
        text.innerHTML = choice;
        label.append(input, text);
        fieldset.appendChild(label);
      });
      controls.appendChild(fieldset);
    } else {
      var label = document.createElement('label');
      label.className = 'numeric-label';
      label.htmlFor = 'numeric-answer';
      label.textContent = 'Your answer (' + q.unit + ')';
      var input = document.createElement('input');
      input.id = 'numeric-answer';
      input.name = 'answer';
      input.className = 'numeric-answer';
      input.type = 'text';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.setAttribute('aria-describedby', 'numeric-help quiz-error');
      var help = document.createElement('p');
      help.id = 'numeric-help';
      help.className = 'numeric-help';
      help.textContent = 'Enter a number only. A decimal point or decimal comma is OK.';
      controls.append(label, input, help);
    }
    check.disabled = false;
    feedback.hidden = true;
    error.hidden = true;
    error.textContent = '';
    next.hidden = true;
    next.textContent = index === questions.length - 1 ? 'See my score →' : 'Next question →';
    if (focus) title.focus();
  }
  function invalid(message) {
    error.textContent = message;
    error.hidden = false;
    var input = controls.querySelector('input');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (answered) return;
    var q = questions[index];
    var correct;
    if (q.choices) {
      var selected = controls.querySelector('input:checked');
      if (!selected) { invalid('Choose an answer first.'); return; }
      correct = Number(selected.value) === q.answer;
    } else {
      var raw = document.getElementById('numeric-answer').value.trim().replace(/\s+/g, '').replace(/,/g, '.');
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) || !Number.isFinite(Number(raw))) {
        invalid('Enter a number, such as 3 or 3.0, without units.');
        return;
      }
      correct = Number(raw) >= q.min && Number(raw) <= q.max;
    }
    answered = true;
    if (correct) score += 1;
    controls.querySelectorAll('input').forEach(function (input) { input.disabled = true; input.removeAttribute('aria-invalid'); });
    check.disabled = true;
    error.hidden = true;
    error.textContent = '';
    feedback.classList.toggle('is-correct', correct);
    document.getElementById('feedback-title').textContent = correct ? 'Correct!' : 'Not quite. Here’s how to find it.';
    document.getElementById('explanation').innerHTML = (correct ? '' : '<strong>Answer: ' + (q.choices ? q.choices[q.answer] : q.answerText) + '.</strong> ') + q.explanation;
    feedback.hidden = false;
    next.hidden = false;
    next.focus();
  });
  function results() {
    var best = Math.max(window.MRDProgress.get(id).quizBest, score);
    window.MRDProgress.set(id, { quizBest: best });
    if (score >= 4) window.MRDProgress.markDone(id, 'quiz');
    document.getElementById('question-panel').hidden = true;
    document.getElementById('results').hidden = false;
    var heading = document.getElementById('results-title');
    heading.textContent = score >= 4 ? 'Check Quiz complete!' : 'Keep practicing—you’re building the idea.';
    document.getElementById('score').textContent = score + ' / 5';
    document.getElementById('result-message').textContent = score >= 4 ? 'You passed! This quiz step is complete. Head back to see your pathway progress.' : 'You need 4 correct to pass. Review the notes, then give it another try.';
    document.getElementById('best-score').textContent = 'Best score in this browser: ' + best + ' / 5';
    heading.focus();
  }
  next.addEventListener('click', function () {
    if (!answered) return;
    if (index === questions.length - 1) results();
    else { index += 1; render(true); }
  });
  document.getElementById('try-again').addEventListener('click', function () { index = 0; score = 0; render(true); });
  render(false);
}());
