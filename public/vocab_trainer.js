document.addEventListener('DOMContentLoaded', () => {
    function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function normalizeKey(k){const m={F:'A',G:'B',H:'C',J:'D'};return (m[k]||k).toUpperCase();}

let queue=[],current=null,total=0,correctCount=0;
let countdown=null,timeRemaining=10;

const qs=id=>document.getElementById(id);
const loaderEl=qs('loader'),quizCard=qs('quizCard'),
      choicesEl=qs('choices'),questionEl=qs('questionText'),
      submitBtn=qs('submitBtn'),progEl=qs('progress'),feedEl=qs('feedback');

function fmt(sec){const m=Math.floor(sec/60),s=(sec%60).toString().padStart(2,'0');return m+':'+s;}
function stopTimer(){clearInterval(countdown);}
function startTimer(end){qs('countdown').textContent=fmt(timeRemaining);
  countdown=setInterval(()=>{timeRemaining--;qs('countdown').textContent=fmt(timeRemaining);
  if(timeRemaining<=0){clearInterval(countdown);end();}},1000);}

qs('fileInput').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  Papa.parse(f,{header:true,skipEmptyLines:true,complete:r=>{
    queue=r.data.map(x=>({q:x.Question,choices:[x.ChoiceA,x.ChoiceB,x.ChoiceC,x.ChoiceD],
      correct:normalizeKey((x.Correct||'').trim()),seen:false,dueReps:0}));
    queue=shuffle(queue);total=queue.length;correctCount=0;
    loaderEl.classList.add('hidden');quizCard.classList.remove('hidden');
    nextQuestion();
  }});
});

function renderCurrent(resetTimer=false){
  if(resetTimer){stopTimer();timeRemaining=10;startTimer(()=>endSession("Time's up! ⏰"));}
  feedEl.textContent='';
  progEl.textContent=(total-queue.length)+'/'+total;
  questionEl.innerHTML=current.q;

  choicesEl.innerHTML='';
  current.choices.forEach((c,i)=>{
    const l=String.fromCharCode(65+i);
    choicesEl.insertAdjacentHTML('beforeend',`
    <label class="flex items-center space-x-2">
      <input type="radio" name="choice" value="${l}" class="h-4 w-4" onchange="submitAnswer()">
      <span>${c}</span>
    </label>`);
  });
}

function nextQuestion(){
  stopTimer();timeRemaining=10;
  if(queue.length===0){endSession('🎉 Session complete!');return;}
  current=queue.shift();
  renderCurrent();
  startTimer(()=>endSession("Time's up! ⏰"));
}

function mastered(){correctCount++;}
function handleCorrect(){
  let done=false;
  if(!current.seen){current.seen=true;if(Math.random()<0.5)queue.push(current); else done=true;}
  else if(current.dueReps>0){current.dueReps--; if(current.dueReps>0)queue.push(current); else done=true;}
  else done=true;
  if(done) mastered();
}
function handleWrong(){current.seen=false;current.dueReps=2;queue.splice(2,0,current);}

function submitAnswer(){
  const sel=document.querySelector('input[name="choice"]:checked');if(!sel)return;
  if(sel.value===current.correct){feedEl.textContent='Correct ✔️';feedEl.classList.replace('text-red-600','text-green-600');handleCorrect();}
  else{feedEl.textContent=`Wrong ❌ (Answer: ${current.correct})`;feedEl.classList.replace('text-green-600','text-red-600');handleWrong();}
  setTimeout(nextQuestion,800);
}

/*submitBtn.onclick=e=>{
  e.preventDefault();
  const sel=document.querySelector('input[name="choice"]:checked');if(!sel)return;
  if(sel.value===current.correct){feedEl.textContent='Correct ✔️';feedEl.classList.replace('text-red-600','text-green-600');handleCorrect();}
  else{feedEl.textContent=`Wrong ❌ (Answer: ${current.correct})`;feedEl.classList.replace('text-green-600','text-red-600');handleWrong();}
  setTimeout(nextQuestion,800);
};*/

function endSession(msg){
  stopTimer();
  quizCard.innerHTML=`<p class="text-2xl font-bold mb-4">${msg}</p>
  <p>You answered ${correctCount} / ${total} correctly.</p>`;
}
});