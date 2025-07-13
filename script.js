let quizData, passageIndex = 0, questionIndex = 0;
const passageEl = document.getElementById('passage');
const questionTextEl = document.getElementById('questionText');
const optionsEl = document.getElementById('options');
const nextBtn = document.getElementById('nextBtn');

// 1. Load the JSON
fetch('quiz.json')
  .then(r => 
    {console.log('fetch status:', r.status, r.statusText);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
  .then(data => {
    console.log('got JSON:', data);
    quizData = data;
    showPassage();
    showQuestion();
  })
  .catch(err => {
    console.error('Error loading quiz data:', err);
    passageEl.textContent = 'Error loading quiz data.';
  });

// 2. Display the current passage
function showPassage() {
  passageEl.textContent = quizData[passageIndex].text;
}

// 3. Display the current question
function showQuestion() {
  const q = quizData[passageIndex].questions[questionIndex];
  questionTextEl.textContent = `Q${questionIndex+1}: ${q.question}`;
  optionsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `
      <input type="radio" name="choice" value="${opt}">
      ${String.fromCharCode(65+i)}. ${opt}
    `;
    optionsEl.appendChild(label);
  });
}

// 4. Handle Next button
nextBtn.addEventListener('click', () => {
  const selected = document.querySelector('input[name="choice"]:checked');
  if (!selected) {
    alert('Please select an answer.');
    return;
  }
  const userAnswer = selected.value;
  const correctAnswer = quizData[passageIndex].questions[questionIndex].answer;
  alert(userAnswer === correctAnswer ? '✅ Correct!' : `❌ Sorry, the right answer was: "${correctAnswer}".`);
  
  // advance
  questionIndex++;
  if (questionIndex < quizData[passageIndex].questions.length) {
    showQuestion();
  } else {
    passageIndex++;
    questionIndex = 0;
    
    if (passageIndex < quizData.length) {
      showPassage();
      showQuestion();
    } /*else {
    // move to next passage (or restart)
    //passageIndex = (passageIndex + 1) % quizData.length;
    passageIndex++;
    questionIndex = 0;
    showPassage();
    showQuestion();
  }*/ else {
    passageEl.textContent = '🎉 You’ve completed the quiz!';
    questionTextEl.textContent = '';
    optionsEl.innerHTML = '';
    nextBtn.disabled = true;
  }
}
});
