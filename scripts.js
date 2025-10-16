/* 簿記 商店経営RPG MVP スクリプト */
// --- 状態 ---
const STATE = {
  user: null,
  questions: [],
  quizSet: [],
  idx: 0,
  correct: 0,
  combo: 0,
  earnedXp: 0,
  weeklyPoints: 0,
};

// --- ユーティリティ ---
const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs={}) => Object.assign(document.createElement(tag), attrs);

function loadLocal() {
  const wp = Number(localStorage.getItem('weeklyPoints') || 0);
  STATE.weeklyPoints = wp;
  $('#weeklyPoints').textContent = wp;
  $('#todayXp').textContent = Number(localStorage.getItem('todayXp') || 0);
  $('#combo').textContent = 0;
}
function saveWeeklyPoints() {
  localStorage.setItem('weeklyPoints', String(STATE.weeklyPoints));
}

// --- CSV読み込み ---
async function loadQuestions() {
  return new Promise((resolve, reject) => {
    Papa.parse('assets/questions.csv', {
      download: true,
      header: true,
      complete: (res) => resolve(res.data.filter(r => r.id)),
      error: reject,
    });
  });
}

// --- クイズ生成 ---
function pick10(arr) {
  const pool = [...arr];
  const out = [];
  while (out.length < 10 && pool.length) {
    out.push(pool.splice(Math.floor(Math.random()*pool.length), 1)[0]);
  }
  return out;
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  $(id).classList.remove('hidden');
}

function startQuiz() {
  STATE.quizSet = pick10(STATE.questions);
  STATE.idx = 0;
  STATE.correct = 0;
  STATE.combo = 0;
  STATE.earnedXp = 0;
  renderQuestion();
  showView('#quizView');
}

function renderQuestion() {
  const q = STATE.quizSet[STATE.idx];
  $('#qProgress').textContent = `${STATE.idx+1} / ${STATE.quizSet.length}`;
  $('#qTag').textContent = q['タグ'];
  $('#qText').textContent = q['問題文'];
  $('#feedback').textContent = '';
  $('#nextBtn').disabled = true;

  const choicesWrap = $('#choices');
  choicesWrap.innerHTML = '';
  const labels = ['A','B','C','D'];
  labels.forEach((lab) => {
    const text = q['選択肢' + lab];
    if (!text) return;
    const btn = el('button', { className: 'choice', textContent: text });
    btn.addEventListener('click', () => onAnswer(lab, btn, q));
    choicesWrap.appendChild(btn);
  });
}

function onAnswer(lab, btn, q) {
  const correct = q['正解'];
  const choiceEls = document.querySelectorAll('.choice');
  choiceEls.forEach(e => e.disabled = true);

  if (lab === correct) {
    btn.classList.add('correct');
    STATE.correct += 1;
    STATE.combo += 1;
    const mult = STATE.combo >= 10 ? 2.0 : STATE.combo >= 5 ? 1.5 : 1.0;
    const gained = Math.round(10 * mult);
    STATE.earnedXp += gained;
    $('#feedback').textContent = `正解！ +${gained} XP（コンボ×${mult.toFixed(1)}）`;
  } else {
    btn.classList.add('wrong');
    STATE.combo = 0;
    $('#feedback').textContent = `不正解… 解説：${q['解説'] || '—'}`;
  }

  document.querySelectorAll('.choice').forEach(e => {
    const labGuess = e.textContent === q['選択肢' + correct] ? 'correct' : '';
    if (labGuess === 'correct') e.classList.add('correct');
  });

  $('#combo').textContent = STATE.combo;
  $('#nextBtn').disabled = false;
}

function nextQuestion() {
  STATE.idx += 1;
  if (STATE.idx >= STATE.quizSet.length) {
    // 結果
    $('#correctCount').textContent = STATE.correct;
    $('#earnedXp').textContent = STATE.earnedXp;
    STATE.weeklyPoints += STATE.earnedXp; // XP=週ポイント（MVP）
    saveWeeklyPoints();
    $('#finalWeeklyPoints').textContent = STATE.weeklyPoints;
    const today = Number(localStorage.getItem('todayXp') || 0) + STATE.earnedXp;
    localStorage.setItem('todayXp', String(today));
    $('#todayXp').textContent = today;
    showView('#resultView');
  } else {
    renderQuestion();
  }
}

function quitQuiz() {
  showView('#homeView');
}

function backHome() {
  loadLocal();
  showView('#homeView');
}

// --- Firebase（プレースホルダ） ---
function initAuth() {
  // firebase.config.js で設定。MVPでは未ログイン不可の想定だが
  // GitHub PagesでまずはUIのみ確認できるようにダミー動作。
  const btn = $('#loginBtn');
  btn.addEventListener('click', () => {
    alert('Googleログインは後で有効化します（firebase.config.js を設定してください）。');
  });
}

// --- 起動 ---
window.addEventListener('DOMContentLoaded', async () => {
  loadLocal();
  initAuth();
  STATE.questions = await loadQuestions();
  $('#reviewCount').textContent = 0; // MVPでは未実装
  $('#startQuizBtn').addEventListener('click', startQuiz);
  $('#nextBtn').addEventListener('click', nextQuestion);
  $('#quitBtn').addEventListener('click', quitQuiz);
  $('#backHomeBtn').addEventListener('click', backHome);
});
